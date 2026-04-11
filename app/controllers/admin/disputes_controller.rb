class Admin::DisputesController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin
  before_action :set_dispute, except: [:index]

  def index
    @disputes = Dispute.includes(:request, :complainant, :respondent)
                       .order(created_at: :desc)

    @disputes = @disputes.where(status: params[:status]) if params[:status].present?
    @disputes = @disputes.where(category: params[:category]) if params[:category].present?

    @stats = {
      total: Dispute.count,
      opened: Dispute.where(status: "opened").count,
      mediation: Dispute.where(status: "mediation").count,
      resolved: Dispute.where(status: ["resolved", "auto_resolved"]).count
    }
  end

  def show
    @messages = @dispute.dispute_messages.chronological.includes(:sender)
    @evidences = @dispute.dispute_evidences.includes(:submitted_by)
    @escrows = @dispute.request.escrow_transactions
  end

  def start_mediation
    service = DisputeService.new(@dispute)
    service.escalate!(mediator: current_user)
    redirect_to admin_dispute_path(@dispute), notice: "중재를 시작했어요."
  end

  def resolve
    service = DisputeService.new(@dispute)
    service.mediate!(
      resolution_type: params[:resolution_type],
      refund_percentage: params[:refund_percentage]&.to_i,
      refund_amount: params[:refund_amount]&.to_i,
      note: params[:resolution_note],
      mediator: current_user
    )
    redirect_to admin_dispute_path(@dispute), notice: "중재 결정이 완료됐어요."
  end

  def add_message
    @dispute.dispute_messages.create!(
      sender: current_user,
      sender_role: "mediator",
      content: params[:content],
      message_type: "text"
    )
    redirect_to admin_dispute_path(@dispute), notice: "메시지를 보냈어요."
  end

  private

  def set_dispute
    @dispute = Dispute.find(params[:id])
  end

  def require_admin
    redirect_to root_path, alert: "권한이 없어요." unless current_user.admin?
  end
end
