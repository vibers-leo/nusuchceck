class API::V1::MessagesController < API::V1::BaseController
  before_action :set_request
  before_action :check_chat_permission

  # GET /api/v1/requests/:request_id/messages
  def index
    messages = @request.messages.order(created_at: :asc)
    messages = messages.where("created_at < ?", params[:before]) if params[:before].present?
    messages = messages.last(50)

    # 읽지 않은 메시지 읽음 처리
    @request.messages.where.not(sender_id: current_user.id).where(read_at: nil).update_all(read_at: Time.current)

    render json: messages.map { |m| message_json(m) }
  end

  # POST /api/v1/requests/:request_id/messages
  def create
    message = @request.messages.build(
      sender: current_user,
      content: params[:content],
      message_type: :user
    )

    if message.save
      render json: message_json(message), status: :created
    else
      render json: { error: message.errors.full_messages.first }, status: :unprocessable_entity
    end
  end

  private

  def set_request
    @request = Request.find_by!(public_token: params[:request_id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "요청을 찾을 수 없어요" }, status: :not_found
  end

  def check_chat_permission
    return if current_user.admin?
    return if current_user.id == @request.customer_id
    return if current_user.id == @request.master_id
    render json: { error: "채팅 권한이 없어요" }, status: :forbidden
  end

  def message_json(m)
    {
      id: m.id,
      content: m.content,
      sender_id: m.sender_id,
      sender_name: m.sender_name,
      message_type: m.message_type,
      is_mine: m.sender_id == current_user.id,
      read_at: m.read_at,
      created_at: m.created_at
    }
  end
end
