import { ImageLabeler } from "@react-native-ml-kit/image-labeling";

const FOOD_MAP = {
  pizza: "Pizza",
  burger: "Burger",
  sandwich: "Sandwich",
  rice: "Rice",
  bread: "Bread",
  egg: "Egg",
  chicken: "Chicken",
  fish: "Fish",
  sushi: "Sushi",
  pasta: "Pasta",
  noodles: "Noodles",
  dal: "Dal",
  lentil: "Dal",
  curry: "Curry",
  salad: "Salad",
};

export async function detectFoodFromImage(uri) {
  const labels = await ImageLabeler.label(uri);

  labels.sort((a, b) => b.confidence - a.confidence);

  for (const item of labels) {
    const name = item.text.toLowerCase();

    for (const key in FOOD_MAP) {
      if (name.includes(key)) {
        return FOOD_MAP[key];
      }
    }
  }

  return "Food (Review & Edit)";
}
