class SetExistingMastersVerified < ActiveRecord::Migration[7.1]
  def up
    # 기존에 가입한 전문가들은 verified: true로 설정
    # (신규 가입자는 Master 모델의 create_default_profile에서 verified: false로 시작)
    MasterProfile.where(verified: [nil, false]).update_all(verified: true, verified_at: Time.current)
  end

  def down
    # 복구 불필요 (기존 데이터 보존)
  end
end
