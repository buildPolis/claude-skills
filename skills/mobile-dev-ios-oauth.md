---
name: mobile-dev-ios-oauth
description: Guide Flutter app integration with Sign in with Apple (iOS OAuth), including App ID capability setup, Xcode configuration, sign_in_with_apple package integration, authorization flow, identity token verification, and Android web-based fallback
---

# Flutter App 整合 Sign in with Apple 指南

此 skill 引導你完成在 Flutter App 中整合 Sign in with Apple（iOS OAuth）的完整流程，包含 Apple Developer 設定、Xcode 專案設定、sign_in_with_apple 套件整合、授權流程實作、後端 identity token 驗證，以及 Android 端的 Web-based 實作方案。

---

## 前置條件

- Flutter SDK 已安裝且 `flutter doctor` 無錯誤
- **Apple Developer Program 帳號**（付費，USD 99/年）— Sign in with Apple 功能需要付費開發者帳號
- Xcode 已安裝（僅限 macOS）
- iOS 13.0 以上的裝置或模擬器（Sign in with Apple 最低系統需求）
- Android Studio 已安裝（若需支援 Android 端）

---

## 步驟 1：查閱最新官方文檔（context7）

在開始之前，先查閱最新的 sign_in_with_apple 套件文檔與 Apple 官方文檔，確保流程與 API 為最新版本。

```
使用 context7 MCP 工具查閱最新文檔：

1. 解析 sign_in_with_apple 套件庫 ID：
   resolve-library-id: libraryName="sign_in_with_apple", query="Flutter sign_in_with_apple Sign in with Apple iOS Android setup"

2. 查詢 sign_in_with_apple 套件整合文檔：
   query-docs: libraryId="<上一步取得的 library ID>", query="Flutter sign_in_with_apple setup iOS Android authorization code identity token web-based sign in"

3. 解析 Apple Developer 文檔庫 ID：
   resolve-library-id: libraryName="Developer Apple", query="Sign in with Apple AuthenticationServices"

4. 查詢 Apple 官方 Sign in with Apple 文檔：
   query-docs: libraryId="/websites/developer_apple", query="Sign in with Apple AuthenticationServices ASAuthorizationAppleIDCredential identity token authorization code JWT verification"

5. 查詢 Flutter 官方文檔：
   resolve-library-id: libraryName="Flutter", query="Apple Sign-In authentication iOS"
   query-docs: libraryId="/flutter/website", query="Sign in with Apple iOS authentication setup capability"
```

> **提醒：** sign_in_with_apple 套件版本可能更新導致 API 變動，請務必確認套件最新版本與遷移指南。

---

## 步驟 2：Apple Developer 設定

### 2.1 啟用 App ID 的 Sign in with Apple Capability

