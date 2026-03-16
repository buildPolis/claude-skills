---
name: mobile-dev-google-oauth
description: Guide Flutter app integration with Google OAuth (google_sign_in), including GCP OAuth Client ID setup for Android/iOS/Web, SHA-1 configuration, URL Scheme setup, sign-in flow implementation, and token verification
---

# Flutter App 整合 Google OAuth 指南

此 skill 引導你完成在 Flutter App 中整合 Google OAuth（Google Sign-In）的完整流程，包含 GCP Console 設定、平台端設定、登入流程實作與後端 token 驗證。

---

## 前置條件

- Flutter SDK 已安裝且 `flutter doctor` 無錯誤
- 已有 Google Cloud Platform（GCP）帳號
- Android Studio 已安裝（Android 開發所需）
- Xcode 已安裝（iOS 開發所需，僅限 macOS）
- 已建立 Firebase 專案或 GCP 專案（用於取得 OAuth Client ID）

---

## 步驟 1：查閱最新官方文檔（context7）

在開始之前，先查閱最新的 google_sign_in 套件文檔與 GCP OAuth 設定文檔，確保流程與 API 為最新版本。

```
使用 context7 MCP 工具查閱最新文檔：

1. 解析 google_sign_in 套件庫 ID：
   resolve-library-id: libraryName="google_sign_in Flutter", query="Flutter google_sign_in OAuth setup Android iOS"

2. 查詢 google_sign_in 套件整合文檔：
   query-docs: libraryId="/websites/pub_dev_packages_google_sign_in", query="Flutter google_sign_in setup Android iOS OAuth Client ID SHA-1 URL scheme sign in flow get ID token access token"

3. 解析 Flutter 文檔庫 ID：
   resolve-library-id: libraryName="Flutter", query="Google Sign-In authentication OAuth"

4. 查詢 Flutter 官方 Google Sign-In 文檔：
   query-docs: libraryId="/flutter/website", query="Google Sign-In authentication setup Android iOS OAuth"
```

> **提醒：** google_sign_in 套件版本可能更新導致 API 變動，請務必確認套件最新版本與遷移指南。

---

## 步驟 2：GCP Console 建立 OAuth 2.0 Client ID

你需要為每個平台（Android、iOS、Web）分別建立 OAuth 2.0 Client ID。

### 2.1 建立或選擇 GCP 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 記下專案 ID（後續設定需要）

### 2.2 設定 OAuth 同意畫面

1. 前往「API 與服務」>「OAuth 同意畫面」
2. 選擇使用者類型：
   - **外部**：任何 Google 帳號都可登入（適合正式上架的 App）
   - **內部**：僅限 Google Workspace 組織內部帳號（適合企業內部 App）
3. 填寫應用程式資訊：
   - 應用程式名稱
   - 使用者支援電子郵件
   - 開發人員聯絡資訊
4. 設定授權範圍（Scopes）：
   - `email`（取得使用者電子郵件）
   - `profile`（取得使用者基本資料）
   - `openid`（OpenID Connect 驗證）
5. 新增測試使用者（在「測試中」狀態下，僅測試使用者可登入）

### 2.3 建立 Android OAuth Client ID

1. 前往「API 與服務」>「憑證」>「建立憑證」>「OAuth 用戶端 ID」
2. 應用程式類型選擇「Android」
3. 填寫：
   - **名稱**：例如 `MyApp Android`
   - **套件名稱**：與 `android/app/build.gradle` 中的 `applicationId` 一致
   - **SHA-1 憑證指紋**：見下方「取得 SHA-1」說明
4. 點選「建立」

### 2.4 建立 iOS OAuth Client ID

1. 前往「API 與服務」>「憑證」>「建立憑證」>「OAuth 用戶端 ID」
2. 應用程式類型選擇「iOS」
3. 填寫：
   - **名稱**：例如 `MyApp iOS`
   - **Bundle ID**：與 Xcode 中的 Bundle Identifier 一致（例如 `com.example.myapp`）
4. 點選「建立」
5. 記下產生的 **iOS Client ID** 與 **iOS URL Scheme**（REVERSED_CLIENT_ID）

