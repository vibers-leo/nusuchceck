class Masters::ProfilesController < ApplicationController
  include MasterAccessible

  before_action :set_profile

  def show
  end

  def edit
  end

  def update
    if @profile.update(profile_params)
      redirect_to masters_profile_path, notice: "프로필이 수정되었습니다."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  # 보험가입증명서 업로드 + OCR 자동 파싱
  def upload_insurance
    file = params[:insurance_certificate]

    unless file.present?
      redirect_to edit_masters_profile_path, alert: "파일을 선택해주세요." and return
    end

    @profile.insurance_certificate.attach(file)
    image_url = url_for(@profile.insurance_certificate)

    # OCR 파싱 (비동기 처리가 이상적이지만 MVP는 동기 처리)
    ocr_result = InsuranceOcrService.new(image_url).call

    if ocr_result[:success]
      @profile.update!(
        insurance_pending_review: true,
        insurance_ocr_data: ocr_result,
        insurance_insurer_name: ocr_result[:insurer_name],
        insurance_valid_until: ocr_result[:valid_until],
        insurance_verified: false  # 관리자 최종 승인 전까지 false
      )

      # 관리자에게 알림
      NotificationService.notify_admins(
        action: "insurance_review_requested",
        message: "#{current_user.name}님이 보험 인증을 요청했어요. (#{ocr_result[:insurer_name] || '보험사 미확인'})",
        notifiable: @profile
      ) rescue nil

      redirect_to masters_profile_path, notice: "보험증명서가 제출됐어요. 관리자 검토 후 인증 완료돼요."
    else
      redirect_to edit_masters_profile_path, alert: "OCR 인식에 실패했어요. 선명한 이미지로 다시 시도해주세요."
    end
  end

  private

  def set_profile
    @profile = current_user.master_profile || current_user.create_master_profile
  end

  def profile_params
    params.require(:master_profile).permit(
      :license_number, :license_type, :experience_years,
      :bank_name, :account_number, :account_holder, :bio,
      equipment: [], service_areas: []
    )
  end
end
