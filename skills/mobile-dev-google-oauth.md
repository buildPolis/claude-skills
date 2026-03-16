---
name: mobile-dev-google-oauth
description: 以 Flutter 為主，引導使用者在行動裝置 App 中整合 Google OAuth（Google Sign-In），包含 GCP Console 設定、Android/iOS 平台配置、登入流程實作與後端 Token 驗證
---

# Google OAuth（Google Sign-In）整合引導

本 skill 引導你在 Flutter 行動應用程式中整合 Google OAuth 登入功能，涵蓋從 GCP Console 設定到完整登入流程實作的每個步驟。

> **適用框架：** 以 Flutter 為主要引導框架。若使用 React Native、Kotlin/Swift 或其他框架，請依據對應的 Google Sign-In SDK 調整實作方式，整體 GCP Console 設定與 OAuth 流程概念相同。

---

## 即時查閱最新文檔（context7）

在開始之前，請透過 context7 查閱最新官方文檔，確保引導內容為最新版本：

1. **google_sign_in 套件文檔：**
   使用 `mcp__plugin_context7_context7__resolve-library-id` 搜尋 `google_sign_in`，取得 library ID 後，使用 `mcp__plugin_context7_context7__query-docs` 查詢：
   - `"Flutter google_sign_in setup configuration Android iOS OAuth sign in"`
   - `"google_sign_in get ID token access token authentication"`

2. **Flutter 官方文檔：**
   使用 `mcp__plugin_context7_context7__resolve-library-id` 搜尋 `Flutter`，查詢：
   - `"Google Sign-In authentication integration"`

3. **Google Identity Platform 文檔：**
   使用 `mcp__plugin_context7_context7__resolve-library-id` 搜尋 `Google Identity` 或 `Google Cloud`，查詢：
   - `"OAuth 2.0 Client ID Android iOS Web configuration"`
   - `"verify ID token server side backend"`

---

## 前置條件

請先確認以下條件已滿足：

- [ ] 已安裝 Flutter SDK 並完成 `flutter doctor` 檢查
- [ ] 已有可正常執行的 Flutter 應用程式
- [ ] 已擁有 Google Cloud Platform（GCP）帳號
- [ ] 已建立 GCP 專案（或準備建立新專案）
- [ ] Android 端：已安裝 Android Studio 與 Android SDK
- [ ] iOS 端：已安裝 Xcode（macOS 環境）

---

## 步驟 1：GCP Console 設定 OAuth 2.0

### 1.1 建立或選擇 GCP 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇既有專案
3. 記下專案 ID，後續步驟會用到

### 1.2 設定 OAuth 同意畫面

1. 在 GCP Console 左側選單中，前往「API 和服務」>「OAuth 同意畫面」
2. 選擇使用者類型：
   - **外部（External）：** 適用於一般應用程式，任何 Google 帳號皆可登入
   - **內部（Internal）：** 僅限組織內部使用（需 Google Workspace）
3. 填寫應用程式名稱、使用者支援電子郵件、開發人員聯絡資訊
4. 設定 Scopes（權限範圍）：至少加入 `email` 和 `profile`
5. 若為外部應用，加入測試使用者（在發布前僅測試使用者可登入）

### 1.3 建立 OAuth 2.0 Client ID

需要為不同平台分別建立 Client ID：

#### Android Client ID

1. 前往「API 和服務」>「憑證」>「建立憑證」>「OAuth 用戶端 ID」
2. 應用程式類型選擇「Android」
3. 填寫套件名稱（與 `android/app/build.gradle.kts` 中的 `applicationId` 一致）
4. 填寫 SHA-1 憑證指紋（詳見步驟 2）
5. 建立完成後記下 Client ID

#### iOS Client ID

1. 前往「API 和服務」>「憑證」>「建立憑證」>「OAuth 用戶端 ID」
2. 應用程式類型選擇「iOS」
3. 填寫 Bundle ID（與 Xcode 專案中的 Bundle Identifier 一致）
4. 建立完成後記下 Client ID 和 iOS URL Scheme

#### Web Client ID（後端驗證用）

1. 前往「API 和服務」>「憑證」>「建立憑證」>「OAuth 用戶端 ID」
2. 應用程式類型選擇「網頁應用程式」
3. 設定授權的重新導向 URI（若有後端回呼需求）
4. 建立完成後記下 Client ID 和 Client Secret

