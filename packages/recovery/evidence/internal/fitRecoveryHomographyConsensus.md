# src/internal/fitRecoveryHomographyConsensus.ts#fitRecoveryHomographyConsensus

## @evidence contracts/development/implementation.md#principled-implementation

Normalized original-design DLT and deterministic unique-index RANSAC test planar/pure-rotation ambiguity on the exact final epipolar subset. Finite-population conditional trial counts target the declared forbidden overlap. The ideal all-inlier sampling model assumes identifiable samples and does not prove a plane absent or a returned camera physically correct.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This competitor never changes the epipolar population or pose. It reports local subset indices, actual trial work, numerical failures and a conditional target so final qualification can distinguish found ambiguity from unfinished search.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No global-match denominator dilutes overlap, no weak best-H confidence claims absence, and no skipped numerical proposal or budget increase supplies a plane. Unexpected exceptions and checkpoint failures propagate.

## @evidence contracts/development/common.md#meaningful-documentation

States frozen epipolar population, local index meaning, symmetric pixel threshold, forbidden-support target, three-refit bound and conditional rather than physical confidence.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N fixed inliers and T proposals, each bounded nine-column SVD and full score costs O(S*N*9^2+N log N); improving proposals have at most three refits. O(N) scratch and fixed current/best matrices avoid retaining every proposal.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each candidate's map/inverse scores the entire fixed population, and a refit only replaces a model when its complete score improves. Unchanged support stops that refit's loop.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the current best matrix, inverse, O(N) indices and scalar counters escape. Proposal/subset arrays expire synchronously and no image, callback, process or global cache is retained.
