import { Assembly } from "../assembly";
import { pipeSector, putMesh, tubeMesh } from "../metric-solid";
import { datum } from "../plan";
import {
  corners,
  exteriorFrame,
  facade,
  roomEdge,
  standardWindowHeight,
} from "./facade";
import { gutterX } from "./roof";

export function right(a: Assembly): void {
  const backEdge = roomEdge("common-room", "z", "max");
  facade(a, exteriorFrame("right"), [
    {
      id: "right-common-glazing",
      room: "common-room",
      a: backEdge - 2.16,
      b: backEdge - 0.36,
      ...standardWindowHeight(0),
    },
    {
      id: "right-bath-glazing",
      room: "upper-bathroom",
      a: roomEdge("upper-bathroom", "z", "max") - 2.16,
      b: roomEdge("upper-bathroom", "z", "max") - 0.36,
      ...standardWindowHeight(1),
      privacy: "all",
    },
  ]);
  corners(a, "right", "right");
  // The roof owns everything above this exact 6.10m butt joint.
  for (const [i, range] of [
    [-0.3, 0.1],
    [0.3, datum.ceilings[1]],
  ].entries())
    putMesh(
      a,
      "right-downpipe-" + i,
      "house",
      "canopy-metal",
      tubeMesh(gutterX, 0, range[0], range[1], 0.055, 0.05),
      "drainage",
    );
  const half = Math.asin(0.04 / 0.055);
  putMesh(
    a,
    "right-inspection-body",
    "house",
    "canopy-metal",
    pipeSector(gutterX, 0, 0.1, 0.3, Math.PI + half, 3 * Math.PI - half),
    "drainage",
  );
  putMesh(
    a,
    "right-inspection-cover",
    "house",
    "steel",
    pipeSector(gutterX, 0, 0.1, 0.3, Math.PI - half, Math.PI + half),
    "removable-cover",
  );
  for (const y of [5.8, 4.0, 2.2, 0.4]) {
    putMesh(
      a,
      "right-downpipe-collar-" + y,
      "house",
      "canopy-metal",
      tubeMesh(gutterX, 0, y - 0.01, y + 0.01, 0.059, 0.055),
      "pipe-clip",
    );
    const pipeEdge = gutterX + 0.059;
    a.box(
      "right-downpipe-clip-" + y,
      "house",
      "canopy-metal",
      (pipeEdge + datum.minX) / 2,
      y,
      0,
      datum.minX - pipeEdge,
      0.02,
      0.02,
    );
  }
}
