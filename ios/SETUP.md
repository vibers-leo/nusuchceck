# 누수체크 iOS 앱 설정 가이드

## 개요
Hotwire Native (turbo-ios)를 사용하여 Rails 웹앱을 네이티브 iOS 앱으로 래핑합니다.

## 1. Xcode 프로젝트 생성

```bash
# Xcode에서 새 프로젝트 생성
# - iOS App 선택
# - Product Name: NusuCheck
# - Bundle Identifier: com.nusucheck.app
# - Language: Swift
# - Interface: Storyboard
```

## 2. Swift Package Manager 의존성

`File > Add Package Dependencies`에서 추가:
```
https://github.com/hotwired/hotwire-native-ios
```

## 3. SceneDelegate.swift

```swift
import UIKit
import HotwireNative

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    private lazy var navigator = Navigator()

    // 서버 URL (환경에 따라 변경)
    #if DEBUG
    private let baseURL = URL(string: "http://localhost:3000")!
    #else
    private let baseURL = URL(string: "https://nusucheck.fly.dev")!
    #endif

    // Path Configuration
    private let pathConfigURL = URL(string: "https://nusucheck.fly.dev/hotwire_native/configuration.json")!

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        // Hotwire 설정
        Hotwire.config.userAgent = "NusuCheck/iOS"
        Hotwire.config.pathConfiguration.sources = [
            .file(Bundle.main.url(forResource: "configuration", withExtension: "json")!),
            .server(pathConfigURL)
        ]

        window = UIWindow(windowScene: windowScene)

        // 탭바 컨트롤러 설정
        let tabBarController = createTabBarController()
        window?.rootViewController = tabBarController
        window?.makeKeyAndVisible()
    }

    private func createTabBarController() -> UITabBarController {
        let tabBar = UITabBarController()
        tabBar.tabBar.tintColor = UIColor(red: 13/255, green: 148/255, blue: 136/255, alpha: 1) // teal-600

        // 고객용 탭 (로그인 후 역할에 따라 동적 변경 필요)
        let homeNav = createTab(
            url: baseURL,
            title: "홈",
            systemImage: "house",
            selectedImage: "house.fill"
        )

        let aiNav = createTab(
            url: baseURL.appendingPathComponent("leak_inspections/new"),
            title: "AI진단",
            systemImage: "cpu",
            selectedImage: "cpu"
        )

        let checkNav = createTab(
            url: baseURL.appendingPathComponent("customers/requests/new"),
            title: "체크",
            systemImage: "plus.circle",
            selectedImage: "plus.circle.fill"
        )

        let notiNav = createTab(
            url: baseURL.appendingPathComponent("notifications"),
            title: "알림",
            systemImage: "bell",
            selectedImage: "bell.fill"
        )

        let myNav = createTab(
            url: baseURL.appendingPathComponent("customers/profile"),
            title: "마이",
            systemImage: "person",
            selectedImage: "person.fill"
        )

        tabBar.viewControllers = [homeNav, aiNav, checkNav, notiNav, myNav]
        return tabBar
    }

    private func createTab(url: URL, title: String, systemImage: String, selectedImage: String) -> UINavigationController {
        let navigator = Navigator()
        navigator.route(url)

        let nav = navigator.rootViewController
        nav.tabBarItem = UITabBarItem(
            title: title,
            image: UIImage(systemName: systemImage),
            selectedImage: UIImage(systemName: selectedImage)
        )
        return nav
    }
}
```

## 4. 로컬 Path Configuration

`configuration.json`을 프로젝트 번들에 추가하세요.
서버 설정의 폴백으로 사용됩니다.

서버 URL: `https://nusucheck.fly.dev/hotwire_native/configuration.json`

## 5. Info.plist 설정

```xml
<!-- 개발 시 HTTP 허용 -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsLocalNetworking</key>
    <true/>
</dict>

<!-- 카메라 권한 (누수 사진 촬영) -->
<key>NSCameraUsageDescription</key>
<string>누수 사진을 촬영하기 위해 카메라 접근이 필요합니다.</string>

<!-- 사진 라이브러리 권한 -->
<key>NSPhotoLibraryUsageDescription</key>
<string>누수 사진을 선택하기 위해 사진 접근이 필요합니다.</string>
```

## 6. 앱 스타일링

### 네비게이션 바 (틸 컬러)
```swift
let appearance = UINavigationBarAppearance()
appearance.configureWithOpaqueBackground()
appearance.backgroundColor = .white
appearance.titleTextAttributes = [.foregroundColor: UIColor.black]
UINavigationBar.appearance().standardAppearance = appearance
UINavigationBar.appearance().scrollEdgeAppearance = appearance
UINavigationBar.appearance().tintColor = UIColor(red: 13/255, green: 148/255, blue: 136/255, alpha: 1)
```

### 탭 바
```swift
let tabAppearance = UITabBarAppearance()
tabAppearance.configureWithOpaqueBackground()
tabAppearance.backgroundColor = .white
UITabBar.appearance().standardAppearance = tabAppearance
UITabBar.appearance().scrollEdgeAppearance = tabAppearance
```

## 7. 빌드 & 테스트

```bash
# 시뮬레이터에서 테스트
# 1. Rails 서버 시작: bin/dev
# 2. Xcode에서 시뮬레이터 선택 후 Run
# 3. baseURL을 http://localhost:3000으로 설정 (DEBUG 모드)
```

## 8. App Store 배포

1. Apple Developer Program 가입 ($99/년)
2. App Store Connect에서 앱 등록
3. Xcode > Archive > Upload
4. 스크린샷 제출 (6.5", 5.5" 필수)
5. 심사 제출

## 참고
- [Hotwire Native iOS](https://github.com/hotwired/hotwire-native-ios)
- [Turbo Native Guide](https://native.hotwired.dev/)
