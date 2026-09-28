import { Assembly } from "../assembly";
import { Item, lining, basin, toilet, cabinet, lights } from "./interior";
export function powder(a: Assembly): void {
  const r = "powder-utility"; lining(a, r);
  toilet(new Item(a, "powder-toilet", r, -4.13, 0, -5.32));
  basin(new Item(a, "powder-basin", r, -4.95, 0, -3.28, Math.PI / 2), 0.8);
  cabinet(new Item(a, "powder-cleaning", r, -3.38, 0, -5.42), 0.52, 2.25, 0.52);
  lights(a, r, [[-4.14, -3.7]]);
}
