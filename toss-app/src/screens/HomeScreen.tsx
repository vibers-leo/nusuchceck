// HomeScreen.tsx — 홈 화면
// AI 빠른 점검 큰 CTA (파란색 그라데이션) + 전문가 찾기 카드 + 최근 점검 내역

import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import Txt from '@toss/tds-react-native/dist/esm/components/txt/Txt';
import { COLORS } from '../constants/config';
import { useAppStore } from '../store/appStore';

interface HomeScreenProps {
  navigation?: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { nickname, inspections, isInspectionLoading, fetchInspections } = useAppStore();

  // 데이터 로드
  const loadData = useCallback(async () => {
    await fetchInspections();
  }, [fetchInspections]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 최근 점검 (최대 5개)
  const recentInspections = inspections.slice(0, 5);

  // 상태 라벨
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: '대기중', color: COLORS.yellow };
      case 'in_progress':
        return { text: '진행중', color: COLORS.primary };
      case 'completed':
        return { text: '완료', color: COLORS.green };
      case 'cancelled':
        return { text: '취소', color: COLORS.gray400 };
      default:
        return { text: status, color: COLORS.gray500 };
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isInspectionLoading} onRefresh={loadData} />
      }
    >
      {/* 인사말 */}
      <View style={styles.header}>
        <Txt typography="t3" fontWeight="bold" color={COLORS.gray900}>
          안녕하세요, {nickname || '고객'}님
        </Txt>
        <View style={styles.spacer4} />
        <Txt typography="t6" color={COLORS.gray500}>
          누수가 의심되시나요? AI로 빠르게 점검해보세요
        </Txt>
      </View>

      {/* AI 빠른 점검 CTA — 파란색 그라데이션 큰 카드 */}
      <View style={styles.ctaSection}>
        <TouchableOpacity
          style={styles.aiCtaCard}
          activeOpacity={0.85}
          onPress={() => {
            // TODO: InspectionScreen으로 탭 전환
          }}
        >
          {/* 배경 장식 원 */}
          <View style={styles.ctaDecorCircle1} />
          <View style={styles.ctaDecorCircle2} />

          <View style={styles.ctaContent}>
            <View style={styles.ctaIconCircle}>
              <Txt typography="t2">🤖</Txt>
            </View>
            <View style={styles.spacer12} />
            <Txt typography="t4" fontWeight="bold" color={COLORS.white}>
              AI 빠른 점검
            </Txt>
            <View style={styles.spacer4} />
            <Txt typography="t6" color="rgba(255,255,255,0.85)">
              사진과 증상으로 누수 상태를 즉시 분석해드려요
            </Txt>
            <View style={styles.spacer16} />
            <View style={styles.ctaStartButton}>
              <Txt typography="t6" fontWeight="bold" color={COLORS.primary}>
                지금 점검하기 →
              </Txt>
            </View>
          </View>
        </TouchableOpacity>

        {/* 전문가 찾기 카드 */}
        <TouchableOpacity
          style={styles.expertCtaCard}
          activeOpacity={0.85}
          onPress={() => {
            // TODO: ExpertsScreen으로 탭 전환
          }}
        >
          <View style={styles.expertCtaRow}>
            <View style={styles.expertIconCircle}>
              <Txt typography="t3">👷</Txt>
            </View>
            <View style={styles.expertCtaText}>
              <Txt typography="t5" fontWeight="bold" color={COLORS.gray900}>
                전문가 찾기
              </Txt>
              <Txt typography="t7" color={COLORS.gray500}>
                검증된 누수 전문가를 바로 연결
              </Txt>
            </View>
            <Txt typography="t4" color={COLORS.gray400}>→</Txt>
          </View>
        </TouchableOpacity>
      </View>

      {/* 빠른 도움 카드 (2개 나란히) */}
      <View style={styles.quickHelpSection}>
        <TouchableOpacity style={styles.quickHelpCard} activeOpacity={0.7}>
          <Txt typography="t5">📋</Txt>
          <View style={styles.spacer8} />
          <Txt typography="t7" fontWeight="bold" color={COLORS.gray800}>셀프 체크리스트</Txt>
          <Txt typography="t7" color={COLORS.gray500}>증상 자가진단</Txt>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickHelpCard} activeOpacity={0.7}>
          <Txt typography="t5">📞</Txt>
          <View style={styles.spacer8} />
          <Txt typography="t7" fontWeight="bold" color={COLORS.gray800}>긴급 상담</Txt>
          <Txt typography="t7" color={COLORS.gray500}>24시간 응대</Txt>
        </TouchableOpacity>
      </View>

      {/* 최근 점검 내역 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Txt typography="t5" fontWeight="bold" color={COLORS.gray900}>
            최근 점검 내역
          </Txt>
          {inspections.length > 5 && (
            <TouchableOpacity onPress={() => { /* TODO: 전체 보기 */ }}>
              <Txt typography="t6" color={COLORS.primary}>
                전체 보기
              </Txt>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.spacer12} />

        {recentInspections.length > 0 ? (
          recentInspections.map((inspection) => {
            const statusInfo = getStatusLabel(inspection.status);
            return (
              <TouchableOpacity
                key={inspection.id}
                style={styles.inspectionCard}
                activeOpacity={0.7}
                onPress={() => {
                  // TODO: 점검 상세로 이동
                }}
              >
                <View style={styles.inspectionIconArea}>
                  <Txt typography="t5">
                    {inspection.type === 'ai_quick' ? '🤖' : '👷'}
                  </Txt>
                </View>
                <View style={styles.inspectionInfo}>
                  <Txt typography="t6" fontWeight="bold" color={COLORS.gray800}>
                    {inspection.type === 'ai_quick' ? 'AI 빠른 점검' : '전문가 방문 점검'}
                  </Txt>
                  <Txt typography="t7" color={COLORS.gray500} numberOfLines={1}>
                    📍 {inspection.address || '주소 미입력'}
                  </Txt>
                  <Txt typography="t7" color={COLORS.gray400}>
                    {inspection.createdAt}
                  </Txt>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                  <Txt typography="t7" color={statusInfo.color} fontWeight="bold">
                    {statusInfo.text}
                  </Txt>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Txt typography="t3">💧</Txt>
            <View style={styles.spacer12} />
            <Txt typography="t6" fontWeight="bold" color={COLORS.gray500}>
              아직 점검 내역이 없어요
            </Txt>
            <View style={styles.spacer4} />
            <Txt typography="t7" color={COLORS.gray400}>
              AI 빠른 점검으로 시작해보세요
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
    paddingBottom: 20,
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

  // CTA 섹션
  ctaSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: COLORS.white,
    gap: 12,
  },

  // AI 빠른 점검 큰 CTA (파란색 그라데이션 효과)
  aiCtaCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 24,
    overflow: 'hidden',
    // 그림자
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  // 배경 장식 원 (그라데이션 느낌)
  ctaDecorCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  ctaDecorCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  ctaContent: {
    zIndex: 1,
  },
  ctaIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaStartButton: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },

  // 전문가 찾기 카드
  expertCtaCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  expertCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  expertIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expertCtaText: {
    flex: 1,
    gap: 2,
  },

  // 빠른 도움 카드 2개 나란히
  quickHelpSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    gap: 12,
    marginTop: 8,
  },
  quickHelpCard: {
    flex: 1,
    backgroundColor: COLORS.gray50,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },

  // 최근 점검 내역 섹션
  section: {
    backgroundColor: COLORS.white,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // 점검 내역 카드
  inspectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  inspectionIconArea: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inspectionInfo: {
    flex: 1,
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  // 빈 상태
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },

  bottomSpacer: {
    height: 24,
  },
});
