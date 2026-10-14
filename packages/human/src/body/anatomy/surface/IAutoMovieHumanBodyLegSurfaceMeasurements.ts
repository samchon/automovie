import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyLegSurfaceMeasurementFields } from "./IAutoMovieHumanBodyLegSurfaceMeasurementFields";

/**
 * Exterior dimensions of one anatomical leg between knee and ankle.
 *
 * Calf size includes gastrocnemius, soleus and overlying tissues; the knee-to-ankle skin distance cannot stand in for tibia or fibula length. The knee and ankle girths delimit distinct joints and remain independent. Knee height (ANSUR II 6.4.57) is the midpatella's height above the floor.
 *
 * @evidence contracts/common.md#principled-implementation The shared nonempty operator requires a supplied knee-to-ankle exterior condition while preserving independent quantities from the named leg field owner.
 * @evidence contracts/common.md#clear-and-simple-design Field definitions remain centralized and this alias owns only the nonempty regional measurement requirement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Calf size and shank skin distance cannot identify compartment volumes or substitute for tibia/fibula lengths.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes skin dimensions, separate knee/ankle stations and floor-relative midpatella height.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The nonempty leg alias computes no cross-section girth or anatomical shank reconstruction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This selection type owns no evaluated leg measurement result to reuse across documents.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Leg measurement selection retains no source sections, tissue volume arrays or solver state.
 * @author Samchon
 */
export type IAutoMovieHumanBodyLegSurfaceMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<IAutoMovieHumanBodyLegSurfaceMeasurementFields>;
