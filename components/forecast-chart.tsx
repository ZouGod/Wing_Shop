"use client"

import { useEffect, useState, useMemo } from "react"
import {
  Area,
  CartesianGrid,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  ReferenceLine,
} from "recharts"
import { generateHistoricalData, calculateForecast } from "@/lib/forecast-utils"
import { products } from "./product-selector"

interface ForecastChartProps {
  selectedProduct: string
  forecastDays?: number
}

export function ForecastChart({ selectedProduct, forecastDays = 7 }: ForecastChartProps) {
  const product = products.find((p) => p.id === selectedProduct)
  const [historical, setHistorical] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedForecastDays, setSelectedForecastDays] = useState(forecastDays)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      // Load 30 days of historical data backward from today
      const data = await generateHistoricalData(selectedProduct, 30)
      setHistorical(data)
      setIsLoading(false)
    }
    loadData()
  }, [selectedProduct])

  // Sync forecastDays prop changes to internal state
  useEffect(() => {
    setSelectedForecastDays(forecastDays)
  }, [forecastDays])

  const chartData = useMemo(() => {
    if (historical.length === 0) return []

    const forecast = calculateForecast(historical, selectedForecastDays)

    // Combine historical and forecast data
    const historicalForChart = historical.map((d) => ({
      date: d.date,
      actual: d.sales,
      predicted: null as number | null,
      upperBound: null as number | null,
      lowerBound: null as number | null,
    }))

    const forecastForChart = forecast.map((d) => ({
      date: d.date,
      actual: null as number | null,
      predicted: d.predicted,
      upperBound: d.upperBound,
      lowerBound: d.lowerBound,
    }))

    return [...historicalForChart, ...forecastForChart]
  }, [historical, selectedForecastDays])

  const todayIndex = chartData.findIndex((d) => d.predicted !== null)

  // Calculate which ticks to show to avoid gaps (show every 5 days)
  const tickFormatter = (value: string, index: number) => {
    // Show every 5th tick or first and last
    if (index % 5 === 0 || index === 0 || index === chartData.length - 1) {
      return value
    }
    return ""
  }

  if (isLoading) {
    return (
      <div className="h-80 w-full flex items-center justify-center bg-muted/20 rounded-lg">
        <p className="text-muted-foreground">Loading real sales data...</p>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center bg-muted/20 rounded-lg">
        <p className="text-muted-foreground">No data available</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickLine={false}
              className="text-muted-foreground"
              tickFormatter={tickFormatter}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              className="text-muted-foreground"
              label={{
                value: product?.unit || "units",
                angle: -90,
                position: "insideLeft",
                className: "text-muted-foreground text-xs",
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Legend />
            {todayIndex > 0 && (
              <ReferenceLine
                x={chartData[todayIndex - 1]?.date}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                label={{ value: "Today", position: "top", className: "text-xs text-muted-foreground" }}
              />
            )}

            {/* Historical actual sales */}
            <Area
              type="monotone"
              dataKey="actual"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              fill="url(#actualGradient)"
              name="Actual Sales"
              connectNulls={false}
            />

            {/* Confidence interval (lower bound) */}
            <Area
              type="monotone"
              dataKey="lowerBound"
              stroke="none"
              fill="hsl(var(--chart-1))"
              fillOpacity={0.1}
              name="Lower Bound"
              connectNulls={false}
            />

            {/* Confidence interval (upper bound) */}
            <Area
              type="monotone"
              dataKey="upperBound"
              stroke="none"
              fill="hsl(var(--chart-1))"
              fillOpacity={0.1}
              name="Upper Bound"
              connectNulls={false}
            />

            {/* Forecast line */}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2 }}
              name="Predicted Demand"
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
