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

        // 关闭按钮点击事件
        const closeButtons = document.querySelectorAll('.close');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.closeModal('qrcodeModal');
            });
        });

        // 点击弹窗外部区域关闭弹窗
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal')) {
                    this.closeModal(e.target.id);
                }
            });
        });
    },

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
};

// 页面加载完成后初始化弹窗功能
document.addEventListener('DOMContentLoaded', () => {
    Modal.init();
});