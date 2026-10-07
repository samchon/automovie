import type { IAutoMovieHumanPersonPerformedSkin } from "./IAutoMovieHumanPersonPerformedSkin";
import type { IAutoMovieHumanPersonSourceNormalReference } from "./IAutoMovieHumanPersonSourceNormalReference";

/**
 * The current performed skin a source normal field is evaluated for, with the
 * final reference skin that normal transport requires. The current-only path
 * ignores the reference.
 *
 * @evidence contracts/common.md#principled-implementation The current skin and, for transport, its actual reference are all a performed normal field needs.
 * @evidence contracts/common.md#clear-and-simple-design Adds one optional field to the performed skin.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Transport refuses an absent reference instead of substituting the current or neutral skin.
 * @evidence contracts/common.md#meaningful-documentation States what the input is and when the reference is read.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The input names existing skins and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The input holds evaluated positions and emits no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Inherits metres in the shared Y-up, +Z-forward performed frame.
 * @evidence contracts/modeling.md#shared-boundaries Both halves are read together over the shared source boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The person assembly owns what is displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits numerical geometry, not a biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Evaluated geometry or compiled lineage, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceNormalInput extends IAutoMovieHumanPersonPerformedSkin {
  /** The final reference skin, required by normal transport. */
  reference?: IAutoMovieHumanPersonSourceNormalReference;
}
