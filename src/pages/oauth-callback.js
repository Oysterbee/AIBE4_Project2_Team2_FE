import { navigate } from "../router.js";

export function renderOAuthCallback(root) {
  const wrap = document.createElement("div");
  wrap.className = "auth-wrap";

  wrap.innerHTML = `
    <div class="auth-card card">
      <div class="auth-brand">
        <div class="brand-mark">MM</div>
        <div class="auth-title">로그인 처리중...</div>
      </div>
      <p class="auth-desc">잠시만 기다려주세요</p>
    </div>
  `;

  root.appendChild(wrap);

  // URL에서 토큰 정보 파싱
  const urlParams = new URLSearchParams(window.location.search);
  const accessToken = urlParams.get("accessToken");
  const refreshToken = urlParams.get("refreshToken");
  const tokenType = urlParams.get("tokenType");
  const expiresIn = urlParams.get("expiresIn");
  const error = urlParams.get("error");

  if (error) {
    alert("소셜 로그인 실패: " + error);
    navigate("/login");
    return;
  }

  if (!accessToken || !refreshToken) {
    alert("토큰 정보가 없습니다");
    navigate("/login");
    return;
  }

  // 세션 저장
  const session = {
    accessToken,
    refreshToken,
    tokenType: tokenType || "Bearer",
    expiresIn: expiresIn ? parseInt(expiresIn) : null,
  };

  localStorage.setItem("mm_session", JSON.stringify(session));

  // 홈으로 리다이렉트
  navigate("/");
}
