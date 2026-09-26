import { Assembly } from "../assembly";
import { Item, lining, desk, chair, cabinet, bed, lights } from "./interior";
export function flex(a: Assembly): void {
  const r = "flex-workroom"; lining(a, r);
  desk(new Item(a, "flex-desk", r, 4.14, 0, -5.35), 1.4);
  chair(new Item(a, "flex-chair", r, 4.14, 0, -4.60, Math.PI));
  cabinet(new Item(a, "flex-books", r, 3.22, 1.05, -4.9, Math.PI / 2), 0.95, 1.35, 0.25, true);
  const murphy = new Item(a, "flex-murphy-frame", r, 4.28, 0, -0.55, Math.PI);
  murphy.box("back", "oak", 0, 1.18, -0.20, 1.3, 2.36, 0.055);
  for (const x of [-0.63, 0.63]) murphy.box("side-" + x, "oak", x, 1.18, 0, 0.045, 2.36, 0.46);
  murphy.box("top", "oak", 0, 2.34, 0, 1.3, 0.04, 0.46);
  if (a.state.flex === "work") {
    murphy.box("closed-panel", "plaster", 0, 1.17, 0.24, 1.2, 2.29, 0.035);
    murphy.box("pull", "metal", 0, 1.03, 0.27, 0.32, 0.025, 0.025);
  } else bed(new Item(a, "flex-guest-bed", r, 4.28, 0, -1.65, Math.PI), 1.1, "green");
  lights(a, r, [[4.14, -4.1], [4.14, -1.65]]);
}
