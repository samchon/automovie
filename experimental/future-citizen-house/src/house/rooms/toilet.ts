import { Item } from "./Item";

export function toilet(t: Item): void {
  t.round("pedestal", "white", 0, 0.20, 0, 0.31, 0.40, 0.47);
  t.round("bowl", "white", 0, 0.39, 0.07, 0.41, 0.20, 0.59);
  t.round("seat", "sanitary-seat", 0, 0.50, 0.08, 0.38, 0.035, 0.50);
  t.box("cistern", "white", 0, 0.62, -0.25, 0.40, 0.36, 0.15);
  t.box("flush", "steel", 0.1, 0.81, -0.25, 0.05, 0.008, 0.035);
}
