// InspectionScreen.tsx — AI 점검 신청 화면
// 스텝 바이 스텝 (주소 → 유형 → 증상 → 제출) 진행 바 포함

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Button } from '@toss/tds-react-native';
import Txt from '@toss/tds-react-native/dist/esm/components/txt/Txt';
import { COLORS } from '../constants/config';
import { useAppStore } from '../store/appStore';

// 누수 유형 옵션
const LEAK_TYPES = [
  { id: 'ceiling', label: '천장 누수', icon: '🏠' },
  { id: 'wall', label: '벽면 누수', icon: '🧱' },
  { id: 'floor', label: '바닥 누수', icon: '🏗️' },
  { id: 'pipe', label: '배관 누수', icon: '🔧' },
  { id: 'bathroom', label: '화장실 누수', icon: '🚿' },
  { id: 'kitchen', label: '주방 누수', icon: '🍳' },
  { id: 'other', label: '기타', icon: '💧' },
];

// 체크리스트 항목
const CHECKLIST_ITEMS = [
  { id: 'water_stain', label: '물 자국/얼룩이 보이나요?' },
  { id: 'mold', label: '곰팡이가 발생했나요?' },
  { id: 'dripping', label: '물이 떨어지고 있나요?' },
  { id: 'smell', label: '습한 냄새가 나나요?' },
  { id: 'wallpaper', label: '벽지가 부풀어 오르거나 벗겨졌나요?' },
  { id: 'floor_damage', label: '바닥이 울퉁불퉁하거나 변색되었나요?' },
];

// 스텝 정의
const STEPS = [
  { key: 'address', label: '주소' },
  { key: 'type', label: '유형' },
  { key: 'symptoms', label: '증상' },
  { key: 'submit', label: '제출' },
];

