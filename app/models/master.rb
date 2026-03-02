class Master < User
  has_one :master_profile, foreign_key: :user_id, dependent: :destroy, inverse_of: :user
  has_many :assigned_requests, class_name: "Request", foreign_key: :master_id, dependent: :nullify, inverse_of: :master
  has_many :estimates, foreign_key: :master_id, dependent: :destroy, inverse_of: :master
  has_many :reviews, foreign_key: :master_id, dependent: :destroy, inverse_of: :master
  has_many :escrow_transactions, foreign_key: :master_id, dependent: :restrict_with_error, inverse_of: :master
  has_many :prepared_insurance_claims, class_name: "InsuranceClaim", foreign_key: :prepared_by_master_id, dependent: :nullify

  accepts_nested_attributes_for :master_profile

  after_create :create_default_profile

  delegate :verified?, :license_number, :experience_years, to: :master_profile, allow_nil: true

  def average_rating
    reviews.average(:overall_rating)&.round(2) || 0.0
  end

  def total_reviews_count
    reviews.count
  end

  def active_requests
    assigned_requests.where.not(status: [:closed, :cancelled])
  end

  def self.ransackable_attributes(auth_object = nil)
    %w[id name email phone address created_at]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[master_profile assigned_requests]
  end

  private

  def create_default_profile
    # 신규 가입 시 verified: false로 시작 (관리자 승인 필요)
    create_master_profile!(verified: false) unless master_profile.present?
  end
end
