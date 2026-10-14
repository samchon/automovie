import { IPortraitUpperLidPoint } from "./IPortraitUpperLidPoint";

/**
 * Upper tissue from the dry margin through the tarsal body and supratarsal crease into the hood and preseptal transition. The ordinary profile orders all offsets strictly. A profile with explicit closed sections can return the hood across the crease, while retaining a simple transverse skin curve. Relief replaces the basic fold depth and volume rather than adding them twice.
 *
 * @evidence contracts/common.md#principled-implementation Six named tissue roles and a common attachment encode crease-to-hood topology; only explicit unfolding admits a returning hood without self-crossing.
 * @evidence contracts/common.md#clear-and-simple-design Role names retain the distinction between tarsal body, two crease banks, hood and preseptal continuation in one transverse section.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Relief replaces the basic fold instead of accumulating a second correction; no independent host-depth or hidden tissue row is added.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies ordinary ordering, the conditional hood return, fixed outer attachment and each anatomical role's meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The upper-section contract stores a fixed number of roles and chooses no topology scan; folded-curve checks belong to its profile resolver.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Station values carry an authored section, with no request key or reusable computation owned by this type.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Nested upper-lid points have ordinary document lifetime and retain no renderer, observer or background process.
 *
 * @author Samchon
 */
export interface IPortraitUpperLidSection {
  /** Narrow dry margin outside the ocular contact rim. */
  margin: IPortraitUpperLidPoint;

  /** Exposed pretarsal body below the supratarsal crease. */
  tarsal: IPortraitUpperLidPoint;

  /** Lower bank of the crease, distinct from tarsal fullness. */
  creaseInner: IPortraitUpperLidPoint;

  /** Upper bank of the crease before the overlying hood. */
  creaseOuter: IPortraitUpperLidPoint;

  /** Visible hood edge; only an explicitly unfolding profile permits its inward return. */
  hood: IPortraitUpperLidPoint;

  /** Broader continuation toward orbital skin. */
  preseptal: IPortraitUpperLidPoint;

  /** Outer skin-query distance, greater than all six tissue offsets, in mm. */
  attachment: number;
}
