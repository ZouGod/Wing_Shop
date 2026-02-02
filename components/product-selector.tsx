"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const products = [
  { id: "grocery-i", name: "GROCERY I", icon: "🛒", unit: "units" },
  { id: "beverages", name: "BEVERAGES", icon: "🥤", unit: "units" },
  { id: "grocery-ii", name: "GROCERY II", icon: "🛒", unit: "units" },
  { id: "bread-bakery", name: "BREAD/BAKERY", icon: "🍞", unit: "units" },
  { id: "produce", name: "PRODUCE", icon: "🥬", unit: "units" },
  { id: "dairy", name: "DAIRY", icon: "🥛", unit: "units" },
  { id: "meats", name: "MEATS", icon: "🥩", unit: "units" },
  { id: "frozen-foods", name: "FROZEN FOODS", icon: "❄️", unit: "units" },
  { id: "beauty", name: "BEAUTY", icon: "💄", unit: "units" },
  { id: "cleaning", name: "CLEANING", icon: "🧹", unit: "units" },
]

interface ProductSelectorProps {
  selectedProduct: string
  onProductChange: (product: string) => void
}

export function ProductSelector({ selectedProduct, onProductChange }: ProductSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {products.map((product) => (
        <Button
          key={product.id}
          variant={selectedProduct === product.id ? "default" : "outline"}
          size="sm"
          onClick={() => onProductChange(product.id)}
          className={cn("gap-2", selectedProduct === product.id && "bg-primary text-primary-foreground")}
        >
          <span>{product.icon}</span>
          {product.name}
        </Button>
      ))}
    </div>
  )
}

export { products }
