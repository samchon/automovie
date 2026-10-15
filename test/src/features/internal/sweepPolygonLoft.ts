import { type IAutoMovieSweep, meshAutoMovieSweep } from "@automovie/engine";
import {
  type IAutoMovieMesh,
  type IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Loft polygon sections along a path with `meshAutoMovieSweep`, the way the
 * geometry tests author a profile run: corner `k` of each section meets corner
 * `k` of the next by parameter, one flat-shaded ring sits at each path point,
 * and the section plane's first axis is the first leg crossed with `+Y`, or
 * with `+X` when the leg is nearly vertical, so `x` lies in a level path's
 * plane of travel and `y` points up.
 *
 * @param props.path Path points, metres.
 * @param props.sections Polygon rings at path fractions, each with optional holes.
 * @returns The mesh.
 */
export function sweepPolygonLoft(props: {
  path: IAutoMovieVector3[];
  sections: Array<{
    at: number;
    outer: Array<{ x: number; y: number }>;
    holes?: Array<Array<{ x: number; y: number }>>;
  }>;
}): IAutoMovieMesh {
  const [a, b] = props.path;
  const leg: IAutoMovieVector3 =
    a !== undefined && b !== undefined
      ? { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z }
      : { x: 0, y: 0, z: 1 };
  const size: number = Math.hypot(leg.x, leg.y, leg.z) || 1;
  const t: IAutoMovieVector3 = {
    x: leg.x / size,
    y: leg.y / size,
    z: leg.z / size,
  };
  const axis: IAutoMovieVector3 =
    Math.abs(t.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  const sweep: IAutoMovieSweep = {
    spine: {
      points: props.path,
      normal: {
        x: axis.y * t.z - axis.z * t.y,
        y: axis.z * t.x - axis.x * t.z,
        z: axis.x * t.y - axis.y * t.x,
      },
    },
    stations: props.sections.map(
      (section): IAutoMovieSweep.IStation => ({
        at: section.at,
        section: { type: "polygon", points: section.outer },
        ...(section.holes === undefined
          ? {}
          : {
              holes: section.holes.map((hole) => ({
                type: "polygon" as const,
                points: hole,
              })),
            }),
      }),
    ),
    correspondence: "parameter",
  };
  return meshAutoMovieSweep({ sweep });
}
