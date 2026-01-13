// src/pages/mypage/utils/validation.js
export function validateProfileUpdate(payload, me) {
  const fieldErrors = {};

  const nicknameMsg = getNicknameRuleMessage(payload.nickname);
  if (nicknameMsg) fieldErrors.nickname = nicknameMsg;

  if (payload.university != null && String(payload.university).length > 20) {
    fieldErrors.university = "대학교명은 20자 이하입니다.";
  }
  if (payload.major != null && String(payload.major).length > 20) {
    fieldErrors.major = "학과명은 20자 이하입니다.";
  }

  const currentPassword = String(payload.currentPassword || "").trim();
  const newPassword = String(payload.newPassword || "").trim();
  const newPasswordConfirm = String(payload.newPasswordConfirm || "").trim();

  if (newPassword || newPasswordConfirm) {
    if (newPassword !== newPasswordConfirm) {
      fieldErrors.newPasswordConfirm = "새 비밀번호가 일치하지 않습니다.";
    }
  }

  const isLocal = isLikelyLocalUser(me);

  if (!isLocal) {
    if (currentPassword) {
      fieldErrors.currentPassword =
        "소셜 계정은 현재 비밀번호를 보낼 수 없습니다.";
    }
    if (newPassword) {
      fieldErrors.newPassword = "소셜 계정은 비밀번호를 변경할 수 없습니다.";
    }
  } else {
    if (!currentPassword) {
      fieldErrors.currentPassword = "현재 비밀번호가 필요합니다.";
    } else {
      const curErr = getPasswordRuleMessage(currentPassword);
      if (curErr) fieldErrors.currentPassword = curErr;
    }

    if (newPassword) {
      const newErr = getPasswordRuleMessage(newPassword);
      if (newErr) fieldErrors.newPassword = newErr;
    }
  }

  const ok = Object.keys(fieldErrors).length === 0;
  return {
    ok,
    fieldErrors,
    message: ok ? "" : "입력값을 확인해 주세요.",
  };
}

export function getNicknameRuleMessage(nicknameRaw) {
  const v = String(nicknameRaw || "").trim();
  if (!v) return "닉네임은 필수입니다.";
  if (v.length < 2 || v.length > 20) return "닉네임은 2~20자입니다.";
  if (!/^[가-힣a-zA-Z0-9_-]{2,20}$/.test(v))
    return "닉네임 형식이 올바르지 않습니다.";
  return "";
}

export function getEmailRuleMessage(emailRaw) {
  const v = String(emailRaw || "").trim();
  if (!v) return "이메일은 필수입니다.";
  if (v.length > 255) return "이메일은 255자 이하입니다.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
    return "이메일 형식이 올바르지 않습니다.";
  return "";
}

export function getPasswordRuleMessage(passwordRaw) {
  const v = String(passwordRaw || "").trim();
  if (!v) return "";

  if (v.length < 8 || v.length > 20) {
    return "비밀번호는 8~20자입니다.";
  }

  if (
    !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(v)
  ) {
    return "비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.";
  }

  return "";
}

export function getNewPasswordConfirmMessage(newPasswordRaw, confirmRaw) {
  const pwd = String(newPasswordRaw || "").trim();
  const cfm = String(confirmRaw || "").trim();

  if (!pwd && !cfm) return "";
  if (!cfm) return "";
  return pwd === cfm ? "" : "새 비밀번호가 일치하지 않습니다.";
}

function isLikelyLocalUser(me) {
  const provider = me?.authProvider ?? null;

  // authProvider가 명시적으로 설정된 경우
  if (provider) {
    return String(provider).toUpperCase() === "LOCAL";
  }

  // fallback: username으로 판단 (소셜 로그인은 google_, github_, kakao_ 등으로 시작)
  const username = me?.username ?? "";
  const userStr = String(username).toLowerCase();
  if (userStr.startsWith("google_") ||
      userStr.startsWith("github_") ||
      userStr.startsWith("kakao_") ||
      userStr.startsWith("naver_")) {
    return false; // 소셜 로그인 사용자
  }

  // 기본값: LOCAL 사용자로 간주
  return true;
}
