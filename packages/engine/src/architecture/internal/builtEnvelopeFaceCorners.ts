import {
  type IAutoMovieBuiltEnvelopeCorner,
  type IAutoMovieBuiltEnvelopeFace,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { compareRenderIds } from "../../render/internal/compareRenderIds";
import { ObservationGeometry } from "./ObservationGeometry";

/*
 * Proximity-based corner records among already placed envelope facades.
 *
 * Only non-parallel `facade` pairs of one building qualify. Vertex proximity
 * within the thicker separation plus numeric slack supplies an allowance rather
 * than proof of a shared edge. The position averages approximately nearest
 * vertex-pair midpoints; it equals a shared edge midpoint only when those pairs
 * describe its ends. Boundary ids fix pair order. The first probe-oriented
 * normal's sign toward the second centroid determines exterior/reentrant;
 * negligible direction or dot product skips an unreadable pair. Results sort by
 * id.
 *
 * builtEnvironmentEnvelopeCorners answers for a whole environment, and
 * the building census passes the faces it already placed so they are not placed
 * twice.
 */
export function builtEnvelopeFaceCorners(
  faces: readonly IAutoMovieBuiltEnvelopeFace[],
): IAutoMovieBuiltEnvelopeCorner[] {
  const facades: IAutoMovieBuiltEnvelopeFace[] = faces.filter(
    (face: IAutoMovieBuiltEnvelopeFace): boolean => face.aspect === "facade",
  );
  const corners: IAutoMovieBuiltEnvelopeCorner[] = [];
  for (let i: number = 0; i < facades.length; i++)
    for (let j: number = i + 1; j < facades.length; j++) {
      const ordered: boolean =
        compareRenderIds(facades[i]!.boundary, facades[j]!.boundary) <=
        0;
      const a: IAutoMovieBuiltEnvelopeFace = ordered
        ? facades[i]!
        : facades[j]!;
      const b: IAutoMovieBuiltEnvelopeFace = ordered
        ? facades[j]!
        : facades[i]!;
      if (a.building !== b.building) continue;
      if (
        AutoMovieEngineVector3.length(AutoMovieEngineVector3.cross(a.normal, b.normal)) <=
        ObservationGeometry.Epsilon
      )
        continue;
      const tolerance: number =
        Math.max(a.thickness, b.thickness) + ObservationGeometry.Epsilon;
      // Average approximately nearest vertex-pair midpoints as the corner proxy.
      // Proximity alone does not establish a shared geometric edge.
      let best: number = Number.POSITIVE_INFINITY;
      const meetings: IAutoMovieVector3[] = [];
      for (const left of a.vertices)
        for (const right of b.vertices) {
          const gap: number = AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(left, right));
          if (gap > Math.min(tolerance, best + ObservationGeometry.Epsilon))
            continue;
          if (gap < best - ObservationGeometry.Epsilon) {
            best = gap;
            meetings.length = 0;
          }
          meetings.push(AutoMovieEngineVector3.scale(AutoMovieEngineVector3.add(left, right), 0.5));
        }
      if (meetings.length === 0) continue;
      const meeting: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
        meetings.reduce(
          (
            sum: IAutoMovieVector3,
            point: IAutoMovieVector3,
          ): IAutoMovieVector3 => AutoMovieEngineVector3.add(sum, point),
          { x: 0, y: 0, z: 0 },
        ),
        1 / meetings.length,
      );
      const toB: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(b.centroid, meeting);
      if (AutoMovieEngineVector3.length(toB) <= ObservationGeometry.Epsilon) continue;
      const turn: number = AutoMovieEngineVector3.dot(a.normal, AutoMovieEngineVector3.normalize(toB));
      if (Math.abs(turn) <= ObservationGeometry.Epsilon) continue;
      corners.push({
        id: `${a.boundary}+${b.boundary}`,
        building: a.building,
        facades: [a.boundary, b.boundary],
        kind: turn < 0 ? "exterior" : "reentrant",
        position: meeting,
        normal: AutoMovieEngineVector3.normalize(AutoMovieEngineVector3.add(a.normal, b.normal)),
      });
    }
  return corners.sort(
    (
      left: IAutoMovieBuiltEnvelopeCorner,
      right: IAutoMovieBuiltEnvelopeCorner,
    ): number => compareRenderIds(left.id, right.id),
  );
}
