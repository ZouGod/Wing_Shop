// "use client"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { products, Product } from "./product-selector"  // Make sure Product type is exported
import { generateHistoricalData, calculateForecast } from "@/lib/forecast-utils"
import { useState, useEffect } from "react"

// Define the interface for inventory data
interface InventoryItem extends Product {
  currentStock: number
  avgDaily: number
  nextWeekDemand: number
  recommendedOrder: number
  stockLevel: number
  status: "critical" | "low" | "healthy" | "healthy-but-reorder"
}

export function InventoryTable() {
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadInventoryData = async () => {
      const data = await Promise.all(
        products.map(async (product): Promise<InventoryItem> => {
          const historical = await generateHistoricalData(product.id, 35)
          const forecast = calculateForecast(historical, 7)
          const avgDaily = Math.round(historical.reduce((sum, d) => sum + d.sales, 0) / Math.max(historical.length, 1))
          const nextWeekDemand = Math.round(forecast.reduce((sum, d) => sum + d.predicted, 0))
          
          // Current stock - in real app, this would come from an API
          const currentStock = Math.round(avgDaily * 7)
          
          // Stock level based on FORECAST demand (not historical average)
          const stockLevel = (currentStock / nextWeekDemand) * 100
          
          // Only reorder when below healthy threshold
          const safetyStock = avgDaily * 3
          let recommendedOrder = 0
          
          // FIX: Only suggest reorder when stock is insufficient for forecast
          if (currentStock < nextWeekDemand + safetyStock) {
            recommendedOrder = Math.max(0, nextWeekDemand + safetyStock - currentStock)
          }
          
          // Determine status
          let status: InventoryItem["status"] = "healthy"
          if (stockLevel < 30) {
            status = "critical"
          } else if (stockLevel < 50) {
            status = "low"
          } else if (stockLevel < 80) {
            status = "healthy-but-reorder"
          }
          
          // FIX: If we have enough for forecast + buffer, no reorder needed
          if (stockLevel >= 100) {
            recommendedOrder = 0
            status = "healthy"
          }

          return {
            ...product,
            currentStock,
            avgDaily,
            nextWeekDemand,
            recommendedOrder,
            stockLevel,
            status,
          }
        })
      )
      setInventoryData(data)
      setIsLoading(false)
    }
    loadInventoryData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading inventory data...</p>
      </div>
    )
  }

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
                  variant={
                    item.status === "critical" 
                      ? "destructive" 
                      : item.status === "low" 
                      ? "secondary" 
                      : "outline"
                  }
                  className={
                    item.status === "healthy" 
                      ? "border-chart-2 text-chart-2" 
                      : item.status === "healthy-but-reorder"
                      ? "border-blue-500 text-blue-500"
                      : ""
                  }
                >
                  {item.status === "critical" 
                    ? "Critical" 
                    : item.status === "low" 
                    ? "Low Stock" 
                    : item.status === "healthy-but-reorder"
                    ? "Reorder Suggested"
                    : "Healthy"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}