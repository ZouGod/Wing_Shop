"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, TrendingUp, Package, Calendar } from "lucide-react"
import { products } from "./product-selector"
import { generateHistoricalData, calculateForecast } from "@/lib/forecast-utils"
import { useState, useEffect } from "react"

export function StockAlerts() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadAlerts = async () => {
      const alertsData = await Promise.all(
        products.map(async (product) => {
          const historical = await generateHistoricalData(product.id, 100)
          const forecast = calculateForecast(historical, 7)
          
          // Calculate actual averages from all historical data
          const avgDaily = Math.round(historical.reduce((sum, d) => sum + d.sales, 0) / Math.max(historical.length, 1))
          const latestSales = historical[historical.length - 1]?.sales || avgDaily

          // Current stock based on 7 days of inventory
          const currentStock = Math.round(avgDaily * 7)
          const stockoutRisk = currentStock < avgDaily * 3

          // Calculate actual demand spike from real data
          const recentAvg = historical.slice(-7).length > 0 
            ? historical.slice(-7).reduce((sum, d) => sum + d.sales, 0) / 7
            : avgDaily
          const previousAvg = historical.slice(-14, -7).length > 0
            ? historical.slice(-14, -7).reduce((sum, d) => sum + d.sales, 0) / 7
            : avgDaily
          const demandChange = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0
          const demandSpike = Math.abs(demandChange) > 20 // More than 20% change

          // Calculate days until stockout
          const daysUntilStockout = avgDaily > 0 ? Math.round(currentStock / avgDaily) : 0

          return {
            product,
            currentStock,
            avgDaily,
            latestSales,
            daysUntilStockout,
            stockoutRisk,
            demandSpike,
            demandChange: demandChange.toFixed(1),
            forecastedDemand: Math.round(forecast.reduce((sum, d) => sum + d.predicted, 0) / 7),
          }
        })
      )
      // Show alerts for products with stock risk or significant demand changes
      const filteredAlerts = alertsData.filter((a) => a.stockoutRisk || a.demandSpike)
      setAlerts(filteredAlerts)
      setIsLoading(false)
    }
    loadAlerts()
  }, [])

  return (
    <div className="space-y-4">
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading stock alerts...</p>
          </CardContent>
        </Card>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium text-foreground">All Clear</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                No stock alerts at this time. Inventory levels are healthy.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        alerts.map((alert) => (
          <Card key={alert.product.id} className={alert.stockoutRisk ? "border-destructive" : "border-chart-4"}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{alert.product.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{alert.product.name}</CardTitle>
                    <CardDescription>
                      Current: {alert.currentStock.toLocaleString()} {alert.product.unit}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  {alert.stockoutRisk && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Stock Risk
                    </Badge>
                  )}
                  {alert.demandSpike && (
                    <Badge className="flex items-center gap-1 bg-chart-4 text-foreground">
                      <TrendingUp className="h-3 w-3" />
                      Demand Spike
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-muted p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Days Until Stockout
                  </div>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{alert.daysUntilStockout} days</p>
                  <p className="mt-1 text-xs text-muted-foreground">Avg Daily: {alert.avgDaily.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    Demand Change (7d)
                  </div>
                  <p
                    className={`mt-1 text-2xl font-semibold ${Number.parseFloat(alert.demandChange) > 0 ? "text-chart-1" : "text-chart-2"}`}
                  >
                    {Number.parseFloat(alert.demandChange) > 0 ? "+" : ""}
                    {alert.demandChange}%
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Forecasted: {alert.forecastedDemand.toLocaleString()}/day</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    Current Stock
                  </div>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{alert.currentStock.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{alert.product.unit}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Forecasting Methodology Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Forecasting Methodology</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="font-medium text-foreground">Method Used</h4>
              <p>Moving Average (MA) with 7-day window and seasonal adjustment</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Evaluation Metric</h4>
              <p>5.7% MAPE</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Model Name</h4>
              <p>Random Forest</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Developer</h4>
              <p>Haksou Sang</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