### 2.5 建立 Web OAuth Client ID（後端驗證用）

1. 前往「API 與服務」>「憑證」>「建立憑證」>「OAuth 用戶端 ID」
2. 應用程式類型選擇「Web 應用程式」
3. 填寫名稱，例如 `MyApp Web`
4. 點選「建立」
5. 記下 **Web Client ID**（此 ID 會用作 `serverClientId`，讓 App 取得可供後端驗證的 ID Token）

> **⚠️ 機密管理提醒：**
> - **Web Client Secret 絕對不可寫死在 App 程式碼中**，Client Secret 僅供後端伺服器使用
> - Android 與 iOS 的 OAuth Client ID 本身是公開的（嵌入在 App 中），安全性由 SHA-1 與 Bundle ID 限制保障
> - 將 Client ID 存放在環境變數或設定檔中，避免直接寫死在程式碼內

---

## 步驟 3：取得 Android SHA-1 憑證指紋

Google 使用 SHA-1 指紋來驗證 Android App 的身份。你需要取得 **debug** 和 **release** 兩種指紋。

### Debug SHA-1

```bash
# macOS / Linux
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Windows
keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### Release SHA-1

```bash
# 使用你的 release keystore
keytool -list -v -keystore <your-release-keystore-path> -alias <your-key-alias>
```

### 使用 Gradle 取得（替代方式）

```bash
cd android && ./gradlew signingReport
```

> **重要：** 在 GCP Console 建立 Android OAuth Client ID 時，需要填入對應環境的 SHA-1。開發時使用 debug SHA-1，上架時需額外新增 release SHA-1。若使用 Google Play App Signing，還需要新增 Google Play Console 中的 App Signing Key 的 SHA-1。

---

## 步驟 4：設定 Firebase / GCP 設定檔

### 方式 A：使用 Firebase（推薦）

如果你的專案使用 Firebase，可透過 Firebase Console 自動管理 OAuth Client ID：

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 在專案設定中新增 Android 與 iOS App
3. 下載設定檔：
   - Android：`google-services.json` → 放置於 `android/app/`
   - iOS：`GoogleService-Info.plist` → 放置於 `ios/Runner/`

### 方式 B：手動設定（不使用 Firebase）

若不使用 Firebase，需手動在各平台設定 OAuth Client ID（見步驟 5、6）。

> **⚠️ 機密管理提醒：**
> - `google-services.json` 和 `GoogleService-Info.plist` 包含專案設定資訊
> - 這些檔案通常可提交至版本控制（不含 Client Secret），但若你有安全顧慮，可加入 `.gitignore`
> - **絕對不可**將 Firebase Admin SDK 的服務帳號金鑰 JSON 提交至版本控制

---

## 步驟 5：Flutter 專案整合 google_sign_in 套件

### 5.1 安裝套件

```bash
flutter pub add google_sign_in
```

### 5.2 確認套件版本

```bash
# 檢查 pubspec.yaml 中的版本
cat pubspec.yaml | grep google_sign_in

# 查看最新版本
flutter pub outdated
```

> **提醒：** 建議使用最新穩定版本。若從舊版升級，請查閱套件的 CHANGELOG 與遷移指南。

---

## 步驟 6：Android 端設定

### 6.1 設定 google-services.json（若使用 Firebase）

確認 `android/app/google-services.json` 已放置正確位置。

### 6.2 設定 build.gradle

確認 `android/app/build.gradle` 中的 `minSdkVersion` 至少為 21：

```groovy
android {
    defaultConfig {
        minSdkVersion 21  // Google Sign-In 所需最低版本
    }
}
```

### 6.3 設定 SHA-1（若不使用 Firebase）

若不使用 Firebase 的 `google-services.json`，需在初始化時手動提供 `serverClientId`：

```dart
GoogleSignInPlatform.instance.initWithParams(
  const SignInInitParameters(
    serverClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    scopes: ['email', 'profile'],
  ),
);
```

---

## 步驟 7：iOS 端設定

### 7.1 設定 URL Scheme

在 `ios/Runner/Info.plist` 中加入 Google Sign-In 回調所需的 URL Scheme：

```xml
<!-- Google Sign-in Section -->
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleTypeRole</key>
        <string>Editor</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <!-- 從 GoogleService-Info.plist 的 REVERSED_CLIENT_ID 取得 -->
            <!-- 格式：com.googleusercontent.apps.YOUR_IOS_CLIENT_ID -->
            <string>com.googleusercontent.apps.YOUR_IOS_CLIENT_ID</string>
        </array>
    </dict>
