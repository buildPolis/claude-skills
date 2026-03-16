---
name: mobile-dev-gcp-deploy
description: Guide Flutter app deployment to Google Play Console, including AAB build, app signing, testing tracks setup, and tester invitation
---

# Flutter App 上架 Google Play Console 測試指南

此 skill 引導你完成將 Flutter App 部署至 Google Play Console 的完整流程，包含建置、簽署、上傳與測試分發。

---

## 前置條件

- Flutter SDK 已安裝且 `flutter doctor` 無 Android 相關錯誤
- 已有 Google Play Console 開發者帳號（需一次性支付 USD 25 註冊費）
- Android Studio 已安裝（用於 SDK 管理與除錯）
- Java / JDK 已安裝（用於產生簽署金鑰）

---

## 步驟 1：查閱最新官方文檔（context7）

在開始之前，先查閱最新的 Flutter Android 部署文檔與 Google Play Console 文檔，確保流程與指令為最新版本。

```
使用 context7 MCP 工具查閱最新文檔：

1. 解析 Flutter 文檔庫 ID：
   resolve-library-id: libraryName="Flutter", query="Android deployment Google Play release build appbundle signing"

2. 查詢 Flutter Android 部署文檔：
   query-docs: libraryId="/flutter/website", query="Build and release Android app Google Play appbundle signing"

3. 解析 Google Play 文檔庫 ID：
   resolve-library-id: libraryName="Google Play Console", query="Google Play Console testing tracks internal testing upload"

4. 查詢 Google Play 測試軌道文檔：
   query-docs: libraryId="/websites/developer_android_google_play", query="testing tracks internal closed open testing upload AAB app signing"
```

---

## 步驟 2：檢視 Flutter 專案設定

確認 `android/app/build.gradle` 中的基本設定：

```bash
# 確認 applicationId、versionCode、versionName
cat android/app/build.gradle | grep -E "applicationId|versionCode|versionName"
```

### 重要設定項目

- **applicationId**：應用程式唯一識別碼（例如 `com.example.myapp`），上架後不可變更
- **versionCode**：每次上傳至 Google Play 時必須遞增的整數
- **versionName**：顯示給使用者的版本號（例如 `1.0.0`）
- **minSdkVersion**：最低支援的 Android SDK 版本（建議 21 以上）
- **targetSdkVersion**：目標 SDK 版本（Google Play 會要求符合最新政策）

---

## 步驟 3：新增啟動圖示

確認已設定正式的啟動圖示，取代預設的 Flutter 圖示：

```bash
# 可使用 flutter_launcher_icons 套件自動產生各尺寸圖示
flutter pub add flutter_launcher_icons --dev
```

在 `pubspec.yaml` 中設定圖示路徑後執行：

```bash
dart run flutter_launcher_icons
```

---

## 步驟 4：建立簽署金鑰（Upload Key）

Google Play 使用兩組金鑰：**upload key**（開發者持有，用於簽署上傳的 AAB）和 **app signing key**（由 Google Play 管理，用於簽署最終發送給使用者的 APK）。

### 產生 upload keystore

```bash
keytool -genkey -v -keystore ~/upload-keystore.jks -keyalg RSA \
  -keysize 2048 -validity 10000 -alias upload
```

> **⚠️ 機密管理提醒：**
> - `upload-keystore.jks` 檔案必須妥善保管，遺失將無法更新 App
> - **絕對不可**將 keystore 檔案提交至版本控制（Git）
> - 確認 `.gitignore` 已包含 `*.jks` 和 `*.keystore`

### 建立 key.properties 檔案

在 `android/` 目錄下建立 `key.properties`：

```properties
storePassword=<你的 keystore 密碼>
keyPassword=<你的 key 密碼>
keyAlias=upload
storeFile=<keystore 檔案的絕對路徑，例如 /Users/username/upload-keystore.jks>
```

