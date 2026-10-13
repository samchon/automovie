
/**
 * Planar ring classification, with its tolerance-qualified rim distinguished.
 *
 * @evidence contracts/common.md#principled-implementation footprintRingPlacement checks segment distance against 1e-9 metres before the shared polygon boundary/parity test, whose own boundary check uses scale-relative tolerance; fewer than three points classify outside, subject to binary64 predicates.
 * @evidence contracts/common.md#clear-and-simple-design Three closed outcomes let footprintContains include both outer and hole rims while excluding only open hole interiors.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Boundary is a declared geometric tolerance rather than a caller-specific margin; this classification does not certify exact predicates at extreme coordinate scales.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes the tolerance-qualified boundary from polygon interior/exterior; classification itself does not validate a ring or guarantee positive area.
 * @evidence contracts/performance.md#efficient-algorithms The result has constant storage; classification scans E edges for distance and at most another E for parity in O(E) time.
 * @evidence contracts/performance.md#reuse-equivalent-work The classifier reads the prepared plan projection instead of remapping XZ points on each query; changed source rings require preparing that projection again.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A scalar outcome retains no ring, query object or host resource; only the caller's prepared ring survives a query.
 */
export type AutoMovieRingPlacement = "outside" | "boundary" | "inside";
