# src/motion/sampleMotion.ts#sampleMotion

## @evidence contracts/development/implementation.md#principled-implementation

Pose and root projections evaluate the same time interval and easing, omitting only fields their callers never read. Uses the shared lower-bound segment search with earlier-segment exact-key ties, interpolates clinical axes linearly through easing, root translation/scale by lerp and rotation by slerp; null axes/roots/expressions are neutral, with null retained only when both sides omit that value.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One sampler owns sparse-to-dense clinical interpolation; named/bezier easing and segment search have shared owners, while expression channels blend separately from pose geometry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Empty keyframes throw and caller admission owns finite clock/ordered keys; differing expression presets switch at eased midpoint and cubicBezier requires authored controls rather than a fabricated curve. These conventions are explicit API semantics.

## @evidence contracts/development/implementation.md#efficient-algorithms

Interior lookup is O(log F) key reads followed by O(Ja+Jb+expression channels) map/set interpolation; endpoints require constant wrapper work and share nested records without full pose copies.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One segment/eased progress serves pose and expression; joint maps remove repeated linear bone lookup, while no cache assumes keyframes or expression arrays remain unchanged across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Interior results own new interpolated records and endpoint wrappers share original root/joints/expression; temporary maps/sets are call-local, and no frame history, handle or task persists.

## @evidence contracts/development/common.md#meaningful-documentation

States finite/admitted motion premise, local-time clamp/wrap, exact endpoint sharing, neutral treatment and the distinct interpolation laws.
