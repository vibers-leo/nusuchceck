import { Controller } from "@hotwired/stimulus"

// 파일 업로드 카운터 컨트롤러 (당근마켓 스타일)
export default class extends Controller {
  static targets = ["photoInput", "videoInput", "photoCount", "videoCount"]
  static values = {
    photoMax: { type: Number, default: 10 },
    videoMax: { type: Number, default: 10 }
  }

  connect() {
    this.updatePhotoCounts()
    this.updateVideoCounts()
  }

  updatePhotoCounts() {
    if (!this.hasPhotoInputTarget || !this.hasPhotoCountTarget) return

    const count = this.photoInputTarget.files.length
    this.photoCountTarget.textContent = `${count}/${this.photoMaxValue}`

    // 카운터 색상 변경
    if (count > 0) {
      this.photoCountTarget.classList.remove('text-gray-400')
      this.photoCountTarget.classList.add('text-primary-600', 'font-bold')
    } else {
      this.photoCountTarget.classList.add('text-gray-400')
      this.photoCountTarget.classList.remove('text-primary-600', 'font-bold')
    }
  }

  updateVideoCounts() {
    if (!this.hasVideoInputTarget || !this.hasVideoCountTarget) return

    const count = this.videoInputTarget.files.length
    this.videoCountTarget.textContent = `${count}/${this.videoMaxValue}`

    // 카운터 색상 변경
    if (count > 0) {
      this.videoCountTarget.classList.remove('text-gray-400')
      this.videoCountTarget.classList.add('text-primary-600', 'font-bold')
    } else {
      this.videoCountTarget.classList.add('text-gray-400')
      this.videoCountTarget.classList.remove('text-primary-600', 'font-bold')
    }
  }
}
