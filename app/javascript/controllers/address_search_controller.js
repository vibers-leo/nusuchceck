import { Controller } from "@hotwired/stimulus"

// Daum 우편번호 서비스를 사용한 주소 검색
export default class extends Controller {
  static targets = ["address", "detailedAddress", "zipcode"]

  connect() {
    // Daum Postcode API 스크립트 동적 로드
    if (!window.daum || !window.daum.Postcode) {
      const script = document.createElement('script')
      script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
      script.async = true
      document.head.appendChild(script)
    }
  }

  // 주소 검색 팝업 열기
  open(event) {
    event.preventDefault()

    if (!window.daum || !window.daum.Postcode) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    new window.daum.Postcode({
      oncomplete: (data) => {
        // 도로명 주소 또는 지번 주소 선택
        let fullAddress = data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress
        let extraAddress = ''

        // 도로명 주소인 경우 추가 정보 조합
        if (data.userSelectedType === 'R') {
          if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
            extraAddress += data.bname
          }
          if (data.buildingName !== '' && data.apartment === 'Y') {
            extraAddress += (extraAddress !== '' ? ', ' + data.buildingName : data.buildingName)
          }
          if (extraAddress !== '') {
            fullAddress += ' (' + extraAddress + ')'
          }
        }

        // 주소 필드에 값 설정
        if (this.hasAddressTarget) {
          this.addressTarget.value = fullAddress
          // 입력 이벤트 발생시켜 validation 트리거 (readonly 필드 호환)
          this.addressTarget.dispatchEvent(new Event('input', { bubbles: true }))
          this.addressTarget.dispatchEvent(new Event('change', { bubbles: true }))
        }

        // 우편번호 필드가 있으면 설정
        if (this.hasZipcodeTarget) {
          this.zipcodeTarget.value = data.zonecode
        }

        // 상세주소 입력 필드로 포커스 이동
        if (this.hasDetailedAddressTarget) {
          this.detailedAddressTarget.focus()
        }
      },
      theme: {
        bgColor: "#FFFFFF",
        searchBgColor: "#F3F4F6",
        contentBgColor: "#FFFFFF",
        pageBgColor: "#FFFFFF",
        textColor: "#111827",
        queryTextColor: "#111827",
        postcodeTextColor: "#2563EB",
        emphTextColor: "#DC2626",
        outlineColor: "#D1D5DB"
      },
      width: '100%',
      height: '100%'
    }).open()
  }
}
