import { Assembly } from "../assembly";
import {
  corners,
  exteriorFrame,
  facade,
  glazingInset,
  roomEdge,
  standardWindowHeight,
} from "./facade";

export function rear(a: Assembly): void {
  facade(a, exteriorFrame("rear"), [
    {
      id: "rear-common-glazing",
      room: "common-room",
      a: roomEdge("common-room", "x", "min") + glazingInset,
      b: roomEdge("common-room", "x", "max") - glazingInset,
      ...standardWindowHeight(0),
    },
    {
      id: "rear-bedroom-glazing",
      room: "primary-bedroom",
      a: roomEdge("primary-bedroom", "x", "min") + glazingInset,
      b: roomEdge("primary-bedroom", "x", "max") - glazingInset,
      ...standardWindowHeight(1),
      privacy: "lower",
    },
    {
      id: "rear-bath-glazing",
      room: "upper-bathroom",
      a: roomEdge("upper-bathroom", "x", "min") + 0.4,
      b: roomEdge("upper-bathroom", "x", "max") - 0.4,
      sill: standardWindowHeight(1).sill + 0.88,
      head: standardWindowHeight(1).head - 0.35,
      privacy: "all",
    },
  ]);
  corners(a, "rear", "rear");
}
