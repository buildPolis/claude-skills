---
name: mobile-dev-ios-oauth
description: 以 Flutter 為主，引導使用者在行動裝置 App 中整合 Sign in with Apple（iOS OAuth），包含 App ID 設定、Xcode 配置、Flutter sign_in_with_apple 套件整合、後端 Token 驗證與 Android 端 Web-based 實作方案
---

# Sign in with Apple（iOS OAuth）整合引導

本 skill 引導你在 Flutter 行動應用程式中整合 Sign in with Apple 登入功能，涵蓋從 Apple Developer 設定到完整登入流程實作的每個步驟。

> **適用框架：** 以 Flutter 為主要引導框架。若使用 React Native、Kotlin/Swift 或其他框架，請依據對應的 Sign in with Apple SDK 調整實作方式，整體 Apple Developer 設定與 OAuth 流程概念相同。

---

## 即時查閱最新文檔（context7）

在開始之前，請透過 context7 查閱最新官方文檔，確保引導內容為最新版本：

1. **sign_in_with_apple 套件文檔：**
   使用 `mcp__plugin_context7_context7__resolve-library-id` 搜尋 `sign_in_with_apple`，取得 library ID 後，使用 `mcp__plugin_context7_context7__query-docs` 查詢：
   - `"Flutter sign_in_with_apple setup configuration iOS Android"`
   - `"sign_in_with_apple authorization credential identity token"`

2. **Flutter 官方文檔：**
   使用 `mcp__plugin_context7_context7__resolve-library-id` 搜尋 `Flutter`，查詢：
   - `"Sign in with Apple authentication integration"`

3. **Apple Developer 文檔：**
   使用 `mcp__plugin_context7_context7__resolve-library-id` 搜尋 `Developer Apple`，查詢：
   - `"Sign in with Apple AuthenticationServices capability setup"`
   - `"Sign in with Apple REST API verify identity token auth token"`

---

## 前置條件

請先確認以下條件已滿足：

- [ ] 已安裝 Flutter SDK 並完成 `flutter doctor` 檢查
- [ ] 已有可正常執行的 Flutter 應用程式
- [ ] 已擁有 Apple Developer Program 帳號（**付費帳號，USD 99/年**，Sign in with Apple 功能需要付費帳號才能使用）
- [ ] iOS 端：已安裝 Xcode（macOS 環境），建議 Xcode 14 以上
- [ ] iOS 端：實體裝置或模擬器為 iOS 13 以上（Sign in with Apple 最低支援版本）
- [ ] Android 端（選用）：若需支援 Android，需準備 Web-based Sign in with Apple 的後端服務

---

## 步驟 1：Apple Developer 設定

### 1.1 啟用 App ID 的 Sign in with Apple Capability

