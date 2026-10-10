import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * The geometric iris-aperture centre on the build's final optical surface.
 * A generated regular annulus has equal samples on every ring, so their
 * centroid gives its common centre from the actual Float32 positions.
 * Without independent optics the source proxy keeps its chart approximation.
 *
 * The chart is the hit of the support's chosen neutral axis on the eye
 * proxy's front, carried by its native triangle and barycentric weights
 * `(1-u-v, u, v)`, so it follows shape and gaze with the posed triangle. This
 * is a named approximation: the CC0 eye proxy has no separate cornea or pupil
 * surface, so the chart point stands for the pupil centre in forward gaze. A
 * basis without that eye's optical support returns a registration gap.
 *
 * @author Samchon
 */
export function readHumanFacePupilCentre(
  context: IHumanFaceMeasurementContext,
  side: "left" | "right",
): IAutoMovieVector3 | IHumanFaceMeasurementGap {
  const iris = context.opticalMesh?.(side, "iris");
  if (iris !== undefined && iris !== null) {
    const count = iris.positions.length / 3;
    if (
      !Number.isSafeInteger(count) ||
      count < 3 ||
      !iris.positions.every(Number.isFinite)
    )
      return {
        reason:
          "unread generated iris: incomplete or nonfinite final positions",
      };
    const center = [0, 1, 2].map((axis) => {
      let sum = 0;
      for (let vertex = 0; vertex < count; vertex++)
        sum += iris.positions[3 * vertex + axis];
      return sum / count;
    });
    return { x: center[0], y: center[1], z: center[2] };
  }
  const owner = side === "left" ? "leftEye" : "rightEye";
  const support = context.basis.opticalSupport?.find(
    (entry) => entry.owner === owner,
  );
  if (support === undefined)
    return {
      reason: `missing registration: the basis's ${owner} optical support`,
    };
  const [a, b, c] = support.anterior.triangle.map((vertex) =>
    context.point(support.surface, vertex),
  );
  const { u, v } = support.anterior;
  const w = 1 - u - v;
  return {
    x: w * a.x + u * b.x + v * c.x,
    y: w * a.y + u * b.y + v * c.y,
    z: w * a.z + u * b.z + v * c.z,
  };
}
