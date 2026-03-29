// App.tsx — 루트 컴포넌트
// NavigationContainer + Stack (Intro -> Main Tabs)
// 풀스크린, 라이트 모드 고정, TossNavBar, 종료 확인 모달

import React, { useState, useCallback } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TDSProvider } from '@toss/tds-react-native';
import Txt from '@toss/tds-react-native/dist/esm/components/txt/Txt';

import { COLORS } from './constants/config';
import { useAppStore } from './store/appStore';

// 스크린
import IntroScreen from './screens/IntroScreen';
import HomeScreen from './screens/HomeScreen';
import InspectionScreen from './screens/InspectionScreen';
import ExpertsScreen from './screens/ExpertsScreen';
import ProfileScreen from './screens/ProfileScreen';

// 컴포넌트
import TossNavBar from './components/TossNavBar';
import ExitModal from './components/ExitModal';

// --- 네비게이션 타입 ---
type RootStackParamList = {
  Intro: undefined;
  Main: undefined;
};

type TabParamList = {
  Home: undefined;
  Inspection: undefined;
  Experts: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// --- 탭 아이콘 라벨 ---
const TAB_CONFIG: Record<keyof TabParamList, { label: string; icon: string }> = {
  Home: { label: '홈', icon: '🏠' },
  Inspection: { label: 'AI점검', icon: '🤖' },
  Experts: { label: '전문가', icon: '👷' },
  Profile: { label: '내 정보', icon: '👤' },
};

// --- 메인 탭 네비게이터 ---
function MainTabs() {
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const logout = useAppStore((s) => s.logout);

  // 종료 모달 열기
  const handleClosePress = useCallback(() => {
    setExitModalVisible(true);
  }, []);

  // 종료 확인
  const handleExitConfirm = useCallback(() => {
    setExitModalVisible(false);
    // TODO: 토스 앱으로 돌아가기 (AppsInToss.exit() 등)
    // 현재는 로그아웃 처리
    logout();
  }, [logout]);

  return (
    <View style={styles.mainContainer}>
      {/* 토스 네비게이션 바 */}
      <TossNavBar
        title="누수체크"
        onMorePress={() => {
          // TODO: 더보기 메뉴 (공유, 신고 등)
        }}
        onClosePress={handleClosePress}
      />

      {/* 탭 네비게이터 */}
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.gray400,
          tabBarStyle: {
            backgroundColor: COLORS.white,
            borderTopColor: COLORS.gray200,
            borderTopWidth: 0.5,
            height: 56,
            paddingBottom: 4,
            paddingTop: 4,
          },
          tabBarLabel: ({ focused, color }) => (
            <Txt
              typography="t7"
              color={focused ? COLORS.primary : COLORS.gray400}
            >
              {TAB_CONFIG[route.name as keyof TabParamList].label}
            </Txt>
          ),
          tabBarIcon: ({ focused }) => (
            <Txt typography="t6">
              {TAB_CONFIG[route.name as keyof TabParamList].icon}
            </Txt>
          ),
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Inspection" component={InspectionScreen} />
        <Tab.Screen name="Experts" component={ExpertsScreen} />
        <Tab.Screen name="Profile">
          {() => (
            <ProfileScreen
              onLogout={() => {
                // 로그아웃 후 인트로로 이동은 Stack 레벨에서 처리
              }}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>

      {/* 종료 확인 모달 */}
      <ExitModal
        visible={exitModalVisible}
        onCancel={() => setExitModalVisible(false)}
        onConfirm={handleExitConfirm}
      />
    </View>
  );
}

// --- 루트 앱 ---
export default function App() {
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);

  return (
    <SafeAreaProvider>
      <TDSProvider>
        {/* 라이트 모드 고정 */}
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animation: 'fade',
            }}
          >
            {isLoggedIn ? (
              <Stack.Screen name="Main" component={MainTabs} />
            ) : (
              <Stack.Screen name="Intro" component={IntroScreen} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </TDSProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
});