1. 登入 [Apple Developer Portal](https://developer.apple.com/account)
2. 前往「Certificates, Identifiers & Profiles」>「Identifiers」
3. 選擇你的 App ID（或建立新的 App ID）
4. 在「Capabilities」區段中，勾選 **Sign in with Apple**
5. 點擊「Save」儲存設定

### 1.2 建立 Services ID（Android / Web 端使用）

若需支援 Android 或 Web 平台的 Sign in with Apple，需要建立 Services ID：

1. 在「Identifiers」頁面，點擊「+」新增
2. 選擇「Services IDs」，點擊「Continue」
3. 填寫 Description（如 `My App Web Sign-In`）與 Identifier（如 `com.example.myapp.web`）
4. 註冊完成後，點擊該 Services ID 進行編輯
5. 勾選 **Sign in with Apple**，點擊「Configure」
6. 設定：
   - **Primary App ID：** 選擇你的主要 App ID
   - **Domains：** 加入你的後端網域（如 `auth.example.com`）
   - **Return URLs：** 加入回呼 URL（如 `https://auth.example.com/callbacks/sign_in_with_apple`）
7. 點擊「Save」

### 1.3 建立 Key（後端驗證用）

1. 前往「Keys」頁面，點擊「+」新增
2. 填寫 Key Name，勾選 **Sign in with Apple**
3. 點擊「Configure」，選擇對應的 Primary App ID
4. 點擊「Register」
5. **下載 Key 檔案（.p8）並安全保存**，此檔案僅能下載一次
6. 記下 **Key ID** 和你的 **Team ID**（在 Membership 頁面可查看）

> **安全提醒：** .p8 Key 檔案為高度機密資訊，切勿提交至版本控制系統，切勿嵌入行動應用程式中。應透過安全的金鑰管理方案儲存於後端伺服器。

---

## 步驟 2：Xcode 專案設定

### 2.1 加入 Sign in with Apple Capability

1. 在 Xcode 中開啟 Flutter 專案的 `ios/Runner.xcworkspace`
2. 選擇 Runner target
3. 前往「Signing & Capabilities」分頁
4. 點擊「+ Capability」，搜尋並加入 **Sign in with Apple**
5. 確認 Signing Team 設定正確（與 Apple Developer 帳號一致）

### 2.2 確認部署目標

確認 `ios/Podfile` 中的最低部署目標為 iOS 13 以上：

```ruby
platform :ios, '13.0'
```

同時在 Xcode 的 Runner target > General > Minimum Deployments 中確認 iOS 版本 >= 13.0。

### 2.3 確認 Entitlements

加入 Capability 後，Xcode 會自動建立 `Runner.entitlements` 檔案，其中應包含：

```xml
<key>com.apple.developer.applesignin</key>
<array>
    <string>Default</string>
</array>
```

---

## 步驟 3：Flutter 整合 sign_in_with_apple 套件

### 3.1 安裝套件

```bash
flutter pub add sign_in_with_apple
```

> **提醒：** 請確認使用最新版本的 `sign_in_with_apple` 套件。可透過 [pub.dev](https://pub.dev/packages/sign_in_with_apple) 查閱最新版本號與更新日誌。

若需在後端產生 Client Secret JWT，建議同時加入以下後端相關套件（依你的後端語言選擇）。

### 3.2 iOS 端設定

`sign_in_with_apple` 套件在 iOS 端使用原生的 `AuthenticationServices` 框架，不需額外配置（Capability 已在步驟 2 設定）。

確認 `ios/Podfile` 中 platform 版本足夠：

```ruby
platform :ios, '13.0'
```

執行 pod install：

```bash
cd ios && pod install && cd ..
```

### 3.3 Android 端設定

Android 不支援原生的 Sign in with Apple，需透過 Web-based OAuth 流程實現。詳見步驟 7。

---

## 步驟 4：實作 iOS 登入流程

### 4.1 基本登入實作

```dart
import 'dart:convert';
import 'dart:math';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:crypto/crypto.dart'; // flutter pub add crypto

class AppleAuthService {
  /// 產生隨機 nonce 字串（用於防止重放攻擊）
  String _generateNonce([int length = 32]) {
    const charset =
        '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';
    final random = Random.secure();
    return List.generate(length, (_) => charset[random.nextInt(charset.length)])
        .join();
  }

  /// 將 nonce 進行 SHA-256 雜湊
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
      final hashedNonce = _sha256ofString(rawNonce);

      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
        nonce: hashedNonce,
      );

      // credential 包含以下重要資訊：
      // - credential.identityToken: JWT 格式的 identity token
      // - credential.authorizationCode: 授權碼（用於後端換取 token）
      // - credential.userIdentifier: Apple 使用者唯一識別碼
      // - credential.email: 使用者 email（僅首次授權時提供）
      // - credential.givenName: 名字（僅首次授權時提供）
      // - credential.familyName: 姓氏（僅首次授權時提供）

      // 將 credential 傳送至後端驗證
      // await _sendToBackend(credential, rawNonce);

      return credential;
    } on SignInWithAppleAuthorizationException catch (e) {
      switch (e.code) {
        case AuthorizationErrorCode.canceled:
          // 使用者取消登入
          print('使用者取消了 Sign in with Apple');
          break;
        case AuthorizationErrorCode.failed:
          print('Sign in with Apple 失敗: ${e.message}');
          break;
        case AuthorizationErrorCode.invalidResponse:
          print('Sign in with Apple 回應無效: ${e.message}');
          break;
        case AuthorizationErrorCode.notHandled:
          print('Sign in with Apple 未處理: ${e.message}');
          break;
        case AuthorizationErrorCode.notInteractive:
          print('Sign in with Apple 非互動式錯誤: ${e.message}');
          break;
        default:
          print('Sign in with Apple 未知錯誤: ${e.message}');
      }
      return null;
    }
  }

  /// 檢查 Sign in with Apple 是否可用
  Future<bool> isAvailable() async {
    return await SignInWithApple.isAvailable();
  }
}
```

### 4.2 取得 Identity Token 與 Authorization Code

```dart
/// 從 credential 中取得驗證所需資訊
void processCredential(AuthorizationCredentialAppleID credential) {
  // Identity Token（JWT 格式）
  final String? identityToken = credential.identityToken;

  // Authorization Code（用於後端向 Apple 換取 token）
  final String? authorizationCode = credential.authorizationCode;

  // 使用者唯一識別碼（穩定不變，可作為使用者 ID）
  final String userIdentifier = credential.userIdentifier;

  // 使用者資訊（僅首次授權時提供，後續登入不會再提供）
  final String? email = credential.email;
  final String? givenName = credential.givenName;
  final String? familyName = credential.familyName;

  // ⚠️ 重要：email 和姓名僅在使用者「首次」授權時提供
  // 後續登入不會再提供，因此首次取得時必須儲存至你的資料庫
  // 若使用者在「設定」>「Apple ID」>「密碼與安全性」>
  // 「使用 Apple ID 的 App」中撤銷授權後重新授權，才會再次提供

  if (identityToken != null && authorizationCode != null) {
    // 將 identityToken 和 authorizationCode 傳送至後端
    // 後端使用 authorizationCode 向 Apple 換取 refresh token
    // 後端使用 identityToken 驗證使用者身份
  }
}
```

### 4.3 在 UI 中使用

```dart
import 'package:flutter/material.dart';
import 'dart:io' show Platform;

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final AppleAuthService _appleAuthService = AppleAuthService();
  bool _isAppleSignInAvailable = false;

  @override
  void initState() {
    super.initState();
    _checkAvailability();
  }

  Future<void> _checkAvailability() async {
    final isAvailable = await _appleAuthService.isAvailable();
    setState(() {
      _isAppleSignInAvailable = isAvailable;
    });
  }

  Future<void> _handleAppleSignIn() async {
    final credential = await _appleAuthService.signIn();
    if (credential != null) {
      // 登入成功，處理 credential
      final identityToken = credential.identityToken;
      final authorizationCode = credential.authorizationCode;

      if (identityToken != null && authorizationCode != null) {
        // 傳送至後端驗證
        // await yourBackendService.verifyAppleToken(
        //   identityToken: identityToken,
        //   authorizationCode: authorizationCode,
        //   userIdentifier: credential.userIdentifier,
        //   email: credential.email,
        //   fullName: '${credential.givenName ?? ''} ${credential.familyName ?? ''}',
        // );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // 使用官方提供的 Apple Sign-In 按鈕
          if (_isAppleSignInAvailable)
            SignInWithAppleButton(
              onPressed: _handleAppleSignIn,
              style: SignInWithAppleButtonStyle.black, // 或 .white / .whiteOutlined
            ),

          // Apple 要求：若提供 Sign in with Apple，
          // 則 App 中若有其他第三方登入選項也須提供 Sign in with Apple
          // 詳見 App Store Review Guidelines 4.8
        ],
      ),
    );
  }
}
```

> **注意：** Apple 的 [App Store Review Guidelines 4.8](https://developer.apple.com/app-store/review/guidelines/#sign-in-with-apple) 規定，若你的 App 提供第三方登入（如 Google Sign-In、Facebook Login 等），則**必須**同時提供 Sign in with Apple 選項。

---

## 步驟 5：AuthenticationServices 流程說明

Sign in with Apple 的 AuthenticationServices 流程如下：

1. **客戶端發起請求：** 呼叫 `SignInWithApple.getAppleIDCredential()`，指定需要的 scopes（email、fullName）和 nonce
2. **系統顯示授權畫面：** iOS 系統彈出原生 Sign in with Apple 對話框
3. **使用者授權：** 使用者透過 Face ID / Touch ID / 密碼進行身份驗證
4. **使用者選擇分享資訊：** 使用者可選擇分享真實 email 或使用 Apple 的隱藏 email 轉發服務（Hide My Email）
5. **回傳 Credential：** 系統回傳 `AuthorizationCredentialAppleID`，包含：
   - `identityToken`：JWT 格式，包含使用者身份資訊，由 Apple 簽署
   - `authorizationCode`：單次使用的授權碼，有效期 5 分鐘
   - `userIdentifier`：使用者唯一識別碼（穩定，不會因重新安裝而改變）
   - `email`、`givenName`、`familyName`：僅首次授權時提供
6. **後端驗證：** 將 identityToken 和 authorizationCode 傳送至後端進行驗證（詳見步驟 6）

---

## 步驟 6：後端驗證 Identity Token

### 6.1 驗證流程概述

1. 客戶端完成 Sign in with Apple，取得 `identityToken` 和 `authorizationCode`
2. 將兩者傳送至後端 API
3. 後端驗證 `identityToken` 的 JWT 簽章（使用 Apple 的公鑰）
4. 後端使用 `authorizationCode` 向 Apple Token Endpoint 換取 refresh token
5. 驗證 token 中的 `iss`（應為 `https://appleid.apple.com`）
6. 驗證 token 中的 `aud`（應為你的 App Bundle ID 或 Services ID）
7. 從 token 中取得使用者資訊（`sub`、`email` 等）

### 6.2 取得 Apple 公鑰

Apple 的公鑰可從以下端點取得：

```
GET https://appleid.apple.com/auth/keys
```

回傳 JWK Set（JSON Web Key Set），包含多組公鑰，需根據 identity token header 中的 `kid` 選擇對應的公鑰。

### 6.3 產生 Client Secret（JWT）

Apple 的 Client Secret 不是固定字串，而是需要用你的 .p8 Key 檔案動態產生的 JWT：

#### Node.js 範例

```javascript
const jwt = require('jsonwebtoken');
const fs = require('fs');

function generateClientSecret() {
  const privateKey = fs.readFileSync(process.env.APPLE_KEY_FILE_PATH);

  const clientSecret = jwt.sign({}, privateKey, {
    algorithm: 'ES256',
    expiresIn: '180d', // 最長 6 個月
    audience: 'https://appleid.apple.com',
    issuer: process.env.APPLE_TEAM_ID,     // 你的 Team ID
    subject: process.env.APPLE_CLIENT_ID,  // 你的 App Bundle ID 或 Services ID
    keyid: process.env.APPLE_KEY_ID,       // 你的 Key ID
  });

  return clientSecret;
}
```

#### Python 範例

```python
import jwt
import time
import os

def generate_client_secret():
    with open(os.environ.get('APPLE_KEY_FILE_PATH'), 'r') as f:
        private_key = f.read()

    now = int(time.time())
    payload = {
        'iss': os.environ.get('APPLE_TEAM_ID'),
        'iat': now,
        'exp': now + 86400 * 180,  # 最長 6 個月
        'aud': 'https://appleid.apple.com',
        'sub': os.environ.get('APPLE_CLIENT_ID'),
    }

    headers = {
        'kid': os.environ.get('APPLE_KEY_ID'),
        'alg': 'ES256',
    }

    client_secret = jwt.encode(
        payload,
        private_key,
        algorithm='ES256',
        headers=headers,
    )

    return client_secret
```

### 6.4 驗證 Authorization Code 並換取 Token

向 Apple Token Endpoint 發送請求：

```
POST https://appleid.apple.com/auth/token
Content-Type: application/x-www-form-urlencoded
```

#### Node.js 範例

```javascript
const axios = require('axios');
const querystring = require('querystring');

async function validateAuthorizationCode(authorizationCode) {
  const clientSecret = generateClientSecret();

  const response = await axios.post(
    'https://appleid.apple.com/auth/token',
    querystring.stringify({
      client_id: process.env.APPLE_CLIENT_ID,
      client_secret: clientSecret,
      code: authorizationCode,
      grant_type: 'authorization_code',
    }),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  );

  // response.data 包含：
  // - access_token: 存取 token
  // - refresh_token: 重新整理 token（需安全儲存）
  // - id_token: JWT 格式的 identity token
  // - expires_in: access_token 有效秒數
  return response.data;
}
```

#### Python 範例

```python
import requests
import os

def validate_authorization_code(authorization_code):
    client_secret = generate_client_secret()

    response = requests.post(
        'https://appleid.apple.com/auth/token',
        data={
            'client_id': os.environ.get('APPLE_CLIENT_ID'),
            'client_secret': client_secret,
            'code': authorization_code,
            'grant_type': 'authorization_code',
        },
        headers={'Content-Type': 'application/x-www-form-urlencoded'},
    )

    response.raise_for_status()
    return response.json()
```

### 6.5 驗證 Identity Token

#### Node.js 範例

```javascript
const jwksClient = require('jwks-rsa');
const jwt = require('jsonwebtoken');

const client = jwksClient({
  jwksUri: 'https://appleid.apple.com/auth/keys',
  cache: true,
  cacheMaxAge: 86400000, // 24 小時
});

function getAppleSigningKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

async function verifyIdentityToken(identityToken) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      identityToken,
      getAppleSigningKey,
      {
        algorithms: ['RS256'],
        issuer: 'https://appleid.apple.com',
        audience: process.env.APPLE_CLIENT_ID,
      },
      (err, decoded) => {
        if (err) return reject(new Error('Invalid Apple Identity Token'));
        resolve({
          userId: decoded.sub,          // Apple 使用者唯一識別碼
          email: decoded.email,
          emailVerified: decoded.email_verified === 'true',
          isPrivateEmail: decoded.is_private_email === 'true',
        });
      }
    );
  });
}
```

#### Python 範例

```python
import jwt
import requests
from jwt.algorithms import RSAAlgorithm
import json
import os

def get_apple_public_keys():
    response = requests.get('https://appleid.apple.com/auth/keys')
    return response.json()['keys']

def verify_identity_token(identity_token):
    # 取得 token header 中的 kid
    unverified_header = jwt.get_unverified_header(identity_token)
    kid = unverified_header['kid']

    # 從 Apple 公鑰中找到對應的 key
    apple_keys = get_apple_public_keys()
    matching_key = None
    for key in apple_keys:
        if key['kid'] == kid:
            matching_key = key
            break

    if not matching_key:
        raise Exception('No matching Apple public key found')

    # 將 JWK 轉換為 PEM 格式
    public_key = RSAAlgorithm.from_jwk(json.dumps(matching_key))

    # 驗證 token
    decoded = jwt.decode(
        identity_token,
        public_key,
        algorithms=['RS256'],
        audience=os.environ.get('APPLE_CLIENT_ID'),
        issuer='https://appleid.apple.com',
    )

    return {
        'user_id': decoded['sub'],
        'email': decoded.get('email'),
        'email_verified': decoded.get('email_verified') == 'true',
        'is_private_email': decoded.get('is_private_email') == 'true',
    }
```

> **安全提醒：** 後端驗證時，`audience` 應設定為你的 App Bundle ID（iOS 原生登入）或 Services ID（Web-based 登入）。所有金鑰、Team ID、Key ID 等設定應透過環境變數管理，不可寫死在程式碼中。

---

## 步驟 7：Android 端 Web-based Sign in with Apple 實作方案

Android 不支援原生的 Sign in with Apple，需透過 Web OAuth 流程實現。`sign_in_with_apple` 套件支援在 Android 上透過 WebView 完成 Apple OAuth。

### 7.1 設定 Web Authentication Service

確保已完成步驟 1.2（建立 Services ID）並正確設定 Domains 和 Return URLs。

### 7.2 建立後端回呼端點

Apple 的 Web OAuth 流程會將使用者重新導向至你設定的 Return URL，並以 `POST` 方式傳送授權結果。你需要在後端建立一個端點來處理此回呼：

#### Node.js（Express）範例

```javascript
const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: true }));

// Apple Sign-In 回呼端點
app.post('/callbacks/sign_in_with_apple', (req, res) => {
  const { code, id_token, state, user } = req.body;

  // 組裝回傳資料，透過 URL fragment 或 redirect 傳回客戶端
  const redirectUrl = new URL('intent://callback');
  redirectUrl.searchParams.append('code', code || '');
  redirectUrl.searchParams.append('id_token', id_token || '');
  if (state) redirectUrl.searchParams.append('state', state);

  // 回傳一個 HTML 頁面，使用 JavaScript 關閉 WebView
  res.send(`
    <html>
    <head><title>Sign in with Apple</title></head>
    <body>
      <p>登入成功，正在返回應用程式...</p>
      <script>
        window.location.href = "intent://callback?code=${encodeURIComponent(code || '')}&id_token=${encodeURIComponent(id_token || '')}#Intent;package=YOUR_ANDROID_PACKAGE_NAME;scheme=signinwithapple;end";
      </script>
    </body>
    </html>
  `);
});
```

### 7.3 Flutter 端 Android 登入實作

```dart
import 'dart:io' show Platform;
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

Future<AuthorizationCredentialAppleID?> signInWithApple() async {
  if (Platform.isIOS) {
    // iOS：使用原生 AuthenticationServices
    return await SignInWithApple.getAppleIDCredential(
      scopes: [
        AppleIDAuthorizationScopes.email,
        AppleIDAuthorizationScopes.fullName,
      ],
    );
  } else if (Platform.isAndroid) {
    // Android：透過 Web-based OAuth 流程
    return await SignInWithApple.getAppleIDCredential(
      scopes: [
        AppleIDAuthorizationScopes.email,
        AppleIDAuthorizationScopes.fullName,
      ],
      webAuthenticationOptions: WebAuthenticationOptions(
        clientId: 'com.example.myapp.web', // 你的 Services ID
        redirectUri: Uri.parse(
          'https://auth.example.com/callbacks/sign_in_with_apple',
        ),
      ),
    );
  }
  return null;
}
```

### 7.4 Android 端注意事項

- Android 上的 Sign in with Apple 是透過 WebView 開啟 Apple 的授權頁面
- 使用的 Client ID 是 **Services ID**（非 App Bundle ID）
- Return URL 必須與 Apple Developer Portal 中 Services ID 設定的 Return URL 完全一致
- 後端回呼端點需要能處理 Apple 的 POST 請求並正確引導使用者返回 App
- 建議使用 HTTPS 的後端服務來處理回呼

---

## 常見問題排查

### Sign in with Apple 按鈕未出現

- **isAvailable() 回傳 false：** 確認裝置 iOS 版本 >= 13.0
- **模擬器問題：** 部分模擬器可能不支援，建議使用實體裝置測試
- **未登入 Apple ID：** 確認裝置已登入 Apple ID

### AuthorizationErrorCode.failed

- **Capability 未設定：** 確認 Xcode 中已加入 Sign in with Apple capability
- **App ID 未啟用：** 確認 Apple Developer Portal 中 App ID 已啟用 Sign in with Apple
- **Provisioning Profile 過期：** 重新產生 Provisioning Profile
- **Entitlements 缺失：** 確認 `Runner.entitlements` 中包含 `com.apple.developer.applesignin`

### 首次登入後再次登入取不到 email 和姓名

- **這是預期行為：** Apple 僅在使用者首次授權時提供 email 和姓名
- **解決方案：** 首次取得後立即儲存至你的資料庫
- **重新取得：** 使用者可在「設定」>「Apple ID」>「密碼與安全性」>「使用 Apple ID 的 App」中撤銷授權，再重新授權即可

### Identity Token 驗證失敗

- **公鑰不匹配：** 確認使用 token header 中的 `kid` 選擇對應的 Apple 公鑰
- **Audience 不匹配：** iOS 原生登入使用 App Bundle ID，Web/Android 登入使用 Services ID
- **Token 已過期：** Identity token 有效期有限，應在取得後立即驗證
- **Issuer 不匹配：** 確認 issuer 為 `https://appleid.apple.com`

### Android 端 Web OAuth 失敗

- **Services ID 未設定：** 確認已建立 Services ID 並啟用 Sign in with Apple
- **Return URL 不匹配：** 確認程式碼中的 redirectUri 與 Apple Developer Portal 設定完全一致
- **Domain 未驗證：** 確認後端網域已加入 Services ID 的 Domains 設定
- **後端回呼未正確處理：** 確認後端能正確接收 Apple 的 POST 回呼並引導返回 App

### Authorization Code 換取 Token 失敗

- **Client Secret 無效：** 確認 .p8 Key 檔案正確、Key ID 和 Team ID 設定正確
- **Authorization Code 過期：** Authorization code 僅有 5 分鐘有效期，且為單次使用
- **Client ID 不匹配：** 確認使用正確的 Client ID（App Bundle ID 或 Services ID）

---

## 安全與機密管理提醒

- **.p8 Key 檔案：** 為最高機密，僅能下載一次，應透過安全的金鑰管理方案（如 AWS Secrets Manager、Google Secret Manager、HashiCorp Vault）儲存於後端伺服器，絕對不可提交至版本控制系統
- **Team ID / Key ID：** 雖非高度機密，但建議透過環境變數管理，不可寫死在程式碼中
- **Client Secret（JWT）：** 動態產生，有效期最長 6 個月，應在後端產生，不可傳送至客戶端
- **Identity Token：** 傳輸時應透過 HTTPS，在後端驗證 JWT 簽章後才可信任其內容
- **Authorization Code：** 單次使用、5 分鐘有效期，應在取得後立即傳送至後端驗證
- **Refresh Token：** 由後端向 Apple 換取並安全儲存，不可傳送至客戶端，用於長期維持使用者登入狀態
- **使用者隱私：** Apple 提供 Hide My Email 功能，使用者可選擇隱藏真實 email，你的 App 應支援此功能並透過 Apple 的 Private Email Relay Service 發送郵件
- **環境變數管理：** 使用 `.env` 檔案搭配 `flutter_dotenv` 等套件管理不同環境的設定值，並將 `.env` 加入 `.gitignore`
- **Token 撤銷：** Apple 要求 App 提供帳號刪除功能時，需透過 Apple REST API 撤銷 token（`https://appleid.apple.com/auth/revoke`），以符合 App Store Review Guidelines
