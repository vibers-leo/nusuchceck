class Coupon < ApplicationRecord
  has_many :user_coupons, dependent: :destroy
  has_many :users, through: :user_coupons

  validates :code, presence: true, uniqueness: true
  validates :name, presence: true
  validates :coupon_type, presence: true, inclusion: { in: %w[percentage fixed_amount] }
  validates :discount_value, presence: true, numericality: { greater_than: 0 }

  scope :active, -> { where(active: true) }
  scope :valid, -> { where('valid_from <= ? AND valid_until >= ?', Time.current, Time.current) }

  def valid?
    active? &&
      (valid_from.nil? || valid_from <= Time.current) &&
      (valid_until.nil? || valid_until >= Time.current) &&
      (usage_limit.nil? || usage_count < usage_limit)
  end

  def calculate_discount(amount)
    if coupon_type == 'percentage'
      discount = amount * (discount_value / 100.0)
      max_discount.present? ? [discount, max_discount].min : discount
    else
      [discount_value, amount].min
    end
  end

  def discount_label
    if coupon_type == 'percentage'
      "#{discount_value.to_i}% 할인"
    else
      "#{discount_value.to_i.to_s(:delimited)}원 할인"
    end
  end
end
