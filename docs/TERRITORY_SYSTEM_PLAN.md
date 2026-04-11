# 전문가 구역 선점 시스템 구현 플랜

## 1. 데이터 모델

### ServiceZone (구역 정의)
```ruby
create_table :service_zones do |t|
  t.string :name, null: false              # "강남", "해운대"
  t.string :region, null: false             # "서울", "부산"
  t.text :districts, array: true, default: [] # ["강남구"] 또는 ["중구", "종로구", "용산구"]
  t.integer :population, default: 0         # 인구수
  t.integer :max_slots, default: 1          # 최대 전문가 수
  t.integer :claimed_slots_count, default: 0 # counter_cache
  t.decimal :monthly_fee, precision: 10, scale: 0, default: 99000  # 월 구독료
  t.boolean :active, default: true
  t.integer :sort_order, default: 0
  t.timestamps
end
add_index :service_zones, [:region, :name], unique: true
```

### ZoneClaim (선점)
```ruby
create_table :zone_claims do |t|
  t.references :master, null: false, foreign_key: { to_table: :users }
  t.references :service_zone, null: false, foreign_key: true
  t.string :status, default: "active"       # active, suspended, expired, released
  t.datetime :claimed_at
  t.datetime :expires_at                     # 구독 만료일
  t.datetime :released_at
  t.timestamps
end
add_index :zone_claims, [:service_zone_id, :master_id], unique: true
add_index :zone_claims, [:service_zone_id, :status]
```

## 2. 구역 데이터 (시드)

### 서울 (15개 구역, 38슬롯)
| 구역명 | 포함 구 | 인구(만) | 슬롯 |
|--------|---------|---------|------|
| 강남 | 강남구 | 53 | 2 |
| 서초 | 서초구 | 42 | 2 |
| 송파 | 송파구 | 67 | 3 |
| 강동 | 강동구 | 47 | 2 |
| 마포·서대문 | 마포구, 서대문구 | 69 | 3 |
| 영등포·동작 | 영등포구, 동작구 | 74 | 3 |
| 관악·금천 | 관악구, 금천구 | 72 | 3 |
| 구로·양천 | 구로구, 양천구 | 87 | 3 |
| 강서 | 강서구 | 58 | 2 |
| 노원·도봉 | 노원구, 도봉구 | 82 | 3 |
| 강북·성북 | 강북구, 성북구 | 71 | 3 |
| 중랑·동대문 | 중랑구, 동대문구 | 73 | 3 |
| 성동·광진 | 성동구, 광진구 | 67 | 3 |
| 도심 | 중구, 종로구, 용산구 | 50 | 2 |
| 은평 | 은평구 | 48 | 1 |

### 부산 (8개 구역, 12슬롯)
| 구역명 | 포함 구 | 인구(만) | 슬롯 |
|--------|---------|---------|------|
| 해운대 | 해운대구 | 25 | 1 |
| 부산진·동래 | 부산진구, 동래구 | 60 | 2 |
| 남구·수영 | 남구, 수영구 | 40 | 2 |
| 사상·사하 | 사상구, 사하구 | 50 | 2 |
| 북구·강서 | 북구, 강서구 | 40 | 2 |
| 금정·연제 | 금정구, 연제구 | 45 | 1 |
| 도심 | 중구, 서구, 동구, 영도구 | 30 | 1 |
| 기장 | 기장군 | 20 | 1 |

### 경기 (추후 확장)
- 수원, 성남, 용인, 고양, 부천 등 인구 50만+ 도시부터

## 3. 비즈니스 로직

### 구독 + 선점 연동
```
전문가 가입 → 구역 선택 → 99,000원 결제 → 선점 활성화
                                    ↓
                            매월 자동 결제 (99,000원)
                                    ↓
                            미결제 시 → 선점 해제 (7일 유예)
```

### 선점 규칙
- 1 전문가 = 최대 3개 구역 선점 가능
- 구역당 슬롯 초과 시 대기열 등록 가능
- 선점 해제 후 30일간 재선점 우선권
- 관리자가 슬롯 수 동적 조정 가능

### 고객 매칭 연동
- 고객 주소 → 해당 구역 전문가 우선 매칭
- 구역 전문가 없으면 인접 구역으로 확장
- MatchingService에서 ZoneClaim 기반 필터 추가

## 4. 구현 순서

### Phase 1: 모델 + 마이그레이션 + 시드 (0.5일)
### Phase 2: 전문가 프로필에 구역 선택 UI (1일)
### Phase 3: 관리자 구역 관리 대시보드 (0.5일)
### Phase 4: MatchingService 연동 (0.5일)
### Phase 5: 구독 결제 연동 (추후)

## 5. 주요 파일

```
app/models/service_zone.rb
app/models/zone_claim.rb
app/controllers/masters/zone_claims_controller.rb
app/controllers/admin/service_zones_controller.rb
app/views/masters/profiles/_zone_selector.html.erb
app/views/admin/service_zones/
app/services/matching_service.rb (수정)
db/migrate/xxx_create_service_zones.rb
db/migrate/xxx_create_zone_claims.rb
db/seeds/service_zones.rb
```
