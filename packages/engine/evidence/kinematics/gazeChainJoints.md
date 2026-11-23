# src/kinematics/gazeChainJoints.ts#gazeChainJoints

## @evidence contracts/development/implementation.md#principled-implementation

A greedy head-first split per axis bounded by each declared range, where `shareOf` never overshoots or flips sign; it relies on angles about the same default-basis axis adding along a parent-child chain, which is exact for one axis when the head rests unrotated under the neck, and the stated limitation is that a simultaneous flexion and twist split composes non-commuting rotations. Companion prepare: The same greedy head-first capacity and unclamped residual owner distributes every current axis. Fixed topology selects the same head/neck/default constraints, with null axes immobile and a missing or disconnected chain retaining the single-head result.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The actor synthesizer solves the aim angles with `aimYawPitch` and this function only decides which joints carry them; ROM lookup goes through the shared `getConstraint`, so the split and the gate read the same ranges. Companion prepare: One lazy cervical source preparation feeds the shared raw numerical owner; private lazy range snapshots preserve first-needed axis/bound order without a second split algorithm.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The residual is left on the head for the gate to report instead of being clamped, and the single-bone fallbacks follow from the rig's structure, not from a named rig or shot. Companion prepare: Original null/fallback/parent rules, shareOf formulas, residuals, nullable neck axes and output order remain. Unused bounds are not eagerly read, failed field reads are not retained, and no aim is clamped to hide insufficient combined range.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two linear bone searches and fixed arithmetic for two axes allocate only the returned joint array/records, without per-call lookup/split closures or intermediate split records. Explicit fixed-rig preparation shares the searches and lazily observed range bounds across actual aims. Companion prepare: Two O(B) bone searches and constraint selection run once across Q aims; at most four axis references and eight min/max scalar observations are prepared lazily. Each query retains fixed scalar arithmetic and fresh output joints, with no measured speedup claim.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Raw calls observe current rig/constraint/bound fields in their original order; prepare shares only explicitly unchanged rig/ROM prerequisites and both paths use this same greedy split owner. Companion prepare: This explicit API requires the rig/default cervical metadata to stay unchanged. Only topology and first-observed range prerequisites are shared; each flexion/twist request is evaluated afresh and no joint, pose, direction, target or time answer is reused.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Raw calls retain no input or result. An explicit prepared reader owns bounded fixed cervical metadata until its caller releases it; each actual output array and joint record remains fresh with no aim/time history. Companion prepare: The caller owns one reader, its fixed rig and at most two constraints/four range snapshots/eight bound scalars until release. Queries add no retained aim, output, dynamic workspace or growing history.

## @evidence contracts/development/common.md#meaningful-documentation

States the head-first order, the unclamped residual and why, the additivity premise and its limitation, every fallback to the single head joint including the parent requirement, the ROM fallback, and each parameter's unit and sign.
