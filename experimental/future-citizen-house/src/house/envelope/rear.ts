import { Assembly } from "../assembly";
import { facade, corners } from "./facade";
export function rear(a: Assembly): void {
  facade(a, { id: "rear-face", along: "x", normal: 1, plane: 5.88, a: -5.26, b: 5.26, floor: 0, top: 6.1, depth: 0.24, spaces: ["house"] }, [
    { id: "rear-common-glazing", room: "common-room", a: -5.22, b: 5.22, sill: 0.12, head: 2.8 },
    { id: "rear-bedroom-glazing", room: "primary-bedroom", a: -2.8, b: 5.22, sill: 3.32, head: 6, privacy: "lower" },
    { id: "rear-bath-glazing", room: "upper-bathroom", a: -4.86, b: -3.42, sill: 4.2, head: 5.65, privacy: "all" },
  ]);
  corners(a, "rear", "rear");
}