</array>
<!-- End of the Google Sign-in Section -->
```

> **取得 REVERSED_CLIENT_ID：**
> - 若使用 Firebase：從 `ios/Runner/GoogleService-Info.plist` 中的 `REVERSED_CLIENT_ID` 欄位取得
> - 若手動設定：將你的 iOS Client ID 反轉（例如 `123456.apps.googleusercontent.com` → `com.googleusercontent.apps.123456`）

### 7.2 設定 GoogleService-Info.plist（若使用 Firebase）

確認 `ios/Runner/GoogleService-Info.plist` 已透過 Xcode 加入專案：

1. 在 Xcode 中開啟 `ios/Runner.xcworkspace`
2. 將 `GoogleService-Info.plist` 拖入 Runner 目錄
3. 確認「Copy items if needed」已勾選

### 7.3 設定 iOS Client ID（若不使用 Firebase）

若不使用 Firebase，在 `ios/Runner/Info.plist` 中加入：

```xml
<key>GIDClientID</key>
<string>YOUR_IOS_CLIENT_ID.apps.googleusercontent.com</string>
```

或在 Dart 程式碼中初始化時提供：

```dart
GoogleSignInPlatform.instance.initWithParams(
  const SignInInitParameters(
    clientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    serverClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    scopes: ['email', 'profile'],
  ),
);
```

---

## 步驟 8：實作登入流程

### 8.1 基本登入實作

```dart
import 'package:google_sign_in/google_sign_in.dart';

class AuthService {
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: [
      'email',
      'profile',
    ],
    // 若不使用 Firebase，需手動提供 serverClientId
    // serverClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  );

  /// 執行 Google 登入
  Future<GoogleSignInAccount?> signIn() async {
    try {
      final GoogleSignInAccount? account = await _googleSignIn.signIn();
      if (account != null) {
        print('登入成功：${account.displayName} (${account.email})');
      }
      return account;
    } catch (error) {
      print('Google 登入失敗：$error');
      return null;
    }
  }

  /// 靜默登入（嘗試使用已快取的憑證登入）
  Future<GoogleSignInAccount?> signInSilently() async {
    return await _googleSignIn.signInSilently();
  }

  /// 登出
  Future<void> signOut() async {
    await _googleSignIn.signOut();
  }

  /// 完全斷開連結（撤銷授權）
  Future<void> disconnect() async {
    await _googleSignIn.disconnect();
  }
}
```

### 8.2 取得 ID Token 與 Access Token

```dart
Future<Map<String, String?>> getTokens() async {
  final GoogleSignInAccount? account = _googleSignIn.currentUser;
  if (account == null) {
    throw Exception('使用者尚未登入');
  }

  final GoogleSignInAuthentication auth = await account.authentication;

  return {
    'idToken': auth.idToken,         // 用於後端驗證使用者身份
    'accessToken': auth.accessToken, // 用於呼叫 Google API
  };
}
```

### 8.3 監聽登入狀態變化

```dart
@override
void initState() {
  super.initState();

  // 監聽登入狀態變化
  _googleSignIn.onCurrentUserChanged.listen((GoogleSignInAccount? account) {
    setState(() {
      _currentUser = account;
    });
  });

  // 嘗試靜默登入
  _googleSignIn.signInSilently();
}
```

### 8.4 完整 Widget 範例

```dart
import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';

class GoogleSignInButton extends StatefulWidget {
  const GoogleSignInButton({super.key});

  @override
  State<GoogleSignInButton> createState() => _GoogleSignInButtonState();
}

