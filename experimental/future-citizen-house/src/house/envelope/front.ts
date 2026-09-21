import { Assembly } from "../assembly";
import { portals } from "../plan";
import { doorway, doorCuts, type Frame } from "../walls";
import { facade, corners } from "./facade";
export function front(a: Assembly): void {
  const f: Frame = { id: "front-face", along: "x", normal: -1, plane: -5.88, a: -5.26, b: 5.26, floor: 0, top: 6.1, depth: 0.24, spaces: ["house"] };
  facade(a, f, [
    { id: "front-stair-glazing-lower", room: "entry", a: -1.2, b: 1.54, sill: 0.12, head: 2.8 },
    { id: "front-stair-glazing-upper", room: "upper-storey", a: -1.2, b: 1.54, sill: 3.32, head: 6 },
    { id: "front-flex-glazing", room: "flex-workroom", a: 3.06, b: 5.22, sill: 0.12, head: 2.8, privacy: "lower" },
    { id: "front-bedroom-glazing", room: "child-bedroom-1", a: 1.8, b: 5.22, sill: 3.32, head: 6, privacy: "lower", breaks: [3.04] },
  ], doorCuts(f));
  doorway(a, f, portals.find((p) => p.id === "front-entry")!);
  corners(a, "front", "front");
}
