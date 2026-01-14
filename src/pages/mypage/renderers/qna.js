// src/pages/mypage/renderers/qna.js
import { escapeHtml, escapeAttr } from "../utils/dom.js";

export function renderMyQuestionItem(item) {
  const questionId = String(item?.questionId ?? "").trim();

  const question = safeText(item?.questionContent, "-");
  const hasAnswer = Boolean(item?.hasAnswer);

  const qCreatedRaw = item?.createdAt || "";
  const qUpdatedRaw = item?.updatedAt || "";
  const qCreatedDate = formatDateOnly(qCreatedRaw);
  const qUpdatedDate = formatDateOnly(qUpdatedRaw);
  const qEdited = hasMeaningfulUpdate(qCreatedRaw, qUpdatedRaw);

  const ans = item?.answer || null;
  const answerText = safeText(ans?.content, "");
  const aCreatedRaw = ans?.createdAt || "";
  const aUpdatedRaw = ans?.updatedAt || "";
  const aCreatedDate = formatDateOnly(aCreatedRaw);
  const aUpdatedDate = formatDateOnly(aUpdatedRaw);
  const aEdited = hasMeaningfulUpdate(aCreatedRaw, aUpdatedRaw);

  const tone = hasAnswer ? "accepted" : "pending";
  const statusLabel = hasAnswer ? "답변 완료" : "답변 대기";

  const qDatesLine = buildDatesLine({
    primaryLabel: "질문일",
    primaryValue: qCreatedDate,
    edited: qEdited,
    updatedLabel: "수정일",
    updatedValue: qUpdatedDate,
  });

  const aDatesLine = answerText
    ? buildDatesLine({
        primaryLabel: "답변일",
        primaryValue: aCreatedDate,
        edited: aEdited,
        updatedLabel: "수정일",
        updatedValue: aUpdatedDate,
      })
    : "";

  // short/full은 항상 렌더링하고, 버튼은 기본 hidden 처리
  // 렌더 후 overflow 측정해서 필요한 경우에만 버튼을 표시
  const qShort = question;
  const qFull = question;

  const aShort = answerText;
  const aFull = answerText;

  return `
    <div class="mypage-item mypage-review-item mypage-qna-item"
      data-question-id="${escapeAttr(questionId)}"
    >
      <div class="mypage-review-top">
        <div class="mypage-review-left"></div>
        <div class="mypage-review-meta"></div>
      </div>

      <div class="mypage-qna-block mypage-qna-block--question">
        ${
          qDatesLine
            ? `<div class="mypage-qna-dates-line" data-no-detail="true">${qDatesLine}</div>`
            : ""
        }

        <div class="mypage-qna-text" data-no-detail="true">
          <span class="mypage-qna-short" data-part="q-short">${escapeHtml(
            qShort
          )}</span>
          <span class="mypage-qna-full" data-part="q-full" hidden>${escapeHtml(
            qFull
          )}</span>
          <button
            type="button"
            class="mypage-qna-more"
            data-action="toggle-qna"
            data-target="question"
            data-open="false"
            aria-expanded="false"
            hidden
          >더보기</button>
        </div>

        ${
          hasAnswer
            ? ""
            : `
              <div class="mypage-qna-actions">
                <button
                  class="mypage-mini-btn"
                  type="button"
                  data-action="edit-qna"
                  data-question-id="${escapeAttr(questionId)}"
                >수정하기</button>

                <button
                  class="mypage-mini-btn"
                  type="button"
                  data-action="delete-qna"
                  data-question-id="${escapeAttr(questionId)}"
                >삭제하기</button>
              </div>
            `
        }
      </div>

      <div class="mypage-qna-block mypage-qna-block--answer">
        <div class="mypage-qna-head">
          <div class="mypage-qna-head-left">
            <span class="mm-badge mypage-status-chip mypage-qna-status"
              data-tone="${escapeAttr(tone)}"
              data-no-detail="true"
            >${escapeHtml(statusLabel)}</span>
          </div>

          ${
            aDatesLine
              ? `<div class="mypage-qna-head-dates" data-no-detail="true">${aDatesLine}</div>`
              : ""
          }
        </div>

        ${
          answerText
            ? `
              <div class="mypage-qna-text" data-no-detail="true">
                <span class="mypage-qna-short" data-part="a-short">${escapeHtml(
                  aShort
                )}</span>
                <span class="mypage-qna-full" data-part="a-full" hidden>${escapeHtml(
                  aFull
                )}</span>
                <button
                  type="button"
                  class="mypage-qna-more"
                  data-action="toggle-qna"
                  data-target="answer"
                  data-open="false"
                  aria-expanded="false"
                  hidden
                >더보기</button>
              </div>
            `
            : `<div class="mm-empty">아직 답변이 없다</div>`
        }
      </div>
    </div>
  `;
}

function buildDatesLine({
  primaryLabel,
  primaryValue,
  edited,
  updatedLabel,
  updatedValue,
}) {
  const p = String(primaryValue || "").trim();
  if (!p || p === "-") return "";

  const parts = [`${renderChipLabel(primaryLabel)} ${renderDateValue(p)}`];

  if (edited) {
    const u = String(updatedValue || "").trim();
    if (u && u !== "-" && u !== p) {
      parts.push(`${renderChipLabel(updatedLabel)} ${renderDateValue(u)}`);
    }
  }

  return parts.join(
    `<span class="mypage-qna-dot" aria-hidden="true">·</span>`
  );
}

function renderChipLabel(label) {
  return `<span class="mypage-qna-date-chip" data-no-detail="true">${escapeHtml(
    label
  )}</span>`;
}

function renderDateValue(value) {
  return `<span class="mypage-qna-date-val" data-no-detail="true">${escapeHtml(
    value
  )}</span>`;
}

function safeText(v, fallback) {
  const s = String(v ?? "").trim();
  return s ? s : fallback ?? "";
}

function formatDateOnly(raw) {
  const s = String(raw || "").trim();
  if (!s) return "-";
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function hasMeaningfulUpdate(createdAt, updatedAt) {
  const cKey = toComparableKey(createdAt);
  const uKey = toComparableKey(updatedAt);
  if (!uKey) return false;
  if (!cKey) return true;
  return uKey !== cKey;
}

function toComparableKey(dt) {
  const s = String(dt || "").trim();
  if (!s) return "";
  const m = s.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?/);
  if (!m) return s;
  const base = m[1];
  const fracRaw = m[2] || "";
  const frac = fracRaw.replace(/0+$/, "");
  return frac ? `${base}.${frac}` : base;
}
