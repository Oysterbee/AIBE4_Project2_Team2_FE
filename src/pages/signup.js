import { navigate } from "../router.js";
import { api, ApiError } from "../services/api.js";

export function renderSignup(root) {
  const wrap = document.createElement("div");
  wrap.className = "auth-wrap";

  wrap.innerHTML = `
    <div class="auth-card card">
      <div class="auth-brand">
        <div class="brand-mark">MM</div>
        <div class="auth-title">회원가입</div>
      </div>

      <form class="auth-form" id="signupForm">

        <div class="auth-row">
          <label class="auth-label">아이디</label>
          <input class="auth-input" name="username" required />
        </div>

        <div class="auth-row">
          <label class="auth-label">이름</label>
          <input class="auth-input" name="name" required />
        </div>

        <div class="auth-row">
          <label class="auth-label">닉네임</label>
          <input class="auth-input" name="nickname" required />
        </div>

        <div class="auth-row">
          <label class="auth-label">이메일</label>
          <input class="auth-input" name="email" type="email" required />
        </div>

        <div class="auth-row">
          <label class="auth-label">재학 상태</label>
          <select class="auth-input" name="status" required>
            <option value="">선택</option>
            <option value="ENROLLED">재학</option>
            <option value="GRADUATED">졸업</option>
            <option value="HIGHSCHOOL">고등학생</option>
          </select>
        </div>

        <div class="auth-row">
          <label class="auth-label">비밀번호</label>
          <input class="auth-input" name="password" type="password" required />
        </div>

        <div class="auth-row">
          <label class="auth-label">비밀번호 확인</label>
          <input class="auth-input" name="password2" type="password" required />
        </div>

        <button class="auth-primary" type="submit">가입하기</button>
        <button class="auth-ghost" type="button" id="toLogin">로그인으로</button>

        <div class="auth-divider">또는</div>

        <div class="auth-social-buttons">
          <button type="button" class="auth-social-btn google" id="googleSignup">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M15.68 8.18182C15.68 7.61455 15.6291 7.06909 15.5345 6.54545H8V9.64364H12.3055C12.1164 10.64 11.5491 11.4836 10.6982 12.0509V14.0655H13.2945C14.8073 12.6691 15.68 10.6182 15.68 8.18182Z" fill="#4285F4"/>
              <path d="M8 16C10.16 16 11.9709 15.2873 13.2945 14.0655L10.6982 12.0509C9.98545 12.5309 9.07636 12.8218 8 12.8218C5.92 12.8218 4.15273 11.4182 3.52 9.52H0.858182V11.5927C2.17455 14.2036 4.87273 16 8 16Z" fill="#34A853"/>
              <path d="M3.52 9.52C3.36 9.04 3.27273 8.52727 3.27273 8C3.27273 7.47273 3.36 6.96 3.52 6.48V4.40727H0.858182C0.312727 5.49091 0 6.70909 0 8C0 9.29091 0.312727 10.5091 0.858182 11.5927L3.52 9.52Z" fill="#FBBC05"/>
              <path d="M8 3.17818C9.17818 3.17818 10.2255 3.58545 11.0582 4.37818L13.3527 2.08364C11.9673 0.792727 10.1564 0 8 0C4.87273 0 2.17455 1.79636 0.858182 4.40727L3.52 6.48C4.15273 4.58182 5.92 3.17818 8 3.17818Z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button type="button" class="auth-social-btn github" id="githubSignup">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            GitHub
          </button>
        </div>
      </form>
    </div>
  `;

  root.appendChild(wrap);

  const form = wrap.querySelector("#signupForm");
  const toLogin = wrap.querySelector("#toLogin");
  const googleSignupBtn = wrap.querySelector("#googleSignup");
  const githubSignupBtn = wrap.querySelector("#githubSignup");

  toLogin.addEventListener("click", () => navigate("/login"));

  // 소셜 로그인 버튼
  googleSignupBtn.addEventListener("click", () => {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
    const backendUrl = apiBaseUrl.replace(/\/api$/, "");
    window.location.href = `${backendUrl}/oauth2/authorization/google`;
  });

  githubSignupBtn.addEventListener("click", () => {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
    const backendUrl = apiBaseUrl.replace(/\/api$/, "");
    window.location.href = `${backendUrl}/oauth2/authorization/github`;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(form);

    const username = fd.get("username")?.trim();
    const name = fd.get("name")?.trim();
    const nickname = fd.get("nickname")?.trim();
    const email = fd.get("email")?.trim();
    const status = fd.get("status");
    const password = fd.get("password");
    const password2 = fd.get("password2");

    // ✅ 프론트 최소 검증
    if (!username || !name || !nickname || !email) {
      alert("필수 항목을 모두 입력해라");
      return;
    }

    if (password.length < 8) {
      alert("비밀번호는 8자 이상이어야 한다");
      return;
    }

    if (password !== password2) {
      alert("비밀번호 확인이 일치하지 않는다");
      return;
    }

    try {
      const result = await api.post("/auth/signup", {
        username,
        password,
        name,
        nickname,
        email,
        status,
      });

      if (!result.success) {
        alert(result.message || "회원가입 실패");
        return;
      }

      alert("회원가입 완료");
      navigate("/login");
    } catch (error) {
      console.error(error);
      if (error instanceof ApiError) {
        alert(error.message);
      } else {
        alert("서버 연결 오류");
      }
    }
  });
}
