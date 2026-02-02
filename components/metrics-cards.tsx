"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Package, AlertTriangle, Target, DollarSign } from "lucide-react"
import { products } from "./product-selector"
import { generateHistoricalData, calculateForecast } from "@/lib/forecast-utils"

interface MetricsCardsProps {
  selectedProduct: string
}

export function MetricsCards({ selectedProduct }: MetricsCardsProps) {
  const historicalData = generateHistoricalData(selectedProduct, 90)
  const forecast = calculateForecast(historicalData, 7)
  const product = products.find((p) => p.id === selectedProduct)

  const avgDailySales = Math.round(historicalData.slice(-30).reduce((sum, d) => sum + d.sales, 0) / 30)
  const forecastAccuracy = 92.3 // Simulated accuracy
  const nextWeekDemand = forecast.reduce((sum, d) => sum + d.predicted, 0)
  const currentStock = Math.round(avgDailySales * 5 + avgDailySales * 2)
  const daysOfStock = Math.round(currentStock / avgDailySales)
  const trend = historicalData[historicalData.length - 1].sales > historicalData[historicalData.length - 8].sales

  const metrics = [
    {
      title: "Avg Daily Sales",
      value: avgDailySales.toLocaleString(),
      unit: product?.unit || "units",
      icon: TrendingUp,
      trend: trend ? "+8.2%" : "-3.1%",
      trendUp: trend,
      color: "text-chart-2",
    },
    {
      title: "Forecast Accuracy",
      value: forecastAccuracy.toFixed(1),
      unit: "%",
      icon: Target,
      trend: "MAPE < 10%",
      trendUp: true,
      color: "text-chart-1",
    },
    {
      title: "Next 7-Day Demand",
      value: Math.round(nextWeekDemand).toLocaleString(),
      unit: product?.unit || "units",
      icon: Package,
      trend: "Predicted",
      trendUp: null,
      color: "text-chart-4",
    },
    {
      title: "Days of Stock",
      value: daysOfStock,
      unit: "days",
      icon: daysOfStock < 3 ? AlertTriangle : DollarSign,
      trend: daysOfStock < 3 ? "Low Stock!" : "Healthy",
      trendUp: daysOfStock >= 3,
      color: daysOfStock < 3 ? "text-destructive" : "text-chart-2",
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
