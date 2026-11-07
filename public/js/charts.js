/**
 * LifeDrop – Admin Analytics Charts with Chart.js
 * Fetches real database metrics dynamically from `/admin/api/charts`.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const stockCanvas = document.getElementById('stockDistributionChart');
    const donorCanvas = document.getElementById('monthlyDonorsChart');
    const urgencyCanvas = document.getElementById('requestUrgencyChart');
    const statusCanvas = document.getElementById('requestStatusChart');

    if (!stockCanvas && !donorCanvas && !urgencyCanvas && !statusCanvas) {
        return; // Not on the dashboard page
    }

    try {
        const response = await fetch('/admin/api/charts');
        if (!response.ok) throw new Error('Failed to load chart metrics');
        const data = await response.json();

        // Common Chart styling options
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.color = '#64748B';

        // -------------------------------------------------------------
        // Chart 1: Blood Group Stock Distribution (Bar Chart)
        // -------------------------------------------------------------
        if (stockCanvas && data.stockDistribution) {
            new Chart(stockCanvas, {
                type: 'bar',
                data: {
                    labels: data.stockDistribution.labels,
                    datasets: [{
                        label: 'Available Units',
                        data: data.stockDistribution.data,
                        backgroundColor: [
                            '#D62839', '#A4162A', '#E11D48', '#BE123C',
                            '#F43F5E', '#FB7185', '#E11D48', '#991B1B'
                        ],
                        borderRadius: 6,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => ` Available: ${ctx.raw} units`
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { precision: 0 },
                            grid: { color: '#F1F5F9' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }

        // -------------------------------------------------------------
        // Chart 2: Monthly Donor Registrations (Line / Area Chart)
        // -------------------------------------------------------------
        if (donorCanvas && data.donorRegistrations) {
            new Chart(donorCanvas, {
                type: 'line',
                data: {
                    labels: data.donorRegistrations.labels.length > 0 ? data.donorRegistrations.labels : ['Current Month'],
                    datasets: [{
                        label: 'New Donors',
                        data: data.donorRegistrations.data.length > 0 ? data.donorRegistrations.data : [0],
                        borderColor: '#2563EB',
                        backgroundColor: 'rgba(37, 99, 235, 0.12)',
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.35,
                        pointBackgroundColor: '#2563EB',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { precision: 0 },
                            grid: { color: '#F1F5F9' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }

        // -------------------------------------------------------------
        // Chart 3: Blood Request by Urgency (Doughnut Chart)
        // -------------------------------------------------------------
        if (urgencyCanvas && data.requestUrgency) {
            new Chart(urgencyCanvas, {
                type: 'doughnut',
                data: {
                    labels: data.requestUrgency.labels,
                    datasets: [{
                        data: data.requestUrgency.data,
                        backgroundColor: ['#16A34A', '#D97706', '#DC2626'],
                        borderWidth: 2,
                        borderColor: '#FFFFFF'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { boxWidth: 12, padding: 14 }
                        }
                    },
                    cutout: '68%'
                }
            });
        }

        // -------------------------------------------------------------
        // Chart 4: Request Status Distribution (Doughnut Chart)
        // -------------------------------------------------------------
        if (statusCanvas && data.requestStatus) {
            new Chart(statusCanvas, {
                type: 'doughnut',
                data: {
                    labels: data.requestStatus.labels,
                    datasets: [{
                        data: data.requestStatus.data,
                        backgroundColor: ['#F59E0B', '#2563EB', '#10B981', '#EF4444'],
                        borderWidth: 2,
                        borderColor: '#FFFFFF'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { boxWidth: 12, padding: 14 }
                        }
                    },
                    cutout: '68%'
                }
            });
        }
    } catch (err) {
        console.error('Error rendering dashboard charts:', err);
    }
});
