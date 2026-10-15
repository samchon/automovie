import { cabinet } from "./cabinet";
import { Item } from "./Item";

/** Furnish a vanity basin of `width`: base cabinet, rim, bowl, tap and mirror. */
export function basin(t: Item, width = 0.65): void {
  cabinet(t, width, 0.8, 0.48);
  t.box("rim", "white", 0, 0.825, 0, width + 0.02, 0.05, 0.50);
  t.round("bowl", "tile", 0, 0.853, 0.025, width * 0.65, 0.018, 0.3);
  t.box("tap", "steel", 0.16, 0.98, -0.17, 0.028, 0.26, 0.028);
  t.box("spout", "steel", 0.16, 1.1, -0.11, 0.028, 0.028, 0.13);
  t.box("mirror", "steel", 0, 1.5, -0.246, width, 0.7, 0.018);
}
