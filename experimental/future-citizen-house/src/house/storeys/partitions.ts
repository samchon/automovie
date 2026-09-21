/** Structural walls have one owner per storey. Room linings fill the remaining
 * 6 mm on each side; openings are subtracted before any finish is attached. */
import { Assembly } from "../assembly";
import { datum, portals, rooms, sharedWalls, stairHole, type Rect } from "../plan";
import { cutWall, doorCuts, doorway, localCut, wallFrame, type Frame } from "../walls";
export function partitions(a: Assembly, level: 0 | 1): void {
  for (const wall of sharedWalls().filter((w) => w.level === level)) {
    const frame = wallFrame(wall);
    const cuts = doorCuts(frame), pocket = portals.find((p) => p.wall === wall.id && p.pocket);
    if (pocket) {
      const cavity = localCut(frame, pocket.id + "-pocket", pocket.center - pocket.width * 1.5 - 0.02, pocket.center + pocket.width / 2 + 0.06, frame.floor, frame.floor + pocket.height + 0.06);
      cutWall(a, frame, [cavity], "plaster", frame.id, 0, 0.06);
      a.wallRecords.at(-1)!.cuts = cuts;
      for (const side of [-1, 1]) {
        const id = frame.id + "-pocket-skin-" + side;
        cutWall(a, frame, cuts, "plaster", id, side * 0.057, 0.054, false);
        a.environment.boundaries.find((b) => b.id === frame.id)!.elements.push(id + "-body");
      }
    } else cutWall(a, frame, cuts, "plaster", frame.id, 0, datum.wall - 0.012);
    for (const portal of portals.filter((p) => p.wall === wall.id)) doorway(a, frame, portal);
  }
  if (level === 1) {
    const sideFrames: Frame[] = [
      { id: "stair-west-enclosure", along: "z", normal: 1, plane: stairHole[0] - datum.wall / 2, a: stairHole[2], b: stairHole[3] - datum.wall, spaces: ["upper-service", "upper-storey"], floor: 3.2, top: 6.1, depth: datum.wall },
      { id: "stair-east-enclosure", along: "z", normal: 1, plane: stairHole[1] + datum.wall / 2, a: stairHole[2], b: stairHole[3], spaces: ["child-bedroom-1", "upper-storey"], floor: 3.2, top: 6.1, depth: datum.wall },
      { id: "stair-north-bedroom-return", along: "x", normal: 1, plane: stairHole[3] + datum.wall / 2, a: 0.3, b: stairHole[1], spaces: ["child-bedroom-1", "upper-storey"], floor: 3.2, top: 6.1, depth: datum.wall },
    ];
    for (const frame of sideFrames) cutWall(a, frame, [], "plaster", frame.id, 0, datum.wall - 0.012);
  }
  // Only intersections of wall endpoints, outside every room and the stair hole,
  // become junction solids. The occupied cell atlas never fills a passage.
  const records = a.wallRecords.filter((r) => r.frame.spaces.length === 2 && r.frame.floor === datum.floors[level]);
  const wallRects: Rect[] = records.map(({ frame: f }) => f.along === "x" ? [f.a, f.b, f.plane - f.depth / 2, f.plane + f.depth / 2] : [f.plane - f.depth / 2, f.plane + f.depth / 2, f.a, f.b]);
  const cells = rooms.filter((r) => r.level === level).flatMap((r) => r.cells);
  const rects = [...wallRects, ...cells, ...(level ? [stairHole] : [])];
  const xs = [...new Set([-5.26, 5.26, ...rects.flatMap((r) => [r[0], r[1]])])].sort((x, y) => x - y);
  const zs = [...new Set([-5.76, 5.76, ...rects.flatMap((r) => [r[2], r[3]])])].sort((x, y) => x - y);
  const inside = (r: Rect, x: number, z: number) => x > r[0] && x < r[1] && z > r[2] && z < r[3];
  for (let i = 0; i + 1 < xs.length; i++) for (let j = 0; j + 1 < zs.length; j++) {
    const x = (xs[i] + xs[i + 1]) / 2, z = (zs[j] + zs[j + 1]) / 2;
    if (rects.some((r) => inside(r, x, z))) continue;
    const w = xs[i + 1] - xs[i], d = zs[j + 1] - zs[j];
    if (w > datum.wall + 1e-6 || d > datum.wall + 1e-6) continue;
    if (w < 1e-6 || d < 1e-6) continue;
    const touches = records.filter((_, k) => { const r = wallRects[k]; return xs[i] <= r[1] + 1e-6 && xs[i + 1] >= r[0] - 1e-6 && zs[j] <= r[3] + 1e-6 && zs[j + 1] >= r[2] - 1e-6; }).map((r) => r.frame.id).sort((a, b) => a.localeCompare(b));
    if (touches.length < 2) continue;
    const id = "junction-" + touches.join("--") + "-" + i + "-" + j;
    a.box(id, level ? "upper-storey" : "ground-storey", "plaster", x, datum.floors[level] + 1.45, z, w, 2.9, d);
    for (const boundary of a.environment.boundaries.filter((b) => touches.includes(b.id))) boundary.elements.push(id);
  }
}