1. 登入 [Apple Developer](https://developer.apple.com/account/)
2. 前往「Certificates, Identifiers & Profiles」>「Identifiers」
3. 選擇你的 App ID（例如 `com.example.myapp`），或建立新的 App ID
4. 在「Capabilities」區段，勾選 **Sign In with Apple**
5. 點選「Save」儲存設定

### 2.2 建立 Services ID（Web / Android 端需要）

若需在 Android 端或 Web 端支援 Sign in with Apple，需額外建立 Services ID：

1. 前往「Identifiers」>「+」按鈕
2. 選擇「Services IDs」，點選「Continue」
3. 填寫：
   - **Description**：例如 `MyApp Sign in with Apple`
   - **Identifier**：例如 `com.example.myapp.service`（不可與 App ID 相同）
4. 勾選 **Sign In with Apple**，點選「Configure」
5. 設定：
   - **Primary App ID**：選擇你的主 App ID
   - **Domains and Subdomains**：加入你的後端域名（例如 `auth.example.com`）
   - **Return URLs**：加入回調 URL（例如 `https://auth.example.com/callbacks/sign_in_with_apple`）
6. 儲存設定

### 2.3 建立 Private Key（後端驗證需要）

1. 前往「Keys」>「+」按鈕
2. 填寫名稱，例如 `Sign in with Apple Key`
3. 勾選 **Sign In with Apple**，點選「Configure」
4. 選擇對應的 Primary App ID
5. 點選「Register」，下載 `.p8` 金鑰檔案
6. 記下 **Key ID** 與你的 **Team ID**（在 Membership 頁面可查看）

> **⚠️ 機密管理提醒：**
> - `.p8` 金鑰檔案**只能下載一次**，請妥善保管
> - **絕對不可**將 `.p8` 金鑰檔案提交至版本控制
> - 將金鑰檔案存放在安全位置，僅供後端伺服器使用

---

## 步驟 3：Xcode 專案設定

### 3.1 開啟 Xcode 工作區

```bash
open ios/Runner.xcworkspace
```

### 3.2 新增 Sign in with Apple Capability

1. 在 Xcode 中點選左側的 **Runner** 專案
2. 選擇 **Runner** target
3. 點選「Signing & Capabilities」分頁
4. 點選「+ Capability」按鈕
5. 搜尋並選擇 **Sign in with Apple**
6. 確認 Capability 已新增成功

### 3.3 確認部署目標

確認 `ios/Podfile` 中的最低版本設定：

```ruby
platform :ios, '13.0'  # Sign in with Apple 需要 iOS 13.0 以上
```

同時確認 Xcode 中 Runner target 的 Deployment Target 為 iOS 13.0 以上。

### 3.4 確認 Entitlements 檔案

Xcode 新增 Capability 後會自動建立或更新 `ios/Runner/Runner.entitlements`，確認包含：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.developer.applesignin</key>
    <array>
        <string>Default</string>
    </array>
</dict>
</plist>
```

---

## 步驟 4：Flutter 專案整合 sign_in_with_apple 套件

### 4.1 安裝套件

```bash
flutter pub add sign_in_with_apple
```

若需搭配加密處理（產生 nonce 等），一併安裝：

```bash
flutter pub add crypto
```

### 4.2 確認套件版本

```bash
# 檢查 pubspec.yaml 中的版本
cat pubspec.yaml | grep sign_in_with_apple

# 查看最新版本
flutter pub outdated
```

### 4.3 iOS 端額外依賴

sign_in_with_apple 套件在 iOS 端使用 Apple 原生的 `AuthenticationServices` 框架，透過 CocoaPods 自動整合。執行：

```bash
cd ios && pod install && cd ..
```

> **提醒：** 建議使用最新穩定版本。若從舊版升級，請查閱套件的 CHANGELOG 與遷移指南。

---

## 步驟 5：實作登入流程（iOS 端）

### 5.1 基本登入實作

```dart
import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

class AppleAuthService {
  /// 產生隨機 nonce 字串（用於防止重放攻擊）
  String _generateNonce([int length = 32]) {
    const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';
    final random = Random.secure();
    return List.generate(length, (_) => charset[random.nextInt(charset.length)]).join();
  }

  /// 計算 SHA-256 雜湊
  String _sha256ofString(String input) {
    final bytes = utf8.encode(input);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  /// 執行 Sign in with Apple 登入
  Future<AuthorizationCredentialAppleID?> signIn() async {
    try {
      // 產生 nonce
      final rawNonce = _generateNonce();
      final nonce = _sha256ofString(rawNonce);

      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
        nonce: nonce,
      );

      // credential 包含：
      // - userIdentifier: Apple 使用者唯一 ID
      // - givenName: 名字（僅首次登入時提供）
      // - familyName: 姓氏（僅首次登入時提供）
      // - email: 電子郵件（僅首次登入時提供，可能是隱藏郵件）
      // - authorizationCode: 授權碼（傳送至後端換取 token）
      // - identityToken: JWT 格式的 identity token

      print('登入成功：${credential.userIdentifier}');
      print('Authorization Code: ${credential.authorizationCode}');
      print('Identity Token: ${credential.identityToken}');

      // 重要：rawNonce 需要傳送至後端以驗證 identity token
      return credential;
    } on SignInWithAppleAuthorizationException catch (e) {
      print('Sign in with Apple 授權失敗：${e.code} - ${e.message}');
      return null;
    } catch (error) {
      print('Sign in with Apple 登入失敗：$error');
      return null;
    }
  }

  /// 檢查 Sign in with Apple 是否可用
  Future<bool> isAvailable() async {
    return await SignInWithApple.isAvailable();
  }
}
```

### 5.2 取得 Authorization Code 與 Identity Token

```dart
Future<Map<String, String?>> getCredentials() async {
  final credential = await SignInWithApple.getAppleIDCredential(
    scopes: [
      AppleIDAuthorizationScopes.email,
      AppleIDAuthorizationScopes.fullName,
    ],
  );

  return {
    'userIdentifier': credential.userIdentifier,
    'authorizationCode': credential.authorizationCode,
    'identityToken': credential.identityToken,
    'email': credential.email,
    'givenName': credential.givenName,
    'familyName': credential.familyName,
  };
}
```

> **重要提醒：**
> - Apple 僅在使用者**首次授權**時提供 `email`、`givenName`、`familyName`
> - 後續登入只會回傳 `userIdentifier`、`authorizationCode`、`identityToken`
> - 因此你必須在首次登入時將使用者資訊儲存至後端資料庫

### 5.3 監聽授權狀態變化

Apple 允許使用者隨時在「設定」>「Apple ID」>「密碼與安全性」中撤銷 App 的授權。你應在 App 啟動時檢查授權狀態：

```dart
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

Future<void> checkCredentialState(String userIdentifier) async {
  try {
    final state = await SignInWithApple.getCredentialState(userIdentifier);
    switch (state) {
      case CredentialState.authorized:
        print('使用者已授權');
        break;
      case CredentialState.revoked:
        print('使用者已撤銷授權，需重新登入');
        break;
      case CredentialState.notFound:
        print('找不到此使用者的憑證');
        break;
      case CredentialState.transferred:
        print('使用者憑證已轉移（App 轉讓情境）');
        break;
    }
  } catch (e) {
    print('檢查授權狀態失敗：$e');
  }
}
```

### 5.4 完整 Widget 範例

```dart
import 'package:flutter/material.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

class AppleSignInButton extends StatefulWidget {
  const AppleSignInButton({super.key});

  @override
  State<AppleSignInButton> createState() => _AppleSignInButtonState();
}

class _AppleSignInButtonState extends State<AppleSignInButton> {
  String? _userIdentifier;
  String? _email;
  String? _displayName;
  bool _isLoading = false;

  Future<void> _handleSignIn() async {
    setState(() => _isLoading = true);

    try {
      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );

      setState(() {
        _userIdentifier = credential.userIdentifier;
        _email = credential.email;
        _displayName = [credential.givenName, credential.familyName]
            .where((name) => name != null)
            .join(' ');
      });

      // 將 authorizationCode 傳送至後端驗證
      await _sendToBackend(
        authorizationCode: credential.authorizationCode,
        identityToken: credential.identityToken,
        userIdentifier: credential.userIdentifier,
        email: credential.email,
        displayName: _displayName,
      );
    } on SignInWithAppleAuthorizationException catch (e) {
      if (e.code == AuthorizationErrorCode.canceled) {
        // 使用者取消登入，不需要顯示錯誤
        return;
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('登入失敗：${e.message}')),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('登入失敗：$error')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _sendToBackend({
    required String authorizationCode,
    String? identityToken,
    String? userIdentifier,
    String? email,
    String? displayName,
  }) async {
    // TODO: 將 authorizationCode 與 identityToken 傳送至你的後端 API
    // 後端應使用 Apple 公鑰驗證 identityToken，並用 authorizationCode 換取 refresh token
  }

  @override
  Widget build(BuildContext context) {
    if (_userIdentifier != null) {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('已登入：${_displayName ?? "Apple 使用者"}'),
          if (_email != null) Text(_email!),
          const SizedBox(height: 8),
          ElevatedButton(
            onPressed: () => setState(() {
              _userIdentifier = null;
              _email = null;
              _displayName = null;
            }),
            child: const Text('登出'),
          ),
        ],
      );
    }

    if (_isLoading) {
      return const CircularProgressIndicator();
    }

    // 使用 Apple 官方風格按鈕
    return SignInWithAppleButton(
      onPressed: _handleSignIn,
      style: SignInWithAppleButtonStyle.black,
    );
  }
}
```

---

## 步驟 6：Android 端 Web-based Sign in with Apple 實作

Apple 並未為 Android 提供原生 SDK，因此需透過 **Web-based OAuth 流程**實作 Sign in with Apple。

### 6.1 前置條件

- 已完成步驟 2.2（建立 Services ID）
- 已設定好後端回調 URL
- 後端伺服器能處理 Apple OAuth 回調

### 6.2 Android 端設定

在 `android/app/build.gradle` 中確認 `minSdkVersion` 至少為 19：

```groovy
android {
    defaultConfig {
        minSdkVersion 19
    }
}
```

### 6.3 使用 sign_in_with_apple 套件的 Web 認證流程

sign_in_with_apple 套件在 Android 端支援透過 `WebAuthenticationOptions` 啟用 Web-based 流程：

```dart
import 'dart:io';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

