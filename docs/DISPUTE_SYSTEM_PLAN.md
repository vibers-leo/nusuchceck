# 분쟁조정 시스템 구현 플랜

## 1. 데이터 모델

### Dispute (분쟁)
```ruby
create_table :disputes do |t|
  t.references :request, null: false, foreign_key: true
  t.references :complainant, null: false, foreign_key: { to_table: :users }  # 신청자
  t.references :respondent, null: false, foreign_key: { to_table: :users }   # 피신청자
  t.references :mediator, foreign_key: { to_table: :users }                  # 중재자 (관리자)

  t.string :status, default: "opened"           # AASM 상태
  t.string :category, null: false               # 분쟁 유형
  t.string :dispute_number, null: false          # DIS-20260411-001
  t.text :description, null: false               # 분쟁 내용
  t.decimal :disputed_amount, precision: 10, scale: 0  # 분쟁 금액

  # 결정
  t.string :resolution_type                      # full_refund, partial_refund, rework, dismissed
  t.decimal :refund_amount, precision: 10, scale: 0
  t.integer :refund_percentage                   # 부분 환불 비율
  t.text :resolution_note                        # 중재 결정 사유
  t.datetime :resolved_at

  # 기한
  t.datetime :expert_response_deadline           # 전문가 답변 기한 (48시간)
  t.datetime :mediation_started_at
  t.datetime :escalated_at                       # 중재 요청 시점

  t.timestamps
end
add_index :disputes, :dispute_number, unique: true
add_index :disputes, :status
```

### DisputeMessage (분쟁 대화)
```ruby
create_table :dispute_messages do |t|
  t.references :dispute, null: false, foreign_key: true
  t.references :sender, foreign_key: { to_table: :users }  # nil = 시스템
  t.string :sender_role                          # customer, expert, mediator, system
  t.text :content, null: false
  t.string :message_type, default: "text"        # text, evidence, decision, system
  t.timestamps
end
```

### DisputeEvidence (증거)
```ruby
create_table :dispute_evidences do |t|
  t.references :dispute, null: false, foreign_key: true
  t.references :submitted_by, null: false, foreign_key: { to_table: :users }
  t.string :evidence_type                        # photo, video, document, receipt
  t.text :description
  t.timestamps
end
# Active Storage로 파일 첨부
```

### AASM 상태 흐름
```
opened (고객 접수)
  → expert_response (전문가 답변 대기, 48시간)
    → mutual_agreement (양측 합의 → 종료)
    → mediation (플랫폼 중재 개시)
      → resolved (중재 결정 완료)
  → auto_resolved (전문가 미응답 → 자동 고객 유리)
  → cancelled (고객 취소)
```

## 2. 분쟁 유형 (Category)

| 코드 | 유형 | 설명 | 기본 조치 |
|------|------|------|----------|
| `poor_quality` | 시공 불량 | 수리 후에도 문제 지속 | 재시공 또는 환불 |
| `recurring_leak` | 재누수 | 보증기간 내 재발생 | 무상 재시공 |
| `overcharge` | 과다 청구 | 견적 대비 초과 청구 | 차액 환불 |
| `incomplete` | 미완료 | 공사 미완료 상태에서 완료 처리 | 재시공 또는 환불 |
| `no_show` | 미방문 | 약속 시간에 방문 안 함 | 출장비 환불 |
| `rudeness` | 불친절 | 부적절한 태도/언행 | 경고 + 부분 환불 |
| `damage` | 재산 피해 | 수리 중 추가 피해 발생 | 피해액 보상 |
| `other` | 기타 | 위에 해당하지 않는 경우 | 중재 판단 |

## 3. 자동화 규칙

### 기한 관리
- 전문가 답변: **48시간** (영업일 기준)
- 중재 결정: **5영업일** 이내
- 증거 제출: 분쟁 개시 후 **7일** 이내

### 자동 처리
```ruby
# 전문가 48시간 미응답 → 자동 고객 유리
DisputeAutoResolveJob.perform_later(dispute_id)

# 분쟁 개시 시 에스크로 자동 보류
escrow_transactions.where(status: :deposited).each(&:hold!)

# 30일 이상 미해결 → 관리자 알림 에스컬레이션
DisputeEscalationJob.perform_later(dispute_id)
```

### 금액별 간소화
| 금액 | 절차 |
|------|------|
| 5만원 이하 | 즉시 환불 (관리자 승인 불요) |
| 5~30만원 | 일반 절차 (전문가 답변 → 중재) |
| 30만원 초과 | 강화 절차 (증거 필수 + 관리자 2인 승인) |

## 4. 구현 순서

### Phase 1: 모델 + 마이그레이션 (1일)
- Dispute, DisputeMessage, DisputeEvidence 모델
- AASM 상태 머신
- 시드 데이터

### Phase 2: 고객 분쟁 접수 UI (1일)
- `customers/disputes_controller.rb` — new, create
- 분쟁 유형 선택 → 내용 작성 → 증거 첨부 → 제출
- 기존 complaint 필드와 연동

### Phase 3: 전문가 답변 UI (1일)
- `masters/disputes_controller.rb` — show, respond
- 답변 + 증거 제출
- 합의안 제시 (부분 환불 등)

### Phase 4: 관리자 중재 (1일)
- `admin/disputes_controller.rb` — index, show, mediate, resolve
- 양측 증거 비교 뷰
- 부분 환불 비율 슬라이더
- 중재 결정 + 사유 기록

### Phase 5: 자동화 + 알림 (1일)
- DisputeAutoResolveJob (48시간 미응답)
- DisputeEscalationJob (30일 초과)
- 이메일 + 실시간 알림
- 에스크로 자동 보류/해제

## 5. 주요 파일

```
app/models/dispute.rb
app/models/dispute_message.rb
app/models/dispute_evidence.rb
app/controllers/customers/disputes_controller.rb
app/controllers/masters/disputes_controller.rb
app/controllers/admin/disputes_controller.rb
app/services/dispute_service.rb
app/jobs/dispute_auto_resolve_job.rb
app/jobs/dispute_escalation_job.rb
app/views/customers/disputes/
app/views/masters/disputes/
app/views/admin/disputes/
db/migrate/xxx_create_disputes.rb
db/migrate/xxx_create_dispute_messages.rb
db/migrate/xxx_create_dispute_evidences.rb
```
