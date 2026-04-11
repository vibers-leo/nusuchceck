class CreateZoneClaims < ActiveRecord::Migration[7.1]
  def change
    create_table :zone_claims do |t|
      t.references :master, null: false, foreign_key: { to_table: :users }
      t.references :service_zone, null: false, foreign_key: true
      t.string :status, default: "active"
      t.datetime :claimed_at
      t.datetime :expires_at
      t.datetime :released_at
      t.timestamps
    end

    add_index :zone_claims, [:service_zone_id, :master_id], unique: true
    add_index :zone_claims, [:service_zone_id, :status]
    add_index :zone_claims, :status
  end
end