export default function InspectionScreen() {
  const { createAIInspection, isInspectionLoading } = useAppStore();

  // 현재 스텝 (0~3)
  const [currentStep, setCurrentStep] = useState(0);
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLeakType, setSelectedLeakType] = useState('');
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 체크리스트 토글
  const toggleCheck = useCallback((id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // 다음 스텝 이동 가능 여부
  const canGoNext = () => {
    switch (currentStep) {
      case 0: return address.trim().length > 0;
      case 1: return selectedLeakType.length > 0;
      case 2: return true; // 증상은 선택사항
      case 3: return true;
      default: return false;
    }
  };

  // 다음 스텝
  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // 이전 스텝
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 점검 신청
  const handleSubmit = async () => {
    if (!address.trim()) {
      Alert.alert('알림', '주소를 입력해주세요.');
      return;
    }
    if (!selectedLeakType) {
      Alert.alert('알림', '누수 유형을 선택해주세요.');
      return;
    }

    // 체크리스트 결과를 설명에 추가
    const checklistResult = Array.from(checkedItems)
      .map((id) => CHECKLIST_ITEMS.find((item) => item.id === id)?.label)
      .filter(Boolean)
      .join(', ');

    const fullDescription = [
      description,
      checklistResult ? `[체크리스트] ${checklistResult}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const result = await createAIInspection({
        address: address.trim(),
        description: fullDescription,
        leakType: selectedLeakType,
      });

      if (result) {
        setIsSubmitted(true);
      } else {
        Alert.alert('오류', '점검 신청에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      Alert.alert('오류', '네트워크 오류가 발생했습니다.');
    }
  };

  // 리셋 (신청 완료 후)
  const handleReset = () => {
    setIsSubmitted(false);
    setCurrentStep(0);
    setAddress('');
    setDescription('');
    setSelectedLeakType('');
    setCheckedItems(new Set());
  };

  // 신청 완료 화면
  if (isSubmitted) {
    return (
      <View style={styles.completedContainer}>
        <View style={styles.completedContent}>
          <View style={styles.completedIconCircle}>
            <Txt typography="t1">✅</Txt>
          </View>
          <View style={styles.spacer20} />
          <Txt typography="t3" fontWeight="bold" color={COLORS.gray900} textAlign="center">
            AI 점검이 시작되었어요
          </Txt>
          <View style={styles.spacer8} />
          <Txt typography="t6" color={COLORS.gray500} textAlign="center">
            분석 결과는 잠시 후 홈 화면에서{'\n'}확인하실 수 있어요
          </Txt>
          <View style={styles.spacer32} />
          <View style={styles.completedButtonArea}>
            <Button
              display="block"
              size="big"
              type="primary"
              onPress={handleReset}
            >
              새 점검 신청하기
            </Button>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Txt typography="t3" fontWeight="bold" color={COLORS.gray900}>
          AI 빠른 점검
        </Txt>
        <View style={styles.spacer4} />
        <Txt typography="t6" color={COLORS.gray500}>
          증상을 알려주시면 AI가 빠르게 분석해드려요
        </Txt>
      </View>

      {/* 스텝 진행 바 */}
      <View style={styles.stepBarContainer}>
        <View style={styles.stepBar}>
          {STEPS.map((step, index) => (
            <View key={step.key} style={styles.stepItemWrapper}>
              {/* 스텝 원 */}
              <View style={[
                styles.stepCircle,
                index <= currentStep && styles.stepCircleActive,
                index < currentStep && styles.stepCircleCompleted,
              ]}>
                <Txt typography="t7" fontWeight="bold" color={index <= currentStep ? COLORS.white : COLORS.gray400}>
                  {index < currentStep ? '✓' : String(index + 1)}
                </Txt>
              </View>
              <Txt
                typography="t7"
                color={index <= currentStep ? COLORS.primary : COLORS.gray400}
                fontWeight={index === currentStep ? 'bold' : undefined}
              >
                {step.label}
              </Txt>
              {/* 연결선 */}
              {index < STEPS.length - 1 && (
                <View style={[
                  styles.stepLine,
                  index < currentStep && styles.stepLineActive,
                ]} />
              )}
            </View>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollInner}
      >
        {/* 스텝 0: 주소 입력 */}
        {currentStep === 0 && (
          <View style={styles.stepContent}>
            <View style={styles.stepCard}>
              <Txt typography="t5" fontWeight="bold" color={COLORS.gray900}>
                어디에서 누수가 발생했나요?
              </Txt>
              <View style={styles.spacer4} />
              <Txt typography="t7" color={COLORS.gray500}>
                정확한 주소를 입력해주세요
              </Txt>
              <View style={styles.spacer16} />
              <TextInput
                style={styles.input}
                placeholder="예: 서울시 강남구 역삼동 123-45"
                placeholderTextColor={COLORS.gray400}
                value={address}
                onChangeText={setAddress}
              />
            </View>
          </View>
        )}

        {/* 스텝 1: 누수 유형 선택 */}
        {currentStep === 1 && (
          <View style={styles.stepContent}>
            <View style={styles.stepCard}>
              <Txt typography="t5" fontWeight="bold" color={COLORS.gray900}>
                어떤 유형의 누수인가요?
              </Txt>
              <View style={styles.spacer4} />
              <Txt typography="t7" color={COLORS.gray500}>
                가장 가까운 유형을 선택해주세요
              </Txt>
              <View style={styles.spacer16} />
              <View style={styles.typeGrid}>
                {LEAK_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeCard,
                      selectedLeakType === type.id && styles.typeCardSelected,
                    ]}
                    onPress={() => setSelectedLeakType(type.id)}
                    activeOpacity={0.7}
                  >
                    <Txt typography="t4">{type.icon}</Txt>
                    <View style={styles.spacer4} />
                    <Txt
                      typography="t7"
                      fontWeight={selectedLeakType === type.id ? 'bold' : undefined}
                      color={selectedLeakType === type.id ? COLORS.primary : COLORS.gray700}
                    >
                      {type.label}
                    </Txt>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* 스텝 2: 증상 체크리스트 */}
        {currentStep === 2 && (
          <View style={styles.stepContent}>
            <View style={styles.stepCard}>
              <Txt typography="t5" fontWeight="bold" color={COLORS.gray900}>
                어떤 증상이 있나요?
              </Txt>
              <View style={styles.spacer4} />
              <Txt typography="t7" color={COLORS.gray500}>
                해당되는 항목을 모두 선택해주세요
              </Txt>
              <View style={styles.spacer16} />
              {CHECKLIST_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.checkItem}
                  onPress={() => toggleCheck(item.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkbox,
                      checkedItems.has(item.id) && styles.checkboxChecked,
                    ]}
                  >
                    {checkedItems.has(item.id) && (
                      <Txt typography="t7" color={COLORS.white}>✓</Txt>
                    )}
                  </View>
                  <Txt typography="t6" color={COLORS.gray700}>
                    {item.label}
                  </Txt>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 스텝 3: 상세 설명 + 제출 */}
        {currentStep === 3 && (
          <View style={styles.stepContent}>
            <View style={styles.stepCard}>
              <Txt typography="t5" fontWeight="bold" color={COLORS.gray900}>
                추가 설명이 있나요? (선택)
              </Txt>
              <View style={styles.spacer4} />
              <Txt typography="t7" color={COLORS.gray500}>
                자세히 설명해주시면 더 정확한 분석이 가능해요
              </Txt>
              <View style={styles.spacer16} />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="누수 상황을 자세히 설명해주세요..."
                placeholderTextColor={COLORS.gray400}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* 요약 카드 */}
            <View style={styles.summaryCard}>
              <Txt typography="t6" fontWeight="bold" color={COLORS.gray900}>
                신청 요약
              </Txt>
              <View style={styles.spacer12} />
              <View style={styles.summaryRow}>
                <Txt typography="t7" color={COLORS.gray500}>주소</Txt>
                <Txt typography="t7" color={COLORS.gray800} fontWeight="bold">{address}</Txt>
              </View>
              <View style={styles.summaryRow}>
                <Txt typography="t7" color={COLORS.gray500}>유형</Txt>
                <Txt typography="t7" color={COLORS.gray800} fontWeight="bold">
                  {LEAK_TYPES.find(t => t.id === selectedLeakType)?.label || '-'}
                </Txt>
              </View>
              <View style={styles.summaryRow}>
                <Txt typography="t7" color={COLORS.gray500}>증상</Txt>
                <Txt typography="t7" color={COLORS.gray800} fontWeight="bold">
                  {checkedItems.size > 0 ? `${checkedItems.size}개 선택` : '없음'}
                </Txt>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 하단 버튼 영역 */}
      <View style={styles.bottomBar}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Txt typography="t6" fontWeight="bold" color={COLORS.gray600}>
              이전
            </Txt>
          </TouchableOpacity>
        )}
        <View style={styles.nextButtonWrapper}>
          {currentStep < STEPS.length - 1 ? (
            <Button
              display="block"
              size="big"
              type="primary"
              onPress={handleNext}
              disabled={!canGoNext()}
            >
              다음
            </Button>
          ) : (
            <Button
              display="block"
              size="big"
              type="primary"
              onPress={handleSubmit}
              loading={isInspectionLoading}
              disabled={!address.trim() || !selectedLeakType}
            >
              AI 점검 시작하기
            </Button>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
  },
  spacer4: {
    height: 4,
  },
  spacer8: {
    height: 8,
  },
  spacer12: {
    height: 12,
  },
  spacer16: {
    height: 16,
  },
  spacer20: {
    height: 20,
  },
  spacer32: {
    height: 32,
  },

  // 스텝 진행 바
  stepBarContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  stepBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stepItemWrapper: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
  },
  stepCircleCompleted: {
    backgroundColor: COLORS.green,
  },
  stepLine: {
    position: 'absolute',
    top: 14,
    left: '60%',
    right: '-60%',
    height: 2,
    backgroundColor: COLORS.gray200,
  },
  stepLineActive: {
    backgroundColor: COLORS.green,
  },

  // 스크롤 콘텐츠
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingBottom: 24,
  },

  // 스텝 콘텐츠
  stepContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  stepCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
  },

  // 입력 필드
  input: {
    backgroundColor: COLORS.gray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.gray900,
  },
  textArea: {
    minHeight: 120,
  },

  // 누수 유형 그리드
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeCard: {
    width: '30%',
    backgroundColor: COLORS.gray50,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },

  // 체크리스트
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray100,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  // 요약 카드
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray100,
  },

  // 하단 버튼 바
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    backgroundColor: COLORS.white,
    gap: 12,
  },
  backButton: {
    width: 64,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonWrapper: {
    flex: 1,
  },

  // 완료 화면
  completedContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
  },
  completedContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  completedIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.green + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedButtonArea: {
    width: '100%',
  },
});
