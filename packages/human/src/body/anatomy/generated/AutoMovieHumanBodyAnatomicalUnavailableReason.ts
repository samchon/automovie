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
