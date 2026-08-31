// Firebase 프로젝트 콘솔 > 프로젝트 설정 > 일반 > 내 앱(웹)에서 가져온 설정값.
// apiKey 등은 클라이언트에 그대로 노출되는 공개 식별자라 커밋해도 안전하다 —
// 실제 보안은 Firebase 콘솔의 Authentication/보안 규칙에서 처리한다.
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD3zmc_0w1IkN7X1JR86TlR8tUt86d5lKw",
  authDomain: "monolog-2026.firebaseapp.com",
  projectId: "monolog-2026",
  storageBucket: "monolog-2026.firebasestorage.app",
  messagingSenderId: "100491653891",
  appId: "1:100491653891:web:160f365ddd38d65a83ef36",
  measurementId: "G-6GWTTVEHG8",
};

// Next.js는 서버(SSR)에서도 이 모듈을 로드하므로, getApps()로 중복 초기화를 막는다.
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Analytics는 브라우저 API(window, indexedDB)가 필요해 SSR에서 호출하면 에러가 난다.
// 실제로 쓰게 되면 클라이언트 컴포넌트 안에서 아래처럼 동적으로 초기화할 것:
//   if (typeof window !== "undefined") {
//     const { getAnalytics, isSupported } = await import("firebase/analytics");
//     if (await isSupported()) getAnalytics(app);
//   }
