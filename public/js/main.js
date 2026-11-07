/**
 * LifeDrop – Public Frontend Scripts
 * Handles client-side validations, real-time age checks, and interactive filtering.
 */

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // 1. Donor Registration Real-time Validation & Age Calculator
    // -------------------------------------------------------------
    const donorForm = document.getElementById('donorRegistrationForm');
    const ageInput = document.getElementById('donorAge');
    const ageFeedback = document.getElementById('ageFeedback');

    if (ageInput && ageFeedback) {
        ageInput.addEventListener('input', () => {
            const age = parseInt(ageInput.value, 10);
            if (isNaN(age) || age < 18 || age > 65) {
                ageFeedback.textContent = 'Eligible donors must be between 18 and 65 years old.';
                ageFeedback.className = 'text-danger small mt-1';
                ageInput.classList.add('is-invalid');
                ageInput.classList.remove('is-valid');
            } else {
                ageFeedback.textContent = 'Age is eligible for blood donation.';
                ageFeedback.className = 'text-success small mt-1';
                ageInput.classList.remove('is-invalid');
                ageInput.classList.add('is-valid');
            }
        });
    }

    if (donorForm) {
        donorForm.addEventListener('submit', (e) => {
            const age = parseInt(ageInput ? ageInput.value : '0', 10);
            if (age < 18 || age > 65) {
                e.preventDefault();
                alert('Donation criteria not met: Donor age must be between 18 and 65 years.');
                ageInput.focus();
                return false;
            }
        });
    }

    // -------------------------------------------------------------
    // 2. Public Blood Availability Real-Time Filter
    // -------------------------------------------------------------
    const searchInput = document.getElementById('availabilitySearch');
    const statusFilter = document.getElementById('availabilityStatusFilter');
    const bloodCards = document.querySelectorAll('.blood-card-item');

    function filterBloodCards() {
        if (!bloodCards.length) return;
        const query = (searchInput ? searchInput.value : '').trim().toUpperCase();
        const selectedStatus = statusFilter ? statusFilter.value : 'all';

        let visibleCount = 0;

        bloodCards.forEach(card => {
            const bloodGroup = card.getAttribute('data-blood-group') || '';
            const status = card.getAttribute('data-status') || '';

            const matchesQuery = !query || bloodGroup.includes(query);
            const matchesStatus = selectedStatus === 'all' || status === selectedStatus;

            if (matchesQuery && matchesStatus) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        const emptyState = document.getElementById('availabilityEmptyState');
        if (emptyState) {
            emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
        }
    }

    if (searchInput) searchInput.addEventListener('input', filterBloodCards);
    if (statusFilter) statusFilter.addEventListener('change', filterBloodCards);

    // -------------------------------------------------------------
    // 3. Auto-dismiss alerts after 6 seconds
    // -------------------------------------------------------------
    const alertElements = document.querySelectorAll('.auto-dismiss');
    alertElements.forEach(alertEl => {
        setTimeout(() => {
            alertEl.style.opacity = '0';
            setTimeout(() => alertEl.remove(), 400);
        }, 6000);
    });
});
