import { Controller } from "@hotwired/stimulus"

// Hotwire Native 브릿지 컨트롤러
// 네이티브 앱과 웹 간 통신을 담당합니다.
// 사용법:
//   <div data-controller="native-bridge">
//     <button data-action="native-bridge#shareLink">공유하기</button>
//   </div>
export default class extends Controller {
  static values = {
    title: String,
    url: String,
    text: String
  }

  connect() {
    this.isNative = document.body.classList.contains("native-app")
  }

  // 네이티브 공유 시트 열기
  shareLink() {
    const shareData = {
      title: this.titleValue || document.title,
      url: this.urlValue || window.location.href,
      text: this.textValue || ""
    }

    if (navigator.share) {
      navigator.share(shareData).catch(() => {})
    } else {
      this.copyToClipboard(shareData.url)
    }
  }

  // 클립보드 복사 (폴백)
  copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast("링크가 복사되었습니다")
    }).catch(() => {})
  }

  // 네이티브 앱에 메시지 전송
  sendToNative(action, data = {}) {
    if (this.isNative && window.NusuCheck) {
      window.NusuCheck.postMessage(JSON.stringify({ action, ...data }))
    }
  }

  // 햅틱 피드백 (네이티브)
  hapticFeedback() {
    if (this.isNative) {
      this.sendToNative("haptic", { style: "light" })
    }
  }

  // 토스트 표시
  showToast(message) {
    const event = new CustomEvent("toast:show", { detail: { message } })
    document.dispatchEvent(event)
  }
}