Future<AuthorizationCredentialAppleID?> signInWithApple() async {
  final credential = await SignInWithApple.getAppleIDCredential(
    scopes: [
      AppleIDAuthorizationScopes.email,
      AppleIDAuthorizationScopes.fullName,
    ],
    // Android 與 Web 平台需要 WebAuthenticationOptions
    webAuthenticationOptions: WebAuthenticationOptions(
      clientId: 'com.example.myapp.service', // 你的 Services ID（非 App ID）
      redirectUri: Uri.parse(
        'https://auth.example.com/callbacks/sign_in_with_apple',
      ),
    ),
  );

  return credential;
}
```

### 6.4 後端回調處理

你的後端伺服器需要處理 Apple 的 POST 回調，並將結果轉發回 App。以下是 Node.js 範例：

```javascript
const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));

// Apple 會 POST 至此回調 URL
app.post('/callbacks/sign_in_with_apple', (req, res) => {
  const { code, id_token, state, user } = req.body;

  // 將回應重新導向回 App
  // sign_in_with_apple 套件期望的格式：
  const redirectUrl = `intent://callback?${new URLSearchParams({
    code: code || '',
    id_token: id_token || '',
    state: state || '',
    ...(user ? { user } : {}),
  }).toString()}#Intent;package=com.example.myapp;scheme=signinwithapple;end`;

  res.redirect(303, redirectUrl);
});
```

> **⚠️ 注意：** Android 端的回調處理方式會依據你的架構而異。上述範例使用 Android Intent URI 將結果傳回 App。請依據你的實際後端架構調整。

### 6.5 跨平台整合

建議封裝一個統一的登入方法，自動根據平台選擇適當的流程：

```dart
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

