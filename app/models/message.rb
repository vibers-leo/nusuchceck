class Message < ApplicationRecord
  belongs_to :request
  belongs_to :sender, class_name: "User"

  validates :content, presence: true, length: { minimum: 1, maximum: 1000 }

  scope :recent, -> { order(created_at: :asc) }
  scope :unread, -> { where(read_at: nil) }
  scope :for_request, ->(request_id) { where(request_id: request_id) }

  after_create_commit -> { broadcast_message }

  def read?
    read_at.present?
  end

  def mark_as_read!
    update(read_at: Time.current) unless read?
  end

  def sender_name
    sender&.name || "Unknown"
  end

  def sent_by_customer?
    request.customer_id == sender_id
  end

  def sent_by_master?
    request.master_id == sender_id
  end

  private

  def broadcast_message
    ActionCable.server.broadcast(
      "chat_#{request_id}",
      {
        id: id,
        content: content,
        sender_name: sender_name,
        sender_id: sender_id,
        sent_by_customer: sent_by_customer?,
        created_at: created_at.strftime("%H:%M"),
        html: ApplicationController.renderer.render(
          partial: "messages/message",
          locals: { message: self, current_user: sender }
        )
      }
    )
  end
end
