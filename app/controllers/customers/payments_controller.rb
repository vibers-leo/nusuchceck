# frozen_string_literal: true

class Customers::PaymentsController < ApplicationController
  include CustomerAccessible

  before_action :set_request, except: [:index]

  ESCROW_TYPE_LABELS = {
    "trip"         => "누수체크 출장비",
    "detection"    => "누수체크 탐지비",
    "construction" => "누수체크 공사비"
  }.freeze

  # GET /customers/payments
  # 결제 내역 목록
  def index
    @payments = current_user.escrow_transactions
                           .includes(:request)
                           .order(created_at: :desc)
                           .page(params[:page])
                           .per(20)

    # 필터
    if params[:status].present?
      @payments = @payments.where(status: params[:status])
    end

    if params[:start_date].present? && params[:end_date].present?
      @payments = @payments.where(created_at: params[:start_date]..params[:end_date])
    end

    # 통계
    all_txns = current_user.escrow_transactions
    @total_amount   = all_txns.where(status: %w[deposited held released settled]).sum(:amount)
    @pending_amount = all_txns.where(status: 'pending').sum(:amount)
    @refunded_amount = all_txns.where(status: 'refunded').sum(:amount)
  end

  # GET /customers/payments/checkout
  # params: request_id, escrow_type, amount
  def checkout
    @escrow_type = params[:escrow_type]
    @amount      = params[:amount].to_d.round

    unless ESCROW_TYPE_LABELS.key?(@escrow_type)
      redirect_to customers_request_path(@request), alert: "잘못된 결제 유형입니다."
      return
    end

    unless @amount > 0
      redirect_to customers_request_path(@request), alert: "결제 금액이 올바르지 않습니다."
      return
    end

    # 포트원 merchant_uid (가맹점 주문번호)
    @merchant_uid = "NUSU-#{@request.id}-#{@escrow_type}-#{SecureRandom.hex(6)}"
    @order_name = ESCROW_TYPE_LABELS[@escrow_type]

    # 포트원 설정
    @portone_store_id = ENV.fetch("PORTONE_STORE_ID", "")
    @portone_channel_key = ENV.fetch("PORTONE_CHANNEL_KEY", "") # 토스페이먼츠 채널 키

    # 콜백 URL
    @callback_url = customers_payments_callback_url(
      request_id: @request.id,
      escrow_type: @escrow_type,
      merchant_uid: @merchant_uid
    )
  end

  # GET /customers/payments/callback
  # 포트원 결제창에서 리다이렉트되는 페이지
  # params: imp_uid, merchant_uid, request_id, escrow_type
  def callback
    imp_uid = params[:imp_uid]
    merchant_uid = params[:merchant_uid]
    escrow_type = params[:escrow_type]

    unless imp_uid.present? && merchant_uid.present?
      PaymentAuditLog.log_payment(
        user: current_user,
        action: "fail",
        details: { reason: "invalid_params", params: params.to_unsafe_h },
        ip_address: request.remote_ip
      )
      redirect_to customers_request_path(@request), alert: "결제 정보가 올바르지 않습니다."
      return
    end

    # 감사 로그: 결제 시도
    PaymentAuditLog.log_payment(
      user: current_user,
      action: "attempt",
      details: {
        imp_uid: imp_uid,
        merchant_uid: merchant_uid,
        escrow_type: escrow_type
      },
      ip_address: request.remote_ip
    )

    # 포트원 API로 결제 정보 조회 및 검증
    port_one = PortOneService.new
    payment = port_one.get_payment(imp_uid)

    # 결제 상태 확인
    unless payment["status"] == "paid"
      PaymentAuditLog.log_payment(
        user: current_user,
        action: "fail",
        details: {
          reason: "payment_not_paid",
          status: payment["status"],
          imp_uid: imp_uid
        },
        ip_address: request.remote_ip
      )
      redirect_to customers_request_path(@request), alert: "결제가 완료되지 않았습니다."
      return
    end

    # 금액 검증
    expected_amount = calculate_expected_amount(@request, escrow_type)
    paid_amount = payment["amount"].to_d

    unless paid_amount == expected_amount
      PaymentAuditLog.log_payment(
        user: current_user,
        action: "fail",
        details: {
          error_type: "AmountMismatch",
          error_message: "결제 금액이 예상 금액과 일치하지 않습니다",
          imp_uid: imp_uid,
          merchant_uid: merchant_uid,
          escrow_type: escrow_type,
          amount_paid: paid_amount.to_f,
          amount_expected: expected_amount.to_f
        },
        ip_address: request.remote_ip
      )
      Rails.logger.error "[PortOne] 금액 불일치: expected=#{expected_amount}, paid=#{paid_amount} | imp_uid=#{imp_uid}"
      redirect_to customers_request_path(@request),
                  alert: "결제 금액이 올바르지 않습니다. 고객센터(contact@nusucheck.com)에 문의해주세요."
      return
    end

    # EscrowService로 DB 업데이트
    escrow = EscrowService.new(@request).finalize_payment!(
      escrow_type:    escrow_type,
      amount:         paid_amount,
      payment_key:    imp_uid,          # 포트원 거래번호
      order_id:       merchant_uid,     # 가맹점 주문번호
      payment_method: normalize_payment_method(payment["pay_method"])
    )

    # 감사 로그: 결제 성공
    PaymentAuditLog.log_payment(
      escrow_transaction: escrow,
      user: current_user,
      action: "success",
      details: {
        imp_uid: imp_uid,
        merchant_uid: merchant_uid,
        amount: paid_amount.to_f,
        pay_method: payment["pay_method"],
        pg_provider: payment["pg_provider"],
        pg_tid: payment["pg_tid"]
      },
      ip_address: request.remote_ip
    )

    label = ESCROW_TYPE_LABELS[escrow_type] || "결제"
    redirect_to customers_request_path(@request),
                notice: "#{label} #{number_to_currency(paid_amount, unit: '₩', precision: 0)} 결제가 완료되었습니다."

  rescue PortOneService::PaymentError => e
    # 감사 로그: 포트원 결제 오류
    PaymentAuditLog.log_payment(
      user: current_user,
      action: "fail",
      details: {
        error_type: "PortOneService::PaymentError",
        error_message: e.message,
        imp_uid: imp_uid,
        merchant_uid: merchant_uid
      },
      ip_address: request.remote_ip
    )
    Rails.logger.error "[PortOne] 결제 조회 실패: #{e.class} - #{e.message} | imp_uid=#{imp_uid}\n#{e.backtrace.first(10).join("\n")}"
    redirect_to customers_request_path(@request),
                alert: "결제 처리 중 오류가 발생했습니다. 고객센터(contact@nusucheck.com)에 문의해주세요."
  rescue EscrowService::EscrowError => e
    # 감사 로그: 에스크로 처리 오류
    PaymentAuditLog.log_payment(
      user: current_user,
      action: "fail",
      details: {
        error_type: "EscrowService::EscrowError",
        error_message: e.message,
        imp_uid: imp_uid,
        merchant_uid: merchant_uid,
        note: "Payment verified but escrow failed"
      },
      ip_address: request.remote_ip
    )
    Rails.logger.error "[PortOne] 에스크로 처리 실패: #{e.class} - #{e.message} | imp_uid=#{imp_uid}\n#{e.backtrace.first(10).join("\n")}"
    redirect_to customers_request_path(@request),
                alert: "결제는 완료되었으나 처리 중 오류가 발생했습니다. 고객센터(contact@nusucheck.com)에 문의해주세요."
  rescue => e
    # 감사 로그: 알 수 없는 오류
    PaymentAuditLog.log_payment(
      user: current_user,
      action: "fail",
      details: {
        error_type: e.class.to_s,
        error_message: e.message,
        imp_uid: imp_uid,
        merchant_uid: merchant_uid
      },
      ip_address: request.remote_ip
    )
    Rails.logger.error "[PortOne] 알 수 없는 오류: #{e.class} - #{e.message} | imp_uid=#{imp_uid}\n#{e.backtrace.first(10).join("\n")}"
    redirect_to customers_request_path(@request),
                alert: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
  end

  private

  def set_request
    @request = current_user.requests.find(params[:request_id])
  rescue ActiveRecord::RecordNotFound
    redirect_to customers_requests_path, alert: "체크 정보를 찾을 수 없습니다."
  end

  # 포트원 pay_method를 정규화
  def normalize_payment_method(pay_method)
    case pay_method
    when "card"          then "card"
    when "vbank"         then "virtual_account"
    when "trans"         then "bank_transfer"
    when "phone"         then "mobile"
    when "samsung"       then "easy_pay"
    when "kpay"          then "easy_pay"
    when "kakaopay"      then "easy_pay"
    when "payco"         then "easy_pay"
    when "lpay"          then "easy_pay"
    when "ssgpay"        then "easy_pay"
    when "tosspay"       then "easy_pay"
    else pay_method || "card"
    end
  end

  # 예상 결제 금액 계산 (서버 검증용)
  def calculate_expected_amount(request, escrow_type)
    estimate = request.accepted_estimate

    unless estimate
      Rails.logger.warn "[PortOne] 수락된 견적이 없음: request_id=#{request.id}"
      return 0.to_d
    end

    case escrow_type
    when "trip"
      # 출장비: line_items에서 category가 "trip"인 항목들의 합계
      trip_items = estimate.parsed_line_items.select { |item| item[:category] == "trip" }
      trip_items.sum { |item| item[:amount].to_d }

    when "detection"
      # 탐지비: detection_subtotal
      estimate.detection_subtotal.to_d

    when "construction"
      # 공사비: total_amount (VAT 포함)
      estimate.total_amount.to_d

    else
      Rails.logger.error "[PortOne] 알 수 없는 escrow_type: #{escrow_type}"
      0.to_d
    end
  end
end
