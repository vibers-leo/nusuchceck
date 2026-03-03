class ChatChannel < ApplicationCable::Channel
  def subscribed
    request = Request.find(params[:request_id])

    # 권한 확인: 고객 또는 배정된 전문가만 채팅 가능
    if can_access_chat?(request)
      stream_from "chat_#{request.id}"

      # 상대방이 보낸 읽지 않은 메시지 읽음 처리
      mark_messages_as_read(request)
    else
      reject
    end
  end

  def unsubscribed
    # 채널 구독 해제 시 처리할 로직 (필요 시)
  end

  def speak(data)
    request = Request.find(params[:request_id])

    return unless can_access_chat?(request)

    message = request.messages.create!(
      sender: current_user,
      content: data["message"]
    )

    # 알림 전송 (상대방에게)
    recipient = (request.customer_id == current_user.id) ? request.master : request.customer

    if recipient.present?
      NotificationService.notify(
        recipient: recipient,
        action: "new_message",
        message: "#{current_user.name}님이 메시지를 보냈습니다: #{message.content.truncate(30)}",
        notifiable: request
      )
    end
  end

  private

  def can_access_chat?(request)
    return false unless current_user

    # 고객이거나 배정된 전문가인 경우에만 접근 가능
    current_user.id == request.customer_id || current_user.id == request.master_id
  end

  def mark_messages_as_read(request)
    # 상대방이 보낸 메시지만 읽음 처리
    request.messages
           .where.not(sender_id: current_user.id)
           .unread
           .update_all(read_at: Time.current)
  end
end
