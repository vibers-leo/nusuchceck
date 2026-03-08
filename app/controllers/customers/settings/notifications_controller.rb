class Customers::Settings::NotificationsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_user

  def show
    # 알림 설정 표시
  end

  def update
    if @user.update(notification_params)
      redirect_to customers_settings_notifications_path, notice: "알림 설정이 업데이트되었습니다."
    else
      render :show, status: :unprocessable_entity
    end
  end

  private

  def set_user
    @user = current_user
  end

  def notification_params
    params.require(:user).permit(
      :email_notifications,
      :push_notifications,
      :sms_notifications,
      :estimate_notification,
      :construction_notification,
      :insurance_notification,
      :marketing_notification
    )
  end
end