class AppleAuthService {
  Future<AuthorizationCredentialAppleID?> signIn() async {
    // 檢查是否支援 Sign in with Apple
    if (!kIsWeb && Platform.isIOS) {
      // iOS：使用原生 AuthenticationServices 流程
      return _signInNative();
    } else {
      // Android / Web：使用 Web-based OAuth 流程
      return _signInWeb();
    }
  }

  Future<AuthorizationCredentialAppleID?> _signInNative() async {
    try {
      return await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );
    } on SignInWithAppleAuthorizationException catch (e) {
      if (e.code == AuthorizationErrorCode.canceled) return null;
      rethrow;
    }
  }

  Future<AuthorizationCredentialAppleID?> _signInWeb() async {
    try {
      return await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
        webAuthenticationOptions: WebAuthenticationOptions(
          clientId: 'com.example.myapp.service',
          redirectUri: Uri.parse(
            'https://auth.example.com/callbacks/sign_in_with_apple',
          ),
        ),
      );
    } on SignInWithAppleAuthorizationException catch (e) {
      if (e.code == AuthorizationErrorCode.canceled) return null;
      rethrow;
    }
  }
}
```

---

## 步驟 7：後端驗證 Identity Token

當 App 取得 `identityToken` 與 `authorizationCode` 後，應將其傳送至後端伺服器進行驗證。

### 7.1 Identity Token 結構

Apple 的 identity token 是一個 JWT（JSON Web Token），包含以下重要欄位：

| 欄位 | 說明 |
|------|------|
| `iss` | 簽發者，固定為 `https://appleid.apple.com` |
| `sub` | 使用者唯一識別碼（同 `userIdentifier`） |
| `aud` | 你的 App ID 或 Services ID |
| `exp` | Token 過期時間 |
| `email` | 使用者電子郵件（可能是隱藏郵件） |
| `email_verified` | 郵件是否已驗證 |
| `nonce` | 用於防止重放攻擊的 nonce 值 |

