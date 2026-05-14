// Real sales data loader from CSV
// Uses actual store sales data from store_44_sales_data.csv

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

interface RawCSVRecord {
  date: string
  unit_sales: string
  transactions: string
  dcoilwtico: string
  onpromotion: string
  is_holiday: string
  dayofweek: string
  month: string
  year: string
  is_weekend: string
  is_payday: string
  sales_lag_7: string
  sales_rolling_mean_7: string
  sales_rolling_mean_14: string
  sales_rolling_mean_30: string
}

const cachedCSVData: Record<string, RawCSVRecord[]> = {}

// Map productId to CSV filename
function getCSVFilename(productId: string): string {
  const productMap: Record<string, string> = {
    "grocery-i": "store_44_GROCERY_I.csv",
    beverages: "store_44_BEVERAGES.csv",
    "grocery-ii": "store_44_GROCERY_II.csv",
    "bread-bakery": "store_44_BREAD_BAKERY.csv",
    produce: "store_44_PRODUCE.csv",
    dairy: "store_44_DAIRY.csv",
    meats: "store_44_MEATS.csv",
    "frozen-foods": "store_44_FROZEN_FOODS.csv",
    beauty: "store_44_BEAUTY.csv",
    cleaning: "store_44_CLEANING.csv",
  }
  return productMap[productId] || "store_44_sales_data.csv"
}

// Load CSV data from public folder
async function loadCSVData(productId: string): Promise<RawCSVRecord[]> {
  if (cachedCSVData[productId]) {
    return cachedCSVData[productId]
  }

  try {
    const filename = getCSVFilename(productId)
    const response = await fetch(`/${filename}`)
    
    if (!response.ok) {
      console.error(`Failed to load ${filename}: ${response.status} ${response.statusText}`)
      return []
    }
    
    const csvText = await response.text()
    
    if (!csvText || csvText.length === 0) {
      console.error(`CSV file ${filename} is empty`)
      return []
    }
    
    const lines = csvText.trim().split("\n")
    
    if (lines.length < 2) {
      console.error(`CSV file ${filename} has no data rows`)
      return []
    }
    
    const headers = lines[0].split(",")

    const data: RawCSVRecord[] = lines.slice(1).map((line) => {
      const values = line.split(",")
      const record: any = {}
      headers.forEach((header, index) => {
        record[header.trim()] = values[index]?.trim() || ""
      })
      return record as RawCSVRecord
    })

    console.log(`Loaded ${data.length} rows from ${filename}`)
    cachedCSVData[productId] = data
    return data
  } catch (error) {
    console.error("Error loading CSV data for", productId, ":", error)
    return []
  }
}

// Day of week multipliers (higher on weekends, market days)
const dayMultipliers = [1.2, 0.9, 0.95, 1.0, 1.1, 1.3, 1.25] // Sun-Sat

export async function generateHistoricalData(productId: string, days: number = 30): Promise<DataPoint[]> {
  const csvData = await loadCSVData(productId)

  if (csvData.length === 0) {
    // Fallback if CSV fails to load
    return generateFallbackData(productId, days)
  }

  // Get today's date
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - days) // 30 days backward

  // Load appropriate data from CSV
  const historicalData = csvData.slice(0, Math.min(days, csvData.length))

  // Map CSV dates to dates starting 30 days ago
  const referenceDate = new Date("2013-01-31") // First date in CSV

  return historicalData.map((record, index) => {
    const csvDate = new Date(record.date)
    const daysFromReference = Math.floor((csvDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Create corresponding date 30 days back from today
    const displayDate = new Date(startDate)
    displayDate.setDate(displayDate.getDate() + index)

    return {
      date: displayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      sales: Math.round(parseFloat(record.unit_sales) || 0),
    }
  })
}

// Fallback simulated data if CSV loading fails - NO RANDOMIZATION
function generateFallbackData(productId: string, days: number = 30): DataPoint[] {
  const productBaseSales: Record<string, number> = {
    "grocery-i": 6000,
    beverages: 4500,
    "grocery-ii": 3200,
    "bread-bakery": 2500,
    produce: 2800,
    dairy: 2200,
    meats: 1800,
    "frozen-foods": 2000,
    beauty: 1200,
    cleaning: 1500,
  }

  const baseSales = productBaseSales[productId] || 2000
  const data: DataPoint[] = []
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - days) // 30 days backward from today

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)

    const dayOfWeek = date.getDay()
    const dayMultiplier = dayMultipliers[dayOfWeek]
    // NO random noise - use consistent multiplier only
    const sales = Math.round(baseSales * dayMultiplier)

    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      sales: Math.max(sales, 0),
    })
  }

  return data
}

export function calculateForecast(historical: DataPoint[], forecastDays: number): ForecastPoint[] {
  // Simple Moving Average with window of 7 days
  const windowSize = Math.min(7, historical.length)
  const recentData = historical.slice(-windowSize)

  const movingAverage = recentData.reduce((sum, d) => sum + d.sales, 0) / windowSize

  // Calculate standard deviation for confidence intervals
  const variance = recentData.reduce((sum, d) => sum + Math.pow(d.sales - movingAverage, 2), 0) / windowSize
  const stdDev = Math.sqrt(variance)

  // 95% confidence interval (1.96 * σ)
  const confidenceMargin = 1.96 * stdDev

  const forecast: ForecastPoint[] = []
  
  // Use today's actual date
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
