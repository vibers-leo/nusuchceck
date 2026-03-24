import { Controller } from "@hotwired/stimulus"

// 대화형 챗봇 스타일 누수 접수 마법사
export default class extends Controller {
  static targets = [
    "chatArea", "typingIndicator", "answerPanel",
    "addressInput", "detailAddressInput", "descInput",
    "submitForm", "submitLabel", "mediaCount",
    "fieldSymptom", "fieldBuilding", "fieldAddress",
    "fieldDetailAddress", "fieldDescription", "fieldSource"
  ]
  static values = { userAddress: String }

  connect() {
    this.flow = null          // "urgent" | "precheck"
    this.formData = {}
    this.isProcessing = false
    this.mediaFiles = []

    // 다음 우편번호 API 로드
    if (!window.daum || !window.daum.Postcode) {
      const script = document.createElement('script')
      script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
      script.async = true
      document.head.appendChild(script)
    }

    // 인사말 → 첫 질문
    this.addAIBubble("안녕하세요! 👋 저는 누수 AI 도우미예요.<br>빠르고 정확하게 도와드릴게요.", 300)
    this.addAIBubble("지금 누수가 발생하고 있나요?", 1600)
    setTimeout(() => this.showPanel("initial"), 2800)
  }

  // ── 분기 선택 ──────────────────────────────────────────────────

  selectUrgent(event) {
    if (this.isProcessing) return
    event.currentTarget.closest('[data-panel]').querySelectorAll('button').forEach(b => b.disabled = true)
    this.addUserBubble("네, 지금 누수 중이에요 🚨")
    this.flow = "urgent"
    this.formData.request_source = "urgent"
    this.sceneSymptom("빠르게 전문가를 연결할게요! 어디에서 새고 있나요?")
  }

  selectPrecheck(event) {
    if (this.isProcessing) return
    event.currentTarget.closest('[data-panel]').querySelectorAll('button').forEach(b => b.disabled = true)
    this.addUserBubble("아니요, 점검이 필요해요 🔍")
    this.flow = "precheck"
    this.formData.request_source = "precheck"
    this.sceneSymptom("상황을 파악해드릴게요! 어떤 증상이 있나요?")
  }

  // ── 증상 선택 ────────────────────────────────────────────────

  selectSymptom(event) {
    if (this.isProcessing) return
    const btn = event.currentTarget
    const label = btn.dataset.label
    const value = btn.dataset.value
    btn.closest('[data-panel]').querySelectorAll('button').forEach(b => b.disabled = true)

    this.addUserBubble(label)
    this.formData.symptom_type = value

    if (this.flow === "urgent") {
      this.sceneMedia("영상이나 사진을 올려주세요 📹<br><span class='text-gray-400 text-xs'>전문가가 즉시 확인해드려요 (선택)</span>")
    } else {
      this.sceneBuilding("어떤 건물인가요?")
    }
  }

  // ── 건물 선택 (점검 플로우) ──────────────────────────────────

  selectBuilding(event) {
    if (this.isProcessing) return
    const btn = event.currentTarget
    btn.closest('[data-panel]').querySelectorAll('button').forEach(b => b.disabled = true)

    this.addUserBubble(btn.dataset.label)
    this.formData.building_type = btn.dataset.value
    this.sceneAddress("어디로 방문하면 될까요? 📍")
  }

  // ── 주소 입력 ────────────────────────────────────────────────

  openAddressSearch(event) {
    event.preventDefault()
    if (!window.daum || !window.daum.Postcode) {
      alert('주소 검색 서비스를 불러오는 중이에요. 잠시 후 다시 눌러주세요.')
      return
    }
    new window.daum.Postcode({
      oncomplete: (data) => {
        let fullAddress = data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress
        let extra = ''
        if (data.userSelectedType === 'R') {
          if (data.bname && /[동|로|가]$/.test(data.bname)) extra += data.bname
          if (data.buildingName && data.apartment === 'Y') {
            extra += (extra ? ', ' + data.buildingName : data.buildingName)
          }
          if (extra) fullAddress += ` (${extra})`
        }
        this.addressInputTarget.value = fullAddress
        if (this.hasDetailAddressInputTarget) {
          this.detailAddressInputTarget.focus()
        }
      },
      theme: { bgColor: "#fff", searchBgColor: "#f3f4f6", contentBgColor: "#fff" },
      width: '100%',
      height: '100%'
    }).open()
  }

