# src/pose/IAutoMovieMarkRomOvershoot.ts#IAutoMovieMarkRomOvershoot.IEntries

## @evidence contracts/development/common.md#meaningful-documentation

States joint path, finite world location, degree excess and Infinity/zero behavior.

## @evidence contracts/development/design.md#principled-representation

Each record measures one joint; markAutoMovieRomOvershoot rejects nonfinite positions, negative overshoot and NaN, while accepting positive Infinity as unmeasurable.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The mark producer turns positive diagnostics into fresh flagged points and borrows the input list only during the call.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Zero produces no mark and an empty list no output, without an extra success flag or copied ROM constraint.
