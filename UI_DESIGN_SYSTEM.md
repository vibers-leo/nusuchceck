# 누수체크 UI 디자인 시스템

## 📐 디자인 철학

### 핵심 원칙
1. **단순함 (Simplicity)**: 토스, 미소처럼 불필요한 요소 제거
2. **명확함 (Clarity)**: 한눈에 이해되는 UI
3. **신뢰감 (Trust)**: 금융/서비스 플랫폼 느낌의 안정적인 디자인
4. **접근성 (Accessibility)**: 모바일 퍼스트, 터치 최적화

---

## 🎨 컬러 시스템

### Primary Colors (Teal 계열)
```
primary-50:  #f0fdfa  // 매우 밝은 배경
primary-100: #ccfbf1  // 밝은 배경, 아이콘 배경
primary-200: #99f6e4  //
primary-300: #5eead4  // 호버 상태
primary-400: #2dd4bf  //
primary-500: #14b8a6  // 메인 브랜드 컬러 ⭐
primary-600: #0d9488  // 버튼, CTA
primary-700: #0f766e  // 버튼 호버
primary-800: #115e59  // 강조
primary-900: #134e4a  // 텍스트 강조
```

**사용 예:**
- CTA 버튼: `bg-primary-600 hover:bg-primary-700`
- 링크/액센트: `text-primary-600`
- 아이콘 배경: `bg-primary-100`

### Grayscale (당근마켓 스타일)
```
gray-50:  #f9fafb   // 배경
gray-100: #f3f4f6   // 카드 배경
gray-200: #e5e7eb   // 테두리
gray-300: #d1d5db   // 비활성 테두리
gray-400: #9ca3af   // 플레이스홀더
gray-500: #6b7280   // 보조 텍스트
gray-600: #4b5563   //
gray-700: #374151   // 본문
gray-800: #1f2937   //
gray-900: #111827   // 제목, 강조 텍스트
```

### Semantic Colors
```
success: green-600  #16a34a  // 성공, 완료
warning: yellow-500 #eab308  // 경고, 주의
danger:  red-600    #dc2626  // 에러, 삭제
info:    blue-600   #2563eb  // 정보
```

---

## 📝 타이포그래피

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, "Pretendard", "Apple SD Gothic Neo",
             "Noto Sans KR", sans-serif;
```

### 폰트 크기 (Toss 스타일 - 큰 폰트)
```
제목 (Hero):       text-[32px] font-bold     // 첫 화면
제목 (Section):    text-[26px] font-bold     // 각 단계 제목 ⭐
제목 (Subsection): text-xl font-bold         // 서브 섹션
본문 (Large):      text-[17px] font-medium   // 버튼 텍스트
본문 (Normal):     text-[15px]               // 기본 본문 ⭐
본문 (Small):      text-sm                   // 보조 설명
캡션:              text-xs                   // 작은 설명
```

### 폰트 무게
```
font-bold:      700  // 제목, CTA 버튼
font-semibold:  600  // 라벨, 강조
font-medium:    500  // 버튼, 선택 항목
font-normal:    400  // 본문
```

### Line Height
```
leading-tight:   1.25  // 제목
leading-relaxed: 1.625 // 본문 (가독성)
leading-normal:  1.5   // 기본
```

---

## 🔘 버튼 시스템

### Primary Button (CTA)
```html
<button class="w-full py-4 rounded-2xl font-bold text-[17px]
               bg-primary-600 text-white
               hover:bg-primary-700
               transition-all shadow-lg">
  버튼 텍스트
</button>
```

**특징:**
- 큰 패딩 (`py-4`): 터치하기 쉬움
- 둥근 모서리 (`rounded-2xl`): 부드러운 느낌
- 그림자 (`shadow-lg`): 입체감

### Secondary Button
```html
<button class="w-full py-4 rounded-2xl font-bold text-[17px]
               bg-gray-100 text-gray-900
               hover:bg-gray-200
               transition-all">
  버튼 텍스트
</button>
```

### Selection Button (당근마켓 스타일) ⭐
```html
<button class="w-full flex items-center gap-4 p-4
               rounded-2xl border-2 border-gray-200 bg-white
               hover:border-primary-300 hover:bg-primary-50/30
               transition-all duration-200
               data-selected='border-primary-500 bg-primary-50 shadow-md'">
  <span class="text-2xl">💧</span>
  <div class="flex-1">
    <p class="font-semibold text-gray-900">벽면 누수</p>
    <p class="text-sm text-gray-500">벽에서 물이 배어나와요</p>
  </div>
  <!-- 선택 시 체크마크만 표시 -->
  <div class="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
    <svg class="w-4 h-4 text-white" fill="currentColor">
      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
    </svg>
  </div>
</button>
```

**디자인 개선점:**
- ❌ 불필요한 라디오 버튼 제거
- ✅ 선택 시 체크마크만 표시
- ✅ 배경색 + 테두리 변경으로 선택 상태 명확히

### Disabled Button
```html
<button class="w-full py-4 rounded-2xl font-bold text-[17px]
               bg-gray-200 text-gray-400
               cursor-not-allowed" disabled>
  다음
</button>
```

---

## 📦 카드 시스템

### Default Card (미소 스타일)
```html
<div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
  <!-- 카드 내용 -->
</div>
```

### Info Card (강조)
```html
<div class="bg-primary-50 rounded-2xl border border-primary-100 p-5">
  <!-- 안심 보증 등 -->
