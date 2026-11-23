# src/geometry/sweep/IAutoMovieSweepBinding.ts#IAutoMovieSweepBinding

## @evidence contracts/development/design.md#principled-representation

Key sections either ride a link rigidly or sit at a joint and turn with both links, the two binding kinds of sweep-based deformation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Bone names aligned with the sweep's own points and stations; no weights, because the sweep's interpolation spreads each motion between stations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Misaligned bindings are refused by the poser, not padded.

## @evidence contracts/development/common.md#meaningful-documentation

States what each binding kind does, the halfway choice and its basis.
