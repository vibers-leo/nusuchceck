// ProfileScreen.tsx — 프로필/내 점검 내역
// 프로필 카드 + 점검 통계 카드 + 내역 리스트 + 메뉴 + 로그아웃

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
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isInspectionLoading} onRefresh={loadData} />
      }
    >
      {/* 프로필 카드 */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Txt typography="t2" color={COLORS.white}>
            {nickname ? nickname.charAt(0) : '💧'}
          </Txt>
        </View>
        <View style={styles.profileInfo}>
          <Txt typography="t4" fontWeight="bold" color={COLORS.gray900}>
            {nickname || '고객'}님
          </Txt>
          {phone && (
            <View style={styles.spacer4}>
              <Txt typography="t6" color={COLORS.gray500}>
                {phone}
              </Txt>
            </View>
          )}
        </View>
      </View>

      {/* 점검 통계 카드 */}
      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Txt typography="t2" fontWeight="bold" color={COLORS.primary}>
              {totalCount}
            </Txt>
            <View style={styles.spacer4_gap} />
            <Txt typography="t7" color={COLORS.gray500}>전체 점검</Txt>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Txt typography="t2" fontWeight="bold" color={COLORS.yellow}>
              {pendingCount}
            </Txt>
            <View style={styles.spacer4_gap} />
            <Txt typography="t7" color={COLORS.gray500}>대기중</Txt>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Txt typography="t2" fontWeight="bold" color={COLORS.primary}>
              {inProgressCount}
            </Txt>
            <View style={styles.spacer4_gap} />
            <Txt typography="t7" color={COLORS.gray500}>진행중</Txt>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Txt typography="t2" fontWeight="bold" color={COLORS.green}>
              {completedCount}
            </Txt>
            <View style={styles.spacer4_gap} />
            <Txt typography="t7" color={COLORS.gray500}>완료</Txt>
          </View>
        </View>
      </View>

      {/* 전체 점검 내역 */}
      <View style={styles.sectionCard}>
        <Txt typography="t5" fontWeight="bold" color={COLORS.gray900}>
          점검 내역
        </Txt>
        <View style={styles.spacer16} />

        {inspections.length > 0 ? (
          inspections.map((inspection) => {
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
                <View style={styles.inspectionMain}>
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
            <View style={styles.spacer4_gap} />
            <Txt typography="t7" color={COLORS.gray400}>
              AI 빠른 점검으로 시작해보세요
            </Txt>
          </View>
        )}
      </View>

      {/* 메뉴 카드 */}
      <View style={styles.menuCard}>
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <View style={styles.menuLeft}>
            <Txt typography="t7">🔔</Txt>
            <Txt typography="t6" color={COLORS.gray800}>알림 설정</Txt>
          </View>
          <Txt typography="t6" color={COLORS.gray400}>→</Txt>
        </TouchableOpacity>
        <View style={styles.menuDivider} />
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <View style={styles.menuLeft}>
            <Txt typography="t7">❓</Txt>
            <Txt typography="t6" color={COLORS.gray800}>자주 묻는 질문</Txt>
          </View>
          <Txt typography="t6" color={COLORS.gray400}>→</Txt>
        </TouchableOpacity>
        <View style={styles.menuDivider} />
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <View style={styles.menuLeft}>
            <Txt typography="t7">📋</Txt>
            <Txt typography="t6" color={COLORS.gray800}>이용약관</Txt>
          </View>
          <Txt typography="t6" color={COLORS.gray400}>→</Txt>
        </TouchableOpacity>
        <View style={styles.menuDivider} />
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <View style={styles.menuLeft}>
            <Txt typography="t7">🔒</Txt>
            <Txt typography="t6" color={COLORS.gray800}>개인정보 처리방침</Txt>
          </View>
          <Txt typography="t6" color={COLORS.gray400}>→</Txt>
        </TouchableOpacity>
        <View style={styles.menuDivider} />
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <View style={styles.menuLeft}>
            <Txt typography="t7">💬</Txt>
            <Txt typography="t6" color={COLORS.gray800}>의견 보내기</Txt>
          </View>
          <Txt typography="t6" color={COLORS.gray400}>→</Txt>
        </TouchableOpacity>
      </View>

      {/* 로그아웃 */}
      <View style={styles.logoutSection}>
        <Button
          display="block"
          size="big"
          type="light"
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
    backgroundColor: COLORS.gray50,
  },
  spacer4: {
    marginTop: 4,
  },
  spacer4_gap: {
    height: 4,
  },
  spacer12: {
    height: 12,
  },
  spacer16: {
    height: 16,
  },

  // 프로필 카드
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    // 그림자
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  profileInfo: {
    flex: 1,
  },

  // 점검 통계 카드
  statsCard: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.gray200,
  },

  // 점검 내역 섹션 카드
  sectionCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
  },

  // 점검 내역 아이템 카드
  inspectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  inspectionIconArea: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inspectionMain: {
    flex: 1,
    gap: 3,
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

  // 메뉴 카드
  menuCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    padding: 4,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.gray50,
    marginHorizontal: 16,
  },

  // 로그아웃
  logoutSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  bottomSpacer: {
    height: 60,
  },
});
