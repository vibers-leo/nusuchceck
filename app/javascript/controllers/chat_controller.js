import { Controller } from "@hotwired/stimulus"
import consumer from "../channels/consumer"

export default class extends Controller {
  static targets = ["messagesContainer", "input", "form", "submitButton"]
  static values = { requestId: Number }

  connect() {
    this.scrollToBottom()
    this.subscribeToChannel()
    this.adjustTextareaHeight()
  }

  disconnect() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  subscribeToChannel() {
    this.subscription = consumer.subscriptions.create(
      {
        channel: "ChatChannel",
        request_id: this.requestIdValue
      },
      {
        connected: () => {
          console.log("Connected to ChatChannel")
        },
        disconnected: () => {
          console.log("Disconnected from ChatChannel")
        },
        received: (data) => {
          // 서버에서 브로드캐스트된 메시지 수신
          this.appendMessage(data)
        }
      }
    )
  }

  appendMessage(data) {
    // 새 메시지를 DOM에 추가
    const messagesContainer = this.messagesContainerTarget
    messagesContainer.insertAdjacentHTML("beforeend", data.html)
    this.scrollToBottom()
  }

  handleKeydown(event) {
    // Enter 키로 전송 (Shift+Enter는 줄바꿈)
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      this.submitForm()
    }

    // 텍스트 영역 높이 자동 조절
    this.adjustTextareaHeight()
  }

  submitForm() {
    const content = this.inputTarget.value.trim()

    if (content.length === 0) {
      return
    }

    // 폼 제출
    this.formTarget.requestSubmit()
  }

  resetForm(event) {
    // Turbo 제출 완료 후 폼 리셋
    if (event.detail.success) {
      this.inputTarget.value = ""
      this.inputTarget.style.height = "auto"
      this.inputTarget.focus()
      this.scrollToBottom()
    }
  }

  adjustTextareaHeight() {
    const textarea = this.inputTarget
    textarea.style.height = "auto"
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px"
  }

  scrollToBottom() {
    requestAnimationFrame(() => {
      const container = this.messagesContainerTarget
      container.scrollTop = container.scrollHeight
    })
  }
}
