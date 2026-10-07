import type { IAutoMovieHumanBodySkinfoldThickness } from "../measurements/IAutoMovieHumanBodySkinfoldThickness";
import type { IAutoMovieHumanBodySurfaceDistance } from "../measurements/IAutoMovieHumanBodySurfaceDistance";
import type { IAutoMovieHumanBodySurfaceGirth } from "../measurements/IAutoMovieHumanBodySurfaceGirth";

/**
 * Independently optional exterior conditions between one knee and ankle.
 * The existing nonempty measurement alias owns selection. These fields carry
 * the same named skin sites and do not infer tibial, fibular or muscle shape.
 *
 * @evidence contracts/common.md#principled-implementation Retains the original leg field population while separating its nonempty-selection responsibility.
 * @evidence contracts/common.md#clear-and-simple-design One named record collects the existing knee, calf and ankle conditions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Knee, calf and ankle conditions remain independently optional and retain target versus observed discriminants; exterior readings do not substitute tibial or muscular surfaces.
 * @evidence contracts/common.md#meaningful-documentation States site, selection and internal-anatomy boundaries.
 * @evidence contracts/modeling.md#part-identity-and-grouping Groups one leg's exterior conditions, not anatomical solids.
 * @evidence contracts/modeling.md#parameter-channels Each original site remains an independently optional condition with no new coupling.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Girth/distance carriers use metres; medial calf double-layer skinfold uses millimetres. Observed method, acquisition posture and optional uncertainty retain their original protocols.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Exterior construction owns shared boundaries.
 * @evidenceExclude contracts/modeling.md#rendered-observation The consuming exterior/assembly observes the result.
 * @evidence contracts/anatomy.md#anatomical-source Named knee/calf/ankle sites retain distance/girth and double-layer caliper definitions. Observed protocols and unknown uncertainty remain explicit, and exterior scalar readings do not determine internal leg anatomy.
 * @evidenceExclude contracts/anatomy.md#permitted-range Physical-scalar and target admission retain supported conditions.
 * @evidence contracts/anatomy.md#parametric-authority Each optional site defines a named absolute measurement condition through the existing target/observed carrier; source-target solving owns deterministic conversion and achievable-source qualification.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyLegSurfaceMeasurementFields {
  /** Horizontal knee girth across the middle of the patella. */
  kneeGirth?: IAutoMovieHumanBodySurfaceGirth;

  /** Existing midpatella height above the acquisition floor. */
  kneeHeight?: IAutoMovieHumanBodySurfaceDistance;

  /** Greatest relaxed calf girth perpendicular to the leg axis. */
  maximumCalfGirth?: IAutoMovieHumanBodySurfaceGirth;

  /** Medial calf skinfold at its greatest girth station. */
  medialCalfSkinfold?: IAutoMovieHumanBodySkinfoldThickness;

  /** Smallest girth above the medial and lateral malleoli. */
  ankleGirth?: IAutoMovieHumanBodySurfaceGirth;

  /** Lateral femoral epicondyle to lateral malleolus skin distance. */
  kneeToAnkleLength?: IAutoMovieHumanBodySurfaceDistance;
}
