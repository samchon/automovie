import type { IAutoMovieBuiltSpace } from "@automovie/interface";

import { Assembly } from "./Assembly";
import { v } from "./v";
import { roofDeckHeight } from "./envelope/roofDeckHeight";
import { canopyTopHeight } from "./envelope/canopyTopHeight";
import { canopySoffitHeight } from "./envelope/canopySoffitHeight";
import { canopy } from "./envelope/canopy";
import { rooms } from "./rooms";
import { type Rect } from "./Rect";
import { datum } from "./datum";
import { foundationBottom } from "./storeys/foundationBottom";

const cell = (id: string, r: Rect, y0: number, y1: number) => ({
  id,
  planes: [
    { normal: v(1, 0, 0), offset: r[1] },
    { normal: v(-1, 0, 0), offset: -r[0] },
    { normal: v(0, 1, 0), offset: y1 },
    { normal: v(0, -1, 0), offset: -y0 },
    { normal: v(0, 0, 1), offset: r[3] },
    { normal: v(0, 0, -1), offset: -r[2] },
  ],
});
export function topology(a: Assembly): void {
  // A bounding box would call the open roof/canopy gap "inside" and reverse
  // the native exposed-soffit normal. These two cells describe the building
  // body and canopy depth; they add no room, storey or access connector.
  const outline: Rect = [datum.minX, datum.maxX, datum.minZ, datum.maxZ];
  const body = cell("house-body", outline, foundationBottom, roofDeckHeight(0));
  const scale = Math.hypot(1, 0.01);
  body.planes[2] = {
    normal: v(-0.01 / scale, 1 / scale, 0),
    offset: roofDeckHeight(0) / scale,
  };
  const cover = cell(
    "house-canopy",
    [canopy.minX, canopy.maxX, canopy.minZ, canopy.maxZ],
    canopySoffitHeight(0),
    canopyTopHeight(0),
  );
  cover.planes[2] = {
    normal: v(0, 1 / scale, 0.01 / scale),
    offset: canopyTopHeight(0) / scale,
  };
  cover.planes[3] = {
    normal: v(0, -1 / scale, -0.01 / scale),
    offset: -canopySoffitHeight(0) / scale,
  };
  const spaces: IAutoMovieBuiltSpace[] = [
    {
      id: "citizen-site",
      kind: "site",
      parent: null,
      cells: [cell("site-cell", [-7.8, 7.8, -8.5, 8.5], -0.852, 8)],
    },
    {
      id: "house",
      kind: "building",
      parent: "citizen-site",
      cells: [body, cover],
    },
    {
      id: "ground-storey",
      kind: "storey",
      parent: "house",
      cells: [cell("ground-cell", outline, foundationBottom, datum.floors[1])],
    },
    {
      id: "upper-storey",
      kind: "storey",
      parent: "house",
      cells: [cell("upper-cell", outline, datum.floors[1], datum.roof)],
    },
    ...rooms.map((r) => ({
      id: r.id,
      kind: "room",
      parent: r.level === 0 ? "ground-storey" : "upper-storey",
      cells: r.cells.map((c, i) =>
        cell(
          r.id + "-cell-" + i,
          c,
          datum.floors[r.level],
          datum.ceilings[r.level],
        ),
      ),
    })),
  ];
  a.environment.spaces.push(...spaces);
}