> **⚠️ 機密管理提醒：**
> - `key.properties` 包含敏感密碼，**絕對不可**提交至 Git
> - 確認 `.gitignore` 已包含 `key.properties`
> - 團隊共用時，應透過安全管道（如密碼管理工具）傳遞此檔案

---

## 步驟 5：設定 Gradle 簽署組態

修改 `android/app/build.gradle`，載入 `key.properties` 並設定 release 簽署：

```groovy
// 在 android { 區塊之前加入
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ...existing config...

    signingConfigs {
        release {
            keyAlias = keystoreProperties['keyAlias']
            keyPassword = keystoreProperties['keyPassword']
            storeFile = keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword = keystoreProperties['storePassword']
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.release
        }
    }
}
```

---

## 步驟 6：檢視 App Manifest

確認 `android/app/src/main/AndroidManifest.xml` 包含必要的權限與設定：

```bash
cat android/app/src/main/AndroidManifest.xml
```

### 常見檢查項目

- `android:label`：App 名稱
- `android:icon`：App 圖示
- 網路權限（如需要）：`<uses-permission android:name="android.permission.INTERNET"/>`
- 移除不必要的 debug 相關設定

---

## 步驟 7：建置 Release AAB

```bash
# 清理先前的建置產物
flutter clean

# 取得套件依賴
flutter pub get

# 建置 release 版本的 Android App Bundle
flutter build appbundle --release
```

建置成功後，AAB 檔案位於：
```
build/app/outputs/bundle/release/app-release.aab
```

### 測試 App Bundle（選用）

使用 `bundletool` 在本地測試 AAB：

```bash
# 下載 bundletool（https://github.com/google/bundletool/releases）
# 從 AAB 產生 APKs
bundletool build-apks --bundle=build/app/outputs/bundle/release/app-release.aab \
  --output=build/app/outputs/bundle/release/app-release.apks \
  --ks=~/upload-keystore.jks --ks-key-alias=upload

# 安裝到已連接的裝置
bundletool install-apks --apks=build/app/outputs/bundle/release/app-release.apks
```

---

## 步驟 8：設定 Google Play Console

### 8.1 建立應用程式

