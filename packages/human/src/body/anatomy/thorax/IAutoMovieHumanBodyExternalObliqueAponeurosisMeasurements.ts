import type { IAutoMovieHumanBodyFibrousTissueMeasurements } from "../measurements/IAutoMovieHumanBodyFibrousTissueMeasurements";

/**
 * One side's anterior aponeurotic continuation of external oblique.
 *
 * Pectoralis major's inferior origins may reach this sheet; it is distinct from the external-oblique muscle belly and the abdominal subcutaneous fat.
 *
 * @evidence contracts/common.md#principled-implementation The anterior external-oblique continuation adopts the shared fibrous-tissue quantity schema as a sheet distinct from its muscle belly.
 * @evidence contracts/common.md#clear-and-simple-design The trunk member names aponeurotic ownership while the fibrous-tissue contract retains measurement definitions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Aponeurosis quantities cannot substitute for external-oblique muscle or overlying abdominal adipose.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes the fibrous continuation and its potential pectoral-origin relationship from neighboring tissues.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Aponeurotic quantity typing computes no fibrous sheet geometry or cross-muscle attachment solve.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This fibrous continuation alias caches no resolved abdominal sheet or pectoral origin.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Aponeurosis inputs own no fibrous-sheet buffer or attachment reconstruction process.
 * @author Samchon
 */
export type IAutoMovieHumanBodyExternalObliqueAponeurosisMeasurements =
  IAutoMovieHumanBodyFibrousTissueMeasurements;
