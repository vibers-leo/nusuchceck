import { Controller } from "@hotwired/stimulus"

// 당근마켓 스타일 바텀시트 컨트롤러
// 사용법:
//   <div data-controller="bottom-sheet">
//     <button data-action="bottom-sheet#open">열기</button>
//     <div data-bottom-sheet-target="overlay" class="hidden ...">
//       <div data-bottom-sheet-target="sheet" class="bottom-sheet-content ...">
//         <div data-action="touchstart->bottom-sheet#onTouchStart touchmove->bottom-sheet#onTouchMove touchend->bottom-sheet#onTouchEnd">
//           <div class="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
//         </div>
//         <!-- 콘텐츠 -->
//       </div>
//     </div>
//   </div>
export default class extends Controller {
  static targets = ["overlay", "sheet"]

  connect() {
    this.startY = 0
    this.currentY = 0
    this.isDragging = false
  }

  open() {
    this.overlayTarget.classList.remove("hidden")
    requestAnimationFrame(() => {
      this.overlayTarget.classList.add("opacity-100")
      this.overlayTarget.classList.remove("opacity-0")
      this.sheetTarget.style.transform = "translateY(0)"
    })
    document.body.style.overflow = "hidden"
  }

  close() {
    this.overlayTarget.classList.add("opacity-0")
    this.overlayTarget.classList.remove("opacity-100")
    this.sheetTarget.style.transform = "translateY(100%)"
    setTimeout(() => {
      this.overlayTarget.classList.add("hidden")
    }, 300)
    document.body.style.overflow = ""
  }

  // 터치 드래그로 닫기
  onTouchStart(e) {
    this.startY = e.touches[0].clientY
    this.isDragging = true
    this.sheetTarget.style.transition = "none"
  }

  onTouchMove(e) {
    if (!this.isDragging) return
    this.currentY = e.touches[0].clientY - this.startY
    if (this.currentY > 0) {
      this.sheetTarget.style.transform = `translateY(${this.currentY}px)`
    }
  }

  onTouchEnd() {
    this.isDragging = false
    this.sheetTarget.style.transition = "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)"
    if (this.currentY > 100) {
      this.close()
    } else {
      this.sheetTarget.style.transform = "translateY(0)"
    }
    this.currentY = 0
  }

  // 오버레이 클릭으로 닫기
  overlayClick(e) {
    if (e.target === this.overlayTarget) {
      this.close()
    }
  }
}