1. 登入 [Google Play Console](https://play.google.com/console)
2. 點選「建立應用程式」
3. 填寫：
   - 應用程式名稱
   - 預設語言
   - 應用程式類型（應用程式 / 遊戲）
   - 免費或付費
4. 接受開發人員計劃政策與美國出口法規聲明

### 8.2 完成商店資訊

在「商店發布」>「主要商店資訊」中填寫：
- 簡短說明（80 字以內）
- 完整說明（4000 字以內）
- 應用程式圖示（512 x 512 px）
- 功能圖片（1024 x 500 px）
- 螢幕截圖（至少 2 張，建議提供手機與平板截圖）

### 8.3 完成應用程式內容聲明

在「政策」>「應用程式內容」中完成：
- 隱私權政策（需提供 URL）
- 廣告聲明
- 應用程式存取權
- 內容分級問卷
- 目標對象與內容
- 資料安全性問卷

---

## 步驟 9：啟用 Play App Signing

1. 前往「發布」>「設定」>「應用程式簽署」
2. 選擇「讓 Google 管理及保護您的應用程式簽署金鑰」（建議）
3. 上傳你的 upload key 憑證，或讓 Google Play 從你第一次上傳的 AAB 中擷取

> 啟用 Play App Signing 後，Google 會使用其管理的 app signing key 重新簽署 APK，你只需用 upload key 簽署上傳的 AAB。

---

## 步驟 10：建立測試軌道並上傳 AAB

Google Play Console 提供三種測試軌道：

| 軌道 | 說明 | 測試者上限 |
|------|------|-----------|
| **Internal Testing（內部測試）** | 最快速的測試方式，無需審核 | 100 人 |
| **Closed Testing（封閉測試）** | 需建立測試者群組，需審核 | 依群組設定 |
| **Open Testing（公開測試）** | 任何人可加入測試，需審核 | 無上限 |

### 建議流程：Internal Testing → Closed Testing → Open Testing → Production

### 上傳至 Internal Testing（建議先從此開始）

1. 前往「測試」>「內部測試」
2. 點選「建立新版本」
3. 上傳 `app-release.aab` 檔案
4. 填寫版本資訊（版本名稱、版本附註）
5. 點選「儲存」然後「審核版本」
6. 點選「開始推出內部測試版」

### 限制發布範圍（選用）

若要防止測試版本被意外發布至正式環境，可在 `AndroidManifest.xml` 加入：

```xml
<application>
    <!-- 限制此版本只能發布到封閉測試以下的軌道 -->
    <meta-data
        android:name="com.google.android.play.largest_release_audience.CLOSED_TESTING"
        android:value="" />
</application>
```

---

## 步驟 11：邀請測試者

### Internal Testing 邀請方式

1. 前往「測試」>「內部測試」>「測試者」分頁
2. 建立電子郵件清單，加入測試者的 Google 帳號
3. 複製測試連結，傳送給測試者
4. 測試者需透過連結接受邀請，才能從 Google Play 下載測試版本

### Closed Testing 邀請方式

1. 前往「測試」>「封閉測試」>「管理軌道」
2. 建立測試者群組（可使用 Google Groups）
3. 設定回饋意見的接收方式

---

## 步驟 12：監控與更新

### 查看測試回饋

- 前往「品質」>「Android Vitals」查看效能指標
- 前往「評分與評論」查看測試者回饋

### 發布更新版本

1. 遞增 `pubspec.yaml` 中的 `version`（例如 `1.0.1+2`，`+` 後為 versionCode）
2. 重新執行 `flutter build appbundle --release`
3. 在 Google Play Console 對應軌道建立新版本並上傳

---

## 常見問題排查

### Q：上傳 AAB 時出現「版本代碼已被使用」
**A：** 每次上傳都需要遞增 `versionCode`。修改 `pubspec.yaml` 中 `version` 的 `+` 後數字（例如 `1.0.0+1` → `1.0.0+2`）。

### Q：上傳後顯示「未簽署」或簽署錯誤
**A：** 確認 `key.properties` 路徑正確、`build.gradle` 已正確設定 `signingConfigs`，並確認使用的是 upload key 而非 debug key。

### Q：內部測試者無法在 Google Play 找到 App
**A：**
1. 確認測試者已透過邀請連結接受測試
2. 確認測試者使用的 Google 帳號與邀請的帳號一致
3. 內部測試版本通常在幾分鐘內可用，但有時可能需要數小時

### Q：App Bundle 太大
**A：**
- 使用 `flutter build appbundle --release` 時會自動啟用 R8 代碼縮減
- 檢查是否有不必要的大型資源檔案
- 考慮使用 `--split-debug-info` 選項分離除錯符號

### Q：targetSdkVersion 不符合 Google Play 要求
**A：** Google Play 會定期要求新上傳的 App 使用最新的 targetSdkVersion。更新 `android/app/build.gradle` 中的 `targetSdkVersion` 為 Google Play 要求的最新版本。

### Q：64 位元支援警告
**A：** Flutter 預設建置的 AAB 已包含 arm64-v8a 和 armeabi-v7a 架構，通常不會有此問題。若出現，確認未在 `build.gradle` 中手動排除 64 位元架構。

---

## 安全性提醒

> **⚠️ 重要：機密資訊管理**
>
> 以下檔案包含敏感資訊，**絕對不可**提交至版本控制系統：
>
> - `android/key.properties` — 包含 keystore 密碼
> - `*.jks` / `*.keystore` — 簽署金鑰檔案
> - Google Play Console 的 API 金鑰或服務帳號 JSON
>
> 請確認 `.gitignore` 包含以下規則：
> ```
> *.jks
> *.keystore
> key.properties
> ```
>
> 在 CI/CD 環境中，使用環境變數或安全的密鑰管理服務來存取這些值。
