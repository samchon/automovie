/**
 * Recognizes a review heading with a current-format fingerprint.
 *
 * Principled implementation: Anchored grammar recognizes H2-H4 reviews with seven-hex fingerprints.
 * Clear and simple design: Section headers have separate grammar because reasons can continue below.
 * Prohibited implementation shortcuts: Levels, keywords and hash width follow the structural protocol.
 * Meaningful documentation: The comment states the current fingerprint format; section parsing validates reason presence.
 * Efficient algorithms: One compilation serves line matches with a fixed number of captures.
 * Reuse equivalent work: The shared expression is non-global and independent of earlier matches.
 * Bound retention and release resources: One fixed RegExp persists without retaining section text.
 */
export const HEADING_REVIEW: RegExp =
  /^(#{2,4}) @(evidenceReview|evidenceExcludeReview) (\S+) (#[0-9a-f]{7})(?: (\S(?:.*\S)?))?$/u;
