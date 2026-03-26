class Customers::TossPaymentsController < ApplicationController
  include CustomerAccessible

  before_action :set_request

  ESCROW_TYPE_LABELS = {
    "trip"         => "누수체크 출장비",
    "detection"    => "누수체크 탐지비",
    "construction" => "누수체크 공사비"
  }.freeze

  # GET /customers/toss_payments/checkout
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

    @order_id   = "NUSU-#{@request.id}-#{@escrow_type}-#{SecureRandom.hex(6)}"
    @order_name = ESCROW_TYPE_LABELS[@escrow_type]
    @toss_client_key = ENV["TOSS_CLIENT_KEY"]
    unless @toss_client_key.present?
      redirect_to customers_request_path(@request), alert: "결제 서비스가 준비 중입니다."
      return
    end

    @success_url = customers_toss_payments_success_url(
      request_id:  @request.id,
      escrow_type: @escrow_type,
      order_id:    @order_id
    )
    @fail_url = customers_toss_payments_fail_url(
      request_id:  @request.id,
      escrow_type: @escrow_type
    )
  end

  # GET /customers/toss_payments/success
  # params: paymentKey, orderId, amount, request_id, escrow_type
  def success
    payment_key  = params[:paymentKey]
    order_id     = params[:orderId]
    amount       = params[:amount].to_d
    escrow_type  = params[:escrow_type]

    unless payment_key.present? && order_id.present? && amount > 0
      # 감사 로그: 잘못된 파라미터
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
        order_id: order_id,
        amount: amount,
        escrow_type: escrow_type,
        payment_key: payment_key
      },
      ip_address: request.remote_ip
    )

    # ===  결제 금액 서버 검증 (보안) ===
    expected_amount = calculate_expected_amount(@request, escrow_type)

    unless amount == expected_amount
      # 감사 로그: 금액 불일치
      PaymentAuditLog.log_payment(
        user: current_user,
        action: "fail",
        details: {
          error_type: "AmountMismatch",
          error_message: "결제 금액이 예상 금액과 일치하지 않습니다",
          order_id: order_id,
          escrow_type: escrow_type,
          amount_received: amount.to_f,
          amount_expected: expected_amount.to_f
        },
        ip_address: request.remote_ip
      )
      Rails.logger.error "[TossPayments] 금액 불일치: expected=#{expected_amount}, received=#{amount} | order_id=#{order_id}"
      redirect_to customers_request_path(@request),
                  alert: "결제 금액이 올바르지 않습니다. 고객센터(contact@nusucheck.com)에 문의해주세요."
      return
    end
    # =====================================

    # 토스 API로 결제 승인
    toss_result = TossPaymentsService.new.confirm_payment(
      payment_key: payment_key,
      order_id:    order_id,
      amount:      amount
    )

    # EscrowService로 DB 업데이트
    escrow = EscrowService.new(@request).finalize_payment!(
      escrow_type:    escrow_type,
      amount:         amount,
      payment_key:    payment_key,
      order_id:       order_id,
      payment_method: normalize_payment_method(toss_result["method"])
    )

    # 감사 로그: 결제 성공
    PaymentAuditLog.log_payment(
      escrow_transaction: escrow,
      user: current_user,
      action: "success",
      details: {
        order_id: order_id,
        amount: amount,
        payment_method: toss_result["method"],
        toss_response: toss_result.slice("status", "approvedAt", "receipt")
      },
      ip_address: request.remote_ip
    )

    label = ESCROW_TYPE_LABELS[escrow_type] || "결제"
    redirect_to customers_request_path(@request),
      notice: "#{label} #{number_to_currency(amount, unit: '₩', precision: 0)} 결제가 완료되었습니다."

  rescue TossPaymentsService::PaymentError => e
    # 감사 로그: 토스 결제 오류
    PaymentAuditLog.log_payment(
      user: current_user,
      action: "fail",
      details: {
        error_type: "TossPaymentsService::PaymentError",
        error_message: e.message,
        order_id: order_id,
        amount: amount
      },
      ip_address: request.remote_ip
    )
    Rails.logger.error "[TossPayments] 결제 승인 실패: #{e.class} - #{e.message} | order_id=#{params[:orderId]}\n#{e.backtrace.first(10).join("\n")}"
    redirect_to customers_request_path(@request),
      alert: "결제 처리 중 오류가 발생했습니다. 카드 정보를 확인하고 다시 시도해주세요."
  rescue EscrowService::EscrowError => e
    # 감사 로그: 에스크로 처리 오류
    PaymentAuditLog.log_payment(
      user: current_user,
      action: "fail",
      details: {
        error_type: "EscrowService::EscrowError",
        error_message: e.message,
        order_id: order_id,
        amount: amount,
        note: "Payment confirmed but escrow failed"
      },
      ip_address: request.remote_ip
    )
    Rails.logger.error "[TossPayments] 에스크로 처리 실패: #{e.class} - #{e.message} | order_id=#{params[:orderId]}\n#{e.backtrace.first(10).join("\n")}"
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
        order_id: order_id,
        amount: amount
      },
      ip_address: request.remote_ip
    )
    Rails.logger.error "[TossPayments] 알 수 없는 오류: #{e.class} - #{e.message} | order_id=#{params[:orderId]}\n#{e.backtrace.first(10).join("\n")}"
    redirect_to customers_request_path(@request),
      alert: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
  end

  # GET /customers/toss_payments/fail
  # params: code, message, request_id, escrow_type
  def fail
    error_message = params[:message] || "알 수 없는 오류"
    error_code    = params[:code]
    Rails.logger.warn "[TossPayments] 결제 실패: code=#{error_code} message=#{error_message} | request_id=#{params[:request_id]}"

    # 감사 로그: 결제 실패 (취소 또는 에러)
    PaymentAuditLog.log_payment(
      user: current_user,
      action: error_code == "PAY_PROCESS_CANCELED" ? "cancel" : "fail",
      details: {
        error_code: error_code,
        error_message: error_message,
        escrow_type: params[:escrow_type],
        order_id: params[:orderId]
      },
      ip_address: request.remote_ip
    )

    # 사용자 친화적인 에러 메시지로 변환
    user_message = case error_code
    when "PAY_PROCESS_CANCELED"
      "결제가 취소되었습니다."
    when "PAY_PROCESS_ABORTED"
      "결제가 중단되었습니다. 다시 시도해주세요."
    when "REJECT_CARD_COMPANY"
      "카드사에서 승인이 거절되었습니다. 카드 정보를 확인해주세요."
    when "INVALID_CARD_NUMBER", "NOT_SUPPORTED_CARD"
      "카드 정보가 올바르지 않습니다. 다시 확인해주세요."
    when "EXCEED_MAX_CARD_INSTALL_PLAN"
      "선택하신 할부 개월수를 이용할 수 없습니다."
    else
      "결제 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
    end

    redirect_to customers_request_path(@request), alert: user_message
  end

  private

  def set_request
    @request = current_user.requests.find(params[:request_id])
  rescue ActiveRecord::RecordNotFound
    redirect_to customers_requests_path, alert: "체크 정보를 찾을 수 없습니다."
  end

  def normalize_payment_method(toss_method)
    case toss_method
    when "카드"          then "card"
    when "가상계좌"       then "virtual_account"
    when "간편결제"       then "easy_pay"
    when "휴대폰"        then "mobile"
    when "계좌이체"       then "bank_transfer"
    else toss_method || "card"
    end
  end

  # 예상 결제 금액 계산 (서버 검증용)
  # @param request [Request] 체크 정보
  # @param escrow_type [String] "trip", "detection", "construction"
  # @return [BigDecimal] 예상 금액
  def calculate_expected_amount(request, escrow_type)
    estimate = request.accepted_estimate

    unless estimate
      Rails.logger.warn "[TossPayments] 수락된 견적이 없음: request_id=#{request.id}"
      return 0.to_d
    end

    case escrow_type
    when "trip"
      # 출장비: line_items에서 category가 "trip"인 항목들의 합계
      trip_items = estimate.parsed_line_items.select { |item| item[:category] == "trip" }
      trip_items.sum { |item| item[:amount].to_d }

    when "detection"
      # 탐지비: detection_subtotal (VAT 제외)
      estimate.detection_subtotal.to_d

    when "construction"
      # 공사비: total_amount (VAT 포함 전체 금액)
      estimate.total_amount.to_d

    else
      Rails.logger.error "[TossPayments] 알 수 없는 escrow_type: #{escrow_type}"
      0.to_d
    end
  end
end
