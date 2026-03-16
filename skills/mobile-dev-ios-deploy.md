---
name: mobile-dev-ios-deploy
description: Guide Flutter app deployment to App Store Connect and TestFlight, including Xcode configuration, provisioning profile setup, IPA build, and test distribution
---

# Flutter App 上架 App Store Connect / TestFlight 測試指南

此 skill 引導你完成將 Flutter App 部署至 App Store Connect 的完整流程，包含 Xcode 設定、簽署、建置 IPA、上傳與 TestFlight 測試分發。

---

## 前置條件

- Flutter SDK 已安裝且 `flutter doctor` 無 iOS 相關錯誤
- macOS 系統（iOS 建置僅支援 macOS）
- Xcode 已安裝（建議使用最新穩定版本），並已安裝 Command Line Tools
- 已加入 **Apple Developer Program**（需年費 USD 99）
- CocoaPods 已安裝（`sudo gem install cocoapods` 或 `brew install cocoapods`）
- 已登入 Apple ID 至 Xcode（Xcode > Settings > Accounts）

---

## 步驟 1：查閱最新官方文檔（context7）

在開始之前，先查閱最新的 Flutter iOS 部署文檔，確保流程與指令為最新版本。

```
使用 context7 MCP 工具查閱最新文檔：

1. 解析 Flutter 文檔庫 ID：
   resolve-library-id: libraryName="Flutter", query="iOS deployment App Store Connect TestFlight build ipa"

2. 查詢 Flutter iOS 部署文檔：
   query-docs: libraryId="/flutter/website", query="Build and release iOS app App Store Connect TestFlight provisioning profile Xcode signing flutter build ipa"

3. 解析 Apple Developer 文檔庫 ID：
   resolve-library-id: libraryName="Apple Developer", query="App Store Connect TestFlight app distribution provisioning profile"

4. 查詢 Apple Developer 文檔：
   query-docs: libraryId="<resolved-id>", query="App Store Connect TestFlight distribution provisioning profile code signing"
```

---

## 步驟 2：檢視 Flutter 專案 iOS 設定

### 2.1 開啟 Xcode 工作區

```bash
# 確保 iOS 依賴已安裝
cd ios && pod install && cd ..

# 使用 Xcode 開啟工作區
open ios/Runner.xcworkspace
```

> **重要：** 務必開啟 `Runner.xcworkspace`（而非 `Runner.xcodeproj`），否則 CocoaPods 依賴不會被載入。

### 2.2 確認 Bundle Identifier

在 Xcode 中，選擇 Runner target > General > Identity：

- **Display Name**：App 在裝置上顯示的名稱
- **Bundle Identifier**：App 的唯一識別碼（例如 `com.example.myapp`），提交後不可變更
- **Version**：顯示給使用者的版本號（例如 `1.0.0`）
- **Build**：內部建置版本號，每次上傳需遞增

```bash
# 也可透過指令檢視 Bundle Identifier
grep -r "PRODUCT_BUNDLE_IDENTIFIER" ios/Runner.xcodeproj/project.pbxproj | head -5
```

---

## 步驟 3：設定 App ID 與 Provisioning Profile

### 3.1 在 Apple Developer Portal 建立 App ID

