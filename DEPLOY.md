# Deploying to MTB's IIS

Production runs on **MTB's own IIS server**, not on Lovable hosting.

## 1. Build

```bash
npm ci
cp .env.example .env.production
# edit .env.production:
#   VITE_USE_MOCK=false
#   VITE_API_BASE=https://<mtb-api-host>/ambala/api/v1
npm run build
```

The build output is `dist/`. `public/web.config`, the favicon, and
`public/mediapipe/*` (face model + wasm loader scripts) are copied into `dist/`.

## 2. IIS

1. Install the **URL Rewrite** module if not present.
2. Copy the contents of `dist/` into the IIS site root.
3. Confirm the app pool serves static content only (no ASP.NET features needed).
4. `web.config` (deployed with the app) handles:
   - SPA rewrite: every non-file path → `/index.html`, so `/v/<linkToken>` works.
   - Security headers: CSP, HSTS, `nosniff`, `X-Frame-Options: DENY`,
     `Referrer-Policy: no-referrer`, `Permissions-Policy` (camera=self only),
     COOP/CORP, and removal of `X-Powered-By`.
   - Caching: `index.html` is not cached; hashed files under `/assets/` are
     immutable.
   - MIME types: `.wasm` → `application/wasm`, `.task` → `application/octet-stream`.
5. Replace the CSP `connect-src` placeholder (`https://REPLACE-WITH-API-ORIGIN.example`)
   with the real MTB API origin.

## 3. CORS on the MTB API

The API must allow, for this site's origin:

- Methods: `POST`, `OPTIONS` (preflight).
- Request headers: `Content-Type`, `Accept`, `Authorization`, `X-Correlation-Id`,
  `X-Request-Timestamp`, `X-App-Version`, `X-Client-Platform`, `Accept-Language`.
- Do **not** require cookies (`credentials: "omit"`).

## 4. Retailer app WebView requirements

**Android**

- `settings.setJavaScriptEnabled(true)`
- `settings.setMediaPlaybackRequiresUserGesture(false)`
- Grant `PermissionRequest.RESOURCE_VIDEO_CAPTURE` in
  `WebChromeClient.onPermissionRequest`.
- `android.permission.CAMERA` in the manifest.

**iOS**

- iOS 14.3+; `configuration.allowsInlineMediaPlayback = true`.
- `NSCameraUsageDescription` in Info.plist.
- Add a `WKScriptMessageHandler` named **`mtbVerify`**; the app posts
  `{"type":"MTB_VERIFY_RESULT","applicationId":"…","result":"MATCHED"|"FAILED"|"EXPIRED"}`
  to it when the flow ends.

React Native WebView apps receive the same JSON via
`window.ReactNativeWebView.postMessage`.

## 5. Smoke test after deploy

Open `/v/<token>` from a real one-time link: the token must disappear from the
address bar, the flow should reach the camera with the back camera, and DevTools
→ Application → Storage must stay empty (nothing is written to storage).
