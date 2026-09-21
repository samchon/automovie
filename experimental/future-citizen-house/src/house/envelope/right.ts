import { Assembly } from "../assembly";
import { facade, corners } from "./facade";
export function right(a: Assembly): void {
  facade(a, { id: "right-face", along: "z", normal: -1, plane: -5.38, a: -5.76, b: 5.76, floor: 0, top: 6.1, depth: 0.24, spaces: ["house"] }, [
    { id: "right-common-glazing", room: "common-room", a: 3.6, b: 5.4, sill: 0.12, head: 2.8 },
    { id: "right-bath-glazing", room: "upper-bathroom", a: 3.6, b: 5.4, sill: 3.32, head: 6, privacy: "all" },
  ]);
  corners(a, "right", "right");
}
