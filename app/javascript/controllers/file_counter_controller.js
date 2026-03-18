import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["dropZone", "videoInput", "videoCount", "videoPreview", "videoPreviewContainer"]
  static values = {
    videoMax: { type: Number, default: 10 }
  }

  connect() {
    this._objectUrls = []
    this.updateVideoCounts()
    this.setupDropZone()
    this.setupDragAndDrop()
    this.setupRemoveVideo()
  }

  disconnect() {
    this._objectUrls.forEach(url => URL.revokeObjectURL(url))
    this._objectUrls = []
  }

  setupRemoveVideo() {
    this.element.addEventListener('remove-video', (e) => {
      this.removeVideoAtIndex(e.detail.index)
    })
  }

  removeVideoAtIndex(index) {
    const dt = new DataTransfer()
    Array.from(this.videoInputTarget.files).forEach((file, i) => {
      if (i !== index) dt.items.add(file)
    })
    this.videoInputTarget.files = dt.files
    this.updateVideoCounts()
    this.videoInputTarget.dispatchEvent(new Event('change', { bubbles: true }))
  }

  setupDropZone() {
    const dropZone = this._getDropZone()
    if (!dropZone) return

    dropZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        this.videoInputTarget.click()
      }
    })

    dropZone.addEventListener('click', (e) => {
      if (e.target === dropZone) this.videoInputTarget.click()
    })
  }

  setupDragAndDrop() {
    const dropZone = this._getDropZone()
    if (!dropZone) return

    ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(name => {
      dropZone.addEventListener(name, (e) => { e.preventDefault(); e.stopPropagation() }, false)
    })
    ;['dragenter', 'dragover'].forEach(name => {
      dropZone.addEventListener(name, () => dropZone.classList.add('border-primary-600', 'bg-primary-100'), false)
    })
    ;['dragleave', 'drop'].forEach(name => {
      dropZone.addEventListener(name, () => dropZone.classList.remove('border-primary-600', 'bg-primary-100'), false)
    })

    dropZone.addEventListener('drop', (e) => this.handleDrop(e), false)
  }

  handleDrop(e) {
    const videoFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('video/'))
    if (videoFiles.length === 0) {
      alert('영상 파일만 업로드할 수 있어요 (MP4, MOV, WebM 등)')
      return
    }
    if (videoFiles.length > this.videoMaxValue) {
      alert(`최대 ${this.videoMaxValue}개의 영상만 업로드할 수 있어요`)
      return
    }
    const dt = new DataTransfer()
    videoFiles.forEach(f => dt.items.add(f))
    this.videoInputTarget.files = dt.files
    this.uploadedViaDragDrop = true
    this.updateVideoCounts()
    this.videoInputTarget.dispatchEvent(new Event('change', { bubbles: true }))
  }

  updateVideoCounts() {
    if (!this.hasVideoInputTarget || !this.hasVideoCountTarget) return

    const count = this.videoInputTarget.files.length
    if (count > 0) {
      this.videoCountTarget.innerHTML = `
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
          </svg>
          <span class="font-bold">${count}개 영상 선택됨</span>
        </div>
      `
      this.showVideoPreviewsWithProgress()
    } else {
      this.videoCountTarget.textContent = ''
      this.hideVideoPreviews()
    }
  }

  showVideoPreviewsWithProgress() {
    if (!this.hasVideoPreviewTarget || !this.hasVideoPreviewContainerTarget) return

    // Revoke old URLs
    this._objectUrls.forEach(url => URL.revokeObjectURL(url))
    this._objectUrls = []

    this.videoPreviewContainerTarget.innerHTML = ''
    this.videoPreviewTarget.classList.remove('hidden')

    const files = Array.from(this.videoInputTarget.files)

    // Large file warning
    const largeFiles = files.filter(f => f.size > 100 * 1024 * 1024)
    if (largeFiles.length > 0) {
      const totalSize = largeFiles.reduce((sum, f) => sum + f.size, 0)
      const warn = document.createElement('div')
      warn.className = 'mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2'
      warn.innerHTML = `
        <svg class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        <p class="text-xs text-amber-800"><strong>대용량 영상 포함</strong> · 총 ${this._formatSize(totalSize)} · 제출 후 잠시 기다려주세요</p>
      `
      this.videoPreviewContainerTarget.appendChild(warn)
    }

    files.forEach((file, index) => {
      const loadingCard = this._createLoadingCard(file, index)
      this.videoPreviewContainerTarget.appendChild(loadingCard)
      this._animateProgressAndReveal(loadingCard, file, index)
    })
  }

  _createLoadingCard(file, index) {
    const r = 28
    const circ = 2 * Math.PI * r
    const card = document.createElement('div')
    card.className = 'bg-white rounded-2xl p-4 border-2 border-gray-100 shadow-sm'
    card.dataset.loadingIndex = index
    card.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="flex-shrink-0 w-16 h-16 flex items-center justify-center">
          <svg class="w-16 h-16" style="transform: rotate(-90deg)" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="${r}" fill="none" stroke="#e5e7eb" stroke-width="4"/>
            <circle class="progress-arc" cx="32" cy="32" r="${r}" fill="none"
              stroke="#0d9488" stroke-width="4" stroke-linecap="round"
              stroke-dasharray="${circ.toFixed(2)}" stroke-dashoffset="${circ.toFixed(2)}"
              style="transition: stroke-dashoffset 0.02s linear"/>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-gray-900 text-sm truncate">${file.name}</p>
          <p class="text-xs text-gray-400 mt-1">${this._formatSize(file.size)}</p>
          <p class="text-xs text-primary-600 mt-1 font-medium progress-label">처리 중...</p>
        </div>
      </div>
    `
    return card
  }

  _animateProgressAndReveal(card, file, index) {
    const r = 28
    const circ = 2 * Math.PI * r
    const arc = card.querySelector('.progress-arc')
    let progress = 0

    const tick = () => {
      progress = Math.min(progress + 3, 100)
      if (arc) arc.style.strokeDashoffset = (circ - (progress / 100) * circ).toFixed(2)

      if (progress < 100) {
        requestAnimationFrame(tick)
      } else {
        setTimeout(() => this._replaceWithPreview(card, file, index), 100)
      }
    }

    // Stagger start per file
    setTimeout(() => requestAnimationFrame(tick), index * 80)
  }

  _replaceWithPreview(card, file, index) {
    const videoUrl = URL.createObjectURL(file)
    this._objectUrls.push(videoUrl)

    const preview = document.createElement('div')
    preview.className = 'bg-white rounded-2xl p-4 border-2 border-primary-100 shadow-sm'
    preview.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0 relative w-36 h-22 rounded-xl overflow-hidden bg-gray-900" style="height: 90px">
          <video src="${videoUrl}"
            class="w-full h-full object-cover"
            preload="metadata" muted playsinline>
          </video>
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div class="w-9 h-9 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
              </svg>
            </div>
          </div>
        </div>
        <div class="flex-1 min-w-0 pt-0.5">
          <div class="flex items-center gap-1 mb-1">
            <svg class="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span class="text-xs font-semibold text-green-600">선택 완료</span>
          </div>
          <p class="font-semibold text-gray-900 text-sm truncate">${file.name}</p>
          <p class="text-xs text-gray-400 mt-0.5">${this._formatSize(file.size)}</p>
          <span class="inline-block mt-1.5 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-bold rounded-full">영상</span>
        </div>
        <button type="button"
          class="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 transition flex items-center justify-center mt-0.5"
          onclick="this.closest('[data-controller]').dispatchEvent(new CustomEvent('remove-video', { detail: { index: ${index} }, bubbles: true }))"
          aria-label="영상 제거">
          <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `

    if (card.parentNode) {
      card.parentNode.replaceChild(preview, card)
    }
  }

  hideVideoPreviews() {
    if (!this.hasVideoPreviewTarget) return
    this.videoPreviewTarget.classList.add('hidden')
    this._objectUrls.forEach(url => URL.revokeObjectURL(url))
    this._objectUrls = []
  }

  _getDropZone() {
    if (this.hasDropZoneTarget) return this.dropZoneTarget
    return this.element.querySelector('[id$="-drop-zone"]')
  }

  _formatSize(bytes) {
    if (bytes === 0) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i]
  }
}
