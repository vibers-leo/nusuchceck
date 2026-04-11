class Masters::DisputesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_dispute

  def index
    @disputes = Dispute.where(respondent: current_user)
                       .includes(:request, :complainant)
                       .order(created_at: :desc)
  end

  def show
    @messages = @dispute.dispute_messages.chronological.includes(:sender)
    @evidences = @dispute.dispute_evidences.includes(:submitted_by)
  end

  def respond
    service = DisputeService.new(@dispute)
    service.respond!(content: params[:content], sender: current_user)
    redirect_to masters_dispute_path(@dispute), notice: "답변을 보냈어요."
  end

  def add_evidence
    service = DisputeService.new(@dispute)
    service.add_evidence!(
      submitted_by: current_user,
      evidence_type: params[:evidence_type] || "photo",
      description: params[:description],
      files: params[:files]
    )
    redirect_to masters_dispute_path(@dispute), notice: "증거를 제출했어요."
  end

  private

  def set_dispute
    @dispute = Dispute.where(respondent: current_user).find(params[:id]) unless action_name == "index"
  end
end
