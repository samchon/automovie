import type {
  IAutoMovieAnalysisLuminaire,
  IAutoMovieAnalysisSolid,
  IAutoMovieAnalysisWarning,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { autoMovieRayObstructed } from "./autoMovieRayObstructed";

/** Distances this short or shorter put a fitting on the sample point. */
const EPSILON: number = 1e-12;

/**
 * Sum the point-light illuminance `I * cos / r^2` of every luminaire that faces
 * a workplane point and reaches it without obstruction.
 *
 * A fitting within 1e-12 metres of the point contributes zero and appends one
 * `luminaire-on-workplane` warning per fitting id through the caller's
 * study-wide `coincident` set; raw distance and energy arithmetic can
 * overflow.
 *
 * One luminaire pass and at most one solid-union ray test per fitting reuse the
 * study's solids; only the caller-owned warnings and coincidence ids survive
 * the call.
 *
 * @param props The point and its unit plane normal, the luminaires, the
 *   occluding solids, and the study's warning list and coincident-fitting set.
 * @returns The artificial illuminance at the point, lux.
 */
export const autoMovieArtificialIlluminance: (props: {
  point: IAutoMovieVector3;
  normal: IAutoMovieVector3;
  luminaires: readonly IAutoMovieAnalysisLuminaire[];
  solids: readonly IAutoMovieAnalysisSolid[];
  warnings: IAutoMovieAnalysisWarning[];
  coincident: Set<string>;
}) => number = (props: {
  point: IAutoMovieVector3;
  normal: IAutoMovieVector3;
  luminaires: readonly IAutoMovieAnalysisLuminaire[];
  solids: readonly IAutoMovieAnalysisSolid[];
  warnings: IAutoMovieAnalysisWarning[];
  coincident: Set<string>;
}): number => {
  let total: number = 0;
  for (const luminaire of props.luminaires) {
    const offset: IAutoMovieVector3 = Vector3.subtract(
      luminaire.position,
      props.point,
    );
    const distance: number = Vector3.length(offset);
    if (distance <= EPSILON) {
      // Reported once per fitting rather than once per sample: the fact is
      // about the luminaire, and a warning repeated per grid cell would bury
      // every other warning the run carries.
      if (!props.coincident.has(luminaire.id)) {
        props.coincident.add(luminaire.id);
        props.warnings.push({
          code: "luminaire-on-workplane",
          detail: `luminaire "${luminaire.id}" sits on the workplane itself, where the inverse square law has no value; it contributes nothing`,
          subject: luminaire.id,
        });
      }
      continue;
    }
    const direction: IAutoMovieVector3 = Vector3.normalize(offset);
    const incidence: number = Vector3.dot(props.normal, direction);
    if (incidence <= 0) continue;
    if (
      autoMovieRayObstructed({
        origin: props.point,
        direction,
        solids: props.solids,
        maxDistance: distance,
      })
    )
      continue;
    total += (luminaire.intensity * incidence) / (distance * distance);
  }
  return total;
};
