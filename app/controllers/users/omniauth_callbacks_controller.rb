class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  skip_before_action :verify_authenticity_token, only: [:kakao, :naver]

  def kakao
    handle_oauth("카카오")
  end

  def naver
    handle_oauth("네이버")
  end

  def failure
    redirect_to root_path, alert: "소셜 로그인에 실패했습니다. 다시 시도해주세요."
  end

  private

  def handle_oauth(provider_name)
    auth = request.env["omniauth.auth"]
    Rails.logger.info "[#{provider_name}] provider=#{auth&.provider} uid=#{auth&.uid} email=#{auth&.info&.email} name=#{auth&.info&.name}"

    @user = User.from_omniauth(auth)

    if @user.persisted?
      sign_in_and_redirect @user, event: :authentication
      set_flash_message(:notice, :success, kind: provider_name) if is_navigational_format?
    else
      Rails.logger.error "[#{provider_name}] 유저 생성 실패: #{@user.errors.full_messages.join(', ')}"
      redirect_to new_user_registration_url, alert: "#{provider_name} 로그인에 실패했습니다: #{@user.errors.full_messages.join(', ')}"
    end
  end
end
