"use client"

import { useMemo } from "react"
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
  forecastDays: number
}

export function ForecastChart({ selectedProduct, forecastDays }: ForecastChartProps) {
  const product = products.find((p) => p.id === selectedProduct)

  const chartData = useMemo(() => {
    const historical = generateHistoricalData(selectedProduct, 60)
    const forecast = calculateForecast(historical, forecastDays)

    // Combine historical and forecast data
    const historicalForChart = historical.slice(-30).map((d) => ({
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
  }, [selectedProduct, forecastDays])

  const todayIndex = chartData.findIndex((d) => d.predicted !== null)

  return (
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
          <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} className="text-muted-foreground" />
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
  )
}
