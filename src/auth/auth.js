import { api, ApiError } from "../services/api.js";

const KEY = "mm_session";

export function getSession() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  const s = getSession();
  return Boolean(s && s.accessToken);
}

export async function login({ username, password }) {
  try {
    const result = await api.post("/auth/login", { username, password });

    if (!result?.success) {
      return { ok: false, message: result?.message || "로그인 실패" };
    }

    const session = {
      accessToken: result?.data?.accessToken || "",
      tokenType: result?.data?.tokenType || "Bearer",
      expiresIn: result?.data?.expiresIn,
      tokenUpdatedAt: Date.now(),
    };

    localStorage.setItem(KEY, JSON.stringify(session));

    try {
      const userInfo = await api.get("/members/me");

      if (userInfo?.success && userInfo?.data) {
        session.user = {
          memberId: userInfo.data.memberId ?? "",
          name: userInfo.data.name ?? "",
          nickname: userInfo.data.nickname ?? "",
          email: userInfo.data.email ?? "",
          username: userInfo.data.username ?? "",
          profileImageUrl: userInfo.data.profileImageUrl ?? "",
          status: userInfo.data.status ?? "",
          university: userInfo.data.university ?? "",
          major: userInfo.data.major ?? "",
          role: userInfo.data.role ?? "",
        };

        localStorage.setItem(KEY, JSON.stringify(session));
      }
    } catch (error) {
      console.warn("사용자 정보 조회 실패:", error);
    }

    try {
      const requestInfo = await api.get("/major-requests/me");

      // user 객체가 이미 세션에 생성되어 있다고 가정
      if (session.user) {
        if (
          requestInfo?.success &&
          Array.isArray(requestInfo.data) &&
          requestInfo.data.length > 0
        ) {
          const latest = requestInfo.data[0];

          // user 객체 안에 직접 추가
          session.user.applicationStatus = latest.applicationStatus ?? "";
          session.user.requestId = latest.id ?? null;
          session.user.rejectReason = latest.reason ?? ""; // 반려 시 사유 확인용
        } else {
          // 신청 이력이 없는 경우
          session.user.applicationStatus = "NONE";
        }

        // 최종적으로 한 번만 저장
        localStorage.setItem(KEY, JSON.stringify(session));
      }
    } catch (error) {
      console.warn("지원 정보 통합 실패:", error);
    }
    return { ok: true, session };
  } catch (error) {
    if (error instanceof ApiError) {
      // 백엔드의 상세 에러 메시지 추출
      const errorMessage =
        error.data?.error?.message || error.data?.message || error.message;
      return { ok: false, message: errorMessage };
    }
    return { ok: false, message: "서버 연결 오류" };
  }
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    console.error("로그아웃 API 호출 실패:", error);
  } finally {
    localStorage.removeItem(KEY);
  }
}
