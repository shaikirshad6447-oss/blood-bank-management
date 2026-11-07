/**
 * LifeDrop – Admin Portal Client Scripts
 * Handles modal injections, mobile sidebar toggle, and action confirmations.
 */

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // 1. Mobile Sidebar Toggle
    // -------------------------------------------------------------
    const sidebar = document.getElementById('adminSidebar');
    const toggleBtn = document.getElementById('sidebarToggleBtn');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });

        // Close sidebar on click outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth < 992 && sidebar.classList.contains('show')) {
                if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                    sidebar.classList.remove('show');
                }
            }
        });
    }

    // -------------------------------------------------------------
    // 2. Stock Adjustment Modal Population
    // -------------------------------------------------------------
    const stockAdjustModal = document.getElementById('stockAdjustModal');
    if (stockAdjustModal) {
        stockAdjustModal.addEventListener('show.bs.modal', (event) => {
            const button = event.relatedTarget;
            if (!button) return;

            const group = button.getAttribute('data-blood-group');
            const currentUnits = button.getAttribute('data-current-units');

            const groupInput = document.getElementById('modalBloodGroup');
            const groupDisplay = document.getElementById('modalBloodGroupDisplay');
            const currentUnitsDisplay = document.getElementById('modalCurrentUnitsDisplay');

            if (groupInput) groupInput.value = group;
            if (groupDisplay) groupDisplay.textContent = group;
            if (currentUnitsDisplay) currentUnitsDisplay.textContent = currentUnits;
        });
    }

    // -------------------------------------------------------------
    // 3. Delete Donor Confirmation Modal Population
    // -------------------------------------------------------------
    const deleteModal = document.getElementById('deleteDonorModal');
    if (deleteModal) {
        deleteModal.addEventListener('show.bs.modal', (event) => {
            const button = event.relatedTarget;
            if (!button) return;

            const donorId = button.getAttribute('data-donor-id');
            const donorName = button.getAttribute('data-donor-name');

            const deleteForm = document.getElementById('deleteDonorForm');
            const nameDisplay = document.getElementById('deleteDonorNameDisplay');

            if (deleteForm) deleteForm.action = `/admin/donors/${donorId}/delete`;
            if (nameDisplay) nameDisplay.textContent = donorName;
        });
    }
});
