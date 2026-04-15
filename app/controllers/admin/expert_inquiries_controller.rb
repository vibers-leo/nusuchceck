class Admin::ExpertInquiriesController < Admin::BaseController
  before_action :set_inquiry, only: [:show, :approve, :reject]

  def index
    @q = ExpertInquiry.ransack(params[:q])
    @inquiries = @q.result.recent.page(params[:page]).per(20)
    @counts = {
      total:    ExpertInquiry.count,
      pending:  ExpertInquiry.pending.count,
      approved: ExpertInquiry.approved.count,
      rejected: ExpertInquiry.rejected.count,
    }
  end

  def show
  end

  def approve
    if @inquiry.pending?
      @inquiry.update!(
        status: "approved",
        approved_at: Time.current,
        approval_notes: params[:approval_notes].to_s.strip.presence
      )

      # 이메일 주소가 있으면 승인 안내 발송
      if @inquiry.email.present?
        registration_url = new_user_registration_url(
          host: request.host_with_port,
          role: "master"
        )
        ExpertInquiryMailer.approval_notification(@inquiry, registration_url).deliver_later
        redirect_to admin_expert_inquiry_path(@inquiry),
                    notice: "승인 완료 — #{@inquiry.name}님에게 등록 안내 이메일을 발송했습니다."
      else
        redirect_to admin_expert_inquiry_path(@inquiry),
                    notice: "승인 완료 — 이메일 주소가 없어 개별 연락이 필요합니다. (연락처: #{@inquiry.phone})"
      end
    else
      redirect_to admin_expert_inquiry_path(@inquiry), alert: "이미 처리된 문의입니다."
    end
  end

  def reject
    if @inquiry.pending?
      @inquiry.update!(
        status: "rejected",
        approved_at: Time.current,
        approval_notes: params[:approval_notes].to_s.strip.presence
      )

      if @inquiry.email.present?
        ExpertInquiryMailer.rejection_notification(@inquiry).deliver_later
      end

      redirect_to admin_expert_inquiry_path(@inquiry), notice: "거절 처리되었습니다."
    else
      redirect_to admin_expert_inquiry_path(@inquiry), alert: "이미 처리된 문의입니다."
    end
  end

  private

  def set_inquiry
    @inquiry = ExpertInquiry.find(params[:id])
  end
end
