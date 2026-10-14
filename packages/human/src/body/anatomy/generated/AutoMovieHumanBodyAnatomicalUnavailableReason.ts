/**
 * Why a named anatomical component was not generated.
 *
 * - `missing-anatomical-input`: the request lacks a quantity the generator needs.
 * - `anatomical-variant-absent`: the reporting generator has no qualified representation of the requested variant.
 * - `missing-bone-landmark`: the reporting generator has no qualified defining bony-landmark consumer.
 * - `missing-tissue-boundary`: the reporting generator has no qualified individual tissue-boundary consumer.
 * - `inconsistent-measurements`: supplied quantities cannot hold together.
 * - `acquisition-not-registered`: an observation's posture, plane or site is not registered.
 * - `outside-observed-population`: the request lies outside the generator's cohort.
 * - `posture-not-validated`: the generator was not validated in the requested posture.
 * - `geometry-not-validated`: no generator with held-out surface validation exists for the part.
 * - `contact-not-validated`: the part's contact with its neighbours is not validated.
 *
 * Current region reports can state generator-registry limitations without inspecting basis geometry. Missing landmark, tissue or variant reports therefore do not prove the structure is absent from an acquired or authored source.
 *
 * @evidence contracts/common.md#principled-implementation A closed vocabulary separates missing quantities/representation, acquisition registration, observed domain, posture and geometry/contact validation failures.
 * @evidence contracts/common.md#clear-and-simple-design All anatomical owners share explicit causes instead of resolved-looking placeholder parts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unavailable geometry/acquisitions remain named failures without population means or substituted body surfaces.
 * @evidence contracts/common.md#meaningful-documentation The list defines each cause, and the prose distinguishes current registry limitations from inspected source absence alongside independent geometry/contact validity.
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