class _GoogleSignInButtonState extends State<GoogleSignInButton> {
  final GoogleSignIn _googleSignIn = GoogleSignIn(scopes: ['email', 'profile']);
  GoogleSignInAccount? _currentUser;

  @override
  void initState() {
    super.initState();
    _googleSignIn.onCurrentUserChanged.listen((account) {
      setState(() => _currentUser = account);
    });
    _googleSignIn.signInSilently();
  }

  Future<void> _handleSignIn() async {
    try {
      await _googleSignIn.signIn();
    } catch (error) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('登入失敗：$error')),
      );
    }
  }

  Future<void> _handleSignOut() async {
    await _googleSignIn.signOut();
  }

  @override
  Widget build(BuildContext context) {
    if (_currentUser != null) {
      return Column(
        children: [
          Text('已登入：${_currentUser!.displayName}'),
          Text(_currentUser!.email),
          ElevatedButton(onPressed: _handleSignOut, child: const Text('登出')),
        ],
      );
    }
    return ElevatedButton(
      onPressed: _handleSignIn,
      child: const Text('使用 Google 帳號登入'),
    );
  }
}
```

---

## 步驟 9：後端驗證 Token

當 App 取得 ID Token 後，應將其傳送至你的後端伺服器進行驗證，而非僅在客戶端信任。

### 9.1 驗證流程

1. App 端取得 `idToken`
2. 將 `idToken` 傳送至後端 API
3. 後端使用 Google 的公鑰驗證 token 的簽章與有效性
4. 驗證通過後，從 token 中提取使用者資訊（email、sub 等）

### 9.2 後端驗證範例（Node.js）

```javascript
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client('YOUR_WEB_CLIENT_ID');

async function verifyIdToken(idToken) {
  const ticket = await client.verifyIdToken({
    idToken: idToken,
    audience: 'YOUR_WEB_CLIENT_ID',
  });

  const payload = ticket.getPayload();
  // payload 包含：sub（使用者 ID）、email、name、picture 等
  return payload;
}
```

### 9.3 後端驗證範例（Python）

```python
from google.oauth2 import id_token
from google.auth.transport import requests

def verify_google_token(token):
    idinfo = id_token.verify_oauth2_token(
        token,
        requests.Request(),
        'YOUR_WEB_CLIENT_ID'
    )
    # idinfo 包含：sub、email、name、picture 等
    return idinfo
```

### 9.4 驗證要點

- **audience** 必須與你的 Web Client ID 一致
- 檢查 `email_verified` 欄位確認信箱已驗證
- 使用 `sub`（Subject）作為使用者唯一識別碼，而非 email
- Token 有過期時間（`exp`），後端應檢查是否過期

> **⚠️ 機密管理提醒：**
> - 後端驗證所需的 **Web Client Secret** 必須存放在伺服器端的環境變數或密鑰管理服務中
> - **絕對不可**將 Client Secret 寫死在程式碼中或提交至版本控制
> - 建議使用 `.env` 檔案搭配 `.gitignore`，或使用雲端密鑰管理服務（如 GCP Secret Manager、AWS Secrets Manager）

---

## 步驟 10：與 Firebase Auth 整合（選用）

若你的專案使用 Firebase Authentication，可將 Google Sign-In 的憑證與 Firebase 整合：

```dart
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';

