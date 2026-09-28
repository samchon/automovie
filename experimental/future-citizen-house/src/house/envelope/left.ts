import { Assembly } from "../assembly";
import {
  corners,
  exteriorFrame,
  facade,
  roomEdge,
  standardWindowHeight,
} from "./facade";

export function left(a: Assembly): void {
  const sideStart = roomEdge("flex-workroom", "z", "min") + 0.36;
  const sideEnd = roomEdge("flex-workroom", "z", "min") + 3.46;
  facade(a, exteriorFrame("left"), [
    {
      id: "left-flex-glazing",
      room: "flex-workroom",
      a: sideStart,
      b: sideEnd,
      ...standardWindowHeight(0),
      privacy: "lower",
    },
    {
      id: "left-bedroom-glazing",
      room: "child-bedroom-1",
      a: roomEdge("child-bedroom-1", "z", "min") + 0.36,
      b: roomEdge("child-bedroom-1", "z", "min") + 3.46,
      ...standardWindowHeight(1),
      privacy: "lower",
    },
    {
      id: "left-child-two-glazing",
      room: "child-bedroom-2",
      a: roomEdge("child-bedroom-2", "z", "min") + 0.49,
      b: roomEdge("child-bedroom-2", "z", "max") - 0.5,
      sill: standardWindowHeight(1).sill + 0.58,
      head: standardWindowHeight(1).head - 0.2,
      privacy: "lower",
    },
  ]);
  corners(a, "left", "left");
}
