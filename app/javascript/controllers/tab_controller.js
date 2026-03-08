import { Controller } from "@hotwired/stimulus"

// 세그먼트 탭 컨트롤러
// 사용법:
//   <div data-controller="tab" data-tab-active-class="active">
//     <button data-tab-target="tab" data-action="tab#switch" data-tab-index="0">탭1</button>
//     <button data-tab-target="tab" data-action="tab#switch" data-tab-index="1">탭2</button>
//     <div data-tab-target="panel" data-tab-index="0">패널1</div>
//     <div data-tab-target="panel" data-tab-index="1" class="hidden">패널2</div>
//   </div>
export default class extends Controller {
  static targets = ["tab", "panel"]
  static values = { index: { type: Number, default: 0 } }

  connect() {
    this.showTab(this.indexValue)
  }

  switch(e) {
    const index = parseInt(e.currentTarget.dataset.tabIndex)
    this.indexValue = index
    this.showTab(index)
  }

  showTab(index) {
    this.tabTargets.forEach((tab, i) => {
      tab.classList.toggle("active", i === index)
    })
    this.panelTargets.forEach((panel, i) => {
      panel.classList.toggle("hidden", i !== index)
    })
  }
}
