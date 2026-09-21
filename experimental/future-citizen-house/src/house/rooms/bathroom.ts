import { Assembly } from "../assembly";
import { Item, lining, basin, toilet, cabinet, lights } from "./interior";
export function bathroom(a: Assembly): void {
  const r = "upper-bathroom"; lining(a, r);
  basin(new Item(a, "bath-vanity", r, -4.99, 3.2, 2.16, Math.PI / 2), 1.0);
  toilet(new Item(a, "bath-toilet", r, -4.95, 3.2, 3.45, Math.PI / 2));
  const shower = new Item(a, "bath-shower", r, -4.14, 3.2, 4.94);
  shower.box("tray", "white", 0, 0.035, 0, 2.05, 0.07, 1.45);
  shower.box("drain", "steel", 0, 0.072, 0, 0.12, 0.004, 0.12);
  shower.box("fixed-screen", "glass", -0.45, 1.13, -0.73, 1.1, 2.2, 0.012);
  shower.box("screen-rail", "metal", -0.45, 2.24, -0.73, 1.1, 0.025, 0.025);
  shower.box("riser", "steel", -0.90, 1.30, 0.10, 0.025, 1.8, 0.025);
  shower.box("head", "steel", -0.77, 2.18, 0.10, 0.3, 0.025, 0.22);
  cabinet(new Item(a, "bath-towels", r, -3.33, 3.2, 3.3, -Math.PI / 2), 0.6, 1.1, 0.38, true);
  lights(a, r, [[-4.14, 2.4], [-4.14, 4.8]]);
}
