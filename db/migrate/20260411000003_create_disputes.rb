class CreateDisputes < ActiveRecord::Migration[7.1]
  def change
    create_table :disputes do |t|
      t.references :request, null: false, foreign_key: true
      t.references :complainant, null: false, foreign_key: { to_table: :users }
      t.references :respondent, null: false, foreign_key: { to_table: :users }
      t.references :mediator, foreign_key: { to_table: :users }

      t.string :status, default: "opened", null: false
      t.string :category, null: false
      t.string :dispute_number, null: false
      t.text :description, null: false
      t.decimal :disputed_amount, precision: 10, scale: 0

      # 결정
      t.string :resolution_type
      t.decimal :refund_amount, precision: 10, scale: 0
      t.integer :refund_percentage
      t.text :resolution_note
      t.datetime :resolved_at

      # 기한
      t.datetime :expert_response_deadline
      t.datetime :mediation_started_at
      t.datetime :escalated_at

      t.timestamps
    end

    add_index :disputes, :dispute_number, unique: true
    add_index :disputes, :status
    add_index :disputes, :category
  end
end