> **安全提醒：** Web Client Secret 為高度機密資訊，僅應儲存在後端伺服器，絕對不可嵌入行動應用程式程式碼中。

---

## 步驟 2：Android 端 SHA-1 設定

### 2.1 取得 Debug SHA-1（開發階段）

```bash
# macOS / Linux
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Windows
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

從輸出中找到 `SHA1:` 開頭的那行，複製指紋值。

### 2.2 取得 Release SHA-1（正式發布）

```bash
keytool -list -v -keystore <你的 release keystore 路徑> -alias <你的 alias>
```

### 2.3 將 SHA-1 加入 GCP Console

1. 在 GCP Console 的 Android OAuth Client ID 設定中
2. 將 Debug 和 Release 的 SHA-1 指紋都加入
3. 若使用 Google Play App Signing，也需加入 Google Play 管理的 App Signing Key 的 SHA-1（可在 Google Play Console >「設定」>「應用程式簽署」中找到）

> **注意：** SHA-1 指紋不正確是 Google Sign-In 在 Android 上失敗的最常見原因。每個 keystore（debug、release、Play App Signing）都有不同的 SHA-1，全部都需要在 GCP Console 中註冊。

---

## 步驟 3：Flutter 專案整合 google_sign_in 套件

### 3.1 安裝套件

```bash
flutter pub add google_sign_in
```

> **提醒：** 請確認使用最新版本的 `google_sign_in` 套件。可透過 [pub.dev](https://pub.dev/packages/google_sign_in) 查閱最新版本號與更新日誌。

### 3.2 Android 端設定

無需額外設定，`google_sign_in` 套件會自動透過 `android/app/build.gradle.kts` 中的 `applicationId` 和已註冊的 SHA-1 來完成驗證。

確認 `android/app/build.gradle.kts` 中的 `minSdk` 至少為 21：

```kotlin
android {
    defaultConfig {
        minSdk = 21
    }
}
```

### 3.3 iOS 端設定

#### 加入 URL Scheme

編輯 `ios/Runner/Info.plist`，加入 iOS Client ID 對應的 URL Scheme（反轉的 Client ID）：

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleTypeRole</key>
        <string>Editor</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <!-- 將以下值替換為你的 iOS Client ID 的反轉形式 -->
            <!-- 例如 Client ID 為 123456789-abcdef.apps.googleusercontent.com -->
            <!-- 則 URL Scheme 為 com.googleusercontent.apps.123456789-abcdef -->
            <string>com.googleusercontent.apps.YOUR_IOS_CLIENT_ID</string>
        </array>
    </dict>
</array>
```

#### 設定 Client ID（iOS）

在 `ios/Runner/Info.plist` 中加入 GIDClientID：

```xml
<key>GIDClientID</key>
<string>YOUR_IOS_CLIENT_ID.apps.googleusercontent.com</string>
```

> **安全提醒：** iOS Client ID 本身不是機密（它會被包含在 App Bundle 中），但仍應透過設定檔管理而非寫死在 Dart 程式碼中，以便於不同環境（開發 / 測試 / 正式）切換。

---

## 步驟 4：實作登入流程

### 4.1 基本登入實作

```dart
import 'package:google_sign_in/google_sign_in.dart';

class GoogleAuthService {
  // 設定需要的 OAuth scopes
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: <String>[
      'email',
      'profile',
      // 如需存取其他 Google API，在此加入對應 scope
      // 'https://www.googleapis.com/auth/contacts.readonly',
    ],
    // iOS 端通常不需要手動指定 clientId（會從 Info.plist 讀取）
    // Web 端或特殊情況可在此指定：
    // clientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
  );

  /// 執行 Google 登入
  Future<GoogleSignInAccount?> signIn() async {
    try {
      final GoogleSignInAccount? account = await _googleSignIn.signIn();
      return account;
    } catch (error) {
      print('Google Sign-In 錯誤: $error');
      return null;
    }
  }

  /// 靜默登入（檢查是否已有登入狀態）
  Future<GoogleSignInAccount?> signInSilently() async {
    try {
      final GoogleSignInAccount? account =
          await _googleSignIn.signInSilently();
      return account;
    } catch (error) {
      print('靜默登入錯誤: $error');
      return null;
    }
  }

  /// 登出
  Future<void> signOut() async {
    await _googleSignIn.signOut();
  }

  /// 中斷連結（撤銷授權，使用者下次登入需重新同意權限）
  Future<void> disconnect() async {
    await _googleSignIn.disconnect();
  }

  /// 取得目前登入的使用者
  GoogleSignInAccount? get currentUser => _googleSignIn.currentUser;

  /// 監聽使用者登入狀態變化
  Stream<GoogleSignInAccount?> get onCurrentUserChanged =>
      _googleSignIn.onCurrentUserChanged;
}
```

