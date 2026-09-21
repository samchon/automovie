import { Assembly } from "../assembly";
import { facade, corners } from "./facade";
export function left(a: Assembly): void {
  facade(a, { id: "left-face", along: "z", normal: 1, plane: 5.38, a: -5.76, b: 5.76, floor: 0, top: 6.1, depth: 0.24, spaces: ["house"] }, [
    { id: "left-flex-glazing", room: "flex-workroom", a: -5.4, b: -2.3, sill: 0.12, head: 2.8, privacy: "lower" },
    { id: "left-bedroom-glazing", room: "child-bedroom-1", a: -5.4, b: -2.3, sill: 3.32, head: 6, privacy: "lower" },
    { id: "left-child-two-glazing", room: "child-bedroom-2", a: 0.35, b: 1.9, sill: 3.9, head: 5.8, privacy: "lower" },
  ]);
  corners(a, "left", "left");
}
