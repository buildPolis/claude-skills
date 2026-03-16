---
name: mobile-dev-ios-deploy
description: 以 Flutter 為主，引導使用者完成 iOS App Store Connect / TestFlight 上架測試流程，包含 Xcode 設定、IPA 建置、TestFlight 分發與 App Review 注意事項
---

# iOS App Store Connect / TestFlight 上架測試引導

本 skill 引導你完成將 Flutter 應用程式部署至 App Store Connect 並透過 TestFlight 進行測試分發的完整流程。

> **適用框架：** 以 Flutter 為主要引導框架。若使用 React Native、Swift 或其他框架，請依據對應工具調整建置指令，整體 App Store Connect 操作流程相同。

---

## 即時查閱最新文檔（context7）

在開始之前，請透過 context7 查閱最新官方文檔，確保引導內容為最新版本：

1. **Flutter iOS 部署文檔：**
   使用 `mcp__plugin_context7_context7__resolve-library-id` 搜尋 `Flutter`，取得 library ID 後，使用 `mcp__plugin_context7_context7__query-docs` 查詢：
   - `"iOS deployment App Store Connect TestFlight build ipa signing provisioning profile"`
   - `"flutter build ipa release Xcode archive upload"`

2. **Apple Developer 文檔：**
   使用 `mcp__plugin_context7_context7__resolve-library-id` 搜尋 `Apple Developer` 或 `App Store Connect`，查詢：
   - `"App Store Connect TestFlight internal external testing"`
   - `"code signing provisioning profile distribution certificate"`

---

## 前置條件

請先確認以下條件已滿足：

- [ ] 已安裝 Flutter SDK 並完成 `flutter doctor` 檢查
- [ ] 已安裝最新版 Xcode（透過 Mac App Store 安裝）
- [ ] 已安裝 Xcode Command Line Tools：`xcode-select --install`
- [ ] 已同意 Xcode 授權條款：`sudo xcodebuild -license accept`
- [ ] 已註冊 **Apple Developer Program**（年費 USD 99，免費帳號無法上傳至 App Store Connect）
- [ ] 已有可正常執行的 Flutter 應用程式
- [ ] 開發環境為 macOS（iOS 建置僅支援 macOS）

---

## 步驟 1：Apple Developer Program 註冊與設定

### 1.1 註冊 Apple Developer Program

