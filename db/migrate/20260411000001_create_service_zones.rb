class CreateServiceZones < ActiveRecord::Migration[7.1]
  def change
    create_table :service_zones do |t|
      t.string :name, null: false
      t.string :region, null: false
      t.text :districts, array: true, default: []
      t.integer :population, default: 0
      t.integer :max_slots, default: 1
      t.integer :claimed_slots_count, default: 0
      t.decimal :monthly_fee, precision: 10, scale: 0, default: 99000
      t.boolean :active, default: true
      t.integer :sort_order, default: 0
      t.timestamps
    end

    add_index :service_zones, [:region, :name], unique: true
    add_index :service_zones, :active
  end
end
