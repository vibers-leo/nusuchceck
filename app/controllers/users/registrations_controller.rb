class Users::RegistrationsController < Devise::RegistrationsController
  before_action :configure_sign_up_params, only: [:create]
  before_action :configure_account_update_params, only: [:update]

  # 회원 탈퇴 — 진행 중 체크가 있으면 차단
  def destroy
    if current_user.customer? && current_user.requests.where.not(status: %w[closed cancelled]).exists?
      redirect_to customers_profile_path, alert: "진행 중인 체크가 있어 탈퇴할 수 없어요. 완료 또는 취소 후 다시 시도해주세요."
      return
    end
    super
  end

  protected

  def configure_sign_up_params
    devise_parameter_sanitizer.permit(:sign_up, keys: [:phone, :address, :type])
  end

  def configure_account_update_params
    devise_parameter_sanitizer.permit(:account_update, keys: [:name, :phone, :address])
  end

  # 고객 전용 가입 - type을 Customer로 강제, 일반 가입은 registered 상태로 설정
  def build_resource(hash = {})
    hash[:type] = "Customer"
    hash[:account_status] = "registered"
    super
  end

  def after_sign_up_path_for(resource)
    customers_requests_path
  end
end