</div>
```

### User Info Card
```html
<div class="bg-gray-50 rounded-2xl p-5">
  <div class="flex items-center gap-4">
    <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
      <!-- 아이콘 -->
    </div>
    <div>
      <p class="font-semibold text-gray-900">이름</p>
      <p class="text-sm text-gray-500">이메일</p>
    </div>
  </div>
</div>
```

---

## 📐 Spacing & Layout

### Container
```
max-w-lg mx-auto px-5  // 모바일: 좌우 20px 여백
```

### Section Padding
```
pt-8 pb-32  // 상단 32px, 하단 128px (고정 버튼 공간 확보)
```

### Element Spacing
```
space-y-3   // 버튼 간격 (12px)
space-y-5   // 폼 필드 간격 (20px)
mb-8        // 제목-본문 간격 (32px)
```

---

## 🔄 애니메이션

### 페이드인 (토스 스타일)
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### 버튼 호버
```
transition-all duration-200
```

### 프로그레스 바
```
transition-all duration-500 ease-out
```

---

## 🎯 인터랙션 패턴

### 1. 버튼 선택 (당근마켓)
- **기본**: 흰 배경, 회색 테두리
- **호버**: 연한 파란 배경, 파란 테두리
- **선택**: 파란 배경, 진한 파란 테두리, 그림자, 체크마크

### 2. 자동 전환 (토스)
- 버튼 선택 후 400ms 딜레이
- 부드러운 페이드인/아웃

### 3. 하단 고정 버튼 (토스)
```html
<div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-10">
  <div class="max-w-lg mx-auto px-5 py-4">
    <button>다음</button>
  </div>
</div>
```

---

## 📱 반응형 브레이크포인트

```
sm:  640px   // 작은 태블릿
md:  768px   // 태블릿
lg:  1024px  // 데스크톱
```

**모바일 퍼스트:**
```html
<!-- 기본 (모바일) -->
<div class="grid grid-cols-1 gap-3">

<!-- 태블릿 이상 -->
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
```

---

## 🎨 아이콘 시스템

### 크기
```
w-4 h-4    // 16px (작은 아이콘)
w-5 h-5    // 20px (일반 아이콘)
w-6 h-6    // 24px (큰 아이콘)
w-8 h-8    // 32px (특대 아이콘)
```

### 아이콘 배경
```html
<div class="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
  <svg class="w-5 h-5 text-primary-600">...</svg>
</div>
```

---

## 📋 폼 시스템

### Input Field (토스 스타일 - 큼직함)
```html
<input class="w-full px-4 py-4 text-[15px]
              border-2 border-gray-200 rounded-xl
              focus:ring-2 focus:ring-primary-500 focus:border-primary-500
              transition"
       placeholder="플레이스홀더">
```

**특징:**
- 큰 패딩 (`py-4`): 터치 최적화
- 두꺼운 테두리 (`border-2`)
- 둥근 모서리 (`rounded-xl`)

### Textarea
```html
<textarea rows="5"
          class="w-full px-4 py-4 text-[15px]
                 border-2 border-gray-200 rounded-xl
                 focus:ring-2 focus:ring-primary-500
                 resize-none leading-relaxed">
</textarea>
```

### Label
```html
<label class="block text-sm font-semibold text-gray-900 mb-2">
  라벨 <span class="text-gray-400 font-normal">(선택)</span>
</label>
```

---

## 🎭 상태 표시

### 로딩
```html
<div class="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
```

### 에러
```html
<p class="text-xs text-red-500 mt-1">필수 항목이에요</p>
<input class="border-red-400">
```

### Success
```html
<div class="p-4 bg-green-50 border border-green-200 rounded-xl">
  <p class="text-green-800">✓ 저장되었습니다</p>
</div>
```

---

## 🔔 알림/토스트

### Info Banner (미소 스타일)
```html
<div class="p-4 bg-blue-50 rounded-2xl border border-blue-200">
  <div class="flex items-start gap-3">
    <div class="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
      <span>💡</span>
    </div>
    <div>
      <p class="font-semibold text-gray-900 text-sm">제목</p>
      <p class="text-sm text-gray-600 mt-1">설명 텍스트</p>
    </div>
  </div>
</div>
```

---

## 📊 프로그레스 바 (토스 스타일)

```html
<!-- 얇고 미니멀한 바 -->
<div class="h-1 bg-gray-100 rounded-full overflow-hidden">
  <div class="h-full bg-primary-500 rounded-full transition-all duration-500"
       style="width: 50%"></div>
</div>
```

---

## 🎯 체크리스트: 새 페이지 만들 때

- [ ] Primary 컬러 사용 (`bg-primary-600`)
- [ ] 큰 폰트 사용 (`text-[26px]` 제목, `text-[15px]` 본문)
- [ ] 버튼 큼직하게 (`py-4`)
- [ ] 둥근 모서리 (`rounded-2xl`)
- [ ] 모바일 퍼스트 (기본 1열, 태블릿 2열)
- [ ] 하단 고정 버튼 시 `pb-32` 여백
- [ ] 애니메이션 부드럽게 (`transition-all duration-200`)
- [ ] 선택 상태 명확히 (배경+테두리+체크마크)
- [ ] 불필요한 장식 제거 (미니멀)

---

## 🚀 향후 개선 방향

1. **다크모드 지원**
   - `dark:` 접두사 활용

2. **컴포넌트 라이브러리**
   - ViewComponent로 재사용 컴포넌트 제작

3. **애니메이션 확장**
   - Framer Motion 도입 검토

4. **접근성 강화**
   - ARIA 속성 완성
   - 키보드 네비게이션 개선

---

**마지막 업데이트**: 2026-03-08
**버전**: 1.0