### 7.2 驗證流程

1. 從 Apple 公鑰端點取得 JWK（JSON Web Key）
2. 使用公鑰驗證 JWT 簽章
3. 驗證 `iss` 為 `https://appleid.apple.com`
4. 驗證 `aud` 為你的 App ID
5. 驗證 `exp` 未過期
6. 若有傳送 nonce，驗證 `nonce` 欄位一致

Apple 公鑰端點：`https://appleid.apple.com/auth/keys`

### 7.3 後端驗證範例（Node.js）

```javascript
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// 建立 JWKS 客戶端
const client = jwksClient({
  jwksUri: 'https://appleid.apple.com/auth/keys',
  cache: true,
  cacheMaxAge: 86400000, // 24 小時快取
});

function getAppleSigningKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

async function verifyAppleIdentityToken(identityToken, expectedAudience) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      identityToken,
      getAppleSigningKey,
      {
        algorithms: ['RS256'],
        issuer: 'https://appleid.apple.com',
        audience: expectedAudience, // 你的 App ID 或 Services ID
      },
      (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
        // decoded 包含：sub、email、email_verified、nonce 等
      }
    );
  });
}
```

### 7.4 後端驗證範例（Python）

```python
import jwt
import requests

APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys'

def get_apple_public_keys():
    """從 Apple 取得公鑰"""
    response = requests.get(APPLE_JWKS_URL)
    return response.json()['keys']

def verify_apple_identity_token(identity_token, expected_audience):
    """驗證 Apple identity token"""
    # 取得 Apple 公鑰
    apple_keys = get_apple_public_keys()

    # 解碼 JWT header 以取得 kid
    header = jwt.get_unverified_header(identity_token)
    kid = header['kid']

    # 找到對應的公鑰
    public_key = None
    for key in apple_keys:
        if key['kid'] == kid:
            public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
            break

    if not public_key:
        raise Exception('找不到對應的 Apple 公鑰')

    # 驗證 token
    decoded = jwt.decode(
        identity_token,
        public_key,
        algorithms=['RS256'],
        audience=expected_audience,
        issuer='https://appleid.apple.com',
    )

    return decoded  # 包含 sub、email、email_verified 等
```

### 7.5 使用 Authorization Code 換取 Token

除了直接驗證 identity token，你也可以透過 Apple 的 `/auth/token` API 使用 authorization code 換取 refresh token：

