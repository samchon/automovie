import { Assembly } from "../assembly";
import { portals, stairHole } from "../plan";
import { doorCuts, doorway } from "../walls";
import {
  corners,
  exteriorFrame,
  facade,
  glazingInset,
  roomEdge,
  standardWindowHeight,
} from "./facade";

export function front(a: Assembly): void {
  const f = exteriorFrame("front");
  facade(
    a,
    f,
    [
      {
        id: "front-stair-glazing-lower",
        room: "entry",
        a: stairHole[0] + glazingInset,
        b: stairHole[1] - glazingInset,
        ...standardWindowHeight(0),
      },
      {
        id: "front-stair-glazing-upper",
        room: "upper-storey",
        a: stairHole[0] + glazingInset,
        b: stairHole[1] - glazingInset,
        ...standardWindowHeight(1),
      },
      {
        id: "front-flex-glazing",
        room: "flex-workroom",
        a: roomEdge("flex-workroom", "x", "min") + glazingInset,
        b: roomEdge("flex-workroom", "x", "max") - glazingInset,
        ...standardWindowHeight(0),
        privacy: "lower",
      },
      {
        id: "front-bedroom-glazing",
        room: "child-bedroom-1",
        a: roomEdge("child-bedroom-1", "x", "min") + glazingInset,
        b: roomEdge("child-bedroom-1", "x", "max") - glazingInset,
        ...standardWindowHeight(1),
        privacy: "lower",
        breaks: [roomEdge("flex-workroom", "x", "min") + 0.02],
      },
    ],
    doorCuts(f),
  );
  doorway(a, f, portals.find((p) => p.id === "front-entry")!);
  corners(a, "front", "front");
}
