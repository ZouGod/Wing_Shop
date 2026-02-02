"use client"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { products } from "./product-selector"
import { generateHistoricalData, calculateForecast } from "@/lib/forecast-utils"

export function InventoryTable() {
  const inventoryData = products.map((product) => {
    const historical = generateHistoricalData(product.id, 30)
    const forecast = calculateForecast(historical, 7)
    const avgDaily = Math.round(historical.reduce((sum, d) => sum + d.sales, 0) / 30)
    const nextWeekDemand = Math.round(forecast.reduce((sum, d) => sum + d.predicted, 0))

    // Simulate current stock (between 2-10 days of inventory)
    const daysOfStock = 2 + Math.random() * 8
    const currentStock = Math.round(avgDaily * daysOfStock)
    const reorderPoint = avgDaily * 3 // 3 days buffer
    const recommendedOrder = Math.max(0, nextWeekDemand - currentStock + reorderPoint)

    const stockLevel = (currentStock / (avgDaily * 7)) * 100 // % of weekly demand

    return {
      ...product,
      currentStock,
      avgDaily,
      nextWeekDemand,
      reorderPoint,
      recommendedOrder,
      stockLevel,
      status: stockLevel < 30 ? "critical" : stockLevel < 50 ? "low" : "healthy",
    }
  })

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Current Stock</TableHead>
            <TableHead className="text-right">Avg Daily</TableHead>
            <TableHead className="text-right">7-Day Forecast</TableHead>
            <TableHead>Stock Level</TableHead>
            <TableHead className="text-right">Reorder Qty</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventoryData.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  {item.name}
                </div>
              </TableCell>
              <TableCell className="text-right">
                {item.currentStock.toLocaleString()} {item.unit}
              </TableCell>
              <TableCell className="text-right">
                {item.avgDaily.toLocaleString()} {item.unit}
              </TableCell>
              <TableCell className="text-right">
                {item.nextWeekDemand.toLocaleString()} {item.unit}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={Math.min(item.stockLevel, 100)} className="h-2 w-20" />
                  <span className="text-xs text-muted-foreground">{Math.round(item.stockLevel)}%</span>
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">
                {item.recommendedOrder > 0 ? (
                  <span className="text-chart-1">+{item.recommendedOrder.toLocaleString()}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant={item.status === "critical" ? "destructive" : item.status === "low" ? "secondary" : "outline"}
                  className={item.status === "healthy" ? "border-chart-2 text-chart-2" : ""}
                >
                  {item.status === "critical" ? "Critical" : item.status === "low" ? "Low Stock" : "Healthy"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
