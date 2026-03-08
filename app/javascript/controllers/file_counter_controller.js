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

    try {
      // 비디오 파일만 필터링
      const videoFiles = Array.from(files).filter(file =>
        file.type.startsWith('video/')
      )

      if (videoFiles.length === 0) {
        alert('영상 파일만 업로드할 수 있어요 (MP4, MOV, WebM 등)')

        // Sentry: 잘못된 파일 타입 에러 추적
        this.element.dispatchEvent(new CustomEvent("sentry:error", {
          detail: {
            error: new Error("Invalid file type uploaded"),
            context: {
              error_type: "invalid_file_type",
              uploaded_types: Array.from(files).map(f => f.type).join(', ')
            }
          },
          bubbles: true
        }))

        return
      }

      if (videoFiles.length > this.videoMaxValue) {
        alert(`최대 ${this.videoMaxValue}개의 영상만 업로드할 수 있어요`)

        // Sentry: 파일 개수 초과 에러 추적
        this.element.dispatchEvent(new CustomEvent("sentry:error", {
          detail: {
            error: new Error("Too many files uploaded"),
            context: {
              error_type: "file_count_exceeded",
              file_count: videoFiles.length,
              max_count: this.videoMaxValue
            }
          },
          bubbles: true
        }))

        return
      }

      // DataTransfer 객체로 파일 설정
      const dataTransfer = new DataTransfer()
      videoFiles.forEach(file => dataTransfer.items.add(file))
      this.videoInputTarget.files = dataTransfer.files

      // 드래그 앤 드롭 플래그 설정
      this.uploadedViaDragDrop = true

      // 카운터 업데이트 및 change 이벤트 발생
      this.updateVideoCounts()
      this.videoInputTarget.dispatchEvent(new Event('change', { bubbles: true }))

      // Analytics: 드래그 앤 드롭 이벤트
      this.trackVideoUpload(videoFiles, "drag_drop")
    } catch (error) {
      console.error("File drop error:", error)

      // Sentry: 파일 드롭 처리 에러 추적
      this.element.dispatchEvent(new CustomEvent("sentry:error", {
        detail: {
          error: error,
          context: {
            error_type: "file_drop_error",
            file_count: files.length
          }
        },
        bubbles: true
      }))

      alert('파일 업로드 중 오류가 발생했어요. 다시 시도해주세요.')
    }
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

      // Analytics: 클릭 업로드 추적 (드래그 앤 드롭이 아닌 경우)
      if (!this.uploadedViaDragDrop) {
        this.trackVideoUpload(Array.from(this.videoInputTarget.files), "click")
      }
      this.uploadedViaDragDrop = false  // 리셋
    } else {
      this.videoCountTarget.textContent = ''
      this.hideVideoPreviews()
    }
  }

  // Analytics 이벤트 발생
  trackVideoUpload(files, method) {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)

    this.element.dispatchEvent(new CustomEvent("analytics:video-uploaded", {
      detail: {
        fileCount: files.length,
        totalSize: totalSize,
        method: method
      },
      bubbles: true
    }))
  }

  showVideoPreviews() {
    if (!this.hasVideoPreviewTarget || !this.hasVideoPreviewContainerTarget) return

    // 미리보기 컨테이너 초기화
    this.videoPreviewContainerTarget.innerHTML = ''

    const files = Array.from(this.videoInputTarget.files)

    // 대용량 파일 경고 (100MB 이상)
    const largeFiles = files.filter(f => f.size > 100 * 1024 * 1024)
    if (largeFiles.length > 0) {
      this.showLargeFileWarning(largeFiles)
    }

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
                preload="none"
                loading="lazy"
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

      reader.onerror = (error) => {
        console.error("FileReader error:", error)

        // Sentry: 파일 읽기 에러 추적
        this.element.dispatchEvent(new CustomEvent("sentry:error", {
          detail: {
            error: new Error("Failed to read video file"),
            context: {
              error_type: "file_reader_error",
              file_name: file.name,
              file_size: file.size,
              file_type: file.type
            }
          },
          bubbles: true
        }))

        // 사용자에게 알림
        alert(`"${file.name}" 파일을 읽을 수 없습니다. 다른 파일을 선택해주세요.`)
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

  // 대용량 파일 경고 표시
  showLargeFileWarning(largeFiles) {
    const totalSize = largeFiles.reduce((sum, f) => sum + f.size, 0)
    const warning = document.createElement('div')
    warning.className = 'mb-3 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl fade-in'
    warning.innerHTML = `
      <div class="flex items-start gap-3">
        <svg class="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        <div class="flex-1">
          <p class="font-bold text-yellow-900 text-sm">대용량 영상이 포함되어 있어요</p>
          <p class="text-yellow-800 text-sm mt-1">
            총 <strong>${this.formatFileSize(totalSize)}</strong> 파일을 업로드합니다.
            <br>인터넷 연결이 느리면 시간이 걸릴 수 있어요. 제출 후 잠시 기다려주세요.
          </p>
        </div>
      </div>
    `

    this.videoPreviewContainerTarget.insertBefore(warning, this.videoPreviewContainerTarget.firstChild)
  }
}
