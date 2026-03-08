import { Controller } from "@hotwired/stimulus"

// 파일 업로드 카운터 컨트롤러 (영상만, 당근마켓 스타일 + 드래그 앤 드롭 + 미리보기)
export default class extends Controller {
  static targets = ["videoInput", "videoCount", "videoPreview", "videoPreviewContainer"]
  static values = {
    videoMax: { type: Number, default: 10 }
  }

  connect() {
    this.updateVideoCounts()
    this.setupDropZone()
    this.setupDragAndDrop()
    this.setupRemoveVideo()
  }

  // 영상 제거 이벤트 설정
  setupRemoveVideo() {
    this.element.addEventListener('remove-video', (e) => {
      const index = e.detail.index
      this.removeVideoAtIndex(index)
    })
  }

  // 특정 인덱스의 영상 제거
  removeVideoAtIndex(index) {
    const dt = new DataTransfer()
    const files = Array.from(this.videoInputTarget.files)

    files.forEach((file, i) => {
      if (i !== index) {
        dt.items.add(file)
      }
    })

    this.videoInputTarget.files = dt.files
    this.updateVideoCounts()
    this.videoInputTarget.dispatchEvent(new Event('change', { bubbles: true }))
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

      // 미리보기 생성
      this.showVideoPreviews()
    } else {
      this.videoCountTarget.textContent = ''
      this.hideVideoPreviews()
    }
  }

  showVideoPreviews() {
    if (!this.hasVideoPreviewTarget || !this.hasVideoPreviewContainerTarget) return

    // 미리보기 컨테이너 초기화
    this.videoPreviewContainerTarget.innerHTML = ''

    const files = Array.from(this.videoInputTarget.files)

    files.forEach((file, index) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        const videoUrl = e.target.result

        const previewCard = document.createElement('div')
        previewCard.className = 'bg-white rounded-2xl p-4 border-2 border-gray-200 fade-in'
        previewCard.innerHTML = `
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-40 h-24 bg-gray-100 rounded-xl overflow-hidden">
              <video
                src="${videoUrl}"
                class="w-full h-full object-cover"
                controls
                preload="metadata"
              ></video>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-gray-900 text-sm truncate">${file.name}</p>
              <p class="text-xs text-gray-500 mt-1">${this.formatFileSize(file.size)}</p>
              <p class="text-xs text-gray-400 mt-1">${file.type || '비디오 파일'}</p>
            </div>
            <button
              type="button"
              class="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 transition flex items-center justify-center"
              data-index="${index}"
              onclick="this.closest('[data-controller=\\"file-counter\\"]').dispatchEvent(new CustomEvent('remove-video', { detail: { index: ${index} } }))"
              aria-label="영상 제거">
              <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        `

        this.videoPreviewContainerTarget.appendChild(previewCard)
      }

      reader.readAsDataURL(file)
    })

    // 미리보기 영역 표시
    this.videoPreviewTarget.classList.remove('hidden')
  }

  hideVideoPreviews() {
    if (!this.hasVideoPreviewTarget) return
    this.videoPreviewTarget.classList.add('hidden')
  }

  // 파일 크기 포맷팅 (바이트 → MB/GB)
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }
}
