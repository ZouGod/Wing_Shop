"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ForecastChart } from "./forecast-chart"
import { InventoryTable } from "./inventory-table"
import { StockAlerts } from "./stock-alerts"
import { MetricsCards } from "./metrics-cards"
import { ProductSelector } from "./product-selector"
import { Package, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react"

export function DemandForecastDashboard() {
  const [selectedProduct, setSelectedProduct] = useState("grocery-i")
  const [forecastPeriod, setForecastPeriod] = useState("7")

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Wing Shop</h1>
                <p className="text-sm text-muted-foreground">Inventory & Demand Forecasting</p>
              </div>
            </div>
            <img src="/wingshop.png" alt="Wing Shop Logo" className="h-8 w-auto" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <ProductSelector selectedProduct={selectedProduct} onProductChange={setSelectedProduct} />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Forecast Period:</span>
            <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="14">14 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Metrics */}
        <MetricsCards selectedProduct={selectedProduct} forecastPeriod={Number.parseInt(forecastPeriod)} />

        {/* Main Content */}
        <Tabs defaultValue="forecast" className="mt-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="forecast" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Forecast
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alerts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="forecast" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Demand Forecast</CardTitle>
                <CardDescription>
                  Time-series prediction using Moving Average method with {forecastPeriod}-day horizon
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ForecastChart selectedProduct={selectedProduct} forecastDays={Number.parseInt(forecastPeriod)} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Inventory Status</CardTitle>
                <CardDescription>Stock levels and recommended reorder quantities</CardDescription>
              </CardHeader>
              <CardContent>
                <InventoryTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="mt-6">
            <StockAlerts />
          </TabsContent>
        </Tabs>

        {/* Data Source Attribution */}
        <footer className="mt-8 border-t border-border pt-4">
          <p className="text-center text-xs text-muted-foreground">
            Wing Tower Building, Preah Moinivong Blvd corner Kampuchea Kroam, Sangkat Monurom, Khan Prampir Meakara, Phnom Penh
            <br />
            © 2026 Wing Bank (Cambodia) Plc
          </p>
        </footer>
      </main>
    </div>
  )
}
