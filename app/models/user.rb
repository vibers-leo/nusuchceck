class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  # Associations
  has_many :notifications, as: :recipient, dependent: :destroy
  has_many :user_coupons, dependent: :destroy
  has_many :coupons, through: :user_coupons

  validates :name, presence: true
  validates :phone, format: { with: /\A01[016789]-?\d{3,4}-?\d{4}\z/, allow_blank: true }

  geocoded_by :address
  after_validation :geocode, if: ->(obj) { obj.address.present? && obj.address_changed? }

  scope :customers, -> { where(type: "Customer") }
  scope :masters, -> { where(type: "Master") }
  scope :admins, -> { where(role: :admin) }

  enum :role, { user: 0, admin: 1 }

  def customer?
    type == "Customer"
  end

  def master?
    type == "Master"
  end

  def admin_user?
    admin?
  end

  def display_role
    return "관리자" if admin?
    return "마스터" if master?
    "고객"
  end
end
