---
name: mobile-dev-gcp-deploy
description: 以 Flutter 為主，引導使用者完成 Google Play Console 上架測試流程，包含 AAB 建置、簽署設定、測試軌道建立與測試者邀請
---

# Google Play Console 上架測試引導

本 skill 引導你完成將 Flutter 應用程式部署至 Google Play Console 的完整流程，涵蓋從建置到測試分發的每個步驟。

> **適用框架：** 以 Flutter 為主要引導框架。若使用 React Native、Kotlin 或其他框架，請依據對應工具調整建置指令，整體 Google Play Console 操作流程相同。

---

## 即時查閱最新文檔（context7）

在開始之前，請透過 context7 查閱最新官方文檔，確保引導內容為最新版本：

1. **Flutter Android 部署文檔：**
   使用 `mcp__plugin_context7_context7__resolve-library-id` 搜尋 `Flutter`，取得 library ID 後，使用 `mcp__plugin_context7_context7__query-docs` 查詢：
   - `"Android deployment Google Play Store release build appbundle signing"`
   - `"flutter build appbundle release signing configuration"`

2. **Google Play Console 文檔：**
   使用 `mcp__plugin_context7_context7__resolve-library-id` 搜尋 `Google Play Console` 或 `Android Developer`，查詢：
   - `"Play Console internal testing closed testing setup"`
   - `"App signing Play App Signing upload key"`

---

## 前置條件

請先確認以下條件已滿足：

- [ ] 已安裝 Flutter SDK 並完成 `flutter doctor` 檢查
- [ ] 已安裝 Android Studio 與 Android SDK
- [ ] 已註冊 Google Play 開發者帳號（需一次性費用 USD 25）
- [ ] 已有可正常執行的 Flutter 應用程式
- [ ] Java Development Kit (JDK) 已安裝（用於產生 keystore）

---

## 步驟 1：檢視並更新應用程式基本設定

### 1.1 更新 Application ID

編輯 `android/app/build.gradle.kts`（或 `build.gradle`），確認 `applicationId` 為正式的套件名稱：

```kotlin
android {
    namespace = "com.example.yourapp"
    defaultConfig {
        applicationId = "com.example.yourapp"
        minSdk = 21 // 根據需求調整
        targetSdk = 34 // 使用最新穩定版
        versionCode = 1
        versionName = "1.0.0"
    }
}
```

### 1.2 更新應用程式名稱

編輯 `android/app/src/main/AndroidManifest.xml`，設定 `android:label`：

```xml
<application
    android:label="你的應用程式名稱"
    android:icon="@mipmap/ic_launcher">
```

### 1.3 新增啟動圖示

確保已將適當尺寸的啟動圖示放置於 `android/app/src/main/res/` 下的各 `mipmap-*` 目錄中。可使用 `flutter_launcher_icons` 套件自動產生：

```yaml
# pubspec.yaml
dev_dependencies:
  flutter_launcher_icons: ^0.14.0

flutter_launcher_icons:
  android: true
  image_path: "assets/icon/app_icon.png"
```

```bash
dart run flutter_launcher_icons
```

---

## 步驟 2：設定應用程式簽署

### 2.1 建立 Upload Keystore

```bash
keytool -genkey -v -keystore ~/upload-keystore.jks -storetype JKS \
  -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

> **安全提醒：** Keystore 檔案與密碼為高度機密資訊，請妥善保管。建議將 keystore 儲存在安全位置，不要提交至版本控制系統。

### 2.2 建立 key.properties 檔案

在 `android/` 目錄下建立 `key.properties`（此檔案不應提交至 Git）：

```properties
storePassword=<你的 keystore 密碼>
keyPassword=<你的 key 密碼>
keyAlias=upload
storeFile=<keystore 檔案的絕對路徑，例如 /Users/username/upload-keystore.jks>
```

> **安全提醒：** 請將 `key.properties` 加入 `.gitignore`，絕對不要將此檔案提交至版本控制系統。內含的密碼與路徑為機密資訊，應透過安全管道傳遞給團隊成員。

### 2.3 在 build.gradle 中引用簽署設定

編輯 `android/app/build.gradle.kts`：

```kotlin
import java.util.Properties
import java.io.FileInputStream

val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

android {
    // ...

    signingConfigs {
        create("release") {
            keyAlias = keystoreProperties["keyAlias"] as String
            keyPassword = keystoreProperties["keyPassword"] as String
            storeFile = keystoreProperties["storeFile"]?.let { file(it) }
            storePassword = keystoreProperties["storePassword"] as String
        }
    }
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
        }
    }
}
```

---

## 步驟 3：建置 Release AAB

### 3.1 清理並建置

```bash
flutter clean
flutter pub get
flutter build appbundle --release
```

建置完成後，AAB 檔案位於：
`build/app/outputs/bundle/release/app-release.aab`

### 3.2 驗證 AAB（選用）

使用 Google 提供的 `bundletool` 驗證 AAB：

```bash
# 安裝 bundletool（macOS）
brew install bundletool