1. 登入 [Apple Developer Portal](https://developer.apple.com/account)
2. 前往「Certificates, Identifiers & Profiles」>「Identifiers」
3. 點選「+」建立新的 App ID
4. 選擇「App IDs」>「App」
5. 填寫 Description 與 Bundle ID（需與 Xcode 中的 Bundle Identifier 一致）
6. 勾選需要的 Capabilities（例如 Push Notifications、Sign in with Apple 等）
7. 點選「Register」

### 3.2 建立 Distribution Certificate

1. 前往「Certificates」>「+」
2. 選擇「Apple Distribution」
3. 依照畫面指示透過 Keychain Access 產生 CSR（Certificate Signing Request）
4. 上傳 CSR 並下載憑證
5. 雙擊下載的 `.cer` 檔案安裝至 Keychain

### 3.3 建立 Provisioning Profile

1. 前往「Profiles」>「+」
2. 選擇「App Store Connect」（用於上架分發）
3. 選擇對應的 App ID
4. 選擇對應的 Distribution Certificate
5. 填寫 Profile 名稱，點選「Generate」
6. 下載並雙擊安裝

> **提示：** 若在 Xcode 中啟用「Automatically manage signing」，Xcode 會自動處理上述 Certificate 與 Provisioning Profile 的建立。建議在開發階段使用自動管理，正式發布時視需要切換為手動管理。

---

## 步驟 4：Xcode 簽署設定

### 4.1 使用自動簽署（建議）

1. 在 Xcode 中選擇 Runner target > Signing & Capabilities
2. 勾選「Automatically manage signing」
3. 選擇你的 Apple Developer Team
4. 確認無簽署錯誤

### 4.2 使用手動簽署

1. 取消勾選「Automatically manage signing」
2. 在 Release 區段選擇對應的 Provisioning Profile
3. 確認 Signing Certificate 為「Apple Distribution」

---

## 步驟 5：設定 App 圖示與啟動畫面

### 5.1 App 圖示

確認已設定正式的 App 圖示，取代預設的 Flutter 圖示：

```bash
# 可使用 flutter_launcher_icons 套件自動產生各尺寸圖示
flutter pub add flutter_launcher_icons --dev
```

在 `pubspec.yaml` 中設定圖示路徑後執行：

```bash
dart run flutter_launcher_icons
```

### 5.2 啟動畫面（Launch Screen）

編輯 `ios/Runner/Base.lproj/LaunchScreen.storyboard` 或使用 Xcode 自訂啟動畫面。App Store 審核會檢查啟動畫面，確保不是空白或包含廣告。

---

## 步驟 6：建置 Release IPA

```bash
# 清理先前的建置產物
flutter clean

# 取得套件依賴
flutter pub get

# 安裝 iOS 依賴
cd ios && pod install && cd ..

# 建置 release 版本的 IPA
flutter build ipa --release
```

建置成功後，IPA 檔案位於：
```
build/ios/ipa/<app-name>.ipa
```

Xcode Archive 位於：
```
build/ios/archive/Runner.xcarchive
```

### 其他建置選項

```bash
# 使用混淆與分離除錯符號（建議正式發布使用）
flutter build ipa --release --obfuscate --split-debug-info=build/ios/symbols

# 指定匯出方式（預設為 app-store）
flutter build ipa --export-method app-store
flutter build ipa --export-method ad-hoc
flutter build ipa --export-method development
```

---

## 步驟 7：上傳至 App Store Connect

有多種方式可將 IPA 上傳至 App Store Connect：

### 方式一：使用 Xcode（Transporter）

1. 在 Xcode 中開啟 Archive：Window > Organizer
2. 選擇最新的 Archive
3. 點選「Distribute App」
4. 選擇「App Store Connect」
5. 選擇「Upload」
6. 依照畫面指示完成上傳

### 方式二：使用 Transporter App

1. 從 Mac App Store 下載「Transporter」
2. 將 `.ipa` 檔案拖入 Transporter
3. 點選「Deliver」上傳

### 方式三：使用指令列工具 xcrun

```bash
# 使用 altool 上傳（需要 App-Specific Password）
xcrun altool --upload-app \
  --type ios \
  --file build/ios/ipa/<app-name>.ipa \
  --apiKey <API_KEY_ID> \
  --apiIssuer <ISSUER_ID>
```

> **⚠️ 機密管理提醒：**
> - App Store Connect API Key 應妥善保管，**不可**寫死在程式碼或腳本中
> - 使用環境變數或安全的密鑰管理服務來存取 API Key
> - App-Specific Password 應透過 Apple ID 網站產生，並安全存放

---

## 步驟 8：在 App Store Connect 設定應用程式

### 8.1 建立應用程式

1. 登入 [App Store Connect](https://appstoreconnect.apple.com)
2. 前往「My Apps」>「+」>「New App」
3. 填寫：
   - **Platforms**：iOS
   - **Name**：App 名稱（會顯示在 App Store 上）
   - **Primary Language**：主要語言
   - **Bundle ID**：選擇已在 Developer Portal 註冊的 Bundle ID
   - **SKU**：自訂的唯一識別碼（例如 `com.example.myapp.v1`）
   - **User Access**：完整存取或限制存取

### 8.2 填寫 App 資訊

在「App Information」中填寫：
- 隱私權政策 URL（必填）
- 年齡分級
- 類別（主要與次要）

### 8.3 準備商店頁面

在「Prepare for Submission」中填寫：
- 截圖（至少需要 6.7 吋和 5.5 吋 iPhone 各一組）
- 宣傳文字
- 描述
- 關鍵字
- 技術支援 URL
- 行銷 URL（選填）

---

## 步驟 9：設定 TestFlight 測試

### 9.1 內部測試

上傳 Build 至 App Store Connect 後，即可設定 TestFlight 測試：

1. 前往「TestFlight」分頁
2. 等待 Build 處理完成（通常需要 15-30 分鐘）
3. Build 處理完成後會出現在列表中
4. 點選 Build 旁的「Manage」>「Internal Testing」
5. 建立 Internal Testing Group（若尚未建立）
6. 新增內部測試者（必須為 App Store Connect 使用者，上限 100 人）
7. 測試者會收到 Email 通知，透過 TestFlight App 安裝測試版本

### 9.2 外部測試

外部測試者不需要是 App Store Connect 使用者，但外部測試需要經過 **Beta App Review**：

1. 前往「TestFlight」>「External Testing」
2. 建立 External Testing Group
3. 選擇要提供給外部測試者的 Build
4. 填寫測試資訊：
   - Beta App Description
   - Feedback Email
   - What to Test（測試說明）
   - 聯繫資訊
5. 提交 Beta App Review（首次提交通常需要 24-48 小時）
6. 審核通過後，透過以下方式邀請外部測試者：
   - 輸入 Email 地址邀請個別測試者
   - 產生公開邀請連結（最多 10,000 名測試者）

### 測試者人數上限

| 測試類型 | 上限 |
|---------|------|
| Internal Testers | 100 人 |
| External Testers | 10,000 人 |

---

## 步驟 10：App Review 注意事項

若最終目標是上架 App Store，以下為常見審核被拒原因與預防措施：

### 常見被拒原因

1. **Crashes / Bugs**：確保 App 穩定，無明顯閃退或功能失效
2. **Incomplete Information**：App 描述、截圖、聯繫資訊需完整
3. **Placeholder Content**：不可包含「lorem ipsum」或測試用假資料
4. **Privacy Issues**：需提供隱私權政策，且 App 需正確處理使用者資料
5. **Login Issues**：若需登入，需提供審核用的測試帳號密碼
6. **Broken Links**：所有連結必須可正常存取
7. **Guideline 4.3 - Spam**：App 需有獨特功能，不可與現有 App 過度相似

### 審核前檢查清單

- [ ] App 在各種 iOS 版本上測試通過
- [ ] 所有功能運作正常，無閃退
- [ ] 截圖為實際 App 畫面
- [ ] 隱私權政策 URL 可存取且內容正確
- [ ] 如需登入，已在 App Review Information 中提供測試帳號
- [ ] App 描述準確反映 App 功能
- [ ] 已處理所有 App 權限的使用說明（例如相機、位置）

---

## 步驟 11：監控與更新

### 查看 TestFlight 回饋

- 前往 App Store Connect >「TestFlight」>「Feedback」查看測試者送出的截圖與回饋
- 前往「Crashes」查看崩潰報告

### 發布更新版本

1. 更新 `pubspec.yaml` 中的 `version`（例如 `1.0.1+2`，`+` 後為 Build Number）
2. 重新執行 `flutter build ipa --release`
3. 上傳新的 IPA 至 App Store Connect
4. 在 TestFlight 中選擇新的 Build 提供給測試者

> **注意：** 每次上傳至 App Store Connect 的 Build Number（`+` 後的數字）必須遞增。

---

## 常見問題排查

### Q：`flutter build ipa` 出現 Signing 錯誤
**A：**
1. 確認已在 Xcode 中選擇正確的 Team
2. 確認 Provisioning Profile 已安裝且尚未過期
3. 嘗試在 Xcode 中手動 Archive 以取得更詳細的錯誤訊息
4. 檢查 Apple Developer 帳號的 Program 是否仍有效（未過期）

### Q：上傳後 App Store Connect 顯示「Invalid Binary」
**A：**
- 檢查 Email（Apple 會寄送詳細的拒絕原因）
- 常見原因：Info.plist 缺少必要的權限說明、不支援的架構、缺少 App Icon
- 確認 `ios/Runner/Info.plist` 中使用到的權限都有對應的 Usage Description

### Q：TestFlight Build 處理時間過長
**A：**
- 通常 Build 處理需要 15-30 分鐘，但有時可能需要更長時間
- 如果超過 1 小時，嘗試重新上傳
- 確認 Build 版本號是唯一的

### Q：外部測試者收不到邀請
**A：**
1. 確認 Beta App Review 已通過
2. 確認測試者 Email 地址正確
3. 請測試者檢查垃圾郵件資料夾
4. 建議使用公開邀請連結作為替代方案

### Q：`pod install` 失敗
**A：**
```bash
# 清理 CocoaPods 快取
cd ios
rm -rf Pods Podfile.lock
pod repo update
pod install
cd ..
```

### Q：Build Number 衝突
**A：** 每次上傳至 App Store Connect 的 Build Number 必須唯一且遞增。修改 `pubspec.yaml` 中 `version` 的 `+` 後數字（例如 `1.0.0+1` → `1.0.0+2`）。

---

## 安全性提醒

> **⚠️ 重要：機密資訊管理**
>
> 以下資訊包含敏感內容，**絕對不可**提交至版本控制系統：
>
> - App Store Connect API Key（`.p8` 檔案）
> - Distribution Certificate（`.p12` 檔案）與其密碼
> - App-Specific Password
> - Provisioning Profile（雖然不含金鑰，但建議不提交）
>
> 請確認 `.gitignore` 包含以下規則：
> ```
> *.p8
> *.p12
> *.mobileprovision
> *.provisionprofile
> ```
>
> 在 CI/CD 環境中：
> - 使用環境變數或安全的密鑰管理服務來存取簽署相關檔案
> - 考慮使用 [Fastlane Match](https://docs.fastlane.tools/actions/match/) 來管理團隊的 Certificate 與 Provisioning Profile
> - App Store Connect API Key 應透過 CI/CD 平台的 Secret 管理功能存取
