class LeakInspectionService
  class AnalysisError < StandardError; end

  CLAUDE_MODEL = ENV.fetch("CLAUDE_MODEL", "claude-sonnet-4-20250514")

  attr_reader :inspection

  def initialize(inspection)
    @inspection = inspection
  end

  def analyze!
    inspection.update!(status: :analyzing)
    start_time = Time.current

    begin
      result = if api_key_available?
                 analyze_with_claude
               else
                 mock_analysis
               end

      inspection.update!(
        status: :completed,
        leak_detected: result[:leak_detected],
        severity: result[:severity],
        analysis_summary: result[:summary],
        analysis_detail: result[:detail],
        recommended_action: result[:recommended_action],
        ai_model_used: api_key_available? ? CLAUDE_MODEL : "mock",
        ai_tokens_used: result[:tokens_used] || 0,
        analysis_duration_seconds: (Time.current - start_time).round(2)
      )

      inspection
    rescue => e
      inspection.update!(status: :failed, analysis_detail: { error: e.message })
      raise AnalysisError, "AI 분석 실패: #{e.message}"
    end
  end

  private

  def api_key_available?
    api_key.present?
  end

  def api_key
    @api_key ||= Rails.application.credentials.dig(:anthropic, :api_key) ||
                 ENV["ANTHROPIC_API_KEY"]
  end

  def analyze_with_claude
    image_bytes = inspection.photo.blob.download
    image_base64 = Base64.strict_encode64(image_bytes)
    media_type = inspection.photo.content_type

    client = Anthropic::Client.new(api_key: api_key)

    response = client.messages.create(
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: media_type, data: image_base64 }
          },
          { type: "text", text: analysis_prompt }
        ]
      }]
    )

    text_content = response.dig("content", 0, "text")
    tokens_used = response.dig("usage", "input_tokens").to_i +
                  response.dig("usage", "output_tokens").to_i

    parsed = parse_json_response(text_content)
    parsed.merge(tokens_used: tokens_used)
  end

  def mock_analysis
    sleep(1.5) # 분석 시뮬레이션

    {
      leak_detected: true,
      severity: "medium",
      summary: "사진 분석 결과, 벽면에 수분 침투 흔적이 관찰됩니다. 변색된 부분과 물방울 자국이 있으며, 배관 연결부 근처에서 누수가 발생한 것으로 추정됩니다.",
      detail: {
        "leak_detected" => true,
        "severity" => "medium",
        "details" => {
          "observed_symptoms" => [
            "벽면 변색 및 얼룩",
            "수분 침투 흔적",
            "곰팡이 발생 초기 징후"
          ],
          "affected_area" => "벽면 하단부 약 50cm x 30cm 범위",
          "possible_causes" => [
            "배관 연결부 노후화",
            "방수층 손상",
            "외벽 크랙을 통한 빗물 침투"
          ],
          "confidence_level" => "medium"
        }
      },
      recommended_action: "전문 누수 탐지 업체에 정밀 진단을 의뢰하시는 것을 권장합니다. 조기 발견 단계이므로 빠른 조치를 통해 피해 확산을 방지할 수 있습니다.",
      tokens_used: 0
    }
  end

  def analysis_prompt
    <<~PROMPT
      당신은 건물 누수 탐지 전문가입니다. 첨부된 사진을 분석하여 누수 여부를 판단해 주세요.

      다음 JSON 형식으로만 응답해 주세요:
      {
        "leak_detected": true/false,
        "severity": "none" | "low" | "medium" | "high" | "critical",
        "summary": "한국어로 된 2-3문장 요약",
        "details": {
          "observed_symptoms": ["관찰된 증상 목록"],
          "affected_area": "영향 범위 설명",
          "possible_causes": ["가능한 원인 목록"],
          "confidence_level": "high" | "medium" | "low"
        },
        "recommended_action": "한국어로 된 추천 조치사항"
      }

      사진이 누수와 관련없는 경우에도 위 형식으로 응답하되, leak_detected를 false로 설정하고 summary에 해당 사진이 누수 관련 사진이 아님을 설명해 주세요.
    PROMPT
  end

  def parse_json_response(text)
    json_str = text.match(/\{[\s\S]*\}/)&.to_s
    parsed = JSON.parse(json_str)

    {
      leak_detected: parsed["leak_detected"] == true,
      severity: parsed["severity"] || "none",
      summary: parsed["summary"],
      detail: parsed,
      recommended_action: parsed["recommended_action"]
    }
  rescue JSON::ParserError
    {
      leak_detected: false,
      severity: "none",
      summary: text&.truncate(500),
      detail: { raw_response: text },
      recommended_action: "AI 응답 분석에 실패했습니다. 전문가 상담을 권장합니다."
    }
  end
end
