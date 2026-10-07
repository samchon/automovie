/**
 * Why a named anatomical component was not generated.
 *
 * - `missing-anatomical-input`: the request lacks a quantity the generator needs.
 * - `anatomical-variant-absent`: the requested variant has no source representation.
 * - `missing-bone-landmark`: the source registers no landmark the part is defined by.
 * - `missing-tissue-boundary`: the one connected skin carries no boundary for this tissue.
 * - `inconsistent-measurements`: supplied quantities cannot hold together.
 * - `acquisition-not-registered`: an observation's posture, plane or site is not registered.
 * - `outside-observed-population`: the request lies outside the generator's cohort.
 * - `posture-not-validated`: the generator was not validated in the requested posture.
 * - `geometry-not-validated`: no generator with held-out surface validation exists for the part.
 * - `contact-not-validated`: the part's contact with its neighbours is not validated.
 *
 * @evidence contracts/common.md#principled-implementation A closed set separates missing input, missing source representation and domain failure.
 * @evidence contracts/common.md#clear-and-simple-design One named union shared by the skin and every part.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every refusal names its cause instead of a generic failure.
 * @evidence contracts/common.md#meaningful-documentation Each member's meaning is stated.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The reason qualifies a part; it defines none.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions It carries no spatial value.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Consumers display the reason; it renders nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It is not an authoring input.
 * @author Samchon
 */
export type AutoMovieHumanBodyAnatomicalUnavailableReason =
  | "missing-anatomical-input"
  | "anatomical-variant-absent"
  | "missing-bone-landmark"
  | "missing-tissue-boundary"
  | "inconsistent-measurements"
  | "acquisition-not-registered"
  | "outside-observed-population"
  | "posture-not-validated"
  | "geometry-not-validated"
  | "contact-not-validated";
