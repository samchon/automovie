import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { Assembly, v } from "./assembly";
import { datum, rooms, type Rect } from "./plan";
const cell = (id: string, r: Rect, y0: number, y1: number) => ({ id, planes: [{ normal: v(1, 0, 0), offset: r[1] }, { normal: v(-1, 0, 0), offset: -r[0] }, { normal: v(0, 1, 0), offset: y1 }, { normal: v(0, -1, 0), offset: -y0 }, { normal: v(0, 0, 1), offset: r[3] }, { normal: v(0, 0, -1), offset: -r[2] }] });
export function topology(a: Assembly): void {
  const spaces: IAutoMovieBuiltSpace[] = [
    { id: "citizen-site", kind: "site", parent: null, cells: [cell("site-cell", [-7.8, 7.8, -8.5, 8.5], -0.75, 8)] },
    { id: "house", kind: "building", parent: "citizen-site", cells: [cell("house-cell", [-5.8, 5.8, -6.7, 6.3], -0.3, 6.84)] },
    { id: "ground-storey", kind: "storey", parent: "house", cells: [cell("ground-cell", [-5.5, 5.5, -6, 6], -0.3, 3.2)] },
    { id: "upper-storey", kind: "storey", parent: "house", cells: [cell("upper-cell", [-5.5, 5.5, -6, 6], 3.2, 6.4)] },
    ...rooms.map((r) => ({ id: r.id, kind: "room", parent: r.level === 0 ? "ground-storey" : "upper-storey", cells: r.cells.map((c, i) => cell(r.id + "-cell-" + i, c, datum.floors[r.level], datum.ceilings[r.level])) })),
  ];
  a.environment.spaces.push(...spaces);
}
