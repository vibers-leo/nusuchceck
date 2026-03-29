// InspectionScreen.tsx — AI 점검 신청 화면
// 주소, 증상 설명, 누수 유형 입력 → AI 빠른 점검 요청

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

export default function InspectionScreen() {
  const { createAIInspection, isInspectionLoading } = useAppStore();

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

  // 신청 완료 화면
  if (isSubmitted) {
    return (
      <View style={styles.completedContainer}>
        <View style={styles.completedContent}>
          <View style={styles.completedIcon}>
            <Txt typography="t1">✅</Txt>
          </View>
          <View style={styles.spacer16} />
          <Txt typography="t3" fontWeight="bold" color={COLORS.gray900} textAlign="center">
            AI 점검이 시작되었어요
          </Txt>
          <View style={styles.spacer8} />
          <Txt typography="t6" color={COLORS.gray500} textAlign="center">
            분석 결과는 잠시 후 홈 화면에서{'\n'}확인하실 수 있어요
          </Txt>
          <View style={styles.spacer32} />
          <Button
            display="block"
            size="big"
            type="secondary"
            onPress={() => {
              setIsSubmitted(false);
              setAddress('');
              setDescription('');
              setSelectedLeakType('');
              setCheckedItems(new Set());
            }}
          >
            새 점검 신청하기
          </Button>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Txt typography="t3" fontWeight="bold" color={COLORS.gray900}>
          AI 빠른 점검
        </Txt>
        <Txt typography="t6" color={COLORS.gray500}>
          증상을 알려주시면 AI가 빠르게 분석해드려요
        </Txt>
      </View>

      {/* 주소 입력 */}
      <View style={styles.section}>
        <Txt typography="t5" fontWeight="bold" color={COLORS.gray800}>
          주소
        </Txt>
        <View style={styles.spacer8} />
        <TextInput
          style={styles.input}
          placeholder="누수 발생 장소를 입력해주세요"
          placeholderTextColor={COLORS.gray400}
          value={address}
          onChangeText={setAddress}
        />
      </View>

      {/* 누수 유형 선택 */}
      <View style={styles.section}>
        <Txt typography="t5" fontWeight="bold" color={COLORS.gray800}>
          누수 유형
        </Txt>
        <View style={styles.spacer8} />
        <View style={styles.typeGrid}>
          {LEAK_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeChip,
                selectedLeakType === type.id && styles.typeChipSelected,
              ]}
              onPress={() => setSelectedLeakType(type.id)}
              activeOpacity={0.7}
            >
              <Txt typography="t7">{type.icon}</Txt>
              <Txt
                typography="t7"
                color={selectedLeakType === type.id ? COLORS.primary : COLORS.gray600}
              >
                {type.label}
              </Txt>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 체크리스트 */}
      <View style={styles.section}>
        <Txt typography="t5" fontWeight="bold" color={COLORS.gray800}>
          증상 체크리스트
        </Txt>
        <View style={styles.spacer4} />
        <Txt typography="t7" color={COLORS.gray500}>
          해당되는 항목을 모두 선택해주세요
        </Txt>
        <View style={styles.spacer12} />
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
                <Txt typography="t7" color={COLORS.white}>
                  ✓
                </Txt>
              )}
            </View>
            <Txt typography="t6" color={COLORS.gray700}>
              {item.label}
            </Txt>
          </TouchableOpacity>
        ))}
      </View>

      {/* 상세 설명 */}
      <View style={styles.section}>
        <Txt typography="t5" fontWeight="bold" color={COLORS.gray800}>
          상세 설명 (선택)
        </Txt>
        <View style={styles.spacer8} />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="누수 상황을 자세히 설명해주시면 더 정확한 분석이 가능해요"
          placeholderTextColor={COLORS.gray400}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* 신청 버튼 */}
      <View style={styles.buttonArea}>
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
      </View>

      {/* 하단 여백 */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
    gap: 4,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  spacer32: {
    height: 32,
  },
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
    minHeight: 100,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  typeChipSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  buttonArea: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  bottomSpacer: {
    height: 40,
  },
  // 완료 화면
  completedContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
  },
  completedContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  completedIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.green + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
