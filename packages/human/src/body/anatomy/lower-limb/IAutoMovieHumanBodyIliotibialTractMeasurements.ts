import type { IAutoMovieHumanBodyFibrousTissueMeasurements } from "../measurements/IAutoMovieHumanBodyFibrousTissueMeasurements";

/**
 * Lateral thickening of fascia lata from pelvis toward lateral proximal tibia.
 *
 * Gluteus maximus inserts through this tract, so the tract crosses the hip region and thigh rather than being an invented skin groove.
 *
 * @evidence contracts/common.md#principled-implementation A named iliotibial tract reuses isolated fibrous-tissue volume/provenance rather than muscle composition inputs.
 * @evidence contracts/common.md#clear-and-simple-design The tract keeps its own connective owner while common fibrous measurement fields stay shared.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Tract anatomy is not authored as a skin groove or silently merged with an inserting muscle.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes fascial tract ownership and its relation to named anatomical attachments.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Iliotibial metadata chooses no fascia path or stiffness reconstruction algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A tract-volume alias stores no cached lateral-thigh connective solve.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The tract schema owns no collagen field, fascial surface or active process.
 * @author Samchon
 */
export type IAutoMovieHumanBodyIliotibialTractMeasurements =
  IAutoMovieHumanBodyFibrousTissueMeasurements;
