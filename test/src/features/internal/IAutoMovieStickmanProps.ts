import { IAutoMovieMaterial } from "@automovie/interface";

/**
 * Typed input of `createAutoMovieStickman`: identity, three metre dimensions and the one material every part wears.
 *
 * Height sets the bone offsets and most part dimensions; `headRadius` and `limbRadius` set thickness independently and raise the torso and limb lengths when a thick head or limb needs room. The producer refuses a dimension outside its documented inclusive range.
 *
 * @evidence contracts/development/design.md#principled-representation Named numeric fields replace the retired string-keyed parameter map, so the compiler checks every dimension's presence and kind and the producer checks only the inclusive metre ranges.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Carries exactly what the stickman build reads: the model and skeleton id, three dimensions and one material; placement, LOD and profiles stay with the scene, population and caller that own them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every field is read by the producer for every figure; no field exists for a particular production, fixture or test.
 * @evidence contracts/development/common.md#meaningful-documentation Members give the id's double role, metre units with inclusive ranges, and the material's adoption by reference.
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
