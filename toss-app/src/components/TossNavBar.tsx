// TossNavBar.tsx — 토스 스타일 네비게이션 바
// 우측 상단에 ... (더보기)와 X (닫기) 버튼 포함

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Txt from '@toss/tds-react-native/dist/esm/components/txt/Txt';
import { COLORS } from '../constants/config';

interface TossNavBarProps {
  title?: string;
  onMorePress?: () => void;
  onClosePress: () => void;
  showMoreButton?: boolean;
}

export default function TossNavBar({
  title = '누수체크',
  onMorePress,
  onClosePress,
  showMoreButton = true,
}: TossNavBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {/* 좌측: 타이틀 */}
        <View style={styles.titleContainer}>
          {title && (
            <Txt typography="t5" fontWeight="bold" color={COLORS.gray900}>
              {title}
            </Txt>
          )}
        </View>

        {/* 우측: ... 버튼 + X 버튼 */}
        <View style={styles.buttonContainer}>
          {showMoreButton && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onMorePress}
              accessibilityLabel="더보기"
            >
              <Txt typography="t5" color={COLORS.gray600}>
                ···
              </Txt>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onClosePress}
            accessibilityLabel="닫기"
          >
            <Txt typography="t5" fontWeight="bold" color={COLORS.gray600}>
              ✕
            </Txt>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray200,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: 16,
  },
  titleContainer: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
});
