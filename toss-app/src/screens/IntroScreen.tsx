// IntroScreen.tsx — 서비스 소개 (토스 로그인 전)
// AI 누수 점검 강조 + 시작하기 버튼

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@toss/tds-react-native';
import Txt from '@toss/tds-react-native/dist/esm/components/txt/Txt';
import { COLORS } from '../constants/config';
import { useAppStore } from '../store/appStore';

interface IntroScreenProps {
  navigation: any;
}

export default function IntroScreen({ navigation }: IntroScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const loginWithToss = useAppStore((s) => s.loginWithToss);

  // 토스 로그인 시작
  const handleStart = async () => {
    setIsLoading(true);
    try {
      // TODO: 실제 토스 프로필 API 연동 후 교체
      // 현재는 테스트용 더미 데이터로 로그인
      const success = await loginWithToss('toss_user_001', '토스유저');
      if (success) {
        navigation.replace('Main');
      }
    } catch (error) {
      console.error('로그인 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 로고 영역 */}
        <View style={styles.logoArea}>
          <View style={styles.iconCircle}>
            <Txt typography="t1" color={COLORS.white}>
              💧
            </Txt>
          </View>
        </View>

        {/* 서비스 소개 */}
        <View style={styles.textArea}>
          <Txt typography="t2" fontWeight="bold" color={COLORS.gray900} textAlign="center">
            누수체크
          </Txt>
          <View style={styles.spacer16} />
          <Txt typography="t5" color={COLORS.gray600} textAlign="center">
            AI로 빠르게, 전문가에게 정확하게
          </Txt>
          <View style={styles.spacer8} />
          <Txt typography="t6" color={COLORS.gray500} textAlign="center">
            AI 빠른 점검으로 누수 상태를 확인하고{'\n'}
            검증된 전문가를 바로 연결해드려요
          </Txt>
        </View>

        {/* 특징 카드 */}
        <View style={styles.featureArea}>
          <View style={styles.featureCard}>
            <Txt typography="t6" color={COLORS.primary}>
              🤖 AI 빠른 점검
            </Txt>
            <View style={styles.spacer4} />
            <Txt typography="t7" color={COLORS.gray500}>
              사진 한 장으로 누수 상태를 즉시 분석
            </Txt>
          </View>
          <View style={styles.featureCard}>
            <Txt typography="t6" color={COLORS.primary}>
              👷 검증된 전문가
            </Txt>
            <View style={styles.spacer4} />
            <Txt typography="t7" color={COLORS.gray500}>
              보험 가입된 전문가만 활동
            </Txt>
          </View>
          <View style={styles.featureCard}>
            <Txt typography="t6" color={COLORS.primary}>
              🔒 안전한 결제
            </Txt>
            <View style={styles.spacer4} />
            <Txt typography="t7" color={COLORS.gray500}>
              에스크로로 공사 완료 후 결제
            </Txt>
          </View>
        </View>

        {/* 시작하기 버튼 */}
        <View style={styles.buttonArea}>
          <Button
            display="block"
            size="big"
            type="primary"
            onPress={handleStart}
            loading={isLoading}
          >
            시작하기
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  spacer16: {
    height: 16,
  },
  spacer8: {
    height: 8,
  },
  spacer4: {
    height: 4,
  },
  featureArea: {
    gap: 12,
    marginBottom: 40,
  },
  featureCard: {
    backgroundColor: COLORS.gray50,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  buttonArea: {
    paddingHorizontal: 8,
  },
});
