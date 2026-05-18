import axios from 'axios'
import type { FoodItem } from '../store'

const BASE_URL = 'https://world.openfoodfacts.org'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapProductToFoodItem = (product: any): FoodItem | null => {
  if (!product || !product.nutriments) return null

  const calories = product.nutriments['energy-kcal_100g'] || (product.nutriments.energy_100g ? product.nutriments.energy_100g / 4.184 : 0)

  if (calories === 0 && !product.nutriments.proteins_100g && !product.nutriments.carbohydrates_100g && !product.nutriments.fat_100g) {
    return null // Not enough nutritional info
  }

  return {
    id: product.id || product.code,
    name: product.product_name || 'Unknown Product',
    brand: product.brands || undefined,
    calories: Number(calories) || 0,
    protein: Number(product.nutriments.proteins_100g) || 0,
    carbs: Number(product.nutriments.carbohydrates_100g) || 0,
    fat: Number(product.nutriments.fat_100g) || 0,
    image_url: product.image_url || undefined,
  }
}

export const searchProducts = async (query: string): Promise<FoodItem[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/cgi/search.pl`, {
      params: {
        search_terms: query,
        search_simple: 1,
        action: 'process',
        json: 1,
        page_size: 20,
        fields: 'id,code,product_name,brands,nutriments,image_url'
      }
    })

    if (response.data && response.data.products) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return response.data.products.map(mapProductToFoodItem).filter(Boolean) as FoodItem[]
    }
    return []
  } catch (error) {
    console.error('Error searching products:', error)
    return []
  }
}

export const getProductByBarcode = async (barcode: string): Promise<FoodItem | null> => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v0/product/${barcode}.json`, {
      params: {
        fields: 'id,code,product_name,brands,nutriments,image_url'
      }
    })

    if (response.data && response.data.product) {
      return mapProductToFoodItem(response.data.product)
    }
    return null
  } catch (error) {
    console.error('Error getting product by barcode:', error)
    return null
  }
}
