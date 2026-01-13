// src/pages/mypage/tabs.js
import { MYPAGE_TABS } from "./state.js";
import { renderProfileTab } from "./renderers/profile.js";

import { renderWrittenReviewItem } from "./renderers/review.js";
import { openReviewDetailModal } from "./components/reviewDetailModal.js";
import { openReviewEditModal } from "./components/reviewEditModal.js";
import { fetchWrittenReviewDetail } from "./api.js";

import { renderAppliedInterviewItem } from "./renderers/appliedInterview.js";
import { openAppliedInterviewDetailModal } from "./components/appliedInterviewDetailModal.js";

import { renderCompletedInterviewItem } from "./renderers/completedInterview.js";
import { openReviewCreateModal } from "./components/reviewCreateModal.js";
import { fetchAppliedInterviewDetail } from "./api.js";

import { renderPagination } from "./pagination.js";
import { startOverlayLoading, endOverlayLoading } from "../../utils/overlay.js";

export function initTabsSection(state) {
  const tabsEl = document.getElementById("mypageTabs");
  const listEl = document.getElementById("mypageList");
  const pagerEl = document.getElementById("mypagePagination");
  if (!tabsEl || !listEl || !pagerEl) return;

  const itemsByReviewId = new Map();

  renderTabs();
  bindTabClick();
  bindListEventsOnce();

  state.renderActiveTab = renderActiveTab;

  window.addEventListener("mm:review-updated", async () => {
    if (state.activeTab === "reviews") await renderActiveTab();
  });

  window.addEventListener("mm:review-created", async () => {
    if (state.activeTab === "completed") await renderActiveTab();
  });

  async function renderActiveTab() {
    listEl.innerHTML = "";
    pagerEl.innerHTML = "";
    itemsByReviewId.clear();

    if (state.activeTab === "profile") {
      renderProfileTab(state);
      return;
    }

    try {
      startOverlayLoading();

      const res = await state.loadActiveTab();
      const items = normalizeItems(res);

      if (items.length === 0) {
        listEl.innerHTML = `<div class="empty">데이터가 없습니다.</div>`;
        renderPagerAlways(res?.meta);
        return;
      }

      if (state.activeTab === "reviews") {
        for (const it of items) {
          const rid = String(it?.review?.reviewId ?? "").trim();
          if (rid) itemsByReviewId.set(rid, it);
        }
        listEl.innerHTML = items.map(renderWrittenReviewItem).join("");
        renderPagerAlways(res?.meta);
        return;
      }

      if (state.activeTab === "applied") {
        listEl.innerHTML = items.map(renderAppliedInterviewItem).join("");
        renderPagerAlways(res?.meta);
        return;
      }

      if (state.activeTab === "completed") {
        listEl.innerHTML = items.map(renderCompletedInterviewItem).join("");
        renderPagerAlways(res?.meta);
        return;
      }

      listEl.innerHTML = items.map(() => "").join("");
      renderPagerAlways(res?.meta);
    } catch {
      listEl.innerHTML = `<div class="empty">목록 조회에 실패했다</div>`;
      renderPagerAlways({ page: 0, totalPages: 1 });
    } finally {
      endOverlayLoading();
    }
  }

  function bindListEventsOnce() {
    listEl.addEventListener("click", onListClick);
    listEl.addEventListener("keydown", onListKeydown);
  }

  async function onListClick(e) {
    const noDetail = e.target.closest?.('[data-no-detail="true"]');

    if (state.activeTab === "reviews") {
      const editBtn = e.target.closest?.('[data-action="open-review-edit"]');
      if (editBtn) {
        e.preventDefault();
        e.stopPropagation();

        const reviewId = String(
          editBtn.getAttribute("data-review-id") || ""
        ).trim();
        const interviewId = String(
          editBtn.getAttribute("data-interview-id") || ""
        ).trim();
        if (!reviewId || !interviewId) return;

        const item = itemsByReviewId.get(reviewId);
        const rating = item?.review?.rating ?? 0;
        const content = item?.review?.content ?? "";

        openReviewEditModal({ reviewId, interviewId, rating, content });
        return;
      }

      if (noDetail) return;

      const row = e.target.closest?.('[data-action="open-review-detail"]');
      if (!row) return;

      const reviewId = String(row.getAttribute("data-review-id") || "").trim();
      if (!reviewId) return;

      await openReviewDetailWithLoading(reviewId);
      return;
    }

    if (state.activeTab === "applied") {
      if (noDetail) return;

      const row = e.target.closest?.(
        '[data-action="open-applied-interview-detail"]'
      );
      if (!row) return;

      const interviewId = String(
        row.getAttribute("data-interview-id") || ""
      ).trim();
      if (!interviewId) return;

      await openAppliedDetailWithLoading(interviewId);
      return;
    }

    if (state.activeTab === "completed") {
      const writeBtn = e.target.closest?.('[data-action="write-review"]');
      if (writeBtn) {
        e.preventDefault();
        e.stopPropagation();

        if (writeBtn.hasAttribute("disabled")) return;

        const interviewId = String(
          writeBtn.getAttribute("data-interview-id") || ""
        ).trim();
        if (!interviewId) return;

        openReviewCreateModal({ interviewId });
        return;
      }

      if (noDetail) return;

      const row = e.target.closest?.(
        '[data-action="open-completed-interview-detail"]'
      );
      if (!row) return;

      const interviewId = String(
        row.getAttribute("data-interview-id") || ""
      ).trim();
      if (!interviewId) return;

      await openAppliedDetailWithLoading(interviewId);
      return;
    }
  }

  async function onListKeydown(e) {
    if (e.key !== "Enter" && e.key !== " ") return;

    if (state.activeTab === "reviews") {
      const row = e.target.closest?.('[data-action="open-review-detail"]');
      if (!row) return;
      e.preventDefault();

      const reviewId = String(row.getAttribute("data-review-id") || "").trim();
      if (!reviewId) return;

      await openReviewDetailWithLoading(reviewId);
      return;
    }

    if (state.activeTab === "applied") {
      const row = e.target.closest?.(
        '[data-action="open-applied-interview-detail"]'
      );
      if (!row) return;
      e.preventDefault();

      const interviewId = String(
        row.getAttribute("data-interview-id") || ""
      ).trim();
      if (!interviewId) return;

      await openAppliedDetailWithLoading(interviewId);
      return;
    }

    if (state.activeTab === "completed") {
      const writeBtn = e.target.closest?.('[data-action="write-review"]');
      if (writeBtn) {
        e.preventDefault();
        if (writeBtn.hasAttribute("disabled")) return;

        const interviewId = String(
          writeBtn.getAttribute("data-interview-id") || ""
        ).trim();
        if (!interviewId) return;

        openReviewCreateModal({ interviewId });
        return;
      }

      const row = e.target.closest?.(
        '[data-action="open-completed-interview-detail"]'
      );
      if (!row) return;
      e.preventDefault();

      const interviewId = String(
        row.getAttribute("data-interview-id") || ""
      ).trim();
      if (!interviewId) return;

      await openAppliedDetailWithLoading(interviewId);
      return;
    }
  }

  async function openReviewDetailWithLoading(reviewId) {
    try {
      startOverlayLoading();
      const res = await fetchWrittenReviewDetail(reviewId);
      if (!res?.success) throw new Error(res?.message || "detail failed");
      openReviewDetailModal(res.data);
    } catch {
      alert("상세 조회에 실패했다");
    } finally {
      endOverlayLoading();
    }
  }

  async function openAppliedDetailWithLoading(interviewId) {
    try {
      startOverlayLoading();
      const res = await fetchAppliedInterviewDetail(interviewId);
      if (!res?.success) throw new Error(res?.message || "detail failed");
      openAppliedInterviewDetailModal(res.data);
    } catch {
      alert("상세 조회에 실패했다");
    } finally {
      endOverlayLoading();
    }
  }

  function renderTabs() {
    tabsEl.innerHTML = MYPAGE_TABS.map((t) => {
      const active = t.key === state.activeTab ? "active" : "";
      return `<button class="mypage-tab ${active}" type="button" data-tab="${t.key}">${t.label}</button>`;
    }).join("");
  }

  function bindTabClick() {
    tabsEl.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-tab]");
      if (!btn) return;

      const key = btn.getAttribute("data-tab");
      if (!key || key === state.activeTab) return;

      state.setActiveTab(key);
      renderTabs();
      await renderActiveTab();
    });
  }

  function normalizeItems(res) {
    const d = res?.data ?? res?.items ?? [];
    return Array.isArray(d) ? d : [];
  }

  function renderPagerAlways(meta) {
    const m = meta || {};
    const totalPages = normalizeTotalPages(m);
    const page1 = normalizePage1(m, totalPages);

    renderPagination(pagerEl, {
      page: page1,
      totalPages,
      onChange: async (nextPage1) => {
        state.paging.page = Math.max(0, Number(nextPage1) - 1);
        await renderActiveTab();
      },
    });
  }

  function normalizeTotalPages(meta) {
    const tp = Number(meta?.totalPages);
    if (Number.isFinite(tp) && tp > 0) return Math.trunc(tp);
    return 1;
  }

  function normalizePage1(meta, totalPages) {
    const p = Number(meta?.page);
    const candidate = Number.isFinite(p) ? Math.trunc(p) + 1 : 1;
    if (candidate < 1) return 1;
    if (candidate > totalPages) return totalPages;
    return candidate;
  }
}
