import { Chart } from "@/components/ui/chart"
// Wing Shop Dashboard JavaScript

// Global state
let forecastChart = null
const currentFilters = {
  product: "",
  store: "",
  days: 7,
}

// Initialize dashboard
document.addEventListener("DOMContentLoaded", () => {
  initializeFilters()
  loadDashboardData()
  setupEventListeners()
})

// Setup event listeners
function setupEventListeners() {
  document.getElementById("product-select").addEventListener("change", handleFilterChange)
  document.getElementById("store-select").addEventListener("change", handleFilterChange)
  document.getElementById("forecast-days").addEventListener("change", handleFilterChange)
  document.getElementById("refresh-btn").addEventListener("click", loadDashboardData)
}

// Handle filter changes
function handleFilterChange() {
  currentFilters.product = document.getElementById("product-select").value
  currentFilters.store = document.getElementById("store-select").value
  currentFilters.days = Number.parseInt(document.getElementById("forecast-days").value)
  loadDashboardData()
}

// Initialize filter dropdowns
async function initializeFilters() {
  try {
    // Load products
    const productsResponse = await fetch("/api/products")
    const products = await productsResponse.json()

    const productSelect = document.getElementById("product-select")
    products.forEach((product) => {
      const option = document.createElement("option")
      option.value = product
      option.textContent = product
      productSelect.appendChild(option)
    })

    // Load stores
    const storesResponse = await fetch("/api/stores")
    const stores = await storesResponse.json()

    const storeSelect = document.getElementById("store-select")
    stores.forEach((store) => {
      const option = document.createElement("option")
      option.value = store
      option.textContent = `Store ${store}`
      storeSelect.appendChild(option)
    })
  } catch (error) {
    console.error("Error loading filters:", error)
  }
}

// Load all dashboard data
async function loadDashboardData() {
  const dashboard = document.querySelector(".dashboard")
  dashboard.classList.add("loading")

  try {
    await Promise.all([loadMetrics(), loadForecastChart(), loadInventoryTable()])
  } catch (error) {
    console.error("Error loading dashboard:", error)
  } finally {
    dashboard.classList.remove("loading")
  }
}

// Load metrics
async function loadMetrics() {
  try {
    const params = new URLSearchParams()
    if (currentFilters.product) params.append("product", currentFilters.product)
    if (currentFilters.store) params.append("store", currentFilters.store)

    const response = await fetch(`/api/metrics?${params}`)
    const metrics = await response.json()

    document.getElementById("daily-avg").textContent = formatNumber(metrics.daily_avg || 0)
    document.getElementById("weekly-total").textContent = formatNumber(metrics.weekly_total || 0)

    const weeklyChange = document.getElementById("weekly-change")
    const change = metrics.weekly_change || 0
    weeklyChange.textContent = `${change >= 0 ? "+" : ""}${change.toFixed(1)}% vs last week`
    weeklyChange.className = `metric-change ${change >= 0 ? "positive" : "negative"}`

    document.getElementById("accuracy").textContent = `${(metrics.forecast_accuracy || 0).toFixed(1)}%`
    document.getElementById("mape").textContent = (metrics.mape || 0).toFixed(1)
  } catch (error) {
    console.error("Error loading metrics:", error)
  }
}

// Load forecast chart
async function loadForecastChart() {
  try {
    const params = new URLSearchParams()
    if (currentFilters.product) params.append("product", currentFilters.product)
    if (currentFilters.store) params.append("store", currentFilters.store)
    params.append("days", currentFilters.days)

    const historicalParams = new URLSearchParams(params)
    historicalParams.set("days", 60)
    const historicalResponse = await fetch(`/api/historical?${historicalParams}`)
    const historicalData = await historicalResponse.json()

    const forecastResponse = await fetch(`/api/forecast?${params}`)
    const forecastData = await forecastResponse.json()

    const historicalDates = historicalData.map((d) => d.date)
    const historicalValues = historicalData.map((d) => d.unit_sales)

    const forecastDates = forecastData.map((d) => d.date)
    const forecastValues = forecastData.map((d) => d.forecast)
    const lowerBound = forecastData.map((d) => d.lower)
    const upperBound = forecastData.map((d) => d.upper)

    const ctx = document.getElementById("forecast-chart").getContext("2d")

    if (forecastChart) {
      forecastChart.destroy()
    }

    forecastChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [...historicalDates, ...forecastDates],
        datasets: [
          {
            label: "Historical Sales",
            data: [...historicalValues, ...Array(forecastDates.length).fill(null)],
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            borderWidth: 2,
            tension: 0.4,
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 4,
          },
          {
            label: "Forecast",
            data: [...Array(historicalDates.length).fill(null), ...forecastValues],
            borderColor: "#22c55e",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.4,
            fill: false,
            pointRadius: 3,
            pointHoverRadius: 6,
          },
          {
            label: "Upper Bound",
            data: [...Array(historicalDates.length).fill(null), ...upperBound],
            borderColor: "rgba(34, 197, 94, 0.3)",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            borderWidth: 1,
            tension: 0.4,
            fill: "+1",
            pointRadius: 0,
          },
          {
            label: "Lower Bound",
            data: [...Array(historicalDates.length).fill(null), ...lowerBound],
            borderColor: "rgba(34, 197, 94, 0.3)",
            backgroundColor: "transparent",
            borderWidth: 1,
            tension: 0.4,
            fill: false,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: "index",
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "#1a1a24",
            titleColor: "#f5f5f7",
            bodyColor: "#a1a1aa",
            borderColor: "#2a2a3a",
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              label: (context) => {
                if (context.raw === null) return null
                return `${context.dataset.label}: ${formatNumber(context.raw)} units`
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              color: "rgba(42, 42, 58, 0.5)",
              drawBorder: false,
            },
            ticks: {
              color: "#71717a",
              maxTicksLimit: 10,
            },
          },
          y: {
            grid: {
              color: "rgba(42, 42, 58, 0.5)",
              drawBorder: false,
            },
            ticks: {
              color: "#71717a",
              callback: (value) => formatNumber(value),
            },
            beginAtZero: true,
          },
        },
      },
    })
  } catch (error) {
    console.error("Error loading forecast chart:", error)
  }
}

// Load inventory table
async function loadInventoryTable() {
  try {
    const params = new URLSearchParams()
    if (currentFilters.product) params.append("product", currentFilters.product)

    const response = await fetch(`/api/inventory?${params}`)
    const inventory = await response.json()

    const tbody = document.getElementById("inventory-body")
    tbody.innerHTML = ""

    let alertCount = 0

    inventory.forEach((item) => {
      if (item.status === "critical" || item.status === "warning") {
        alertCount++
      }

      const row = document.createElement("tr")
      row.innerHTML = `
                <td><strong>${item.product}</strong></td>
                <td>${formatNumber(item.current_stock)}</td>
                <td>${formatNumber(item.daily_demand)}/day</td>
                <td>${item.days_of_stock.toFixed(1)} days</td>
                <td><span class="status-tag ${item.status}">${item.status}</span></td>
                <td><span class="action-text ${item.status}">${item.action}</span></td>
            `
      tbody.appendChild(row)
    })

    document.getElementById("alerts-count").textContent = alertCount
  } catch (error) {
    console.error("Error loading inventory:", error)
  }
}

// Format number with commas
function formatNumber(num) {
  if (num === null || num === undefined) return "--"
  return Math.round(num).toLocaleString()
}
