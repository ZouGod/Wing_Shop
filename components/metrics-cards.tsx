"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Package, AlertTriangle, Target, DollarSign } from "lucide-react"
import { useState, useEffect } from "react"
import { products } from "./product-selector"
import { generateHistoricalData, calculateForecast } from "@/lib/forecast-utils"

interface MetricsCardsProps {
  selectedProduct: string
  forecastPeriod?: number
}

export function MetricsCards({ selectedProduct, forecastPeriod = 7 }: MetricsCardsProps) {
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [forecast, setForecast] = useState<any[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const data = await generateHistoricalData(selectedProduct, 35)
      const pred = calculateForecast(data, forecastPeriod)
      setHistoricalData(data)
      setForecast(pred)
      setIsLoaded(true)
    }
    loadData()
  }, [selectedProduct, forecastPeriod])

  if (!isLoaded) {
    return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" />
  }
  const product = products.find((p) => p.id === selectedProduct)

  const avgDailySales = Math.round(historicalData.reduce((sum, d) => sum + d.sales, 0) / Math.max(historicalData.length, 1))
  const avgDailySales7Days = historicalData.slice(-7).length > 0 
    ? Math.round(historicalData.slice(-7).reduce((sum, d) => sum + d.sales, 0) / 7)
    : avgDailySales
  const avgDailySales30Days = avgDailySales
  
  // Calculate trend based on actual data
  const trend = historicalData.length >= 8 
    ? historicalData[historicalData.length - 1].sales > historicalData[historicalData.length - 8].sales
    : false
  const trendPercentage = historicalData.length >= 8
    ? ((historicalData[historicalData.length - 1].sales - historicalData[historicalData.length - 8].sales) / historicalData[historicalData.length - 8].sales * 100).toFixed(1)
    : "0.0"
  
  // Calculate forecast accuracy based on actual variance
  const forecastVariance = historicalData.length > 0
    ? Math.sqrt(historicalData.reduce((sum, d) => sum + Math.pow(d.sales - avgDailySales, 2), 0) / historicalData.length)
    : 0
  const forecastAccuracy = Math.max(85, Math.min(95, 95 - (forecastVariance / avgDailySales * 100)))
  
  const nextDemand = forecast.reduce((sum, d) => sum + d.predicted, 0)
  const currentStock = Math.round(avgDailySales * 7) // 7 days of stock
  const requiredStock = Math.round(avgDailySales * forecastPeriod)
  const daysOfStockAvailable = avgDailySales > 0 ? Math.round(currentStock / avgDailySales) : 0
  const stockSufficiency = currentStock >= requiredStock

  const metrics = [
    {
      title: "Avg Daily Sales",
      value: avgDailySales.toLocaleString(),
      unit: product?.unit || "units",
      icon: TrendingUp,
      trend: trend ? `+${trendPercentage}%` : `${trendPercentage}%`,
      trendUp: trend,
      color: "text-chart-2",
    },
    {
      title: "Forecast Accuracy",
      value: forecastAccuracy.toFixed(1),
      unit: "%",
      icon: Target,
      trend: `Variance: ${(forecastVariance / avgDailySales * 100).toFixed(1)}%`,
      trendUp: forecastAccuracy > 90,
      color: forecastAccuracy > 90 ? "text-chart-1" : "text-chart-4",
    },
    {
      title: `Next ${forecastPeriod}-Day Demand`,
      value: Math.round(nextDemand).toLocaleString(),
      unit: product?.unit || "units",
      icon: Package,
      trend: `Avg: ${Math.round(nextDemand / forecastPeriod).toLocaleString()}/day`,
      trendUp: null,
      color: "text-chart-4",
    },
    {
      title: "Days of Stock",
      value: daysOfStockAvailable,
      unit: "days",
      icon: stockSufficiency ? DollarSign : AlertTriangle,
      trend: stockSufficiency ? `Covers ${forecastPeriod}d` : `Only ${daysOfStockAvailable}d of ${forecastPeriod}d`,
      trendUp: stockSufficiency,
      color: stockSufficiency ? "text-chart-2" : "text-destructive",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{metric.title}</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-semibold text-foreground">{metric.value}</span>
                  <span className="text-sm text-muted-foreground">{metric.unit}</span>
                </div>
                <div className="mt-1 flex items-center gap-1">
                  {metric.trendUp !== null &&
                    (metric.trendUp ? (
                      <TrendingUp className="h-3 w-3 text-chart-2" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-destructive" />
                    ))}
                  <span
                    className={`text-xs ${metric.trendUp === false ? "text-destructive" : metric.trendUp === true ? "text-chart-2" : "text-muted-foreground"}`}
                  >
                    {metric.trend}
                  </span>
                </div>
              </div>
              <div className={`rounded-lg bg-muted p-2 ${metric.color}`}>
                <metric.icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
