// ExpertsScreen.tsx — 전문가 목록 화면
// 카드형 (프로필 + 평점 별점 + 전문 분야 뱃지 + 리뷰 수)

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

  // 별점 렌더링 (★☆)
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    let stars = '';
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) stars += '★';
      else if (i === fullStars && hasHalf) stars += '★';
      else stars += '☆';
    }
    return stars;
  };

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
      {/* 상단: 프로필 영역 */}
      <View style={styles.profileRow}>
        <View style={styles.avatarCircle}>
          <Txt typography="t3" color={COLORS.white}>👷</Txt>
        </View>
        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Txt typography="t5" fontWeight="bold" color={COLORS.gray900}>
              {expert.name}
            </Txt>
            {expert.isVerified && (
              <View style={styles.verifiedBadge}>
                <Txt typography="t7" color={COLORS.primary} fontWeight="bold">
                  ✓ 인증
                </Txt>
              </View>
            )}
          </View>
          <Txt typography="t7" color={COLORS.gray500}>
            경력 {expert.experience}
          </Txt>
        </View>
      </View>

      {/* 중간: 평점 + 리뷰 */}
      <View style={styles.ratingCard}>
        <View style={styles.ratingStars}>
          <Txt typography="t5" color={COLORS.yellow}>
            {renderStars(expert.rating)}
          </Txt>
          <Txt typography="t5" fontWeight="bold" color={COLORS.gray900}>
            {expert.rating.toFixed(1)}
          </Txt>
        </View>
        <View style={styles.ratingMeta}>
          <View style={styles.metaItem}>
            <Txt typography="t7" color={COLORS.gray500}>
              리뷰
            </Txt>
            <Txt typography="t7" fontWeight="bold" color={COLORS.gray800}>
              {expert.reviewCount}건
            </Txt>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Txt typography="t7" color={COLORS.gray500}>
              평균 응답
            </Txt>
            <Txt typography="t7" fontWeight="bold" color={COLORS.gray800}>
              {expert.responseTime}
            </Txt>
          </View>
        </View>
      </View>

      {/* 전문 분야 뱃지 */}
      <View style={styles.specialtyRow}>
        {expert.specialties.map((specialty, index) => (
          <View key={index} style={styles.specialtyBadge}>
            <Txt typography="t7" color={COLORS.primary} fontWeight="bold">
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
        <Txt typography="t6" fontWeight="bold" color={COLORS.white}>
          견적 요청하기
        </Txt>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isExpertsLoading} onRefresh={loadData} />
      }
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Txt typography="t3" fontWeight="bold" color={COLORS.gray900}>
          전문가 찾기
        </Txt>
        <View style={styles.spacer4} />
        <Txt typography="t6" color={COLORS.gray500}>
          검증된 누수 전문가에게 견적을 받아보세요
        </Txt>
      </View>

      {/* 안내 배너 */}
      <View style={styles.infoBanner}>
        <View style={styles.bannerIconCircle}>
          <Txt typography="t6">🔒</Txt>
        </View>
        <View style={styles.bannerText}>
          <Txt typography="t7" fontWeight="bold" color={COLORS.primary}>
            안전 보장
          </Txt>
          <Txt typography="t7" color={COLORS.gray600}>
            모든 전문가는 보험 가입 + 자격증 검증 완료
          </Txt>
        </View>
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
            <Txt typography="t3">👷</Txt>
            <View style={styles.spacer12} />
            <Txt typography="t5" fontWeight="bold" color={COLORS.gray500}>
              등록된 전문가가 없어요
            </Txt>
            <View style={styles.spacer4} />
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
  spacer12: {
    height: 12,
  },

  // 안내 배너
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  bannerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    flex: 1,
    gap: 2,
  },

  // 전문가 목록
  listSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // 전문가 카드
  expertCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    gap: 16,
    // 그림자
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  // 프로필 영역
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifiedBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  // 평점 카드
  ratingCard: {
    backgroundColor: COLORS.gray50,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metaDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.gray200,
  },

  // 전문 분야 뱃지
  specialtyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  // 견적 요청 버튼
  requestButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },

  // 빈 상태
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 4,
  },

  bottomSpacer: {
    height: 40,
  },
});
