import { navigate } from "../router.js";

export async function renderApply(root) {
  // async 추가 (내 정보 조회용)
  const wrap = document.createElement("div");
  wrap.className = "apply-wrap";

  wrap.innerHTML = `
    <h2 class="apply-title">전공자 지원하기</h2>

    <section class="card apply-card">
      <form class="apply-form" id="applyForm">
        <!-- 이름, 학교, 전공은 백엔드에서 자동 조회되므로 readonly로 보여주거나 생략 가능 -->
        <div class="apply-row">
          <label class="apply-label" for="name">이름</label>
          <input class="apply-input" id="name" name="name" placeholder="로딩 중..." readonly />
        </div>

        <div class="apply-row">
          <label class="apply-label" for="school">학교</label>
          <input class="apply-input" id="school" name="school" placeholder="로딩 중..." readonly />
        </div>

        <div class="apply-row">
          <label class="apply-label" for="major">전공</label>
          <input class="apply-input" id="major" name="major" placeholder="로딩 중..." readonly />
        </div>

        <div class="apply-row">
          <label class="apply-label" for="intro">한 줄 소개</label>
          <textarea class="apply-textarea" id="intro" name="intro" rows="4" placeholder="후배들에게 어떤 도움을 줄 수 있는지 짧게 적어줘" required></textarea>
        </div>


        <!-- 파일 업로드 필드 추가 (필수) -->
        <div class="apply-row">
          <label class="apply-label" for="file">증빙 서류</label>
          <input class="apply-input" type="file" id="file" name="file" accept="image/*" required />
          <p class="apply-help">학생증 또는 재학증명서를 업로드해주세요.</p>
        </div>

        <div class="apply-btn-row">
          <button class="apply-submit" type="submit">지원서 제출</button>
          <button class="apply-cancel" type="button" id="cancelBtn">취소</button>
        </div>
      </form>
    </section>
  `;

  root.appendChild(wrap);

  const form = wrap.querySelector("#applyForm");
  const cancelBtn = wrap.querySelector("#cancelBtn");
  const nameInput = wrap.querySelector("#name");
  const schoolInput = wrap.querySelector("#school");
  const majorInput = wrap.querySelector("#major");

  // 1. 내 정보 조회 및 표시 (선택 사항)
  try {
    const token = localStorage.getItem("accessToken");
    if (token) {
      // 프로필 조회 API 호출 (경로 확인 필요)
      // const res = await fetch("/api/members/me/detail", ...);
      // ... 데이터 채우기
      // 임시:
      nameInput.value = "홍길동 (자동조회)";
      schoolInput.value = "한국대 (자동조회)";
      majorInput.value = "컴공 (자동조회)";
    }
  } catch (e) {
    console.error(e);
  }

  cancelBtn.addEventListener("click", () => navigate("/"));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const file = fd.get("file");
    const intro = fd.get("intro");

    // 백엔드 전송용 FormData
    const submissionData = new FormData();

    // JSON 데이터 ('request' 파트)
    const requestDto = {
      content: intro,
    };

    const jsonBlob = new Blob([JSON.stringify(requestDto)], {
      type: "application/json",
    });
    submissionData.append("request", jsonBlob);

    // 파일 데이터 ('file' 파트)
    if (file) {
      submissionData.append("file", file);
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/major-requests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submissionData,
      });

      if (response.ok) {
        alert("전공자 인증 요청이 완료되었습니다.");
        navigate("/");
      } else {
        const errorText = await response.text();
        alert("요청 실패: " + errorText);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("서버 통신 오류");
    }
  });
}
