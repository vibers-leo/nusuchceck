import { Controller } from "@hotwired/stimulus"

// Sentry 에러 추적 컨트롤러
// Usage: data-controller="error-tracking" data-action="error->error-tracking#captureError"
export default class extends Controller {
  connect() {
    // 전역 에러 핸들러 등록 (window.onerror, unhandledrejection)
    this.setupGlobalErrorHandlers()

    // Turbo 이벤트 에러 추적
    this.setupTurboErrorHandlers()
  }

  disconnect() {
    // 이벤트 리스너 정리
    window.removeEventListener("unhandledrejection", this.handleUnhandledRejection)
    document.removeEventListener("turbo:frame-missing", this.handleTurboFrameMissing)
  }

  // 전역 에러 핸들러 설정
  setupGlobalErrorHandlers() {
    // Promise rejection 에러
    this.handleUnhandledRejection = (event) => {
      console.error("Unhandled Promise Rejection:", event.reason)

      if (typeof Sentry !== "undefined") {
        Sentry.captureException(event.reason, {
          tags: { error_type: "unhandled_rejection" }
        })
      }
    }

    window.addEventListener("unhandledrejection", this.handleUnhandledRejection)
  }

  // Turbo 프레임워크 에러 핸들러
  setupTurboErrorHandlers() {
    // Turbo Frame이 서버에서 찾을 수 없을 때
    this.handleTurboFrameMissing = (event) => {
      console.error("Turbo Frame Missing:", event.detail)

      if (typeof Sentry !== "undefined") {
        Sentry.captureMessage("Turbo Frame Missing", {
          level: "warning",
          tags: { error_type: "turbo_frame_missing" },
          extra: {
            frame_id: event.detail.fetchResponse?.response?.url
          }
        })
      }
    }

    document.addEventListener("turbo:frame-missing", this.handleTurboFrameMissing)

    // Turbo 폼 제출 에러
    document.addEventListener("turbo:fetch-request-error", (event) => {
      console.error("Turbo Fetch Error:", event.detail)

      if (typeof Sentry !== "undefined") {
        Sentry.captureException(new Error("Turbo Fetch Request Error"), {
          tags: { error_type: "turbo_fetch_error" },
          extra: event.detail
        })
      }
    })
  }

  // 커스텀 에러 캡처 (data-action으로 호출)
  captureError(event) {
    const error = event.detail?.error || event.detail?.message || "Unknown error"
    const context = event.detail?.context || {}

    console.error("Custom Error Captured:", error, context)

    if (typeof Sentry !== "undefined") {
      if (error instanceof Error) {
        Sentry.captureException(error, {
          tags: { error_type: "custom_error" },
          extra: context
        })
      } else {
        Sentry.captureMessage(error, {
          level: context.level || "error",
          tags: { error_type: "custom_error" },
          extra: context
        })
      }
    }
  }

  // 폼 검증 에러 추적 (analytics와 연동)
  captureFormError(event) {
    const errorType = event.detail?.type || "validation_error"
    const errorMessage = event.detail?.message || "Form validation failed"
    const step = event.detail?.step

    console.error("Form Error:", errorType, errorMessage, step)

    if (typeof Sentry !== "undefined") {
      Sentry.captureMessage(errorMessage, {
        level: "warning",
        tags: {
          error_type: "form_validation",
          form_step: step
        },
        extra: {
          error_details: event.detail
        }
      })
    }
  }

  // 파일 업로드 에러 추적
  captureFileUploadError(event) {
    const error = event.detail?.error
    const fileInfo = event.detail?.file

    console.error("File Upload Error:", error, fileInfo)

    if (typeof Sentry !== "undefined") {
      Sentry.captureException(error, {
        tags: {
          error_type: "file_upload",
          file_type: fileInfo?.type,
          file_size: fileInfo?.size
        },
        extra: {
          file_name: fileInfo?.name,
          error_message: error?.message
        }
      })
    }
  }

  // 네트워크 에러 추적
  captureNetworkError(event) {
    const response = event.detail?.response
    const request = event.detail?.request

    console.error("Network Error:", response?.status, request?.url)

    if (typeof Sentry !== "undefined") {
      Sentry.captureMessage("Network Request Failed", {
        level: "error",
        tags: {
          error_type: "network_error",
          status_code: response?.status
        },
        extra: {
          url: request?.url,
          method: request?.method,
          response_text: response?.statusText
        }
      })
    }
  }

  // Breadcrumb 추가 (사용자 행동 추적)
  addBreadcrumb(event) {
    const message = event.detail?.message || "User action"
    const category = event.detail?.category || "ui"
    const data = event.detail?.data || {}

    if (typeof Sentry !== "undefined") {
      Sentry.addBreadcrumb({
        message: message,
        category: category,
        level: "info",
        data: data
      })
    }
  }

  // 커스텀 태그 설정
  setTag(event) {
    const key = event.detail?.key
    const value = event.detail?.value

    if (typeof Sentry !== "undefined" && key) {
      Sentry.setTag(key, value)
    }
  }

  // 컨텍스트 설정
  setContext(event) {
    const key = event.detail?.key
    const value = event.detail?.value

    if (typeof Sentry !== "undefined" && key) {
      Sentry.setContext(key, value)
    }
  }

  // 수동으로 에러 전송 (테스트용)
  testError(event) {
    event.preventDefault()

    if (typeof Sentry !== "undefined") {
      Sentry.captureMessage("Sentry Test Error", {
        level: "info",
        tags: { test: true }
      })

      alert("테스트 에러가 Sentry로 전송되었습니다. Sentry 대시보드를 확인하세요.")
    } else {
      alert("Sentry가 로드되지 않았습니다. 프로덕션 환경인지 확인하세요.")
    }
  }
}
