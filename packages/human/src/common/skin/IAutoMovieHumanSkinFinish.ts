import type { IAutoMovieHumanSkinScattering } from "./IAutoMovieHumanSkinScattering";

/**
 * Reusable finish properties for skin materials supplied by different bases.
 *
 * A person's skin is one organ drawn from two surfaces, the head's and the
 * body's, that meet at the neck. Whatever the renderer does to skin beyond
 * its albedo has to be the same on both sides of that join, or the join shows
 * as a change of material where the geometry is continuous. This record is
 * that shared part. Albedo is not in it: a person states one cheek colour,
 * the face wears it, and the body derives its sites from it and returns to
 * the cheek's own colour at the neck's cut.
 *
 *
 * @evidence contracts/common.md#principled-implementation A material identity and RGB scattering distances share appearance parameters across the body's skin material and the source face finish.
 * @evidence contracts/common.md#clear-and-simple-design Albedo remains with colour owners while this record names only the common material and scattering contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sharing a finish cannot certify neck geometry continuity, individual tissue calibration or an absent skin material.
 * @evidence contracts/common.md#meaningful-documentation The description explains the head/body join purpose and keeps albedo separate from the reusable finish.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Shared skin finish schema is erased by TypeScript; its runtime consumer owns the actual geometry or measurement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared skin finish schema specifies caller data and performs no runtime recomputation or cache lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Shared skin finish schema acquires no runtime handle or retained cache; concrete array and map ownership belongs to its producing and consuming functions.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanSkinFinish {
  /** Material id consumers use to identify their skin. */
  material: string;

  /** Subsurface scattering distance per linear RGB primary. */
  scattering: IAutoMovieHumanSkinScattering;
}