### 4.2 取得 ID Token 與 Access Token

```dart
/// 取得已登入使用者的認證 Token
Future<Map<String, String?>?> getTokens() async {
  final GoogleSignInAccount? account = _googleSignIn.currentUser;
  if (account == null) return null;

  final GoogleSignInAuthentication auth = await account.authentication;

  return {
    'idToken': auth.idToken,       // 用於後端驗證使用者身份
    'accessToken': auth.accessToken, // 用於呼叫 Google API
  };
}

/// 取得 HTTP 授權標頭（用於呼叫 Google API）
Future<Map<String, String>?> getAuthHeaders() async {
  final GoogleSignInAccount? account = _googleSignIn.currentUser;
  if (account == null) return null;

  return await account.authHeaders;
  // 回傳格式：{'Authorization': 'Bearer <accessToken>', 'X-Goog-AuthUser': '0'}
}
```

### 4.3 在 UI 中使用

```dart
import 'package:flutter/material.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final GoogleAuthService _authService = GoogleAuthService();
  GoogleSignInAccount? _currentUser;

  @override
  void initState() {
    super.initState();
    // 監聽登入狀態變化
    _authService.onCurrentUserChanged.listen((account) {
      setState(() {
        _currentUser = account;
      });
    });
    // 嘗試靜默登入
    _authService.signInSilently();
  }

  Future<void> _handleSignIn() async {
    final account = await _authService.signIn();
    if (account != null) {
      // 登入成功，取得 token 傳送至後端
      final tokens = await _authService.getTokens();
      final idToken = tokens?['idToken'];
      if (idToken != null) {
        // 將 idToken 傳送至你的後端伺服器進行驗證
        // await yourBackendService.verifyGoogleToken(idToken);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_currentUser != null) {
      return Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('歡迎，${_currentUser!.displayName}'),
          Text(_currentUser!.email),
          ElevatedButton(
            onPressed: () => _authService.signOut(),
            child: const Text('登出'),
          ),
        ],
      );
    }
    return Center(
      child: ElevatedButton(
        onPressed: _handleSignIn,
        child: const Text('使用 Google 帳號登入'),
      ),
    );
  }
}
```

---

## 步驟 5：後端驗證 Token

### 5.1 驗證流程概述

行動應用程式取得的 ID Token 應傳送至後端伺服器驗證，而非在客戶端直接信任。驗證流程如下：

1. 客戶端完成 Google Sign-In，取得 `idToken`
2. 將 `idToken` 傳送至後端 API
3. 後端使用 Google 的公鑰驗證 token 簽章
4. 驗證 token 中的 `aud`（audience）是否為你的 Client ID
5. 驗證 token 未過期
6. 從 token 中取得使用者資訊（email、sub 等）

### 5.2 後端驗證範例（Node.js）

```javascript
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_WEB_CLIENT_ID);

async function verifyGoogleToken(idToken) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_WEB_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return {
      userId: payload['sub'],
      email: payload['email'],
      emailVerified: payload['email_verified'],
      name: payload['name'],
      picture: payload['picture'],
    };
  } catch (error) {
    throw new Error('Invalid Google ID Token');
  }
}
```

### 5.3 後端驗證範例（Python）

```python
from google.oauth2 import id_token
from google.auth.transport import requests
import os

def verify_google_token(token):
    try:
        id_info = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            os.environ.get('GOOGLE_WEB_CLIENT_ID')
        )
        return {
            'user_id': id_info['sub'],
            'email': id_info['email'],
            'email_verified': id_info['email_verified'],
            'name': id_info.get('name'),
            'picture': id_info.get('picture'),
        }
    except ValueError:
        raise Exception('Invalid Google ID Token')
```

> **安全提醒：** 後端驗證時使用的 Client ID 應為 **Web Client ID**。在 Flutter 行動應用中取得的 `idToken`，其 audience 對應的是 Web Client ID（而非 Android 或 iOS Client ID）。務必使用環境變數儲存 Client ID，不可寫死在程式碼中。

