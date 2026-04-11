class DisputeEvidence < ApplicationRecord
  belongs_to :dispute
  belongs_to :submitted_by, class_name: "User"

  has_many_attached :files

  validates :evidence_type, presence: true

  TYPES = {
    photo: "사진",
    video: "영상",
    document: "서류",
    receipt: "영수증"
  }.freeze

  def type_label
    TYPES[evidence_type.to_sym] || evidence_type
  end
end
