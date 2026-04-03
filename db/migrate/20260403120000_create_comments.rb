class CreateComments < ActiveRecord::Migration[7.1]
  def change
    create_table :comments do |t|
      t.references :post, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.integer    :parent_id, null: true  # nil이면 댓글, 있으면 대댓글
      t.text       :content, null: false

      t.timestamps
    end

    add_index :comments, :parent_id
  end
end
