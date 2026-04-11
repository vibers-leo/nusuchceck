class CreateDisputeEvidences < ActiveRecord::Migration[7.1]
  def change
    create_table :dispute_evidences do |t|
      t.references :dispute, null: false, foreign_key: true
      t.references :submitted_by, null: false, foreign_key: { to_table: :users }
      t.string :evidence_type, default: "photo"
      t.text :description
      t.timestamps
    end
  end
end
