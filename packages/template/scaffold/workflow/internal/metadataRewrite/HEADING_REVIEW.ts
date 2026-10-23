/** Recognizes a review heading with a current-format fingerprint. */
export const HEADING_REVIEW: RegExp =
  /^(#{2,4}) @(evidenceReview|evidenceExcludeReview) (\S+) (#[0-9a-f]{7})(?: (\S(?:.*\S)?))?$/u;
