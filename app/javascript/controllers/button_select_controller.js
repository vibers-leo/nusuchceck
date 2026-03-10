import { Controller } from "@hotwired/stimulus"

// 버튼 형식의 라디오 선택 (select 대체)
export default class extends Controller {
  select(event) {
    event.preventDefault()

    const button = event.currentTarget
    const field = button.dataset.field
    const value = button.dataset.value

    // 같은 그룹의 다른 버튼 선택 해제
    const group = button.closest('[data-controller="button-select"]')
    group.querySelectorAll('.select-button').forEach(btn => {
      btn.classList.remove('border-primary-600', 'bg-primary-50', 'selected')
      btn.classList.add('border-gray-200')
      btn.querySelector('.select-check')?.classList.add('hidden')
      btn.setAttribute('aria-checked', 'false')
    })

    // 현재 버튼 선택 표시
    button.classList.remove('border-gray-200')
    button.classList.add('border-primary-600', 'bg-primary-50', 'selected')
    button.querySelector('.select-check')?.classList.remove('hidden')
    button.setAttribute('aria-checked', 'true')

    // Hidden input 업데이트
    const input = document.getElementById(`${field}-input`)
    if (input) {
      input.value = value
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }
}
