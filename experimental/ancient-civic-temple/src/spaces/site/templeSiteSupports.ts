import type { IAutoMovieBuiltSurface } from "@automovie/interface";
import { rectanglePolygon } from "../../geometry/rectanglePolygon";
import { templeSitePieces } from "./templeSitePieces";
import { gradeBands } from "./gradeBands";

/**
 * Walking supports for soil and paving; neighboring ground and curbs are outside the walkable list.
 */

export const templeSiteSupports = (space: string): IAutoMovieBuiltSurface[] => templeSitePieces().flatMap((piece) => gradeBands(piece.rect).map(({ rect, plane }, i) => ({
  space,
  surface: {
    id: `support.site.${piece.id}.${i}`, kind: "floor" as const,
    polygon: rectanglePolygon(rect).map((q) => ({ x: q.x, y: 0, z: q.z })),
    height: { kind: "plane" as const, originHeight: plane.constant, slopeX: plane.x, slopeZ: plane.z },
  },
})));
