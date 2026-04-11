class CreateDisputeMessages < ActiveRecord::Migration[7.1]
  def change
    create_table :dispute_messages do |t|
      t.references :dispute, null: false, foreign_key: true
      t.references :sender, foreign_key: { to_table: :users }
      t.string :sender_role
      t.text :content, null: false
      t.string :message_type, default: "text"
      t.timestamps
    end

    add_index :dispute_messages, [:dispute_id, :created_at]
  end
end
