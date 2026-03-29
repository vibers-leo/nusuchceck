// ProfileScreen.tsx — 프로필/내 점검 내역
// 사용자 정보, 점검 통계, 전체 점검 내역, 설정

import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Button } from '@toss/tds-react-native';
import Txt from '@toss/tds-react-native/dist/esm/components/txt/Txt';
import { COLORS } from '../constants/config';
import { useAppStore } from '../store/appStore';

interface ProfileScreenProps {
  onLogout?: () => void;
}

export default function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const {
    nickname,
    phone,
    inspections,
    isInspectionLoading,
    fetchInspections,
    logout,
  } = useAppStore();

  // 데이터 로드
  const loadData = useCallback(async () => {
    await fetchInspections();
  }, [fetchInspections]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 통계 계산
  const totalCount = inspections.length;
  const completedCount = inspections.filter((i) => i.status === 'completed').length;
  const inProgressCount = inspections.filter((i) => i.status === 'in_progress').length;
  const pendingCount = inspections.filter((i) => i.status === 'pending').length;

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

  // 로그아웃 처리
  const handleLogout = () => {
    logout();
    onLogout?.();
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isInspectionLoading} onRefresh={loadData} />
      }
    >
      {/* 프로필 헤더 */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Txt typography="t2" color={COLORS.white}>
            💧
          </Txt>
        </View>
        <View style={styles.profileInfo}>
          <Txt typography="t4" fontWeight="bold" color={COLORS.gray900}>
            {nickname || '고객'}님
          </Txt>
          {phone && (
            <Txt typography="t6" color={COLORS.gray500}>
              {phone}
            </Txt>
          )}
        </View>
      </View>

      {/* 점검 통계 */}
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Txt typography="t3" fontWeight="bold" color={COLORS.primary}>
            {totalCount}
          </Txt>
          <Txt typography="t7" color={COLORS.gray500}>
            전체 점검
          </Txt>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Txt typography="t3" fontWeight="bold" color={COLORS.yellow}>
            {pendingCount}
          </Txt>
          <Txt typography="t7" color={COLORS.gray500}>
            대기중
          </Txt>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Txt typography="t3" fontWeight="bold" color={COLORS.primary}>
            {inProgressCount}
          </Txt>
          <Txt typography="t7" color={COLORS.gray500}>
            진행중
          </Txt>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Txt typography="t3" fontWeight="bold" color={COLORS.green}>
            {completedCount}
          </Txt>
          <Txt typography="t7" color={COLORS.gray500}>
            완료
          </Txt>
        </View>
      </View>

      {/* 전체 점검 내역 */}
      <View style={styles.section}>
        <Txt typography="t5" fontWeight="bold" color={COLORS.gray800}>
          점검 내역
        </Txt>
        <View style={styles.spacer12} />

        {inspections.length > 0 ? (
          inspections.map((inspection) => {
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
                <View style={styles.inspectionRow}>
                  <View style={styles.inspectionMain}>
                    <Txt typography="t6" fontWeight="bold" color={COLORS.gray800}>
                      {inspection.type === 'ai_quick' ? 'AI 빠른 점검' : '전문가 방문 점검'}
                    </Txt>
                    <Txt typography="t7" color={COLORS.gray500} numberOfLines={1}>
                      {inspection.address || '주소 미입력'}
                    </Txt>
                    <Txt typography="t7" color={COLORS.gray400}>
                      {inspection.createdAt}
                    </Txt>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                    <Txt typography="t7" color={statusInfo.color}>
                      {statusInfo.text}
                    </Txt>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Txt typography="t6" color={COLORS.gray400}>
              아직 점검 내역이 없어요
            </Txt>
          </View>
        )}
      </View>

      {/* 메뉴 */}
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <Txt typography="t6" color={COLORS.gray700}>
            알림 설정
          </Txt>
          <Txt typography="t6" color={COLORS.gray400}>→</Txt>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <Txt typography="t6" color={COLORS.gray700}>
            자주 묻는 질문
          </Txt>
          <Txt typography="t6" color={COLORS.gray400}>→</Txt>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <Txt typography="t6" color={COLORS.gray700}>
            이용약관
          </Txt>
          <Txt typography="t6" color={COLORS.gray400}>→</Txt>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <Txt typography="t6" color={COLORS.gray700}>
            개인정보 처리방침
          </Txt>
          <Txt typography="t6" color={COLORS.gray400}>→</Txt>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <Txt typography="t6" color={COLORS.gray700}>
            의견 보내기
          </Txt>
          <Txt typography="t6" color={COLORS.gray400}>→</Txt>
        </TouchableOpacity>
      </View>

      {/* 로그아웃 */}
      <View style={styles.logoutSection}>
        <Button
          display="block"
          size="medium"
          type="secondary"
          onPress={handleLogout}
        >
          로그아웃
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    gap: 16,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  statsSection: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: COLORS.gray50,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.gray200,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  spacer12: {
    height: 12,
  },
  inspectionItem: {
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray200,
  },
  inspectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  inspectionMain: {
    flex: 1,
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  menuSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray200,
  },
  logoutSection: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  bottomSpacer: {
    height: 60,
  },
});
