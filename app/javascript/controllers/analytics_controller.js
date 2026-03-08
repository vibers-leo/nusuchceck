import { Controller } from "@hotwired/stimulus"

// Google Analytics 이벤트 추적 컨트롤러
export default class extends Controller {
  static values = {
    category: String,  // 예: "Request Form"
    label: String      // 예: "Step 1"
  }

  connect() {
    this.startTime = new Date()
    this.stepStartTime = new Date()

    // 폼 시작 이벤트
    this.trackEvent("form_start", {
      form_type: "leak_check_request",
      timestamp: new Date().toISOString()
    })

    // 커스텀 이벤트 리스너 등록
    this.element.addEventListener("analytics:step-completed", this.trackStepCompleted.bind(this))
    this.element.addEventListener("analytics:video-uploaded", this.trackVideoUpload.bind(this))

    // 폼 제출 이벤트 리스너
    const form = this.element.querySelector("form")
    if (form) {
      form.addEventListener("submit", this.trackFormSubmit.bind(this))
    }
  }

  disconnect() {
    // 폼 포기 이벤트 (페이지 이탈 시)
    this.trackEvent("form_abandoned", {
      last_step: this.getCurrentStep(),
      time_spent: this.getTimeSpent()
    })
  }

  // 단계 완료 추적
  trackStepCompleted(event) {
    const step = event.detail?.step || event.currentTarget.dataset.step

    this.trackEvent("step_completed", {
      step_number: step,
      step_name: this.getStepName(step),
      time_on_step: this.getTimeOnStep()
    })
  }

  // 영상 업로드 추적
  trackVideoUpload(event) {
    const fileCount = event.detail?.fileCount || 0
    const totalSize = event.detail?.totalSize || 0
    const method = event.detail?.method || "click"  // "click" 또는 "drag_drop"

    this.trackEvent("video_uploaded", {
      file_count: fileCount,
      total_size_mb: Math.round(totalSize / (1024 * 1024) * 100) / 100,
      upload_method: method
    })

    // 드래그 앤 드롭 사용 별도 추적 (중요 지표)
    if (method === "drag_drop") {
      this.trackEvent("drag_drop_used", {
        file_count: fileCount
      })
    }
  }

  // 폼 제출 추적
  trackFormSubmit(event) {
    this.trackEvent("form_submitted", {
      total_steps: 7,
      has_video: this.hasVideo(),
      video_count: this.getVideoCount(),
      completion_time: this.getTimeSpent()
    })
  }

  // 에러 추적
  trackError(event) {
    const errorType = event.detail?.type || "unknown"
    const errorMessage = event.detail?.message || ""
    const step = this.getCurrentStep()

    // Google Analytics
    this.trackEvent("form_error", {
      error_type: errorType,
      error_message: errorMessage,
      step: step
    })

    // Sentry 에러 추적
    this.element.dispatchEvent(new CustomEvent("sentry:error", {
      detail: {
        error: new Error(errorMessage),
        context: {
          error_type: errorType,
          step: step,
          form_type: "leak_check_request"
        }
      },
      bubbles: true
    }))
  }

  // Google Analytics 이벤트 전송 (gtag.js)
  trackEvent(eventName, params = {}) {
    if (typeof gtag === "function") {
      gtag("event", eventName, {
        event_category: this.categoryValue || "Request Form",
        event_label: this.labelValue,
        ...params,
        // 커스텀 디멘션 (OKR 추적용)
        send_to: "G-XXXXXXXXXX",  // TODO: GA Measurement ID 설정
        non_interaction: false
      })

      console.log(`[Analytics] ${eventName}`, params)
    } else {
      console.warn("[Analytics] gtag not loaded, event not tracked:", eventName, params)
    }
  }

  // 헬퍼 메서드
  getCurrentStep() {
    const wizard = document.querySelector("[data-controller='check-wizard']")
    if (wizard) {
      const controller = this.application.getControllerForElementAndIdentifier(wizard, "check-wizard")
      return controller?.currentStepValue || 1
    }
    return 1
  }

  getStepName(step) {
    const stepNames = {
      1: "symptom_selection",
      2: "building_type",
      3: "address",
      4: "description",
      5: "video_upload",
      6: "contact_info",
      7: "final_review"
    }
    return stepNames[step] || `step_${step}`
  }

  getTimeSpent() {
    if (!this.startTime) {
      this.startTime = new Date()
    }
    return Math.round((new Date() - this.startTime) / 1000)  // 초 단위
  }

  getTimeOnStep() {
    if (!this.stepStartTime) {
      this.stepStartTime = new Date()
    }
    const time = Math.round((new Date() - this.stepStartTime) / 1000)
    this.stepStartTime = new Date()  // 리셋
    return time
  }

  hasVideo() {
    const input = document.getElementById("video-upload")
    return input && input.files.length > 0
  }

  getVideoCount() {
    const input = document.getElementById("video-upload")
    return input ? input.files.length : 0
  }
}