  submitAddress(event) {
    event.preventDefault()
    const address = this.addressInputTarget.value.trim()
    if (!address) {
      this.addressInputTarget.classList.add('border-red-400')
      this.addressInputTarget.placeholder = '주소를 검색해주세요'
      this.addressInputTarget.focus()
      return
    }
    this.addressInputTarget.classList.remove('border-red-400')
    const detail = this.hasDetailAddressInputTarget ? this.detailAddressInputTarget.value.trim() : ''
    const displayAddr = detail ? `${address} ${detail}` : address

    this.formData.address = address
    this.formData.detailed_address = detail
    this.addUserBubble(`📍 ${displayAddr}`)

    // 주소 패널 버튼 비활성화
    this.answerPanelTarget.querySelectorAll('[data-panel="address"] button').forEach(b => b.disabled = true)

    if (this.flow === "urgent") {
      this.sceneSubmit()
    } else {
      this.sceneDescription("상황에 대해 더 설명해주실 내용이 있나요?<br><span class='text-gray-400 text-xs'>자세할수록 전문가가 더 잘 준비할 수 있어요 (선택)</span>")
    }
  }

  // ── 설명 입력 (점검 플로우, 선택) ───────────────────────────

  submitDescription(event) {
    event.preventDefault()
    const desc = this.hasDescInputTarget ? this.descInputTarget.value.trim() : ''
    if (desc) {
      this.formData.description = desc
      this.addUserBubble(`💬 ${desc.length > 40 ? desc.slice(0, 40) + '...' : desc}`)
    }
    this.sceneMedia("영상이나 사진이 있으면 더 빠른 진단이 돼요 📸<br><span class='text-gray-400 text-xs'>없어도 괜찮아요 (선택)</span>")
  }

  skipDescription(event) {
    event.preventDefault()
    this.addUserBubble("건너뛸게요")
    this.sceneMedia("영상이나 사진이 있으면 더 빠른 진단이 돼요 📸<br><span class='text-gray-400 text-xs'>없어도 괜찮아요 (선택)</span>")
  }

  // ── 미디어 업로드 (선택) ─────────────────────────────────────

  onMediaSelected(event) {
    this.mediaFiles = Array.from(event.target.files)
    if (this.hasMediaCountTarget) {
      this.mediaCountTarget.textContent = `${this.mediaFiles.length}개 선택됨`
      this.mediaCountTarget.classList.remove('hidden')
    }
  }

  submitMedia(event) {
    event.preventDefault()
    if (this.mediaFiles.length > 0) {
      this.addUserBubble(`📎 파일 ${this.mediaFiles.length}개 첨부했어요`)
    }
    this.sceneSubmit()
  }

  skipMedia(event) {
    event.preventDefault()
    this.addUserBubble("나중에 올릴게요")
    this.sceneSubmit()
  }

  // ── 최종 제출 ────────────────────────────────────────────────

  sceneSubmit() {
    const finalMsg = this.flow === "urgent"
      ? "확인했어요! 🚨 전문가가 빠르게 연락드릴게요.<br>아래 버튼을 눌러 요청을 완료해주세요."
      : "완료됐어요! ✅ 전문가가 빠르게 확인하고 연락드릴게요.<br>아래 버튼을 눌러 요청을 완료해주세요."

    this.addAIBubble(finalMsg, 600)

    setTimeout(() => {
      // 제출 버튼 텍스트 변경
      if (this.hasSubmitLabelTarget) {
        this.submitLabelTarget.textContent = this.flow === "urgent"
          ? "전문가에게 바로 요청하기 🚨"
          : "전문가에게 요청하기"
      }

      this.syncHiddenFields()
      this.attachMediaToForm()
      this.showPanel("submit")
    }, 1600)
  }

  syncHiddenFields() {
    if (this.hasFieldSymptomTarget)      this.fieldSymptomTarget.value      = this.formData.symptom_type      || ''
    if (this.hasFieldBuildingTarget)     this.fieldBuildingTarget.value     = this.formData.building_type     || ''
    if (this.hasFieldAddressTarget)      this.fieldAddressTarget.value      = this.formData.address            || ''
    if (this.hasFieldDetailAddressTarget) this.fieldDetailAddressTarget.value = this.formData.detailed_address || ''
    if (this.hasFieldDescriptionTarget)  this.fieldDescriptionTarget.value  = this.formData.description       || ''
    if (this.hasFieldSourceTarget)       this.fieldSourceTarget.value       = this.formData.request_source    || ''
  }

