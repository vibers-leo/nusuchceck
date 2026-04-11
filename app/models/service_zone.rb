class ServiceZone < ApplicationRecord
  has_many :zone_claims, dependent: :destroy
  has_many :masters, through: :zone_claims

  scope :active, -> { where(active: true) }
  scope :by_region, ->(region) { where(region: region) }
  scope :available, -> { active.where("claimed_slots_count < max_slots") }

  validates :name, presence: true
  validates :region, presence: true
  validates :max_slots, numericality: { greater_than: 0 }
  validates :name, uniqueness: { scope: :region }

  def full?
    claimed_slots_count >= max_slots
  end

  def available_slots
    max_slots - claimed_slots_count
  end

  def districts_text
    districts.is_a?(Array) ? districts.join(", ") : ""
  end

  def display_name
    "#{region} #{name}"
  end
end
