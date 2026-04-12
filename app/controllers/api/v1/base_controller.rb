class API::V1::BaseController < ActionController::API
  before_action :authenticate_token!

  private

  def authenticate_token!
    token = request.headers["Authorization"]&.split("Bearer ")&.last
    unless token
      render json: { error: "인증이 필요해요" }, status: :unauthorized
      return
    end

    payload = JwtService.decode(token)
    unless payload
      render json: { error: "토큰이 만료되었거나 유효하지 않아요" }, status: :unauthorized
      return
    end

    @current_user = User.find_by(id: payload[:user_id])
    unless @current_user
      render json: { error: "사용자를 찾을 수 없어요" }, status: :unauthorized
    end
  end

  def current_user
    @current_user
  end

  def render_error(message, status: :unprocessable_entity)
    render json: { error: message }, status: status
  end

  def render_success(data = {}, status: :ok)
    render json: data, status: status
  end
end
