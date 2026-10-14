import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyTrunkSurfaceMeasurementFields } from "./IAutoMovieHumanBodyTrunkSurfaceMeasurementFields";

/**
 * Target or observed exterior chest, waist and buttock dimensions, with hip breadth (ANSUR II 6.4.51) and buttock depth (6.4.18) at the pelvis.
 *
 * Each landmark must be reproduced by the same named measurement on the generated standing skin. A bust girth includes overlying breast tissue; neither it nor a waist or buttock girth measures the internal organ, muscle or adipose volumes. These are independent conditions, not a request to move selected skin vertices until a preferred silhouette appears.
 *
 * @evidence contracts/common.md#principled-implementation The nonempty operator selects named trunk surface conditions whose original site and protocol carriers remain field-owned.
 * @evidence contracts/common.md#clear-and-simple-design Shared trunk fields avoid duplicating acquisition definitions; this alias enforces a supplied exterior condition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Breast-inclusive bust and waist/buttock girths cannot substitute for organ, muscle or adipose quantities or direct vertex edits.
 * @evidence contracts/common.md#meaningful-documentation The prose states site reproduction requirements and distinguishes external pelvic breadth/depth from tissue measurements.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Nonempty trunk selection evaluates no standing skin instrument or compartment-volume estimation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The trunk selection alias contains no completed source-rest or acquisition reading to cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Selected trunk inputs retain no generated section planes or clinical measurement resources.
 * @author Samchon
 */
export type IAutoMovieHumanBodyTrunkSurfaceMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<IAutoMovieHumanBodyTrunkSurfaceMeasurementFields>;
