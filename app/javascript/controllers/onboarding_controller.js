import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["container", "slide", "dot", "prevBtn", "nextBtn", "finishBtn", "progressBar"]

  connect() {
    // 이미 온보딩을 본 사용자는 표시하지 않음
    if (localStorage.getItem('onboarding_completed') === 'true') {
      return
    }

    // 첫 방문자에게만 표시
    this.currentIndex = 0
    this.containerTarget.classList.remove('hidden')
    this.updateView()
  }

  next(event) {
    event.preventDefault()

    if (this.currentIndex < this.slideTargets.length - 1) {
      this.currentIndex++
      this.updateView()
    }
  }

  prev(event) {
    event.preventDefault()

    if (this.currentIndex > 0) {
      this.currentIndex--
      this.updateView()
    }
  }

  skip(event) {
    event.preventDefault()
    this.complete()
  }

  finish(event) {
    event.preventDefault()
    this.complete()
  }

  complete() {
    // 로컬 스토리지에 완료 플래그 저장
    localStorage.setItem('onboarding_completed', 'true')

    // 온보딩 화면 숨기기 (페이드아웃 애니메이션)
    this.containerTarget.style.opacity = '1'
    this.containerTarget.style.transition = 'opacity 0.3s ease-out'
    this.containerTarget.style.opacity = '0'

    setTimeout(() => {
      this.containerTarget.classList.add('hidden')
      this.containerTarget.style.opacity = '1'
    }, 300)
  }

  updateView() {
    // 슬라이드 표시/숨김
    this.slideTargets.forEach((slide, index) => {
      if (index === this.currentIndex) {
        slide.classList.remove('hidden')
        // 페이드인 애니메이션
        slide.style.opacity = '0'
        slide.style.transform = 'translateY(20px)'
        setTimeout(() => {
          slide.style.transition = 'all 0.4s ease-out'
          slide.style.opacity = '1'
          slide.style.transform = 'translateY(0)'
        }, 50)
      } else {
        slide.classList.add('hidden')
      }
    })

    // 닷 인디케이터 업데이트
    this.dotTargets.forEach((dot, index) => {
      if (index === this.currentIndex) {
        dot.classList.remove('bg-gray-300')
        dot.classList.add('bg-primary-600')
      } else {
        dot.classList.remove('bg-primary-600')
        dot.classList.add('bg-gray-300')
      }
    })

    // 이전 버튼 표시/숨김
    if (this.currentIndex === 0) {
      this.prevBtnTarget.classList.add('hidden')
    } else {
      this.prevBtnTarget.classList.remove('hidden')
    }

    // 다음/시작 버튼 전환
    if (this.currentIndex === this.slideTargets.length - 1) {
      this.nextBtnTarget.classList.add('hidden')
      this.finishBtnTarget.classList.remove('hidden')
    } else {
      this.nextBtnTarget.classList.remove('hidden')
      this.finishBtnTarget.classList.add('hidden')
    }

    // 진행 바 업데이트
    const progress = ((this.currentIndex + 1) / this.slideTargets.length) * 100
    this.progressBarTarget.style.width = `${progress}%`
  }
}
