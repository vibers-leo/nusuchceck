class AddPublicTokenToRequests < ActiveRecord::Migration[7.1]
  def change
    add_column :requests, :public_token, :string
    add_index :requests, :public_token, unique: true

    # 기존 레코드에 토큰 부여
    reversible do |dir|
      dir.up do
        execute <<-SQL
          UPDATE requests SET public_token = substr(md5(random()::text || id::text), 1, 12) WHERE public_token IS NULL
        SQL
      end
    end

    change_column_null :requests, :public_token, false
  end
end