```bash
curl -v POST "https://appleid.apple.com/auth/token" \
-H 'content-type: application/x-www-form-urlencoded' \
-d 'client_id=YOUR_APP_ID' \
-d 'client_secret=YOUR_CLIENT_SECRET_JWT' \
-d 'code=AUTHORIZATION_CODE_FROM_APP' \
-d 'grant_type=authorization_code' \
-d 'redirect_uri=YOUR_REDIRECT_URI'
```

其中 `client_secret` 是一個由你的 `.p8` 私鑰簽發的 JWT。產生方式如下（Node.js）：

```javascript
const jwt = require('jsonwebtoken');
const fs = require('fs');

function generateClientSecret() {
  const privateKey = fs.readFileSync('path/to/AuthKey_XXXXXXXXXX.p8');
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iss: 'YOUR_TEAM_ID',     // Apple Developer Team ID
    iat: now,
    exp: now + 15777000,     // 最長 6 個月
    aud: 'https://appleid.apple.com',
    sub: 'YOUR_APP_ID',     // App ID 或 Services ID
  };

  return jwt.sign(payload, privateKey, {
    algorithm: 'ES256',
    keyid: 'YOUR_KEY_ID',   // 在 Apple Developer 建立金鑰時取得的 Key ID
  });
}
```

> **⚠️ 機密管理提醒：**
> - **`.p8` 私鑰檔案絕對不可提交至版本控制**
> - `client_secret` JWT 的產生邏輯僅在後端伺服器執行
> - Team ID、Key ID 等識別碼可存放在環境變數中
> - 建議使用雲端密鑰管理服務（如 GCP Secret Manager、AWS Secrets Manager）儲存 `.p8` 金鑰

---

## 步驟 8：與 Firebase Auth 整合（選用）

若你的專案使用 Firebase Authentication，可將 Sign in with Apple 的憑證與 Firebase 整合：

```dart
import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

Future<UserCredential?> signInWithAppleFirebase() async {
  // 產生 nonce
  final rawNonce = _generateNonce();
  final nonce = sha256.convert(utf8.encode(rawNonce)).toString();

  // 取得 Apple 憑證
  final appleCredential = await SignInWithApple.getAppleIDCredential(
    scopes: [
      AppleIDAuthorizationScopes.email,
      AppleIDAuthorizationScopes.fullName,
    ],
    nonce: nonce,
  );

  // 建立 Firebase OAuthCredential
  final oauthCredential = OAuthProvider('apple.com').credential(
    idToken: appleCredential.identityToken,
    rawNonce: rawNonce,
    accessToken: appleCredential.authorizationCode,
  );

  // 使用憑證登入 Firebase
  return await FirebaseAuth.instance.signInWithCredential(oauthCredential);
}

String _generateNonce([int length = 32]) {
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';
  final random = Random.secure();
  return List.generate(length, (_) => charset[random.nextInt(charset.length)]).join();
}
```

> 使用 Firebase Auth 整合時，需額外安裝 `firebase_auth`、`firebase_core` 與 `crypto` 套件。

---

## 常見問題排查

### Q：iOS 端出現 `AuthorizationErrorCode.failed` 錯誤
**A：** 請確認：
1. 已在 Apple Developer 的 App ID 中啟用 Sign in with Apple capability
2. 已在 Xcode 的 Signing & Capabilities 中新增 Sign in with Apple
3. 確認 `Runner.entitlements` 檔案包含 `com.apple.developer.applesignin` 項目
4. 確認使用的是付費的 Apple Developer Program 帳號（非免費帳號）

### Q：首次登入後，後續登入取不到 email 和姓名
**A：** 這是 Apple 的設計。`email`、`givenName`、`familyName` **僅在使用者首次授權時提供**。解決方式：
1. 在首次登入時立即將這些資訊儲存至後端
2. 若測試時需重新觸發，前往「設定」>「Apple ID」>「密碼與安全性」>「使用 Apple ID 的 App」中移除你的 App，然後重新登入

