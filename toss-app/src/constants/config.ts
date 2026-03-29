// 앱 상수 설정

// API 서버 URL
export const API_URL = 'https://nusucheck.com';

// 앱 정보
export const APP_NAME = '누수체크';
export const APP_SCHEME = 'nusucheck';

// 색상 상수 (토스 디자인 시스템 기준 + 누수체크 브랜드)
export const COLORS = {
  // 브랜드 색상 (블루)
  primary: '#3b82f6',
  primaryLight: '#dbeafe',
  primaryDark: '#2563eb',

  // 토스 브랜드 색상 (호환용)
  tossBlue: '#3182F6',
  tossBlueLight: '#E8F3FF',
  tossBlueDark: '#1B64DA',

  // 그레이 스케일
  gray50: '#F9FAFB',
  gray100: '#F2F4F6',
  gray200: '#E5E8EB',
  gray300: '#D1D6DB',
  gray400: '#B0B8C1',
  gray500: '#8B95A1',
  gray600: '#6B7684',
  gray700: '#4E5968',
  gray800: '#333D4B',
  gray900: '#191F28',

  // 기능 색상
  white: '#FFFFFF',
  black: '#191F28',
  red: '#F04452',
  green: '#2FC473',
  yellow: '#FFC043',
  purple: '#8B5CF6',
} as const;

// API 설정
export const CONFIG = {
  API_TIMEOUT: 10000,
  API_RETRY_COUNT: 2,
  API_RETRY_DELAY: 1000,
} as const;

// 점검 유형
export const INSPECTION_TYPES = {
  AI_QUICK: 'ai_quick',       // AI 빠른 점검
  EXPERT_VISIT: 'expert_visit', // 전문가 방문 점검
} as const;

// 점검 상태
export const INSPECTION_STATUS = {
  PENDING: 'pending',           // 대기중
  IN_PROGRESS: 'in_progress',   // 진행중
  COMPLETED: 'completed',       // 완료
  CANCELLED: 'cancelled',       // 취소
} as const;
