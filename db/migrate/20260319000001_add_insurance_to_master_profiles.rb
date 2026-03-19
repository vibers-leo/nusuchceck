class AddInsuranceToMasterProfiles < ActiveRecord::Migration[7.1]
  def change
    add_column :master_profiles, :insurance_verified, :boolean, default: false, null: false
    add_column :master_profiles, :insurance_verified_at, :datetime
    add_column :master_profiles, :insurance_valid_until, :date
    add_column :master_profiles, :insurance_insurer_name, :string
    add_column :master_profiles, :insurance_ocr_data, :jsonb, default: {}
    add_column :master_profiles, :insurance_pending_review, :boolean, default: false, null: false

    add_index :master_profiles, :insurance_verified
    add_index :master_profiles, :insurance_valid_until
  end
end
