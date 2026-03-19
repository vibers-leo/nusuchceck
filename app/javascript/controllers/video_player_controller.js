import { Controller } from "@hotwired/stimulus"

// 영상 뷰어 컨트롤러 — 썸네일 클릭 → 전체화면 플레이어
export default class extends Controller {
  static targets = ["modal", "video"]

  connect() {
    this._keydown = this._handleKeydown.bind(this)
    document.addEventListener("keydown", this._keydown)
  }

  disconnect() {
    document.removeEventListener("keydown", this._keydown)
    this._restoreScroll()
  }

  // 썸네일 클릭 → 모달 열기
  open(event) {
    const url = event.currentTarget.dataset.videoUrl
    if (!url) return

    this.videoTarget.src = url
    this.modalTarget.classList.remove("hidden")
    this.modalTarget.classList.add("flex")
    document.body.style.overflow = "hidden"

    // 자동 재생 (브라우저 정책상 실패할 수 있음)
    this.videoTarget.play().catch(() => {})
  }

  // 모달 닫기
  close() {
    this.videoTarget.pause()
    this.videoTarget.src = ""
    this.modalTarget.classList.add("hidden")
    this.modalTarget.classList.remove("flex")
    this._restoreScroll()
  }

  // 배경(backdrop) 클릭 시 닫기
  backdrop(event) {
    if (event.target === this.modalTarget) this.close()
  }

  _handleKeydown(event) {
    if (event.key === "Escape" && !this.modalTarget.classList.contains("hidden")) {
      this.close()
    }
  }

  _restoreScroll() {
    document.body.style.overflow = ""
  }
}
