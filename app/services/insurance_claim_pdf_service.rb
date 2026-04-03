class InsuranceClaimPdfService
  require 'prawn'
  require 'prawn/table'

  MARGIN = 28  # 상하좌우 여백 (포인트) — 좁게

  def initialize(insurance_claim)
    @claim = insurance_claim
    @pdf = Prawn::Document.new(
      page_size: 'A4',
      margin: MARGIN
    )
  end

  def generate
    setup_fonts
    render_header
    render_claim_meta
    render_applicant_section
    render_incident_section
    render_insurance_section if insurance_info_present?
    render_victim_section    if @claim.victim_name.present?
    render_master_section    if @claim.prepared_by_master?
    render_footer
    @pdf
  end

  private

  def setup_fonts
    nanum_paths = [
      "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
      "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf"
    ]
    if nanum_paths.all? { |p| File.exist?(p) }
      @pdf.font_families.update(
        "NanumGothic" => {
          normal: nanum_paths[0],
          bold:   nanum_paths[1]
        }
      )
      @pdf.font "NanumGothic"
    end
  end

  # ── 헤더 ─────────────────────────────────────────────────────────────
  def render_header
    w = @pdf.bounds.width

    @pdf.bounding_box([0, @pdf.cursor], width: w, height: 44) do
      @pdf.fill_color "1D4ED8"
      @pdf.fill_rectangle [0, @pdf.bounds.top], w, 44
      @pdf.fill_color "FFFFFF"
      @pdf.text_box "보험 청구서",
        at: [0, 30], width: w,
        size: 18, style: :bold, align: :center
    end

    @pdf.move_down 6

    # 플랫폼명 + 날짜
    @pdf.fill_color "6B7280"
    @pdf.text "누수체크 플랫폼  ·  발급일: #{Date.today.strftime('%Y년 %m월 %d일')}",
      size: 8, align: :center
    @pdf.fill_color "000000"
    @pdf.move_down 10
    @pdf.stroke_color "E5E7EB"
    @pdf.stroke_horizontal_rule
    @pdf.stroke_color "000000"
    @pdf.move_down 8
  end

  # ── 청구서 번호 / 상태 ─────────────────────────────────────────────
  def render_claim_meta
    w = @pdf.bounds.width
    col = w / 3.0

    data = [
      ["청구서 번호", @claim.claim_number || "-"],
      ["현재 상태",   @claim.status_label],
      ["제출일",      @claim.submitted_at&.strftime("%Y.%m.%d") || "-"]
    ]

    # 가로로 3열 배치
    @pdf.bounding_box([0, @pdf.cursor], width: w, height: 32) do
      @pdf.fill_color "F3F4F6"
      @pdf.fill_rectangle [0, @pdf.bounds.top], w, 32
      @pdf.fill_color "000000"

      data.each_with_index do |(label, value), i|
        x = col * i + 6
        @pdf.text_box "#{label}", at: [x, 26], width: col - 8, size: 7, style: :bold
        @pdf.text_box value,      at: [x, 16], width: col - 8, size: 9
      end
    end

    @pdf.move_down 10
  end

  # ── 신청자 정보 ───────────────────────────────────────────────────
  def render_applicant_section
    rows = [
      ["성명", @claim.applicant_name],
      ["연락처", @claim.applicant_phone],
      ["이메일", @claim.applicant_email.presence || "-"],
      ["생년월일", @claim.birth_date&.strftime("%Y년 %m월 %d일") || "-"]
    ]
    render_section("신청자 정보", rows)
  end

  # ── 사고 정보 ─────────────────────────────────────────────────────
  def render_incident_section
    address = [@claim.incident_address, @claim.incident_detail_address.presence].compact.join(" ")
    rows = [
      ["사고 발생일", @claim.incident_date.strftime("%Y년 %m월 %d일")],
      ["사고 장소",   address],
      ["피해 유형",   @claim.damage_type_label],
      ["예상 피해액", @claim.estimated_damage_amount ? "#{number_with_delimiter(@claim.estimated_damage_amount)}원" : "-"]
    ]
    render_section("사고 정보", rows)

    # 사고 내용 (텍스트 박스)
    render_text_block("사고 내용 상세", @claim.incident_description)
  end

  # ── 보험 정보 ─────────────────────────────────────────────────────
  def render_insurance_section
    rows = [
      ["보험사",   @claim.insurance_company || "-"],
      ["증권번호", @claim.policy_number || "-"]
    ]
    render_section("보험 정보", rows)
  end

  # ── 피해자 정보 ───────────────────────────────────────────────────
  def render_victim_section
    rows = [
      ["성명",   @claim.victim_name],
      ["연락처", @claim.victim_phone || "-"],
      ["주소",   @claim.victim_address || "-"]
    ]
    render_section("피해자 정보", rows)
  end

  # ── 전문가 작성 정보 ──────────────────────────────────────────────
  def render_master_section
    @pdf.move_down 6
    w = @pdf.bounds.width

    @pdf.bounding_box([0, @pdf.cursor], width: w) do
      @pdf.stroke_color "7C3AED"
      @pdf.stroke_bounds
      @pdf.stroke_color "000000"
      @pdf.pad(6) do
        @pdf.fill_color "7C3AED"
        @pdf.text "전문가 작성", size: 8, style: :bold
        @pdf.fill_color "000000"
        @pdf.text "작성자: #{@claim.prepared_by_master.name}", size: 8
        if @claim.customer_reviewed?
          @pdf.text "고객 승인: #{@claim.customer_reviewed_at&.strftime('%Y.%m.%d %H:%M')}", size: 8
        end
      end
    end

    @pdf.move_down 8
  end

  # ── 푸터 ─────────────────────────────────────────────────────────
  def render_footer
    @pdf.move_down 12
    @pdf.stroke_color "E5E7EB"
    @pdf.stroke_horizontal_rule
    @pdf.stroke_color "000000"
    @pdf.move_down 6
    @pdf.fill_color "9CA3AF"
    @pdf.text "본 문서는 누수체크 플랫폼에서 자동 생성되었습니다.  |  문의: support@nusucheck.kr",
      size: 7, align: :center
    @pdf.fill_color "000000"

    @pdf.number_pages "<page> / <total>",
      at: [@pdf.bounds.right - 40, -14],
      align: :right,
      size: 7
  end

  # ── 공통 테이블 섹션 ──────────────────────────────────────────────
  def render_section(title, rows)
    @pdf.move_down 8

    # 섹션 제목
    @pdf.fill_color "1E3A8A"
    @pdf.text title, size: 9, style: :bold
    @pdf.fill_color "000000"
    @pdf.move_down 3

    @pdf.table(rows,
      width: @pdf.bounds.width,
      cell_style: {
        border_color: 'E5E7EB',
        padding: [4, 6],
        size: 9
      },
      column_widths: { 0 => 88 }
    ) do
      column(0).style(font_style: :bold, background_color: 'F9FAFB', text_color: '374151')
      column(1).style(background_color: 'FFFFFF', text_color: '111827')
    end
  end

  # ── 텍스트 블록 (사고 내용 등) ────────────────────────────────────
  def render_text_block(title, content)
    @pdf.move_down 8

    @pdf.fill_color "1E3A8A"
    @pdf.text title, size: 9, style: :bold
    @pdf.fill_color "000000"
    @pdf.move_down 3

    w = @pdf.bounds.width
    text_h = @pdf.height_of(content.to_s, width: w - 16, size: 9) + 12
    text_h = [text_h, 36].max  # 최소 높이

    @pdf.bounding_box([0, @pdf.cursor], width: w, height: text_h) do
      @pdf.stroke_color "E5E7EB"
      @pdf.stroke_bounds
      @pdf.stroke_color "000000"
      @pdf.fill_color "FFFFFF"
      @pdf.fill_rectangle [1, @pdf.bounds.top - 1], w - 2, text_h - 2
      @pdf.fill_color "000000"
      @pdf.text_box content.to_s,
        at: [6, text_h - 7],
        width: w - 12,
        height: text_h - 14,
        size: 9,
        overflow: :expand
    end
  end

  def insurance_info_present?
    @claim.insurance_company.present? || @claim.policy_number.present?
  end

  def number_with_delimiter(number)
    number.to_s.reverse.scan(/\d{1,3}/).join(',').reverse
  end
end
