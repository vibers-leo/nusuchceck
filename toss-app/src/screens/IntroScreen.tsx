// IntroScreen.tsx — 서비스 소개 (토스 로그인 전)
// AI 누수 점검 히어로 + 특징 카드 + 시작하기 CTA

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
          <View style={styles.spacer12} />
          <Txt typography="t5" color={COLORS.gray600} textAlign="center">
            AI로 빠르게, 전문가에게 정확하게
          </Txt>
          <View style={styles.spacer8} />
          <Txt typography="t6" color={COLORS.gray500} textAlign="center">
            AI 빠른 점검으로 누수 상태를 확인하고{'\n'}
            검증된 전문가를 바로 연결해드려요
          </Txt>
        </View>

        {/* 특징 카드 3개 — 가로 배치 */}
        <View style={styles.featureArea}>
          <View style={styles.featureRow}>
            <View style={styles.featureCard}>
              <View style={styles.featureIconCircle}>
                <Txt typography="t5">🤖</Txt>
              </View>
              <View style={styles.spacer8} />
              <Txt typography="t7" color={COLORS.gray800} fontWeight="bold" textAlign="center">
                AI 빠른 점검
              </Txt>
              <Txt typography="t7" color={COLORS.gray500} textAlign="center">
                사진으로 즉시 분석
              </Txt>
            </View>
            <View style={styles.featureCard}>
              <View style={styles.featureIconCircle}>
                <Txt typography="t5">👷</Txt>
              </View>
              <View style={styles.spacer8} />
              <Txt typography="t7" color={COLORS.gray800} fontWeight="bold" textAlign="center">
                검증된 전문가
              </Txt>
              <Txt typography="t7" color={COLORS.gray500} textAlign="center">
                보험 가입 완료
              </Txt>
            </View>
            <View style={styles.featureCard}>
              <View style={styles.featureIconCircle}>
                <Txt typography="t5">🔒</Txt>
              </View>
              <View style={styles.spacer8} />
              <Txt typography="t7" color={COLORS.gray800} fontWeight="bold" textAlign="center">
                안전한 결제
              </Txt>
              <Txt typography="t7" color={COLORS.gray500} textAlign="center">
                에스크로 결제
              </Txt>
            </View>
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
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    // 그림자 효과
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  textArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  spacer12: {
    height: 12,
  },
  spacer8: {
    height: 8,
  },
  // 특징 카드 영역
  featureArea: {
    marginBottom: 40,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 12,
  },
  featureCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  featureIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonArea: {
    paddingHorizontal: 4,
  },
});
