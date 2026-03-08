import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["dropzone", "input", "preview", "placeholder", "submitBtn"]

  trigger() {
    this.inputTarget.click()
  }

  keydown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      this.trigger()
    }
  }

  preview() {
    const file = this.inputTarget.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기는 5MB를 초과할 수 없습니다.")
      this.inputTarget.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      this.previewTarget.src = e.target.result
      this.previewTarget.classList.remove("hidden")
      this.previewTarget.setAttribute("alt", file.name)
      this.placeholderTarget.classList.add("hidden")
    }
    reader.readAsDataURL(file)

    if (this.hasSubmitBtnTarget) {
      this.submitBtnTarget.disabled = false
      this.submitBtnTarget.classList.remove("opacity-50", "cursor-not-allowed")
    }
  }

  dragover(event) {
    event.preventDefault()
    this.dropzoneTarget.classList.add("border-primary-400", "bg-primary-50")
  }

  dragleave(event) {
    event.preventDefault()
    this.dropzoneTarget.classList.remove("border-primary-400", "bg-primary-50")
  }

  drop(event) {
    event.preventDefault()
    this.dropzoneTarget.classList.remove("border-primary-400", "bg-primary-50")

    const files = event.dataTransfer.files
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      this.inputTarget.files = files
      this.preview()
    }
  }
}
