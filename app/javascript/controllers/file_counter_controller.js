import { Controller } from "@hotwired/stimulus"

// 파일 업로드 카운터 컨트롤러 (영상만, 당근마켓 스타일 + 드래그 앤 드롭)
export default class extends Controller {
  static targets = ["videoInput", "videoCount"]
  static values = {
    videoMax: { type: Number, default: 10 }
  }

  connect() {
    this.updateVideoCounts()
    this.setupDropZone()
    this.setupDragAndDrop()
  }

  // 드롭존 키보드 접근성 설정
  setupDropZone() {
    const dropZone = document.getElementById('video-drop-zone')
    if (dropZone) {
      dropZone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          this.videoInputTarget.click()
        }
      })

      dropZone.addEventListener('click', (e) => {
        // label 클릭이 아닌 경우에만 처리
        if (e.target === dropZone) {
          this.videoInputTarget.click()
        }
      })
    }
  }

  // 드래그 앤 드롭 설정
  setupDragAndDrop() {
    const dropZone = document.getElementById('video-drop-zone')
    if (!dropZone) return

    // 드래그 이벤트 기본 동작 방지
    ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, this.preventDefaults, false)
      document.body.addEventListener(eventName, this.preventDefaults, false)
    })

    // 드래그 오버 시 시각적 피드백
    ;['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => this.highlight(dropZone), false)
    })

    ;['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => this.unhighlight(dropZone), false)
    })

    // 드롭 처리
    dropZone.addEventListener('drop', (e) => this.handleDrop(e), false)
  }

  preventDefaults(e) {
    e.preventDefault()
    e.stopPropagation()
  }

  highlight(dropZone) {
    dropZone.classList.add('border-primary-600', 'bg-primary-100', 'scale-105')
    dropZone.classList.remove('border-primary-500', 'bg-gradient-to-br')
  }

  unhighlight(dropZone) {
    dropZone.classList.remove('border-primary-600', 'bg-primary-100', 'scale-105')
    dropZone.classList.add('border-primary-500', 'bg-gradient-to-br')
  }

  handleDrop(e) {
    const dt = e.dataTransfer
    const files = dt.files

    // 비디오 파일만 필터링
    const videoFiles = Array.from(files).filter(file =>
      file.type.startsWith('video/')
    )

    if (videoFiles.length === 0) {
      alert('영상 파일만 업로드할 수 있어요 (MP4, MOV, WebM 등)')
      return
    }

    if (videoFiles.length > this.videoMaxValue) {
      alert(`최대 ${this.videoMaxValue}개의 영상만 업로드할 수 있어요`)
      return
    }

    // DataTransfer 객체로 파일 설정
    const dataTransfer = new DataTransfer()
    videoFiles.forEach(file => dataTransfer.items.add(file))
    this.videoInputTarget.files = dataTransfer.files

    // 카운터 업데이트 및 change 이벤트 발생
    this.updateVideoCounts()
    this.videoInputTarget.dispatchEvent(new Event('change', { bubbles: true }))
  }

  updateVideoCounts() {
    if (!this.hasVideoInputTarget || !this.hasVideoCountTarget) return

    const count = this.videoInputTarget.files.length

    if (count > 0) {
      this.videoCountTarget.innerHTML = `
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full animate-fade-in">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
          </svg>
          <span class="font-bold">${count}개 영상 선택됨</span>
        </div>
      `
    } else {
      this.videoCountTarget.textContent = ''
    }
  }
}
