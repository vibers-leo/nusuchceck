// HomeScreen.tsx — 홈 화면
// 빠른 점검 CTA + 최근 점검 내역

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

  // 심각도 라벨
  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high':
        return { text: '심각', color: COLORS.red };
      case 'medium':
        return { text: '주의', color: COLORS.yellow };
      case 'low':
        return { text: '경미', color: COLORS.green };
      default:
        return { text: '미확인', color: COLORS.gray400 };
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isInspectionLoading} onRefresh={loadData} />
      }
    >
      {/* 인사말 */}
      <View style={styles.header}>
        <Txt typography="t3" fontWeight="bold" color={COLORS.gray900}>
          안녕하세요, {nickname || '고객'}님
        </Txt>
        <Txt typography="t6" color={COLORS.gray500}>
          누수가 의심되시나요? AI로 빠르게 점검해보세요
        </Txt>
      </View>

      {/* 빠른 점검 CTA */}
      <View style={styles.ctaSection}>
        <TouchableOpacity
          style={styles.ctaCard}
          activeOpacity={0.85}
          onPress={() => {
            // TODO: InspectionScreen으로 탭 전환
          }}
        >
          <View style={styles.ctaIcon}>
            <Txt typography="t2">🤖</Txt>
          </View>
          <View style={styles.ctaTextArea}>
            <Txt typography="t5" fontWeight="bold" color={COLORS.white}>
              AI 빠른 점검
            </Txt>
            <Txt typography="t7" color="rgba(255,255,255,0.8)">
              사진과 증상으로 누수 상태를 즉시 분석
            </Txt>
          </View>
          <Txt typography="t5" color={COLORS.white}>→</Txt>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ctaCardSecondary}
          activeOpacity={0.85}
          onPress={() => {
            // TODO: ExpertsScreen으로 탭 전환
          }}
        >
          <View style={styles.ctaIcon}>
            <Txt typography="t2">👷</Txt>
          </View>
          <View style={styles.ctaTextArea}>
            <Txt typography="t5" fontWeight="bold" color={COLORS.gray900}>
              전문가 찾기
            </Txt>
            <Txt typography="t7" color={COLORS.gray500}>
              검증된 누수 전문가를 바로 연결
            </Txt>
          </View>
          <Txt typography="t5" color={COLORS.gray400}>→</Txt>
        </TouchableOpacity>
      </View>

      {/* 최근 점검 내역 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Txt typography="t5" fontWeight="bold" color={COLORS.gray800}>
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
                style={styles.inspectionItem}
                activeOpacity={0.7}
                onPress={() => {
                  // TODO: 점검 상세로 이동
                }}
              >
                <View style={styles.inspectionInfo}>
                  <View style={styles.inspectionRow}>
                    <Txt typography="t6" fontWeight="bold" color={COLORS.gray800}>
                      {inspection.type === 'ai_quick' ? 'AI 빠른 점검' : '전문가 방문 점검'}
                    </Txt>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                      <Txt typography="t7" color={statusInfo.color}>
                        {statusInfo.text}
                      </Txt>
                    </View>
                  </View>
                  <Txt typography="t7" color={COLORS.gray500} numberOfLines={1}>
                    {inspection.address || '주소 미입력'}
                  </Txt>
                  <Txt typography="t7" color={COLORS.gray400}>
                    {inspection.createdAt}
                  </Txt>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Txt typography="t5" color={COLORS.gray400}>
              💧
            </Txt>
            <View style={styles.spacer8} />
            <Txt typography="t6" color={COLORS.gray400}>
              아직 점검 내역이 없어요
            </Txt>
            <Txt typography="t7" color={COLORS.gray400}>
              AI 빠른 점검으로 시작해보세요
            </Txt>
          </View>
        )}
      </View>
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
    paddingBottom: 16,
    gap: 4,
  },
  ctaSection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  ctaCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ctaCardSecondary: {
    backgroundColor: COLORS.gray50,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  ctaIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTextArea: {
    flex: 1,
    gap: 2,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spacer12: {
    height: 12,
  },
  spacer8: {
    height: 8,
  },
  inspectionItem: {
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray200,
  },
  inspectionInfo: {
    gap: 4,
  },
  inspectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 4,
  },
});
