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
 * @evidence contracts/common.md#principled-implementation A closed vocabulary separates missing quantities/representation, acquisition registration, observed domain, posture and geometry/contact validation failures.
 * @evidence contracts/common.md#clear-and-simple-design All anatomical owners share explicit causes instead of resolved-looking placeholder parts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unavailable geometry/acquisitions remain named failures without population means or substituted body surfaces.
 * @evidence contracts/common.md#meaningful-documentation The bullet list defines each cause, including extrapolation and independent geometry/contact validity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Failure literals classify reports without running acquisition or surface validation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The reason vocabulary stores no completed generation or shared retry state.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Failure labels allocate no missing-part geometry or retained validation task.
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
