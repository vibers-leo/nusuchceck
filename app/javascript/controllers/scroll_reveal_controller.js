import { Controller } from "@hotwired/stimulus"

// 스크롤 시 요소 페이드인 애니메이션
// 사용법:
//   <div data-controller="scroll-reveal">
//     <div data-scroll-reveal-target="item" class="opacity-0">...</div>
//     <div data-scroll-reveal-target="item" class="opacity-0">...</div>
//   </div>
export default class extends Controller {
  static targets = ["item"]

  connect() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("fade-in")
            entry.target.classList.remove("opacity-0")
            this.observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    )

    this.itemTargets.forEach((el) => this.observer.observe(el))
  }

  disconnect() {
    this.observer?.disconnect()
  }
}