### Q：Android 端無法開啟 Apple 登入頁面
**A：**
1. 確認已在 Apple Developer 建立 Services ID 並正確設定 Domain 與 Return URL
2. 確認 `WebAuthenticationOptions` 中的 `clientId` 使用的是 Services ID（非 App ID）
3. 確認 `redirectUri` 與 Apple Developer 中設定的 Return URL 完全一致
4. 確認後端伺服器的回調處理已正確實作

### Q：後端驗證 identity token 失敗
**A：**
1. 確認使用的 `audience` 值正確（iOS 使用 App ID，Android/Web 使用 Services ID）
2. 確認 token 未過期（`exp` 欄位）
3. 確認從 `https://appleid.apple.com/auth/keys` 取得的公鑰是最新的
4. 若使用 nonce，確認前端傳送的是**原始 nonce 的 SHA-256 雜湊**，後端驗證時也使用相同的雜湊值

### Q：使用者選擇「隱藏我的電子郵件」，如何發送通知？
**A：** Apple 提供的隱藏郵件格式為 `xxxxx@privaterelay.appleid.com`。你可以正常發送郵件至此地址，Apple 會轉發至使用者的真實信箱。但需在 Apple Developer 中設定你的發送郵件域名：
1. 前往「Certificates, Identifiers & Profiles」>「More」>「Configure」
2. 在「Email Communication」中註冊你的發送域名與郵件地址

### Q：模擬器上 Sign in with Apple 無法正常運作
**A：**
1. iOS 模擬器支援 Sign in with Apple，但需先在模擬器的「設定」中登入 Apple ID
2. 確認模擬器系統版本為 iOS 13.0 以上
3. 部分情境在模擬器上可能行為不同，建議在實體裝置上進行最終測試

---

## 安全性提醒

> **⚠️ 重要：機密資訊管理**
>
> 以下原則務必遵守：
>
> 1. **私鑰檔案管理**
>    - `.p8` 私鑰檔案**絕對不可**提交至版本控制
>    - 私鑰僅供後端伺服器產生 `client_secret` JWT 時使用
>    - 建議使用雲端密鑰管理服務安全儲存
>
> 2. **Client Secret 安全**
>    - `client_secret`（JWT）的產生邏輯僅在後端執行
>    - **絕對不可**在 App 程式碼中包含 `.p8` 金鑰或 `client_secret`
>
> 3. **Token 安全**
>    - Identity Token 與 Authorization Code 不可明文儲存在裝置上
>    - 使用平台提供的安全儲存方案（iOS: Keychain / Android: EncryptedSharedPreferences）
>    - Token 傳輸必須使用 HTTPS
>
> 4. **使用者隱私**
>    - 尊重使用者選擇「隱藏我的電子郵件」的權利
>    - 不可嘗試繞過 Apple 的隱私保護機制
>    - 遵守 Apple 的 [App Store 審查指南](https://developer.apple.com/app-store/review/guidelines/) 中關於 Sign in with Apple 的規定
>
> 5. **App Store 審查要求**
>    - 若你的 App 提供第三方社交登入（如 Google、Facebook），**必須同時提供 Sign in with Apple** 選項
>    - 這是 Apple App Store 的強制要求（自 2020 年起）
>
> 6. **環境變數範例**
>    ```bash
>    # .env（後端伺服器用，絕對不可提交至 Git）
>    APPLE_TEAM_ID=YOUR_TEAM_ID
>    APPLE_KEY_ID=YOUR_KEY_ID
>    APPLE_CLIENT_ID=com.example.myapp
>    APPLE_SERVICE_ID=com.example.myapp.service
>    APPLE_PRIVATE_KEY_PATH=/secure/path/to/AuthKey.p8
>    ```
>    確認 `.gitignore` 包含：
>    ```
>    .env
>    .env.*
>    *.p8
>    ```
