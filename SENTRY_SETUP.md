# Sentry 에러 추적 설정 가이드

## 개요

Sentry는 실시간 에러 모니터링 및 추적 시스템입니다. 프로덕션 환경에서 발생하는 에러를 자동으로 수집하고, 알림을 보내며, 디버깅에 필요한 컨텍스트를 제공합니다.

### 주요 기능
- **실시간 에러 추적**: Ruby, JavaScript 에러 자동 수집
- **성능 모니터링**: 느린 요청, 데이터베이스 쿼리 추적
- **세션 재생**: 에러 발생 시 사용자 행동 재생
- **알림**: Slack, 이메일 등으로 즉시 알림
- **Release 추적**: Git 커밋별 에러 발생률 모니터링

## 설치 방법

### 1. Sentry 계정 생성

1. [Sentry.io](https://sentry.io/) 접속
2. 무료 계정 생성 (월 5,000 에러까지 무료)
3. 새 프로젝트 생성: **Rails** 선택
4. DSN 복사 (프로젝트 설정에서 확인 가능)

### 2. Gem 설치

```bash
bundle install
```

이미 `Gemfile`에 다음 gem들이 추가되어 있습니다:
- `sentry-ruby`: 핵심 SDK
- `sentry-rails`: Rails 통합
- `sentry-sidekiq`: Sidekiq 백그라운드 작업 추적

### 3. 환경 변수 설정

`.env` 파일에 다음을 추가하세요:

```env
# Sentry DSN (Backend - Ruby/Rails)
SENTRY_DSN=https://[YOUR_KEY]@[YOUR_ORG].ingest.sentry.io/[PROJECT_ID]

# Sentry DSN (Frontend - JavaScript)
SENTRY_DSN_FRONTEND=https://[YOUR_KEY]@[YOUR_ORG].ingest.sentry.io/[PROJECT_ID]

# 샘플링 비율 (0.0 ~ 1.0)
SENTRY_TRACES_SAMPLE_RATE=0.1    # 10%만 추적
SENTRY_PROFILES_SAMPLE_RATE=0.1  # 10%만 프로파일링

# Git 커밋 해시 (Release 추적용)
GIT_COMMIT_SHA=$(git rev-parse HEAD)
```

**프로덕션 환경**에서는 환경 변수를 서버에 직접 설정하세요:
- Heroku: `heroku config:set SENTRY_DSN=...`
- AWS/DigitalOcean: `.env.production` 또는 시스템 환경 변수

### 4. 설정 파일 확인

설정 파일이 이미 생성되어 있습니다:

#### `config/initializers/sentry.rb`
- Rails 백엔드 에러 추적
- Sidekiq 통합
- PII 필터링 설정
- 제외할 예외 목록

#### `app/views/layouts/application.html.erb`
- JavaScript 프론트엔드 에러 추적
- 사용자 정보 자동 설정
- 성능 모니터링 통합

#### `app/javascript/controllers/error_tracking_controller.js`
- 커스텀 에러 캡처
- Turbo 에러 추적
- 파일 업로드 에러 추적
- Breadcrumb 추가

## 사용 방법

### 1. 자동 에러 추적

설정 완료 후 **자동으로** 다음 에러들이 Sentry로 전송됩니다:
- Rails 예외 (500 에러)
- JavaScript 에러 (unhandled exceptions)
- Promise rejection 에러
- Sidekiq 작업 실패
- Turbo 프레임 에러

### 2. 수동 에러 캡처 (Rails)

```ruby
begin
  # 위험한 작업
  risky_operation
rescue => e
  Sentry.capture_exception(e)
  # 또는 추가 컨텍스트와 함께
  Sentry.capture_exception(e, {
    tags: { operation: "file_upload" },
    extra: { file_size: file.size }
  })
end
```

### 3. 수동 에러 캡처 (JavaScript)

#### 방법 1: CustomEvent 사용 (권장)

```javascript
// 에러 발생 시
this.element.dispatchEvent(new CustomEvent("sentry:error", {
  detail: {
    error: error,
    context: {
      operation: "video_upload",
      file_size: file.size
    }
  },
  bubbles: true
}))
```

HTML에서:
```html
<div data-controller="error-tracking" data-action="sentry:error->error-tracking#captureError">
  <!-- 자식 요소들 -->
</div>
```

#### 방법 2: 직접 Sentry 호출

```javascript
if (typeof Sentry !== "undefined") {
  Sentry.captureException(error, {
    tags: { step: "video_upload" },
    extra: { file_name: file.name }
  })
}
```

### 4. Breadcrumb 추가 (사용자 행동 추적)

```javascript
// 중요한 사용자 액션 기록
this.element.dispatchEvent(new CustomEvent("sentry:breadcrumb", {
  detail: {
    message: "User selected video file",
    category: "ui.interaction",
    data: { file_count: files.length }
  },
  bubbles: true
}))
```

### 5. 폼 검증 에러 추적

기존 `analytics_controller`에 통합되어 있습니다:

```javascript
// check_wizard_controller.js
trackError(event) {
  const errorType = event.detail?.type || "unknown"
  const errorMessage = event.detail?.message || ""

  this.trackEvent("form_error", {
    error_type: errorType,
    error_message: errorMessage,
    step: this.getCurrentStep()
  })
}
```

이벤트 발생:
```javascript
this.element.dispatchEvent(new CustomEvent("analytics:error", {
  detail: {
    type: "validation_error",
    message: "필수 항목이 입력되지 않았습니다",
    step: this.currentStepValue
  },
  bubbles: true
}))
```

## 테스트

### 개발 환경에서 테스트

1. `.env` 파일에 `SENTRY_DSN` 추가
2. `config/initializers/sentry.rb`에서 개발 환경 활성화:
   ```ruby
   config.enabled_environments = %w[development production staging]
   ```

3. Rails 콘솔에서 테스트:
   ```ruby
   rails console
   Sentry.capture_message("Test error from Rails")
   ```

4. 브라우저에서 테스트:
   - 개발자 도구 콘솔에서:
     ```javascript
     Sentry.captureMessage("Test error from browser")
     ```

### 프로덕션 배포 전 체크리스트

- [ ] `SENTRY_DSN` 환경 변수 설정 (백엔드)
- [ ] `SENTRY_DSN_FRONTEND` 환경 변수 설정 (프론트엔드)
- [ ] Sentry 프로젝트에서 알림 설정 (Slack, 이메일)
- [ ] Release 추적 설정: `GIT_COMMIT_SHA` 환경 변수
- [ ] 샘플링 비율 조정 (`SENTRY_TRACES_SAMPLE_RATE`)
- [ ] Sentry 대시보드에서 첫 에러 확인

## Sentry 대시보드 활용

### 1. Issues (이슈)
- 발생한 에러 목록 확인
- 에러 빈도, 영향받은 사용자 수 확인
- 스택 트레이스, 브레드크럼 확인

### 2. Performance (성능)
- 느린 요청 추적
- 데이터베이스 쿼리 성능
- 프론트엔드 렌더링 시간

### 3. Releases (릴리스)
- Git 커밋별 에러 발생률
- 새 배포 후 에러 증가 감지
- 자동 롤백 권장

### 4. Alerts (알림)
- 에러 급증 시 알림
- 특정 에러 발생 시 Slack 메시지
- 일일 요약 이메일

## OKR 연계

### KR: 에러율 5% 이하 유지

**측정 지표**:
```
에러율 = (Sentry 에러 발생 수 / 총 요청 수) × 100
```

**목표**:
- 주간 에러율 5% 이하
- Critical 에러 0건
- 평균 에러 해결 시간 24시간 이내

**추적 방법**:
1. Sentry 대시보드에서 주간 에러율 확인
2. Google Analytics와 비교 (총 방문자 vs 에러 발생 사용자)
3. 주간 회고에서 top 5 에러 리뷰 및 해결

## 비용 관리

### 무료 플랜
- 월 5,000 에러까지 무료
- 1명의 팀원
- 30일 데이터 보관

### 비용 절감 팁
1. **샘플링 비율 조정**: 모든 요청을 추적하지 말고 10-20%만 추적
   ```ruby
   config.traces_sample_rate = 0.1  # 10%만 추적
   ```

2. **제외할 예외 설정**: 404, 401 등 예상된 에러는 제외
   ```ruby
   config.excluded_exceptions += ['ActionController::RoutingError']
   ```

3. **환경별 분리**: 개발/테스트 환경은 비활성화
   ```ruby
   config.enabled_environments = %w[production staging]
   ```

4. **Before Send 훅**: 민감한 정보 필터링
   ```ruby
   config.before_send = lambda do |event, hint|
     return nil if event.user&.email&.include?("test")
     event
   end
   ```

## 문제 해결

### 에러가 Sentry로 전송되지 않을 때

1. **환경 변수 확인**:
   ```bash
   rails console
   ENV['SENTRY_DSN']  # 값이 있어야 함
   ```

2. **활성화된 환경 확인**:
   ```ruby
   Sentry.configuration.enabled_environments
   ```

3. **수동 전송 테스트**:
   ```ruby
   Sentry.capture_message("Test")
   ```

4. **JavaScript 확인**:
   - 브라우저 개발자 도구 콘솔에서 `Sentry` 객체 확인
   - `SENTRY_DSN_FRONTEND` 환경 변수 설정 확인

### 너무 많은 에러가 전송될 때

1. **제외할 예외 추가**:
   ```ruby
   config.excluded_exceptions += ['YourCustomError']
   ```

2. **샘플링 비율 낮추기**:
   ```ruby
   config.traces_sample_rate = 0.05  # 5%
   ```

3. **Before Send 훅 활용**:
   ```ruby
   config.before_send = lambda do |event, hint|
     # 특정 조건의 에러는 전송하지 않음
     return nil if event.message&.include?("Ignore this")
     event
   end
   ```

## 참고 자료

- [Sentry 공식 문서](https://docs.sentry.io/)
- [Sentry Rails 가이드](https://docs.sentry.io/platforms/ruby/guides/rails/)
- [Sentry JavaScript 가이드](https://docs.sentry.io/platforms/javascript/)
- [Sentry Sidekiq 통합](https://docs.sentry.io/platforms/ruby/guides/sidekiq/)

---

**마지막 업데이트**: 2026-02-13
**작성자**: Claude Sonnet 4.5
