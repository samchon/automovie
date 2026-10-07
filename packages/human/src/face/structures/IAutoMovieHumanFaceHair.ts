import type {} from "./IAutoMovieHumanFaceHair/compatibility/Layer";
import type {} from "./IAutoMovieHumanFaceHair/compatibility/Region";

/**
 * Numerical instructions for generating scalp locks on a shared facial basis.
 * The basis owns anatomical growth regions and neutral correspondence. This
 * document owns lengths, fields and appearance; it contains no strand positions,
 * images or identity-dependent resource key. Empty layers mean no scalp hair.
 * Coordinates are metres in the neutral head frame: +Y superior, +Z anterior,
 * and +X anatomical left. Fields describe static styling, not follicle biology,
 * elastic-rod dynamics, hair-to-hair contact or a biological density calibration.
 *
 * Existing qualified member names are loaded by type-only compatibility
 * modules, which forward to independently owned canonical interfaces.
 * The aliases add no runtime value or second field definition.
 *
 * @evidence contracts/common.md#principled-implementation The document groups the canonical layer records while type-only aliases retain the existing public qualification.
 * @evidence contracts/common.md#clear-and-simple-design Each member interface owns its fields in one named file; compatibility modules only forward their type identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Existing fields and namespace syntax are preserved without duplicated definitions or runtime mutation.
 * @evidence contracts/common.md#meaningful-documentation States metric styling ownership, source-growth responsibility and the compatibility loading boundary.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceHair {
  /** Independently generated named populations, at most eight. */
  layers: IAutoMovieHumanFaceHair.Layer[];
}
