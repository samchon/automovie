import type { IAutoMovieHumanFaceScalpHairLayer } from "./IAutoMovieHumanFaceScalpHairLayer";

/**
 * Named scalp populations authored without personal coordinates or curves.
 * Empty layers explicitly mean bald. Omission of this section preserves the
 * legacy hairstyle rather than selecting an unrelated population or source.
 * Each layer owns its traits; the shared basis retains source rights and growth
 * registration. Styling inputs do not certify a biological population fit.
 *
 * @evidence contracts/common.md#principled-implementation Named populations compile into the existing deterministic hair path with no second geometry implementation.
 * @evidence contracts/common.md#clear-and-simple-design A single ordered population list composes the independently named layer records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject-specific geometry, private guide or image is selected.
 * @evidence contracts/common.md#meaningful-documentation States bald, omitted and source-rights meanings.
 * @evidence contracts/modeling.md#part-identity-and-grouping Each layer retains a unique population identity in the assembled hairstyle.
 * @evidenceExclude contracts/modeling.md#parameter-channels Layer owners document their controls.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The existing hair builder emits population geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Layer records and the expander own units.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Shared source registration and contact owners construct the roots.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembled hair owner observes the result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The layer traits are authored styling, not measured follicle anatomy.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing runtime admission bounds representation.
 * @evidence contracts/anatomy.md#parametric-authority A shared domain and named styling traits select populations without sculpt inputs.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceScalpHair {
  /** Ordered independent populations, at most eight. */
  layers: IAutoMovieHumanFaceScalpHairLayer[];
}
