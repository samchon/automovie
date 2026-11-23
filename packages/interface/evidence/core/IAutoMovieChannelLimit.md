# src/core/IAutoMovieChannelLimit.ts#IAutoMovieChannelLimit

## @evidence contracts/development/design.md#principled-representation `applyChannelLimit` validates finiteness, width and ordering, then clamps each component independently to its own bounds and records one violation per crossed bound with the component, side, limit and actual value, a per-axis box clamp.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One channel reference and two nullable bound vectors express every per-component box limit, and profile-bound limits apply before direct ones in `resolveFrame` so the caller's limit clamps last.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Malformed bounds throw instead of being ignored, and an out-of-range value is clamped and reported rather than silently clamped; the remaining gap is that a rotation quaternion is boxed per component, which is not an angular limit, so the humanoid joint constraint stays separate.

## @evidence contracts/development/common.md#meaningful-documentation

States combined clamping/reporting, supplied-value width, null versus omitted-tail versus resident-hole semantics, phase ordering and unnormalized quaternion component bounds.
