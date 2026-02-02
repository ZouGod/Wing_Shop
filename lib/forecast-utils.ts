// Simulated grocery sales data generator based on typical patterns
// In production, replace with real data from Corporación Favorita dataset or your own sales data

interface DataPoint {
  date: string
  sales: number
}

interface ForecastPoint {
  date: string
  predicted: number
  upperBound: number
  lowerBound: number
}

// Base daily sales by product (simulating Cambodia market)
const productBaseSales: Record<string, number> = {
  rice: 450, // kg per day
  water: 800, // bottles per day
  oil: 120, // liters per day
  noodles: 350, // packs per day
  sugar: 80, // kg per day
}

// Day of week multipliers (higher on weekends, market days)
const dayMultipliers = [1.2, 0.9, 0.95, 1.0, 1.1, 1.3, 1.25] // Sun-Sat

// Simulate economic shock impact (Cambodia-Thailand conflict)
const economicShockMultiplier = 0.85 // 15% demand reduction due to supply chain disruption

export function generateHistoricalData(productId: string, days: number): DataPoint[] {
  const baseSales = productBaseSales[productId] || 100
  const data: DataPoint[] = []

  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    const dayOfWeek = date.getDay()
    const dayMultiplier = dayMultipliers[dayOfWeek]

    // Add some randomness (±20%)
    const noise = 0.8 + Math.random() * 0.4

    // Seasonal pattern (higher at month start/end for essentials)
    const dayOfMonth = date.getDate()
    const monthlyPattern = dayOfMonth <= 5 || dayOfMonth >= 25 ? 1.15 : 1.0

    // Apply economic shock for recent data (last 30 days)
    const shockEffect = i < 30 ? economicShockMultiplier : 1.0

    const sales = Math.round(baseSales * dayMultiplier * monthlyPattern * noise * shockEffect)

    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      sales: Math.max(sales, 0),
    })
  }

  return data
}

export function calculateForecast(historical: DataPoint[], forecastDays: number): ForecastPoint[] {
  // Simple Moving Average with window of 7 days
  const windowSize = 7
  const recentData = historical.slice(-windowSize)

  const movingAverage = recentData.reduce((sum, d) => sum + d.sales, 0) / windowSize

  // Calculate standard deviation for confidence intervals
  const variance = recentData.reduce((sum, d) => sum + Math.pow(d.sales - movingAverage, 2), 0) / windowSize
  const stdDev = Math.sqrt(variance)

  // 95% confidence interval (1.96 * σ)
  const confidenceMargin = 1.96 * stdDev

  const forecast: ForecastPoint[] = []
  const today = new Date()

  for (let i = 1; i <= forecastDays; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)

    const dayOfWeek = date.getDay()
    const dayMultiplier = dayMultipliers[dayOfWeek]

    // Add slight trend based on recent direction
    const trendAdjustment = i * 0.5 // Small daily increase assumption

    const predicted = Math.round(movingAverage * dayMultiplier + trendAdjustment)

    forecast.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      predicted: Math.max(predicted, 0),
      upperBound: Math.round(predicted + confidenceMargin * dayMultiplier),
      lowerBound: Math.max(0, Math.round(predicted - confidenceMargin * dayMultiplier)),
    })
  }

  return forecast
}

// Calculate Mean Absolute Percentage Error (MAPE)
export function calculateMAPE(actual: number[], predicted: number[]): number {
  if (actual.length !== predicted.length || actual.length === 0) return 0

  const sum = actual.reduce((acc, a, i) => {
    if (a === 0) return acc
    return acc + Math.abs((a - predicted[i]) / a)
  }, 0)

  return (sum / actual.length) * 100
}
