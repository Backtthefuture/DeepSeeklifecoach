// 弹窗控制逻辑
const Modal = {
    init() {
        this.setupEventListeners();
    },

    setupEventListeners() {
        // 社群按钮点击事件
        const communityBtn = document.getElementById('communityBtn');
        if (communityBtn) {
            communityBtn.addEventListener('click', () => {
                this.openModal('qrcodeModal');
            });
        }

        // 关闭按钮点击事件 - 适配新的弹窗结构
        const modalButtons = document.querySelectorAll('.modal-button');
        modalButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // 找到最近的modal-overlay父元素
                const modalOverlay = e.target.closest('.modal-overlay');
                if (modalOverlay) {
                    this.closeModal(modalOverlay.id);
                }
            });
        });

        // 点击弹窗外部区域关闭弹窗
        const modalOverlays = document.querySelectorAll('.modal-overlay');
        modalOverlays.forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                // 只有当点击的是弹窗背景而不是弹窗内容时才关闭
                if (e.target === overlay) {
                    this.closeModal(overlay.id);
                }
            });
        });
    },

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            // 添加页面滚动锁定
            document.body.style.overflow = 'hidden';
        }
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            // 恢复页面滚动
            document.body.style.overflow = '';
        }
    }
};

// 页面加载完成后初始化弹窗功能
document.addEventListener('DOMContentLoaded', () => {
    Modal.init();
});