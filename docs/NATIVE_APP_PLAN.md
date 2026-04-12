# 누수체크 Expo 네이티브 앱 개발 계획

## 전략
- **WebView Shell 사용하지 않음** — 네이티브 풀 구현
- Rails는 API 서버 역할만, Expo 앱에서 API 호출
- 같은 코드로 iOS/Android/토스/카카오 4개 플랫폼 배포 가능

## 현재 상태 (expo/nusucheck-app)
- ✅ Expo 54 + Router + NativeWind 셋업 완료
- ✅ 4탭 레이아웃 (홈/점검/전문가/프로필)
- ✅ 홈 화면 UI, 점검 신청 UI, 로그인 모달 UI
- ❌ API 연동 0% (모든 화면이 정적 UI만)
- ❌ 에셋 (아이콘/스플래시) 없음
- ❌ EAS 미설정

---

## Phase 1: Rails API 레이어 구축 (rails/nusucheck)

### 필요한 API 엔드포인트

```
POST   /api/v1/auth/sign_in          # 이메일 로그인 → JWT 토큰
POST   /api/v1/auth/sign_up          # 회원가입
POST   /api/v1/auth/kakao            # 카카오 OAuth → JWT
POST   /api/v1/auth/refresh           # 토큰 갱신
DELETE /api/v1/auth/sign_out          # 로그아웃

GET    /api/v1/me                     # 내 정보
PATCH  /api/v1/me                     # 내 정보 수정

GET    /api/v1/requests               # 내 요청 목록
POST   /api/v1/requests               # 요청 생성 (사진/영상 포함)
GET    /api/v1/requests/:id           # 요청 상세
POST   /api/v1/requests/:id/cancel    # 요청 취소

GET    /api/v1/requests/:id/messages  # 채팅 메시지
POST   /api/v1/requests/:id/messages  # 메시지 전송

POST   /api/v1/leak_inspections       # AI 점검 (사진 업로드)
GET    /api/v1/leak_inspections/:id   # AI 점검 결과

GET    /api/v1/masters                # 전문가 목록
GET    /api/v1/masters/:id            # 전문가 상세

GET    /api/v1/notifications          # 알림 목록
POST   /api/v1/notifications/:id/read # 읽음 처리

GET    /api/v1/estimates/:id          # 견적 상세
POST   /api/v1/estimates/:id/accept   # 견적 수락

POST   /api/v1/disputes               # 분쟁 접수
GET    /api/v1/disputes               # 분쟁 목록
GET    /api/v1/disputes/:id           # 분쟁 상세
```

### 인증 방식: JWT (devise-jwt 또는 doorkeeper)
- `expo-secure-store`에 토큰 저장
- `Authorization: Bearer <token>` 헤더
- Refresh token으로 자동 갱신

---

## Phase 2: Expo 앱 핵심 화면 구현

### 우선순위 1 (오픈베타 필수)

| 화면 | API | 설명 |
|------|-----|------|
| 로그인/회원가입 | auth/* | 이메일 + 카카오 OAuth |
| 홈 | me, requests | 최근 점검, 빠른 메뉴 |
| AI 점검 | leak_inspections | 카메라 → 업로드 → 분석 결과 |
| 전문가 점검 요청 | requests (create) | 증상/건물/주소/사진 위저드 |
| 내 요청 목록 | requests (index) | 상태별 필터 |
| 요청 상세 | requests/:id | 상태, 타임라인, 액션 |
| 채팅 | messages | 실시간 채팅 (WebSocket) |
| 프로필 | me | 내 정보, 소셜 연동, 로그아웃 |

### 우선순위 2 (베타 이후)

| 화면 | 설명 |
|------|------|
| 전문가 목록/상세 | 검증된 전문가 조회 |
| 견적 확인/수락 | 견적서 상세 + 수락 |
| 결제 | 토스페이먼츠 SDK 연동 |
| 알림 | 푸시 + 인앱 알림 |
| 분쟁 접수 | 분쟁 폼 + 대화 |
| 보험 청구 | 11단계 폼 (축소 검토) |
| 리뷰 작성 | 별점 + 텍스트 |

---

## Phase 3: 전문가용 앱 (별도 탭 또는 앱)

| 화면 | 설명 |
|------|------|
| 오픈 오더 | 공개 오더 목록 + 클레임 |
| 내 작업 | 배정된 요청 관리 |
| 현장 작업 | 방문/도착/탐지완료 상태 전이 |
| 견적 작성 | 항목 추가 + 금액 계산 |
| 구역 선점 | 구역 목록 + 선점/해제 |
| 정산 | 에스크로 현황 |

---

## Phase 4: 배포

### iOS
- Apple Developer 계정
- EAS Build → TestFlight → App Store 제출
- 번들ID: com.vibers.nusucheck

### Android
- Google Play Console 계정
- EAS Build → Internal Testing → Production
- 패키지: com.vibers.nusucheck

### 토스 미니앱 (별도 트랙)
- toss/apps/nusucheck-toss 프로젝트
- React 컴포넌트 공유 가능
- Gemini AI → Rails AI API 전환 검토

---

## 작업 순서 (권장)

```
Day 1-2: Rails API 레이어 (auth + requests + leak_inspections)
Day 3-4: Expo 앱 로그인 + AI 점검 + 요청 생성
Day 5:   채팅 (WebSocket) + 알림 (푸시)
Day 6:   QA + 에셋 (아이콘/스플래시) + EAS 빌드
Day 7:   TestFlight + Internal Testing 배포
```

## 주요 파일 (생성 필요)

### Rails 측
```
app/controllers/api/v1/base_controller.rb
app/controllers/api/v1/auth_controller.rb
app/controllers/api/v1/requests_controller.rb
app/controllers/api/v1/leak_inspections_controller.rb
app/controllers/api/v1/messages_controller.rb
app/controllers/api/v1/masters_controller.rb
app/controllers/api/v1/notifications_controller.rb
config/routes.rb (api/v1 namespace 추가)
```

### Expo 측
```
expo/nusucheck-app/lib/api.ts          # API 클라이언트
expo/nusucheck-app/lib/auth.ts         # 토큰 관리
expo/nusucheck-app/hooks/useAuth.ts    # 인증 훅
expo/nusucheck-app/hooks/useApi.ts     # API 훅
expo/nusucheck-app/app/(tabs)/index.tsx  # 수정
expo/nusucheck-app/app/(auth)/login.tsx  # 수정
expo/nusucheck-app/app/request/new.tsx   # 신규
expo/nusucheck-app/app/request/[id].tsx  # 신규
expo/nusucheck-app/app/chat/[id].tsx     # 신규
```
