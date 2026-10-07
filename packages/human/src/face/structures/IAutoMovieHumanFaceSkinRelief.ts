import type {} from "./IAutoMovieHumanFaceSkinRelief/compatibility/Nasolabial";
import type {} from "./IAutoMovieHumanFaceSkinRelief/compatibility/Regions";

/**
 * Regional authored skin geometry, separate from clinical skin-condition
 * observations and pigmentation. The connected pose owner consumes these
 * values before contact and common normal construction; they therefore survive
 * person composition and static export as geometry. An exported static asset
 * does not restore the editable numerical record.
 *
 * Existing qualified member names are loaded by type-only compatibility
 * modules, which forward to independently owned canonical interfaces.
 * The aliases add no runtime value or second field definition.
 *
 * @evidence contracts/common.md#principled-implementation Independent sides preserve asymmetric authored identity and performance.
 * @evidence contracts/common.md#clear-and-simple-design Nasolabial and other source-host regional courses share one numerical record while retaining independent sides and performed fractions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Clinical observations remain separate and are never converted to displacement.
 * @evidence contracts/common.md#meaningful-documentation States the actual consumer order and static document boundary.
 * @evidence contracts/modeling.md#parameter-channels Each omitted side adds no relief; neither side inherits the other.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record groups traits of existing skin, not parts.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The member settings state their units.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The regional producer owns its joins.
 * @evidenceExclude contracts/modeling.md#rendered-observation The producer and connected consumer observe the result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The regional settings state their source and qualification.
 * @evidenceExclude contracts/anatomy.md#permitted-range The producer admits each region and its combinations.
 * @evidence contracts/anatomy.md#parametric-authority Only named regional numerical traits enter.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceSkinRelief {
  /** Independent source-relative nasolabial relief; omission changes no geometry. */
  nasolabial?: IAutoMovieHumanFaceSkinRelief.Nasolabial;
  /** Other visible source-host regions; no lower-lid or ocular cage is duplicated. */
  regions?: IAutoMovieHumanFaceSkinRelief.Regions;
}
