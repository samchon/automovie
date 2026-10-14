import { IAutoMovieGaitLimb } from "@automovie/interface";

/**
 * Build one catalogue limb with eased swing and stance intervals. Phase is in
 * turns, duty is the stance fraction, and amplitude and optional neutral are
 * degrees. An omitted neutral remains absent for the engine's zero default.
 * The catalogue owns these inputs; gait sampling admits their numeric ranges.
 *
 * @evidence contracts/common.md#principled-implementation Copies the catalogue's bone, phase, amplitude and duty into one gait row, with the easeOut swing and easeInOut stance used by both cat and horse tables; optional neutral preserves the engine's absent-as-zero representation.
 * @evidence contracts/common.md#clear-and-simple-design One row constructor owns the identical easing defaults shared by the cat and horse upper and lower limbs, while each catalogue table retains its own phases and angles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The constructor does not inspect species, gait names or expected results; its callers supply their declared timing and angle data without modifying the engine sampler or validation.
 * @evidence contracts/common.md#meaningful-documentation Documents phase turns, duty fraction, degree angles, the two easing choices and the absent neutral default, with numeric admission left to gait sampling.
 * @evidence contracts/performance.md#efficient-algorithms Constructs one fixed-width object in constant time and space per limb; there is no traversal of either gait table or skeleton.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This row constructor coordinates no requests or phases; each table invocation needs a distinct mutable row, and the completed table is retained by its catalogue module.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns the newly allocated row to the catalogue without retaining inputs, handles or tasks; the caller owns its lifetime.
 */
export function createQuadrupedGaitLimb(
  bone: IAutoMovieGaitLimb["bone"],
  phase: number,
  amplitude: number,
  duty: number,
  neutral?: number,
): IAutoMovieGaitLimb {
  const limb: IAutoMovieGaitLimb = {
    bone,
    phase,
    duty,
    amplitude,
    swingEasing: "easeOut",
    stanceEasing: "easeInOut",
  };
  if (neutral !== undefined) limb.neutral = neutral;
  return limb;
}
