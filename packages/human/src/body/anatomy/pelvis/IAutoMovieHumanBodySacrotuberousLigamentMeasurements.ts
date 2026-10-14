import type { IAutoMovieHumanBodyFibrousTissueMeasurements } from "../measurements/IAutoMovieHumanBodyFibrousTissueMeasurements";

/**
 * Sacrum-to-ischial-tuberosity ligament on one pelvic side.
 *
 * Gluteus maximus can originate on it; that relation does not make it a second copy of sacrum, coxal bone or gluteal muscle.
 *
 * @evidence contracts/common.md#principled-implementation The sacrotuberous alias preserves fibrous-tissue quantity provenance for one side's sacrum-to-ischial ligament.
 * @evidence contracts/common.md#clear-and-simple-design A named ligament remains separate from sacrum, coxal bone and gluteus despite its attachment relationship.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A gluteal origin relation does not duplicate skeletal or muscular material into the ligament quantity.
 * @evidence contracts/common.md#meaningful-documentation Prose identifies sacral/ischial endpoints, side ownership and distinct gluteal-origin relationship.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Sacrotuberous typing performs no ligament path reconstruction or gluteal attachment search.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The ligament alias coordinates no repeated sacral/coxal geometry computation across consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Sacrotuberous metadata retains no ligament meshes, pelvic buffers or mechanical solver tasks.
 * @author Samchon
 */
export type IAutoMovieHumanBodySacrotuberousLigamentMeasurements =
  IAutoMovieHumanBodyFibrousTissueMeasurements;
