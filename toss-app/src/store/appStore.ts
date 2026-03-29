// appStore.ts — 누수체크 토스 미니앱 상태 관리
// 인증, 점검, 전문가 상태를 통합 관리

import { create } from 'zustand';
import api, { setAuthToken } from '../services/api';

// --- 인터페이스 ---

// 점검 정보
export interface Inspection {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  type: 'ai_quick' | 'expert_visit';
  address: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | '';
  aiResult: string;
  createdAt: string;
  updatedAt: string;
}

// 전문가 정보
export interface Expert {
  id: string;
  name: string;
  profileImage: string;
  rating: number;
  reviewCount: number;
  specialties: string[];
  experience: string;
  responseTime: string;
  isVerified: boolean;
}

// --- 인증 상태 ---

export interface AuthState {
  userId: string;
  nickname: string;
  phone: string;
  isLoggedIn: boolean;
  token: string;
}

// --- 앱 전체 상태 ---

export interface AppState extends AuthState {
  // 점검 상태
  inspections: Inspection[];
  currentInspection: Inspection | null;
  isInspectionLoading: boolean;

  // 전문가 상태
  experts: Expert[];
  isExpertsLoading: boolean;

  // 인증 액션
  loginWithToss: (tossUserId: string, tossNickname: string) => Promise<boolean>;
  logout: () => void;

  // 점검 액션
  fetchInspections: () => Promise<void>;
  createAIInspection: (data: {
    address: string;
    description: string;
    leakType: string;
  }) => Promise<Inspection | null>;
  fetchInspection: (id: string) => Promise<void>;

  // 전문가 액션
  fetchExperts: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  (set, get) => ({
    // --- 초기 상태 ---

    // 인증
    userId: '',
    nickname: '',
    phone: '',
    isLoggedIn: false,
    token: '',

    // 점검
    inspections: [],
    currentInspection: null,
    isInspectionLoading: false,

    // 전문가
    experts: [],
    isExpertsLoading: false,

    // --- 인증 액션 ---

    // 토스 로그인 — 토스 프로필 정보로 서버 인증
    loginWithToss: async (tossUserId: string, tossNickname: string) => {
      try {
        const data = await api.post('/login', {
          toss_user_id: tossUserId,
          nickname: tossNickname,
          provider: 'toss',
        });

        if (data.token) {
          setAuthToken(data.token);
          set({
            userId: String(data.user?.id || tossUserId),
            nickname: data.user?.nickname || tossNickname,
            phone: data.user?.phone || '',
            token: data.token,
            isLoggedIn: true,
          });
          return true;
        }

        return false;
      } catch (error) {
        console.error('토스 로그인 실패:', error);
        return false;
      }
    },

    // 로그아웃
    logout: () => {
      setAuthToken(null);
      set({
        userId: '',
        nickname: '',
        phone: '',
        isLoggedIn: false,
        token: '',
        inspections: [],
        currentInspection: null,
        experts: [],
      });
    },

    // --- 점검 액션 ---

    // 내 점검 목록 조회
    fetchInspections: async () => {
      set({ isInspectionLoading: true });
      try {
        const data = await api.get<Inspection[]>('/customers/requests');
        set({ inspections: data });
      } catch (error) {
        console.error('점검 목록 조회 실패:', error);
      } finally {
        set({ isInspectionLoading: false });
      }
    },

    // AI 빠른 점검 생성
    createAIInspection: async (params) => {
      set({ isInspectionLoading: true });
      try {
        const data = await api.post<Inspection>('/leak_inspections', {
          leak_inspection: {
            address: params.address,
            description: params.description,
            leak_type: params.leakType,
          },
        });
        // 목록에 추가
        set((state) => ({
          inspections: [data, ...state.inspections],
          currentInspection: data,
        }));
        return data;
      } catch (error) {
        console.error('AI 점검 생성 실패:', error);
        return null;
      } finally {
        set({ isInspectionLoading: false });
      }
    },

    // 점검 상세 조회
    fetchInspection: async (id: string) => {
      set({ isInspectionLoading: true });
      try {
        const data = await api.get<Inspection>(`/leak_inspections/${id}`);
        set({ currentInspection: data });
      } catch (error) {
        console.error('점검 상세 조회 실패:', error);
      } finally {
        set({ isInspectionLoading: false });
      }
    },

    // --- 전문가 액션 ---

    // 전문가 목록 조회
    fetchExperts: async () => {
      set({ isExpertsLoading: true });
      try {
        const data = await api.get<Expert[]>('/customers/masters');
        set({ experts: data });
      } catch (error) {
        console.error('전문가 목록 조회 실패:', error);
      } finally {
        set({ isExpertsLoading: false });
      }
    },
  })
);
