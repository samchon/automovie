import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { Assembly, v } from "./assembly";
import { datum, rooms, type Rect } from "./plan";
import { canopy, B, P, R } from "./envelope/roof";
const cell = (id: string, r: Rect, y0: number, y1: number) => ({ id, planes: [{ normal: v(1, 0, 0), offset: r[1] }, { normal: v(-1, 0, 0), offset: -r[0] }, { normal: v(0, 1, 0), offset: y1 }, { normal: v(0, -1, 0), offset: -y0 }, { normal: v(0, 0, 1), offset: r[3] }, { normal: v(0, 0, -1), offset: -r[2] }] });
export function topology(a: Assembly): void {
  // A bounding box would call the open roof/canopy gap "inside" and reverse
  // the native exposed-soffit normal. These two cells describe the building
  // body and canopy depth; they add no room, storey or access connector.
  const body = cell("house-body", [-5.5, 5.5, -6, 6], -0.6, R(0));
  const scale = Math.hypot(1, 0.01);
  body.planes[2] = { normal: v(-0.01 / scale, 1 / scale, 0), offset: R(0) / scale };
  const cover = cell("house-canopy", [canopy.minX, canopy.maxX, canopy.minZ, canopy.maxZ], B(0), P(0));
  cover.planes[2] = { normal: v(0, 1 / scale, 0.01 / scale), offset: P(0) / scale };
  cover.planes[3] = { normal: v(0, -1 / scale, -0.01 / scale), offset: -B(0) / scale };
  const spaces: IAutoMovieBuiltSpace[] = [
    { id: "citizen-site", kind: "site", parent: null, cells: [cell("site-cell", [-7.8, 7.8, -8.5, 8.5], -0.852, 8)] },
    { id: "house", kind: "building", parent: "citizen-site", cells: [body, cover] },
    { id: "ground-storey", kind: "storey", parent: "house", cells: [cell("ground-cell", [-5.5, 5.5, -6, 6], -0.6, 3.2)] },
    { id: "upper-storey", kind: "storey", parent: "house", cells: [cell("upper-cell", [-5.5, 5.5, -6, 6], 3.2, 6.4)] },
    ...rooms.map((r) => ({ id: r.id, kind: "room", parent: r.level === 0 ? "ground-storey" : "upper-storey", cells: r.cells.map((c, i) => cell(r.id + "-cell-" + i, c, datum.floors[r.level], datum.ceilings[r.level])) })),
  ];
  a.environment.spaces.push(...spaces);
}