Future<UserCredential?> signInWithGoogle() async {
  // 觸發 Google 登入流程
  final GoogleSignInAccount? googleUser = await GoogleSignIn().signIn();
  if (googleUser == null) return null; // 使用者取消登入

  // 取得認證資訊
  final GoogleSignInAuthentication googleAuth = await googleUser.authentication;

  // 建立 Firebase 憑證
  final credential = GoogleAuthProvider.credential(
    accessToken: googleAuth.accessToken,
    idToken: googleAuth.idToken,
  );

  // 使用憑證登入 Firebase
  return await FirebaseAuth.instance.signInWithCredential(credential);
}
```

> 使用 Firebase Auth 整合時，需額外安裝 `firebase_auth` 與 `firebase_core` 套件。

---

## 常見問題排查

### Q：Android 端出現 `PlatformException(sign_in_failed, com.google.android.gms.common.api.ApiException: 10, null)`
**A：** 錯誤碼 10 表示 SHA-1 設定不正確。請確認：
1. 在 GCP Console 中填入的 SHA-1 與目前使用的 keystore 一致
2. Debug 與 Release 環境使用不同的 keystore，需分別設定
3. 若使用 Google Play App Signing，需額外加入 Play Console 提供的 App Signing Key SHA-1
4. `google-services.json` 是在加入 SHA-1 **之後**下載的（需重新下載）

### Q：Android 端出現 `PlatformException(sign_in_failed, com.google.android.gms.common.api.ApiException: 12500, null)`
**A：** 錯誤碼 12500 通常表示 OAuth 同意畫面設定不完整。前往 GCP Console 確認 OAuth 同意畫面已正確設定並已發布（或已加入測試使用者）。

### Q：iOS 端無法彈出登入畫面
**A：**
1. 確認 `Info.plist` 中的 `CFBundleURLSchemes` 已正確設定 REVERSED_CLIENT_ID
2. 確認 `GoogleService-Info.plist` 已正確加入 Xcode 專案（非僅放在目錄中）
3. 若使用模擬器，確認已登入 Google 帳號或網路連線正常

### Q：取得的 `idToken` 為 null
**A：**
1. 確認已設定 `serverClientId`（Web Client ID）
2. 若使用 Firebase 的 `google-services.json` / `GoogleService-Info.plist`，通常會自動設定
3. 若手動設定，確認 `GoogleSignIn` 初始化時已傳入正確的 `serverClientId`

### Q：OAuth 同意畫面顯示「此應用程式未經驗證」
**A：** 在 GCP Console 中，OAuth 同意畫面處於「測試中」狀態時會顯示此警告。正式上架前需提交驗證申請。測試階段可點選「繼續」跳過。

### Q：已登入但無法取得使用者的特定資訊（如生日、電話）
**A：** 預設的 `email` 和 `profile` 範圍僅提供基本資料。若需要額外資訊，需在 `scopes` 中加入對應的 Google API 範圍，並在 OAuth 同意畫面中設定。敏感範圍需通過 Google 審核。

### Q：Web 平台的 Google Sign-In 無法正常運作
**A：** Flutter Web 使用不同的 google_sign_in 實作。確認已在 `web/index.html` 中加入 Google Sign-In 的 meta tag：
```html
<meta name="google-signin-client_id" content="YOUR_WEB_CLIENT_ID.apps.googleusercontent.com">
```

---

## 安全性提醒

> **⚠️ 重要：機密資訊管理**
>
> 以下原則務必遵守：
>
> 1. **Client Secret 僅供後端使用**
>    - Web OAuth Client Secret **絕對不可**出現在 App 程式碼中
>    - 行動端 App 屬於公開客戶端（public client），不使用 Client Secret
>
> 2. **Token 安全**
>    - ID Token 與 Access Token 不可明文儲存在裝置上
>    - 使用平台提供的安全儲存方案（Android: EncryptedSharedPreferences / iOS: Keychain）
>    - Token 傳輸必須使用 HTTPS
>
> 3. **設定檔管理**
>    - `google-services.json` 和 `GoogleService-Info.plist` 可提交至版本控制（不含 Secret）
>    - Firebase Admin SDK 服務帳號金鑰 **絕對不可**提交至版本控制
>    - 後端的 `.env` 檔案應加入 `.gitignore`
>
> 4. **OAuth 範圍最小化**
>    - 僅申請 App 實際需要的最小權限範圍
>    - 避免申請過多敏感範圍，以免增加 Google 審核難度與使用者疑慮
>
> 5. **環境變數範例**
>    ```bash
>    # .env（後端伺服器用，絕對不可提交至 Git）
>    GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
>    GOOGLE_CLIENT_SECRET=your-web-client-secret
>    ```
>    確認 `.gitignore` 包含：
>    ```
>    .env
>    .env.*
>    ```