---

## 步驟 6：進階設定

### 6.1 請求額外的 Scopes

```dart
final GoogleSignIn _googleSignIn = GoogleSignIn(
  scopes: <String>[
    'email',
    'profile',
    'https://www.googleapis.com/auth/calendar.readonly', // 讀取日曆
    'https://www.googleapis.com/auth/drive.file',        // 存取 Drive 檔案
  ],
);
```

### 6.2 Web 平台支援

若同時需要支援 Flutter Web，需在 `web/index.html` 中加入 Google Sign-In 的 meta tag：

```html
<meta name="google-signin-client_id" content="YOUR_WEB_CLIENT_ID.apps.googleusercontent.com">
```

### 6.3 Server Auth Code（後端代行存取）

若後端需要代表使用者存取 Google API，可取得 Server Auth Code：

```dart
final GoogleSignIn _googleSignIn = GoogleSignIn(
  scopes: <String>['email', 'profile'],
  serverClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
);

// 登入後取得 server auth code
final GoogleSignInAccount? account = await _googleSignIn.signIn();
if (account != null) {
  final String? serverAuthCode = account.serverAuthCode;
  // 將 serverAuthCode 傳送至後端，換取 refresh token
}
```

---

## 常見問題排查

### PlatformException(sign_in_failed, ...)（Android）

- **SHA-1 不正確：** 確認 debug 和 release 的 SHA-1 都已加入 GCP Console
- **套件名稱不符：** 確認 GCP Console 中的套件名稱與 `applicationId` 完全一致
- **Google Play Services 未安裝：** 模擬器需安裝含 Google Play Services 的系統映像
- **OAuth 同意畫面未設定：** 確認已完成 OAuth 同意畫面設定

### 登入彈窗未出現（iOS）

- **URL Scheme 未設定：** 確認 `Info.plist` 中已加入正確的反轉 Client ID 作為 URL Scheme
- **Bundle ID 不符：** 確認 GCP Console 中的 Bundle ID 與 Xcode 專案一致
- **GIDClientID 未設定：** 確認 `Info.plist` 中已設定 `GIDClientID`

### idToken 為 null

- **未設定 Web Client ID：** 在某些情況下需要指定 `serverClientId` 才能取得 idToken
- **Scopes 不足：** 確認至少包含 `email` scope
- **Token 已過期：** 呼叫 `authentication` 前確認使用者仍處於登入狀態

### ApiException: 10（DEVELOPER_ERROR）

- 通常為 SHA-1 或 Client ID 設定錯誤
- 確認所有平台的 Client ID 都已正確建立
- 確認 `google-services.json`（若有使用 Firebase）與 GCP Console 設定一致

### ApiException: 12500

- Google Play Services 版本過舊，請更新裝置上的 Google Play Services
- 確認 OAuth 同意畫面已正確設定

### 登出後重新登入未顯示帳號選擇

- 使用 `disconnect()` 而非 `signOut()` 來完全撤銷授權
- `signOut()` 僅清除本地狀態，`disconnect()` 會撤銷應用程式的存取權限

---

## 安全與機密管理提醒

- **Client Secret（Web）：** 僅限後端使用，絕對不可嵌入行動應用程式程式碼中，應透過環境變數管理
- **Client ID：** 雖非機密，但建議透過設定檔（如 `Info.plist`、`build.gradle`）管理，而非寫死在 Dart 程式碼中，以方便不同環境切換
- **ID Token：** 傳輸時應透過 HTTPS，在後端驗證後才可信任其內容
- **Access Token：** 具有時效性，不應持久化儲存；若需長期存取，應在後端使用 Refresh Token
- **Refresh Token：** 僅在後端透過 Server Auth Code 換取，應安全儲存在後端，不可傳送至客戶端
- **SHA-1 指紋：** 雖非機密，但 release keystore 檔案本身為機密，應妥善保管
- **google-services.json / GoogleService-Info.plist：** 這些檔案包含專案設定資訊，可提交至版本控制系統，但請確認不含 API Key 等額外機密
- **環境變數管理：** 使用 `.env` 檔案搭配 `flutter_dotenv` 等套件管理不同環境的設定值，並將 `.env` 加入 `.gitignore`
