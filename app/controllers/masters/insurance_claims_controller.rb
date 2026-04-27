class Masters::InsuranceClaimsController < ApplicationController
  include MasterAccessible

  before_action :set_insurance_claim, only: [:show, :edit, :update, :send_to_customer, :download_pdf]
  before_action :set_request, only: [:new, :create], if: -> { params[:request_id].present? }

  def index
    @q = current_user.prepared_insurance_claims.ransack(params[:q])
    @insurance_claims = @q.result.recent.page(params[:page])
  end

  def show
    authorize @insurance_claim, policy_class: Masters::InsuranceClaimPolicy
  end

  def new
    authorize InsuranceClaim, :create?, policy_class: Masters::InsuranceClaimPolicy

    if @request
      @insurance_claim = current_user.prepared_insurance_claims.build(
        customer: @request.customer,
        request: @request
      )
      @insurance_claim.prefill_from_request!
    else
      redirect_to masters_requests_path, alert: "신고를 먼저 선택해주세요."
    end
  end

  def create
    authorize InsuranceClaim, :create?, policy_class: Masters::InsuranceClaimPolicy

    @insurance_claim = current_user.prepared_insurance_claims.build(insurance_claim_params)
    @insurance_claim.request = @request if @request
    @insurance_claim.customer = @request.customer if @request

    if @insurance_claim.save
      redirect_to masters_insurance_claim_path(@insurance_claim),
                  notice: "보험청구서가 작성되었습니다. 고객에게 전송하시겠어요?"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    authorize @insurance_claim, policy_class: Masters::InsuranceClaimPolicy
  end

  def update
    authorize @insurance_claim, policy_class: Masters::InsuranceClaimPolicy

    if @insurance_claim.update(insurance_claim_params)
      redirect_to masters_insurance_claim_path(@insurance_claim),
                  notice: "보험청구서가 수정되었습니다."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def send_to_customer
    authorize @insurance_claim, policy_class: Masters::InsuranceClaimPolicy

    if @insurance_claim.may_send_to_customer?
      @insurance_claim.send_to_customer!

      # 이메일 발송
      InsuranceClaimMailerJob.perform_later("review_request", @insurance_claim.id)

      # 실시간 알림 발송
      NotificationService.notify_insurance_review_requested(@insurance_claim)

      redirect_to masters_insurance_claim_path(@insurance_claim),
                  notice: "고객에게 검토 요청을 보냈습니다."
    else
      redirect_to masters_insurance_claim_path(@insurance_claim),
                  alert: "현재 상태에서는 전송할 수 없습니다."
    end
  end

  def download_pdf
    authorize @insurance_claim, policy_class: Masters::InsuranceClaimPolicy
    pdf = InsuranceClaimPdfService.new(@insurance_claim).generate
    send_data pdf.render,
              filename: "보험신청서_#{@insurance_claim.claim_number}.pdf",
              type: "application/pdf",
              disposition: "inline"
  end

  private

  def set_insurance_claim
    @insurance_claim = current_user.prepared_insurance_claims.find(params[:id])
  end

  def set_request
    @request = current_user.assigned_requests.find_by!(public_token: params[:request_id])
  end

  def insurance_claim_params
    params.require(:insurance_claim).permit(
      :applicant_name, :applicant_phone, :applicant_email,
      :birth_date, :incident_address, :incident_detail_address,
      :incident_date, :incident_description, :damage_type,
      :estimated_damage_amount, :insurance_company, :policy_number,
      :victim_name, :victim_phone, :victim_address,
      supporting_documents: []
    )
  end
end
