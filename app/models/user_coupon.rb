class UserCoupon < ApplicationRecord
  belongs_to :user
  belongs_to :coupon
  belongs_to :request, optional: true

  validates :user_id, uniqueness: { scope: :coupon_id }

  scope :available, -> { where(used: false).joins(:coupon).merge(Coupon.active.valid) }
  scope :used, -> { where(used: true) }

  def use!(request)
    return false if used?
    return false unless coupon.valid?

    transaction do
      update!(used: true, used_at: Time.current, request: request)
      coupon.increment!(:usage_count)
    end

    true
  end
end