# 驗證 AAB
bundletool validate --bundle=build/app/outputs/bundle/release/app-release.aab
```

---

## 步驟 4：設定 Google Play Console

### 4.1 建立應用程式

1. 前往 [Google Play Console](https://play.google.com/console)
2. 點選「建立應用程式」
3. 填寫應用程式名稱、預設語言、應用程式類型（應用程式/遊戲）、付費/免費
4. 同意開發人員計畫政策與美國出口法規

### 4.2 完成商店資訊

在「商店設定」中填寫：

- **主要商店資訊：** 簡短說明（80 字）、完整說明（4000 字）
- **圖片素材：** 應用程式圖示（512x512）、功能圖片（1024x500）、手機螢幕截圖（至少 2 張）
- **分類：** 應用程式類別、標籤
- **聯絡資訊：** 電子郵件、網站（選用）、電話（選用）

### 4.3 完成內容聲明

在「政策」>「應用程式內容」中完成：

- 隱私權政策（必須提供 URL）
- 廣告聲明
- 內容分級問卷
- 目標對象
- 資料安全性聲明

---

## 步驟 5：設定 Play App Signing

1. 在 Google Play Console 中前往「設定」>「應用程式簽署」
2. 選擇「使用 Google Play 管理的金鑰」（建議）
3. 上傳你的 upload key 憑證（從 keystore 匯出）：

```bash
keytool -export -rfc -keystore ~/upload-keystore.jks -alias upload \
  -file upload_certificate.pem
```

> **說明：** Google Play App Signing 會使用 Google 管理的 app signing key 對最終發布給使用者的 APK 進行簽署。你只需使用 upload key 簽署上傳的 AAB，Google 會處理其餘部分。這提供了額外的安全性 — 即使 upload key 遺失，你可以聯繫 Google 重設。

---

## 步驟 6：建立測試軌道並上傳 AAB

### 6.1 測試軌道類型

| 軌道類型 | 說明 | 適用場景 |
|---------|------|---------|
| Internal Testing | 最多 100 位測試者，無需審核 | 團隊內部快速測試 |
| Closed Testing | 透過電子郵件清單或 Google Groups 邀請 | 小規模外部測試 |
| Open Testing | 任何人都可加入測試 | 大規模公測 |

### 6.2 建立 Internal Testing 軌道（建議先從此開始）

1. 前往「測試」>「內部測試」
2. 點選「建立新版本」
3. 上傳 AAB 檔案（`app-release.aab`）
4. 填寫版本資訊（版本名稱、版本說明）
5. 點選「儲存」，然後「檢查版本」，最後「開始推出」

### 6.3 邀請測試者

1. 前往「測試」>「內部測試」>「測試者」標籤
2. 建立電子郵件清單，加入測試者的 Google 帳號電子郵件
3. 複製測試邀請連結，分享給測試者
4. 測試者需透過連結接受邀請，然後即可從 Google Play 安裝測試版本

---

## 步驟 7：版本更新流程

當需要發布新版本時：

1. 更新 `pubspec.yaml` 中的 `version`（例如 `1.0.1+2`，其中 `+2` 為 versionCode）
2. 重新建置：`flutter build appbundle --release`
3. 在 Google Play Console 對應的測試軌道中建立新版本
4. 上傳新的 AAB
5. 填寫更新說明，推出版本

---

## 常見問題排查

### AAB 建置失敗

- 確認 `flutter doctor` 無錯誤
- 執行 `flutter clean` 後重新建置
- 確認 `key.properties` 路徑與密碼正確
- 確認 JDK 版本與 Gradle 版本相容

### 上傳 AAB 被拒絕

- **版本代碼重複：** 確保每次上傳的 `versionCode` 大於前一次
- **Target SDK 版本過低：** Google Play 要求 target SDK 為最新穩定版，執行 `flutter build appbundle` 前確認 `targetSdk` 設定
- **64 位元支援：** Flutter 預設已支援，但若有原生函式庫請確認包含 `arm64-v8a` 架構

### 簽署問題

- **Upload key 不符：** 確認使用的 keystore 與 Google Play Console 中註冊的 upload key 一致
- **Key 遺失：** 若使用 Play App Signing，可聯繫 Google 重設 upload key

### 測試者無法安裝

- 確認測試者已接受邀請連結
- 確認測試者使用的 Google 帳號與邀請清單中的一致
- 確認版本已完成推出（狀態為「可供測試」）
- Internal Testing 版本最多需等待數分鐘才能在 Play Store 中出現

### Multidex 問題

若應用程式方法數超過 65536，需啟用 multidex：

```kotlin
android {
    defaultConfig {
        multiDexEnabled = true
    }
}
```

---

## 安全與機密管理提醒

- **Keystore 檔案（.jks）：** 不可提交至版本控制系統，應安全備份
- **key.properties：** 包含密碼，必須加入 `.gitignore`
- **Google Play Console 存取權限：** 使用最小權限原則，僅授予團隊成員必要的角色
- **API 金鑰：** 若使用 Google Cloud API，請透過環境變數或安全儲存方案管理，不可寫死在程式碼中
- **Service Account：** 若使用 CI/CD 自動上傳，Service Account JSON 金鑰為高度機密，應透過 CI/CD 平台的 secret 管理功能儲存
