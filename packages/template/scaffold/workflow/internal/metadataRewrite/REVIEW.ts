/** Recognizes a flat review carrying a seven-hex-digit fingerprint. */
export const REVIEW: RegExp =
  /^@(evidenceReview|evidenceExcludeReview) (\S+) (#[0-9a-f]{7}) (\S(?:.*\S)?)$/u;
