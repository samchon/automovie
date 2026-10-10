import type { IAutoMovieHumanBodySkinfoldThickness } from "../measurements/IAutoMovieHumanBodySkinfoldThickness";
import type { IAutoMovieHumanBodySurfaceDistance } from "../measurements/IAutoMovieHumanBodySurfaceDistance";
import type { IAutoMovieHumanBodySurfaceGirth } from "../measurements/IAutoMovieHumanBodySurfaceGirth";

/**
 * Independently optional exterior conditions between one knee and ankle.
 * The existing nonempty measurement alias owns selection. These fields carry
 * the same named skin sites and do not infer tibial, fibular or muscle shape.
 *
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