  attachMediaToForm() {
    if (this.mediaFiles.length === 0) return
    const form = this.submitFormTarget

    // 이미지와 영상을 분리해서 해당 field name으로 추가
    const dt = new DataTransfer()
    this.mediaFiles.forEach(f => dt.items.add(f))

    // 모든 파일을 photos[]로 먼저, 영상은 videos[]로
    const photos = this.mediaFiles.filter(f => f.type.startsWith('image/'))
    const videos = this.mediaFiles.filter(f => f.type.startsWith('video/'))

    if (photos.length > 0) {
      const photoDt = new DataTransfer()
      photos.forEach(f => photoDt.items.add(f))
      const photoInput = document.createElement('input')
      photoInput.type = 'file'
      photoInput.name = 'request[photos][]'
      photoInput.multiple = true
      photoInput.style.display = 'none'
      Object.defineProperty(photoInput, 'files', { value: photoDt.files })
      form.appendChild(photoInput)
    }

    if (videos.length > 0) {
      const videoDt = new DataTransfer()
      videos.forEach(f => videoDt.items.add(f))
      const videoInput = document.createElement('input')
      videoInput.type = 'file'
      videoInput.name = 'request[videos][]'
      videoInput.multiple = true
      videoInput.style.display = 'none'
      Object.defineProperty(videoInput, 'files', { value: videoDt.files })
      form.appendChild(videoInput)
    }
  }

  // ── 씬 헬퍼 ─────────────────────────────────────────────────

  sceneSymptom(msg) {
    this.addAIBubble(msg)
    setTimeout(() => this.showPanel("symptom"), this._panelDelay())
  }

  sceneBuilding(msg) {
    this.addAIBubble(msg)
    setTimeout(() => this.showPanel("building"), this._panelDelay())
  }

  sceneAddress(msg) {
    this.addAIBubble(msg)
    setTimeout(() => {
      this.autoFillAddress()
      this.showPanel("address")
    }, this._panelDelay())
  }

  sceneDescription(msg) {
    this.addAIBubble(msg)
    setTimeout(() => this.showPanel("description"), this._panelDelay())
  }

  sceneMedia(msg) {
    this.addAIBubble(msg)
    setTimeout(() => this.showPanel("media"), this._panelDelay())
  }

  autoFillAddress() {
    if (this.userAddressValue && this.hasAddressInputTarget) {
      this.addressInputTarget.value = this.userAddressValue
    }
  }

  _panelDelay() {
    // 타이핑 인디케이터(800ms) + 메시지 등장(300ms) + 여유(200ms) = 1300ms
    return 1300
  }

  // ── 채팅 버블 유틸 ──────────────────────────────────────────

  addAIBubble(html, delay = 600) {
    this.isProcessing = true
    setTimeout(() => {
      this.showTypingIndicator()
      setTimeout(() => {
        this.hideTypingIndicator()
        const bubble = document.createElement('div')
        bubble.className = 'flex items-end gap-2 bubble-fade-in'
        bubble.innerHTML = `
          <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mb-1">
            <span class="text-sm">🤖</span>
          </div>
          <div class="max-w-[75%] bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
            <p class="text-sm text-gray-800 leading-relaxed">${html}</p>
          </div>
        `
        this.chatAreaTarget.insertBefore(bubble, this.typingIndicatorTarget)
        this.scrollToBottom()
        this.isProcessing = false
      }, 800)
    }, delay)
  }

  addUserBubble(text) {
    const bubble = document.createElement('div')
    bubble.className = 'flex justify-end bubble-fade-in'
    bubble.innerHTML = `
      <div class="max-w-[75%] bg-primary-500 rounded-2xl rounded-br-md px-4 py-3">
        <p class="text-sm text-white leading-relaxed">${text}</p>
      </div>
    `
    this.chatAreaTarget.insertBefore(bubble, this.typingIndicatorTarget)
    this.scrollToBottom()
  }

  showPanel(name) {
    const panels = this.answerPanelTarget.querySelectorAll('[data-panel]')
    panels.forEach(p => p.classList.add('hidden'))
    const target = this.answerPanelTarget.querySelector(`[data-panel="${name}"]`)
    if (target) {
      target.classList.remove('hidden')
      target.classList.add('slide-up')
      setTimeout(() => target.classList.remove('slide-up'), 400)
    }
    this.scrollToBottom()
  }

  showTypingIndicator() {
    this.typingIndicatorTarget.classList.remove('hidden')
    this.scrollToBottom()
  }

  hideTypingIndicator() {
    this.typingIndicatorTarget.classList.add('hidden')
  }

  scrollToBottom() {
    setTimeout(() => {
      this.chatAreaTarget.scrollTo({ top: this.chatAreaTarget.scrollHeight, behavior: 'smooth' })
    }, 50)
  }
}
