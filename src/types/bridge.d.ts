export {}

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage(message: string): void };
    webkit?: {
      messageHandlers?: {
        mtbVerify?: { postMessage(message: string): void };
      };
    };
    AndroidBridge?: { onVerificationResult?(message: string): void };
  }
}
