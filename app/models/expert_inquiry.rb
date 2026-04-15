class ExpertInquiry < ApplicationRecord
  validates :name, :phone, presence: true

  scope :pending,  -> { where(status: "pending") }
  scope :approved, -> { where(status: "approved") }
  scope :rejected, -> { where(status: "rejected") }
  scope :recent,   -> { order(created_at: :desc) }

  def pending?  = status == "pending"
  def approved? = status == "approved"
  def rejected? = status == "rejected"

  def status_label
    { "pending" => "검토 대기", "approved" => "승인됨", "rejected" => "거절됨" }[status] || status
  end

  def self.ransackable_attributes(auth_object = nil)
    %w[name phone email status created_at]
  end
end
