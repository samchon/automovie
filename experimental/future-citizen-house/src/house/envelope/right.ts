import { Assembly } from "../assembly";
import { facade, corners } from "./facade";
import { pipeSector, putMesh, tubeMesh } from "../metric-solid";
export function right(a: Assembly): void {
  facade(a, { id: "right-face", along: "z", normal: -1, plane: -5.38, a: -5.76, b: 5.76, floor: 0, top: 6.1, depth: 0.24, spaces: ["house"] }, [
    { id: "right-common-glazing", room: "common-room", a: 3.6, b: 5.4, sill: 0.12, head: 2.8 },
    { id: "right-bath-glazing", room: "upper-bathroom", a: 3.6, b: 5.4, sill: 3.32, head: 6, privacy: "all" },
  ]);
  corners(a, "right", "right");
  // The roof owns everything above this exact 6.10m butt joint.
  for (const [i, range] of [[-0.30, 0.10], [0.30, 6.10]].entries())
    putMesh(a, "right-downpipe-" + i, "house", "metal", tubeMesh(-5.68, 0, range[0], range[1], 0.055, 0.05), "drainage");
  const half = Math.asin(0.04 / 0.055);
  putMesh(a, "right-inspection-body", "house", "metal", pipeSector(-5.68, 0, 0.10, 0.30, Math.PI + half, 3 * Math.PI - half), "drainage");
  putMesh(a, "right-inspection-cover", "house", "steel", pipeSector(-5.68, 0, 0.10, 0.30, Math.PI - half, Math.PI + half), "removable-cover");
  for (const y of [5.80, 4.00, 2.20, 0.40]) {
    putMesh(a, "right-downpipe-collar-" + y, "house", "metal", tubeMesh(-5.68, 0, y - 0.01, y + 0.01, 0.059, 0.055), "pipe-clip");
    a.box("right-downpipe-clip-" + y, "house", "metal", (-5.621 - 5.50) / 2, y, 0, 0.121, 0.02, 0.02);
  }
}