1. 前往 [Apple Developer Program](https://developer.apple.com/programs/) 註冊
2. 使用 Apple ID 登入，完成身份驗證與付款（年費 USD 99）
3. 等待 Apple 審核通過（通常 24-48 小時）

### 1.2 在 Xcode 中登入 Apple ID

1. 開啟 Xcode > Settings > Accounts
2. 點選「+」新增 Apple ID
3. 確認已顯示正確的 Team（個人或組織）

---

## 步驟 2：Xcode 專案設定

### 2.1 開啟 Flutter iOS 專案

使用 Xcode 開啟 Flutter 的 iOS 專案：

```bash
open ios/Runner.xcworkspace
```

> **注意：** 務必開啟 `.xcworkspace`，而非 `.xcodeproj`，以確保 CocoaPods 依賴正確載入。

### 2.2 設定 Bundle Identifier

1. 在 Xcode 中選擇 Runner target
2. 前往 Signing & Capabilities 標籤
3. 設定 **Bundle Identifier** 為唯一的識別碼（例如 `com.yourcompany.yourapp`）
4. 此 Bundle Identifier 必須與 App Store Connect 中建立的 App ID 一致

### 2.3 設定 Display Name 與版本

1. 在 General 標籤中設定 **Display Name**（使用者在裝置上看到的名稱）
2. 確認 **Version**（例如 `1.0.0`）與 **Build**（例如 `1`）設定正確
3. 或在 `pubspec.yaml` 中設定 `version: 1.0.0+1`（`+` 後面為 build number）

### 2.4 設定 Signing（簽署）

1. 在 Signing & Capabilities 標籤中勾選 **Automatically manage signing**（建議）
2. 選擇正確的 **Team**
3. Xcode 會自動建立並管理 App ID、Provisioning Profile 與 Signing Certificate

> **手動簽署（進階）：** 若需要手動管理簽署，取消勾選 Automatically manage signing，並在 [Apple Developer Portal](https://developer.apple.com/account/resources/certificates/list) 中手動建立 Distribution Certificate 與 Provisioning Profile。

### 2.5 設定 Deployment Target

1. 在 General 標籤中設定 **Minimum Deployments**（最低 iOS 版本）
2. Flutter 目前最低支援 iOS 12.0，但建議根據目標使用者設定

### 2.6 新增應用程式圖示

確保已在 `ios/Runner/Assets.xcassets/AppIcon.appiconset/` 中放置所有必要尺寸的圖示。可使用 `flutter_launcher_icons` 套件自動產生：

```yaml
# pubspec.yaml
dev_dependencies:
  flutter_launcher_icons: ^0.14.0

flutter_launcher_icons:
  ios: true
  image_path: "assets/icon/app_icon.png"
```

```bash
dart run flutter_launcher_icons
```

---

## 步驟 3：建立 App ID 與 App Store Connect 應用程式

### 3.1 建立 App ID（若使用自動簽署，Xcode 會自動處理）

若需手動建立：

1. 前往 [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list) > Identifiers
2. 點選「+」建立新的 App ID
3. 選擇「App IDs」，平台選「iOS」
4. 填入 Description 與 Bundle ID（Explicit，例如 `com.yourcompany.yourapp`）
5. 勾選需要的 Capabilities（如 Push Notifications、Sign in with Apple 等）
6. 點選 Register

### 3.2 在 App Store Connect 建立應用程式

1. 前往 [App Store Connect](https://appstoreconnect.apple.com/) > My Apps
2. 點選「+」>「New App」
3. 填寫：
   - **Platforms：** iOS
   - **Name：** 應用程式名稱（在 App Store 上顯示的名稱）
   - **Primary Language：** 主要語言
   - **Bundle ID：** 選擇先前建立的 Bundle ID
   - **SKU：** 唯一識別碼（例如 `com.yourcompany.yourapp.v1`）
4. 點選 Create

---

## 步驟 4：建置 Release IPA

### 4.1 清理並建置

```bash
flutter clean
flutter pub get
flutter build ipa --release
```

建置完成後：
- Xcode Archive 位於：`build/ios/archive/Runner.xcarchive`
- IPA 檔案位於：`build/ios/ipa/*.ipa`

### 4.2 指定匯出方式（選用）

若需要指定不同的匯出方式，可使用 `--export-method` 參數：

```bash
# 預設為 app-store（上傳至 App Store Connect）
flutter build ipa --release --export-method=app-store

# Ad Hoc 分發（需要裝置 UDID 註冊）
flutter build ipa --release --export-method=ad-hoc
```

### 4.3 使用自訂 export options（進階）

若需要更精細的控制，可提供 export options plist：

```bash
flutter build ipa --release --export-options-plist=path/to/ExportOptions.plist
```

### 4.4 程式碼混淆（選用但建議）

```bash
flutter build ipa --release --obfuscate --split-debug-info=build/debug-info
```

> **提醒：** 請保留 `build/debug-info` 中的符號檔案，用於日後的崩潰報告解析。

---

## 步驟 5：上傳至 App Store Connect

有多種方式可將 IPA 上傳至 App Store Connect：

### 方式一：透過 Xcode（建議）

1. 開啟 Xcode
2. 選單 > Window > Organizer
3. 選擇剛建置的 Archive
4. 點選「Distribute App」
5. 選擇「App Store Connect」> Upload
6. 依照指示完成上傳

### 方式二：透過命令列 xcrun altool

```bash
xcrun altool --upload-app --type ios \
  -f build/ios/ipa/*.ipa \
  --apiKey your_api_key \
  --apiIssuer your_issuer_id
```

> **安全提醒：** API Key 與 Issuer ID 為機密資訊，不可寫死在程式碼或腳本中。請透過環境變數或安全儲存方案管理。建議使用 App Store Connect API Key（在 App Store Connect > Users and Access > Integrations > App Store Connect API 中建立）。

### 方式三：透過 Transporter 應用程式

1. 從 Mac App Store 下載 [Transporter](https://apps.apple.com/app/transporter/id1450874784)
2. 登入 Apple ID
3. 拖曳 IPA 檔案至 Transporter
4. 點選「Deliver」上傳

> **注意：** 上傳後，Apple 會自動進行驗證處理（約 15-30 分鐘）。驗證完成前，無法在 App Store Connect 中選擇該建置版本。

---

## 步驟 6：TestFlight 測試分發設定

### 6.1 TestFlight 測試類型

| 測試類型 | 說明 | 審核 | 測試者上限 |
|---------|------|------|-----------|
| Internal Testing | 團隊成員（App Store Connect 使用者） | 不需審核 | 100 人 |
| External Testing | 外部測試者 | 需要 Beta App Review | 10,000 人 |

### 6.2 設定 Internal Testing（內部測試）

1. 前往 App Store Connect > 你的 App > TestFlight
2. 上傳的建置版本驗證完成後會自動出現
3. 在「Internal Group」中新增測試者（必須為 App Store Connect 使用者）
4. 測試者會收到 TestFlight 邀請通知
5. 測試者需安裝 [TestFlight App](https://apps.apple.com/app/testflight/id899247664) 來安裝測試版本

> **優點：** Internal Testing 不需要 Beta App Review，上傳後可立即開始測試。

### 6.3 設定 External Testing（外部測試）

1. 在 TestFlight 標籤中點選「+」建立新的 External Group
2. 設定群組名稱
3. 選擇要測試的建置版本
4. 填寫測試資訊：
   - **Beta App Description：** 測試版本說明
   - **What to Test：** 請測試者關注的功能
   - **Feedback Email：** 接收回饋的電子郵件
5. 新增測試者（透過電子郵件邀請或公開連結）
6. 提交 Beta App Review

> **注意：** External Testing 的首次提交需要通過 Beta App Review（通常 24-48 小時），後續同一版本的更新通常審核較快。

### 6.4 邀請測試者

**透過電子郵件邀請：**
1. 在 External Group 中點選「+」新增測試者
2. 輸入測試者電子郵件
3. 測試者會收到邀請郵件，需安裝 TestFlight App 後接受邀請

**透過公開連結：**
1. 在 External Group 中啟用「Public Link」
2. 複製公開連結分享給測試者
3. 可設定測試者人數上限

---

## 步驟 7：App Review 注意事項

在將應用程式從 TestFlight 轉為正式上架時，需通過 Apple 的 App Review。以下為常見注意事項：

### 7.1 常見被拒原因

- **隱私政策缺失：** 所有 App 都需要提供隱私政策 URL
- **不完整的功能：** App 不應有明顯的 placeholder 或未完成功能
- **登入問題：** 若 App 需要登入，須提供測試帳號給審核人員
- **權限說明不足：** 所有權限請求（相機、位置、通知等）必須在 `Info.plist` 中提供清楚的使用說明
- **使用私有 API：** 不可使用 Apple 未公開的 API
- **第三方登入：** 若提供 Google 或 Facebook 登入，Apple 要求必須同時提供 Sign in with Apple

### 7.2 Info.plist 權限說明設定

編輯 `ios/Runner/Info.plist`，為每個使用的權限加入說明：

```xml
<key>NSCameraUsageDescription</key>
<string>需要存取相機以拍攝照片</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>需要存取相簿以選擇圖片</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>需要存取位置以提供附近的服務</string>
```

### 7.3 準備 App Store 資訊

在 App Store Connect 中完善以下資訊：

- **螢幕截圖：** 需提供 6.7 吋（iPhone 15 Pro Max）與 6.5 吋（iPhone 11 Pro Max）截圖，若支援 iPad 也需要 iPad 截圖
- **App 說明：** 清楚描述應用程式功能
- **關鍵字：** 用於 App Store 搜尋優化
- **隱私政策 URL：** 必填
- **年齡分級：** 完成分級問卷
- **聯絡資訊：** 提供支援 URL 與聯絡方式

---

## 步驟 8：版本更新流程

當需要發布新版本時：

1. 更新 `pubspec.yaml` 中的 `version`（例如 `1.0.1+2`，其中 `+2` 為 build number）
2. **Build number 必須遞增**，每次上傳的 build number 必須大於前一次
3. 重新建置：`flutter build ipa --release`
4. 透過上述任一方式上傳至 App Store Connect
5. 在 TestFlight 中選擇新建置版本分發給測試者
6. 若為正式版更新，建立新版本並提交 App Review

---

## 常見問題排查

### 建置失敗

- 執行 `flutter clean` 後重新建置
- 確認 `flutter doctor` 無 Xcode 相關錯誤
- 執行 `cd ios && pod install --repo-update && cd ..` 更新 CocoaPods 依賴
- 確認 Xcode 為最新版本且已同意授權條款
- 若出現 signing 錯誤，嘗試在 Xcode 中重新選擇 Team

### Provisioning Profile 問題

- 確認 Bundle Identifier 與 App Store Connect 中的一致
- 嘗試在 Xcode 中取消再重新勾選 Automatically manage signing
- 前往 Apple Developer Portal 檢查 Provisioning Profile 是否有效
- 刪除過期的 Profile：`~/Library/MobileDevice/Provisioning Profiles/`

### 上傳失敗

- **ITMS-90xxx 錯誤：** 根據具體錯誤碼查閱 Apple 文檔
- **Icon 缺失：** 確保 `Assets.xcassets` 中包含所有必要尺寸的圖示
- **Build number 重複：** 確保每次上傳的 build number 大於前一次
- **二進位檔案大小過大：** 考慮使用 `--split-debug-info` 與 `--obfuscate` 減小體積

### TestFlight 問題

- **建置版本未出現：** 上傳後需等待 15-30 分鐘驗證處理
- **測試者未收到邀請：** 確認測試者電子郵件正確，檢查垃圾郵件匣
- **External Testing 審核未通過：** 檢查被拒原因，修正後重新提交
- **測試者無法安裝：** 確認測試者的裝置 iOS 版本符合 Minimum Deployments 設定
- **TestFlight 版本過期：** TestFlight 建置版本有效期為 90 天，過期需重新上傳

### CocoaPods 問題

```bash
# 清理並重新安裝
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..
```

---

## 安全與機密管理提醒

- **Signing Certificate 與 Private Key：** 匯出時設定強密碼，安全儲存 `.p12` 檔案，不可提交至版本控制系統
- **App Store Connect API Key：** 用於 CI/CD 自動上傳時，API Key（`.p8` 檔案）為高度機密，僅可下載一次，請妥善保管並透過 CI/CD 平台的 secret 管理功能儲存
- **Provisioning Profile：** 若使用手動簽署，Profile 檔案不應提交至公開的版本控制系統
- **環境變數：** 任何與 Apple 帳號、API Key 相關的資訊，皆應透過環境變數或安全儲存方案管理，不可寫死在程式碼或腳本中
- **團隊權限管理：** 在 App Store Connect 中使用角色權限控制，僅授予團隊成員必要的存取權限（Admin、App Manager、Developer 等）
