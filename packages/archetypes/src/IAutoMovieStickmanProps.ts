import { IAutoMovieMaterial } from "@automovie/interface";

/**
 * Typed input of `createAutoMovieStickman`: identity, three metre dimensions and the one material every part wears.
 *
 * Height sets the bone offsets and most part dimensions; `headRadius` and `limbRadius` set thickness independently and raise the torso and limb lengths when a thick head or limb needs room. The producer refuses a dimension outside its documented inclusive range.
 *
 * @evidence contracts/common.md#principled-implementation Named numeric fields replace the retired string-keyed parameter map, so the compiler checks every dimension's presence and kind and the producer checks only the inclusive metre ranges.
 * @evidence contracts/common.md#clear-and-simple-design Carries exactly what the stickman build reads: the model and skeleton id, three dimensions and one material; placement, LOD and profiles stay with the scene, population and caller that own them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every field is read by the producer for every figure; no field exists for a particular production, fixture or test.
 * @evidence contracts/common.md#meaningful-documentation Members give the id's double role, metre units with inclusive ranges, and the material's adoption by reference.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An input record selects no algorithm; the fixed-size build it feeds is costed on `createAutoMovieStickman`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A plain argument record coordinates no work across calls or consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the record; the producer keeps only the material reference inside the returned model.
 * @author Samchon
 */
export interface IAutoMovieStickmanProps {
  /** Non-blank model id, also used as the skeleton id that poses and motions cite. */
  id: string;

  /** Standing height in metres, from 0.5 through 3. */
  height: number;

  /** Head sphere radius in metres, from 0.05 through 0.5. */
  headRadius: number;

  /** Upper-arm and shin capsule radius in metres, from 0.01 through 0.25; other limbs scale from it. */
  limbRadius: number;

  /** Material every part references; the returned model adopts this record by reference as its only material. */
  material: IAutoMovieMaterial;
}
