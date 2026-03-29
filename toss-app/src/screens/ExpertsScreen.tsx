// ExpertsScreen.tsx — 전문가 목록 화면
// 검증된 누수 전문가 목록 + 상세 정보

import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import Txt from '@toss/tds-react-native/dist/esm/components/txt/Txt';
import { COLORS } from '../constants/config';
import { useAppStore, Expert } from '../store/appStore';

export default function ExpertsScreen() {
  const { experts, isExpertsLoading, fetchExperts } = useAppStore();

  // 데이터 로드
  const loadData = useCallback(async () => {
    await fetchExperts();
  }, [fetchExperts]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 전문가 카드 렌더링
  const renderExpertCard = (expert: Expert) => (
    <TouchableOpacity
      key={expert.id}
      style={styles.expertCard}
      activeOpacity={0.7}
      onPress={() => {
        // TODO: 전문가 상세 페이지 이동
      }}
    >
      {/* 프로필 영역 */}
      <View style={styles.profileRow}>
        <View style={styles.avatarCircle}>
          <Txt typography="t4" color={COLORS.white}>
            👷
          </Txt>
        </View>
        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Txt typography="t5" fontWeight="bold" color={COLORS.gray900}>
              {expert.name}
            </Txt>
            {expert.isVerified && (
              <View style={styles.verifiedBadge}>
                <Txt typography="t7" color={COLORS.primary}>
                  인증됨
                </Txt>
              </View>
            )}
          </View>
          <Txt typography="t7" color={COLORS.gray500}>
            경력 {expert.experience}
          </Txt>
        </View>
      </View>

      {/* 평점/리뷰 */}
      <View style={styles.ratingRow}>
        <Txt typography="t6" color={COLORS.yellow}>
          ★ {expert.rating.toFixed(1)}
        </Txt>
        <Txt typography="t7" color={COLORS.gray500}>
          리뷰 {expert.reviewCount}건
        </Txt>
        <Txt typography="t7" color={COLORS.gray400}>
          · 평균 응답 {expert.responseTime}
        </Txt>
      </View>

      {/* 전문 분야 */}
      <View style={styles.specialtyRow}>
        {expert.specialties.map((specialty, index) => (
          <View key={index} style={styles.specialtyChip}>
            <Txt typography="t7" color={COLORS.primary}>
              {specialty}
            </Txt>
          </View>
        ))}
      </View>

      {/* 견적 요청 버튼 */}
      <TouchableOpacity
        style={styles.requestButton}
        activeOpacity={0.7}
        onPress={() => {
          // TODO: 견적 요청 화면으로 이동
        }}
      >
        <Txt typography="t6" fontWeight="bold" color={COLORS.primary}>
          견적 요청하기
        </Txt>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isExpertsLoading} onRefresh={loadData} />
      }
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Txt typography="t3" fontWeight="bold" color={COLORS.gray900}>
          전문가 찾기
        </Txt>
        <Txt typography="t6" color={COLORS.gray500}>
          검증된 누수 전문가에게 견적을 받아보세요
        </Txt>
      </View>

      {/* 안내 배너 */}
      <View style={styles.infoBanner}>
        <Txt typography="t7" color={COLORS.primary}>
          🔒 모든 전문가는 보험 가입 + 자격증 검증을 완료했어요
        </Txt>
      </View>

      {/* 전문가 목록 */}
      <View style={styles.listSection}>
        {experts.length > 0 ? (
          experts.map(renderExpertCard)
        ) : isExpertsLoading ? (
          <View style={styles.emptyState}>
            <Txt typography="t6" color={COLORS.gray400}>
              전문가 목록을 불러오는 중...
            </Txt>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Txt typography="t5" color={COLORS.gray400}>
              👷
            </Txt>
            <View style={styles.spacer8} />
            <Txt typography="t6" color={COLORS.gray400}>
              등록된 전문가가 없어요
            </Txt>
            <Txt typography="t7" color={COLORS.gray400}>
              잠시 후 다시 확인해주세요
            </Txt>
          </View>
        )}
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
  infoBanner: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  listSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  expertCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifiedBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  specialtyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specialtyChip: {
    backgroundColor: COLORS.gray50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  requestButton: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  spacer8: {
    height: 8,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 4,
  },
  bottomSpacer: {
    height: 40,
  },
});
