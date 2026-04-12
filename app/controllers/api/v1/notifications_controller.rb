class Api::V1::NotificationsController < Api::V1::BaseController
  # GET /api/v1/notifications
  def index
    notifications = current_user.notifications.order(created_at: :desc).limit(50)

    render json: {
      unread_count: current_user.notifications.where(read_at: nil).count,
      notifications: notifications.map { |n| notification_json(n) }
    }
  end

  # POST /api/v1/notifications/:id/read
  def read
    notification = current_user.notifications.find(params[:id])
    notification.update!(read_at: Time.current) unless notification.read_at
    render json: { success: true }
  rescue ActiveRecord::RecordNotFound
    render json: { error: "알림을 찾을 수 없어요" }, status: :not_found
  end

  # POST /api/v1/notifications/read_all
  def read_all
    current_user.notifications.where(read_at: nil).update_all(read_at: Time.current)
    render json: { success: true }
  end

  private

  def notification_json(n)
    {
      id: n.id,
      action: n.action,
      message: n.message,
      read: n.read_at.present?,
      created_at: n.created_at
    }
  end
end
