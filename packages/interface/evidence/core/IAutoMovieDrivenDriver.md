# src/core/IAutoMovieDrivenDriver.ts#IAutoMovieDrivenDriver

## @evidence contracts/development/design.md#principled-representation `applyDriven` checks the output is scalar-width, reads the source as exactly one finite value, then evaluates the curve or the affine remap `o0 + (o1 - o0) * t` with `t = (x - i0) / (i1 - i0)` (zero when the ends are equal), clamping `t` to `[0, 1]` only when `clamp` is true.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One driver type covers both mappings, with the curve as an optional field that replaces the range triple, so a nonlinear driver need not invent a dead range.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Node TRS and existing multi-morph outputs refuse rather than being narrowed, and absent linear ranges throw. Finite source/range/control values do not certify every remap or interpolation intermediate: the scalar output has no separate finite-result gate before publication to the sampled map.

## @evidence contracts/development/common.md#meaningful-documentation

States both mappings and when each applies, the pass and ordering, the exact output and source width rules, the answer for an unsampled source and for equal range ends, the clamp default, and where a pointer output becomes visible.
