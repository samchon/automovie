/**
 * Recognizes a flat review carrying a seven-hex-digit fingerprint.
 *
 * Principled implementation: Anchored grammar requires a review keyword, target, seven-hex fingerprint and reason.
 * Clear and simple design: Classification and fingerprint extraction share one structural grammar.
 * Prohibited implementation shortcuts: Fingerprint width and keyword alternatives are evidence protocol rules.
 * Meaningful documentation: The comment identifies the fingerprint requirement; the expression also requires a reason.
 * Efficient algorithms: One compilation serves matches over individual declaration lines.
 * Reuse equivalent work: The non-global expression has no cross-call lastIndex dependency.
 * Bound retention and release resources: One module-owned RegExp persists without retaining prior source lines.
 */
export const REVIEW: RegExp =
  /^@(evidenceReview|evidenceExcludeReview) (\S+) (#[0-9a-f]{7}) (\S(?:.*\S)?)$/u;
