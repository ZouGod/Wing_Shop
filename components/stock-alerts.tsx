"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, TrendingUp, Package, Calendar } from "lucide-react"
import { products } from "./product-selector"
import { generateHistoricalData, calculateForecast } from "@/lib/forecast-utils"

export function StockAlerts() {
  const alerts = products
    .map((product) => {
      const historical = generateHistoricalData(product.id, 30)
      const forecast = calculateForecast(historical, 7)
      const avgDaily = Math.round(historical.reduce((sum, d) => sum + d.sales, 0) / 30)

      const daysOfStock = 2 + Math.random() * 8
      const currentStock = Math.round(avgDaily * daysOfStock)
      const stockoutRisk = currentStock < avgDaily * 3

      // Calculate demand spike
      const recentAvg = historical.slice(-7).reduce((sum, d) => sum + d.sales, 0) / 7
      const previousAvg = historical.slice(-14, -7).reduce((sum, d) => sum + d.sales, 0) / 7
      const demandSpike = recentAvg > previousAvg * 1.2

      return {
        product,
        currentStock,
        avgDaily,
        daysUntilStockout: Math.round(currentStock / avgDaily),
        stockoutRisk,
        demandSpike,
        demandChange: (((recentAvg - previousAvg) / previousAvg) * 100).toFixed(1),
      }
    })
    .filter((a) => a.stockoutRisk || a.demandSpike)

  return (
    <div className="space-y-4">
      {alerts.length === 0 ? (
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
                </div>
                <div className="flex items-center justify-center">
                  <Button className="w-full">Create Reorder</Button>
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
              <p>Simple Moving Average (SMA) with 7-day window and seasonal adjustment</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Confidence Interval</h4>
              <p>95% CI based on historical variance (±1.96σ)</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Data Source</h4>
              <p>Simulated from Corporación Favorita patterns (Kaggle public dataset)</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Recommended Upgrade</h4>
              <p>Use Prophet or ARIMA for production with real historical data</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
