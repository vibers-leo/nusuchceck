class Customers::DisputesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_request, only: [:new, :create]
  before_action :set_dispute, only: [:show, :add_message, :cancel]

  def index
    @disputes = current_user.disputes_as_complainant
                            .includes(:request, :respondent)
                            .order(created_at: :desc)
  end

  def show
    @messages = @dispute.dispute_messages.chronological.includes(:sender)
    @evidences = @dispute.dispute_evidences.includes(:submitted_by)
  end

  def new
    @dispute = @request.disputes.build
  end

  def create
    @dispute = @request.disputes.build(dispute_params)
    @dispute.complainant = current_user
    @dispute.respondent = @request.master

    # 분쟁 금액 자동 설정 (공사비 기준)
    construction_escrow = @request.escrow_transactions.find_by(escrow_type: "construction")
    @dispute.disputed_amount = construction_escrow&.amount || @request.total_fee || 0

    if @dispute.save
      # 간소화 처리 (5만원 이하)
      if @dispute.quick_refund?
        DisputeService.new(@dispute).quick_resolve!
        redirect_to customers_dispute_path(@dispute), notice: "소액 분쟁으로 즉시 환불 처리됐어요."
      else
        redirect_to customers_dispute_path(@dispute), notice: "분쟁이 접수됐어요. 전문가 답변을 기다려 주세요."
      end
    else
      render :new, status: :unprocessable_entity
    end
  end

  def add_message
    @dispute.dispute_messages.create!(
      sender: current_user,
      sender_role: "customer",
      content: params[:content],
      message_type: "text"
    )
    redirect_to customers_dispute_path(@dispute), notice: "메시지를 보냈어요."
  end

  def cancel
    if @dispute.may_cancel?
      @dispute.cancel!
      redirect_to customers_disputes_path, notice: "분쟁이 취소됐어요."
    else
      redirect_to customers_dispute_path(@dispute), alert: "이 상태에서는 취소할 수 없어요."
    end
  end

  private

  def set_request
    @request = current_user.requests.find_by!(public_token: params[:request_id])
  end

  def set_dispute
    @dispute = Dispute.where(complainant: current_user).find(params[:id])
  end

  def dispute_params
    params.require(:dispute).permit(:category, :description)
  end
end
