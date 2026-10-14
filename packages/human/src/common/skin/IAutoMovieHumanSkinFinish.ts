import type { IAutoMovieHumanSkinScattering } from "./IAutoMovieHumanSkinScattering";

/**
 * Reusable finish properties for skin materials supplied by different bases.
 *
 * Builders can apply the same scattering distances to materials at a shared
 * skin join. The record does not apply itself or enforce agreement between
 * source materials; applyHumanSkinFinish updates a matching material explicitly.
 * Albedo and geometric continuity remain with their respective owners.
 *
 *
 * @evidence contracts/common.md#principled-implementation A material identity and RGB scattering distances define a reusable appearance finish; applying it to individual source materials remains an explicit builder operation.
 * @evidence contracts/common.md#clear-and-simple-design Albedo remains with colour owners while this record names only the common material and scattering contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sharing a finish cannot certify neck geometry continuity, individual tissue calibration or an absent skin material.
 * @evidence contracts/common.md#meaningful-documentation The description explains shared-join reuse, explicit application and the separate ownership of albedo and geometric continuity.
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
