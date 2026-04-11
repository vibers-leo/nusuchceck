class DisputeMessage < ApplicationRecord
  belongs_to :dispute
  belongs_to :sender, class_name: "User", optional: true

  validates :content, presence: true

  scope :chronological, -> { order(created_at: :asc) }

  def system?
    sender_role == "system"
  end

  def sender_name
    return "시스템" if system?
    return "중재자" if sender_role == "mediator"
    sender&.name || "알 수 없음"
  end
end
