import { Item } from "./Item";
import { table } from "./table";
export function desk(t: Item, width = 1.2): void {
  table(t, width, 0.6);
  t.box("screen", "metal", 0, 1.01, -0.13, 0.5, 0.3, 0.025);
  t.box("screen-stand", "metal", 0, 0.815, -0.13, 0.04, 0.15, 0.04);
  t.box("keyboard", "white", 0, 0.7475, 0.13, 0.35, 0.015, 0.12);
}
