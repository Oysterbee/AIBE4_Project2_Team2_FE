// src/services/notification.js

let notificationBtn = null;
let notificationBadge = null;
let notificationPopup = null;
let notificationList = null;
let popupCount = null;
let closeBtn = null;

let unreadCount = 0;
let eventSource = null;

// ★ 메인에서 호출할 초기화 함수
export function initNotification(memberId) {
    // 1. DOM 요소 찾기
    notificationBtn = document.getElementById('notificationBtn');
    notificationBadge = document.getElementById('notificationBadge');
    notificationPopup = document.getElementById('notificationPopup');
    notificationList = document.getElementById('notificationList');
    popupCount = document.getElementById('popupCount');
    closeBtn = document.getElementById('closeNotification');

    if (!notificationBtn) {
        // 헤더가 아직 안 그려졌을 때를 대비해 잠시 대기 후 재시도
        setTimeout(() => initNotification(memberId), 500);
        return;
    }

    console.log("✅ 알림 시스템 가동 (Member ID:", memberId + ")");
    bindEvents();
    loadUnreadNotifications();
    connectSSE(memberId);
}

// src/services/notification.js 내부

function bindEvents() {
    // [변경 전] 버튼을 변수에 담아서 이벤트를 걸었음 (버튼 없으면 에러남)
    /* notificationBtn.addEventListener('click', ...); 
    */

    // [변경 후] 문서 전체를 감시하다가, 클릭된 게 버튼이면 실행 (버튼이 늦게 생겨도 OK)
    document.addEventListener('click', (e) => {
        // 1. 종 버튼을 눌렀을 때
        const btn = e.target.closest('#notificationBtn');
        if (btn) {
            e.stopPropagation(); // 이벤트 전파 막기
            const popup = document.getElementById('notificationPopup');
            if(popup) {
                popup.classList.toggle('active');
                console.log("🔔 종 버튼 클릭됨! 팝업 상태:", popup.classList.contains('active'));
            } else {
                console.error("❌ 팝업 요소를 찾을 수 없습니다.");
            }
            return;
        }

        // 2. 닫기 버튼(X)을 눌렀을 때
        const close = e.target.closest('#closeNotification');
        if (close) {
            e.stopPropagation();
            document.getElementById('notificationPopup').classList.remove('active');
            return;
        }

        // 3. 팝업 외부를 눌렀을 때 (닫기)
        const popup = document.getElementById('notificationPopup');
        const isBtn = e.target.closest('#notificationBtn');
        const isPopup = e.target.closest('#notificationPopup');

        if (popup && popup.classList.contains('active') && !isBtn && !isPopup) {
            popup.classList.remove('active');
        }
    });

    console.log("✅ 이벤트 리스너(위임 방식) 등록 완료");
}

async function loadUnreadNotifications() {
    try {
        // ★ [수정] credentials: 'include' 추가 (쿠키 전송)
        const response = await fetch('http://localhost:8080/api/notifications/unread', {
            method: 'GET',
            credentials: 'include' 
        });

        if (response.ok) {
            const result = await response.json();
            const notifications = result.data || [];
            
            unreadCount = notifications.length;
            updateBadgeUI();

            notificationList.innerHTML = '';
            if (notifications.length === 0) showEmptyMessage();
            else notifications.forEach(data => appendNotificationItem(data, false));
        }
    } catch (error) {
        console.error("초기 알림 로드 실패:", error);
    }
}

function connectSSE(memberId) {
    if (eventSource) eventSource.close();

    const sseUrl = `http://localhost:8080/api/notifications/subscribe?id=${memberId}`;
    
    // ★ [수정] withCredentials: true 추가 (쿠키 전송)
    eventSource = new EventSource(sseUrl, { withCredentials: true });

    eventSource.addEventListener('notification', (e) => {
        const data = JSON.parse(e.data);
        unreadCount++;
        updateBadgeUI();
        appendNotificationItem(data, true);
    });
    
    eventSource.onerror = (err) => {
        // 연결 끊김 로그는 너무 자주 떠서 생략
        // eventSource.close(); 
    };
}

function appendNotificationItem(data, isNew) {
    const emptyMsg = notificationList.querySelector('.empty-msg');
    if (emptyMsg) emptyMsg.remove();

    const li = document.createElement('li');
    li.className = 'notification-item';
    
    // 알림 타입 한글 변환
    let typeText = data.type;
    if(data.type === 'INTERVIEW_REQUEST') typeText = '인터뷰 요청';
    if(data.type === 'INTERVIEW_ACCEPTED') typeText = '인터뷰 수락';
    if(data.type === 'INTERVIEW_REJECTED') typeText = '인터뷰 거절';
    if(data.type === 'INTERVIEW_COMPLETED') typeText = '인터뷰 완료';

    li.innerHTML = `
        <span class="noti-type">${typeText}</span>
        <span class="noti-content">${data.content}</span>
    `;

    li.addEventListener('click', () => handleRead(data.id, data.url, li));

    if (isNew) notificationList.prepend(li);
    else notificationList.appendChild(li);
}

async function handleRead(id, url, element) {
    try {
        await fetch(`http://localhost:8080/api/notifications/${id}/read`, { 
            method: 'PATCH',
            credentials: 'include' // ★ PATCH도 쿠키 필요
        });
        element.remove();
        unreadCount--;
        updateBadgeUI();
        if (notificationList.children.length === 0) showEmptyMessage();
        
        if (url) window.location.hash = "#" + url;
    } catch (e) {
        console.error(e);
    }
}

function updateBadgeUI() {
    // 요소를 다시 확실하게 찾음
    const badge = document.getElementById('notificationBadge');
    
    if (!badge) {
        console.warn("배지 요소를 찾을 수 없습니다.");
        return;
    }

    console.log(`뱃지 업데이트: ${unreadCount}개`); // 디버깅용 로그

    if (unreadCount > 0) {
        badge.style.display = 'flex'; // 1개 이상이면 보임
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
    } else {
        badge.style.display = 'none'; // 0개면 숨김
    }
}

function showEmptyMessage() {
    notificationList.innerHTML = '<li class="empty-msg">새로운 알림이 없습니다.</li>';
}