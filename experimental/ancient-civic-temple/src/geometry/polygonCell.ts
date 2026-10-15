import type { IAutoMovieConvexSpaceCell } from "@automovie/interface";
import { edgeInside } from "./edgeInside";
import type { HeightPlane } from "./HeightPlane";
import type { PlanPoint } from "./PlanPoint";

/** The exact convex cell over a CCW polygon, at or above floor and at or below ceiling. */

export const polygonCell = (
  id: string, polygon: readonly PlanPoint[], floor: number, ceiling: HeightPlane
): IAutoMovieConvexSpaceCell => ({
  id,
  planes: [
    ...polygon.map((point, i) => {
      const edge = edgeInside(point, polygon[(i + 1) % polygon.length]!);
      return { normal: { x: -edge.x, y: 0, z: -edge.z }, offset: edge.constant };
    }),
    { normal: { x: 0, y: -1, z: 0 }, offset: -floor },
    { normal: { x: -ceiling.x, y: 1, z: -ceiling.z }, offset: ceiling.constant },
  ],
});
