import type { Diet } from "./types";

export function allowedDiets(diet: Diet): Diet[] {
  switch (diet) {
    case "vegan":
      return ["vegan"];
    case "veg":
      return ["vegan", "veg"];
    case "egg":
      return ["vegan", "veg", "egg"];
    case "nonveg":
      return ["vegan", "veg", "egg", "nonveg"];
  }
}

export function tightenTime(maxMinutes: number): number {
  if (maxMinutes > 30) return 30;
  if (maxMinutes > 15) return 15;
  return 15;
}
