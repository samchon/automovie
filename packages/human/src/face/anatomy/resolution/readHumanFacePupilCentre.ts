import type { IAutoMovieHumanFaceOpticalSupport as ImportedIAutoMovieHumanFaceOpticalSupport } from "../../structures/IAutoMovieHumanFaceOpticalSupport";
import type { IAutoMovieHumanFaceOpticalSupportAnterior as ImportedIAutoMovieHumanFaceOpticalSupportAnterior } from "../../structures/IAutoMovieHumanFaceOpticalSupportAnterior";
import type { IAutoMovieVector3, IAutoMovieMesh as ImportedIAutoMovieMesh } from "@automovie/interface";

import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * The geometric iris-aperture centre on the build's final optical surface. A generated regular annulus has equal samples on every ring, so their centroid gives its common centre from the actual Float32 positions. Without independent optics the source proxy keeps its chart approximation.
 *
 * The chart is the hit of the support's chosen neutral axis on the eye proxy's front, carried by its native triangle and barycentric weights `(1-u-v, u, v)`, so it follows shape and gaze with the posed triangle. This is a named approximation: the eye proxy has no separate cornea or pupil surface, so the chart point stands for the pupil centre in forward gaze. A basis without that eye's optical support returns a registration gap.
 *
 * @evidence contracts/common.md#principled-implementation The generated iris annulus centroid is preferred when its actual mesh exists.
 * @evidence contracts/common.md#clear-and-simple-design Absent generated iris uses the registered source triangle's barycentric pupil approximation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An invalid present iris remains a gap rather than falling back to stale source-card geometry; neither path models refracted apparent pupil position.
 * @evidence contracts/common.md#meaningful-documentation The result is a current head-frame metre coordinate.
 * @evidence contracts/performance.md#efficient-algorithms Generated acquisition scans iris vertices; source fallback reads one registered support triangle.
 * @evidence contracts/performance.md#reuse-equivalent-work The context's actual optical mesh or existing pupil registration supplies the single chosen path.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only an owned centre vector/gap escapes and copied iris vertices are temporary.
 *
 * @author Samchon
 */
export function readHumanFacePupilCentre(
  context: IHumanFaceMeasurementContext,
  side: "left" | "right",
): IAutoMovieVector3 | IHumanFaceMeasurementGap {
  const iris: ImportedIAutoMovieMesh | null | undefined = context.opticalMesh?.(side, "iris");
  if (iris !== undefined && iris !== null) {
    const count: number = iris.positions.length / 3;
    if (
      !Number.isSafeInteger(count) ||
      count < 3 ||
      !iris.positions.every(Number.isFinite)
    )
      return {
        reason:
          "unread generated iris: incomplete or nonfinite final positions",
      };
    const center: number[] = [0, 1, 2].map((axis: number): number => {
      let sum: number = 0;
      for (let vertex: number = 0; vertex < count; vertex++)
        sum += iris.positions[3 * vertex + axis];
      return sum / count;
    });
    return { x: center[0], y: center[1], z: center[2] };
  }
  const owner: "leftEye" | "rightEye" = side === "left" ? "leftEye" : "rightEye";
  const support: ImportedIAutoMovieHumanFaceOpticalSupport | undefined = context.basis.opticalSupport?.find(
    (entry: ImportedIAutoMovieHumanFaceOpticalSupport): boolean => entry.owner === owner,
  );
  if (support === undefined)
    return {
      reason: `missing registration: the basis's ${owner} optical support`,
    };
  const [a, b, c]: IAutoMovieVector3[] = support.anterior.triangle.map((vertex: number): IAutoMovieVector3 =>
    context.point(support.surface, vertex),
  );
  const { u, v }: ImportedIAutoMovieHumanFaceOpticalSupportAnterior = support.anterior;
  const w: number = 1 - u - v;
  return {
    x: w * a.x + u * b.x + v * c.x,
    y: w * a.y + u * b.y + v * c.y,
    z: w * a.z + u * b.z + v * c.z,
  };
}
