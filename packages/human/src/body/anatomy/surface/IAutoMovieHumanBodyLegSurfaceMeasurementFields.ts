import type { IAutoMovieHumanBodySkinfoldThickness } from "../measurements/IAutoMovieHumanBodySkinfoldThickness";
import type { IAutoMovieHumanBodySurfaceDistance } from "../measurements/IAutoMovieHumanBodySurfaceDistance";
import type { IAutoMovieHumanBodySurfaceGirth } from "../measurements/IAutoMovieHumanBodySurfaceGirth";

/**
 * Independently optional exterior conditions between one knee and ankle. The existing nonempty measurement alias owns selection. These fields carry the same named skin sites and do not infer tibial, fibular or muscle shape.
 *
 * @evidence contracts/common.md#principled-implementation Independently optional knee, calf, ankle and shank quantities preserve their distinct skin sites and surface/skinfold measurement representations.
 * @evidence contracts/common.md#clear-and-simple-design This field owner exposes named leg conditions; the nonempty alias separately requires at least one supplied condition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exterior girths, skin distance and pinched skinfold cannot reconstruct tibial/fibular or muscle geometry.
 * @evidence contracts/common.md#meaningful-documentation Members identify patellar height, relaxed calf station, medial skinfold and malleolar/epicondylar endpoints.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Leg field typing performs no calf-section measurement or tibial/fibular shape inference.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Optional leg conditions coordinate no previously evaluated acquisition or generated muscle result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Leg field metadata acquires no pinched-tissue model, section samples or measurement task.
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
