# src/motion/human/touch/IAutoMovieMotionHumanSeatedReach.ts#IAutoMovieMotionHumanSeatedReach.IJoint

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

A joint and its room, the data the weighted resolution reads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The hips stand for the hip joints, which turn the trunk over the seat.

# src/motion/human/touch/IAutoMovieMotionHumanSeatedReach.ts#IAutoMovieMotionHumanSeatedReach.INeedResult

## @evidence contracts/development/common.md#meaningful-documentation

share: Common share in [0, 1] of every eligible trunk joint's remaining flexion room. Zero is returned when joints is empty, even if the target cannot be reached; 1 may mean a feasible endpoint or saturation while still unreachable. The subsequent arm fit judges the actual miss. joints: Eligible trunk bones with their remaining available flexion in degrees; these are available rooms, not applied joint rotations or a certificate that the target is reachable.

## @evidence contracts/development/design.md#principled-representation

share: Common share in [0, 1] of every eligible trunk joint's remaining flexion room. Zero is returned when joints is empty, even if the target cannot be reached; 1 may mean a feasible endpoint or saturation while still unreachable. The subsequent arm fit judges the actual miss. joints: Eligible trunk bones with their remaining available flexion in degrees; these are available rooms, not applied joint rotations or a certificate that the target is reachable.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: touch/HumanSeatedReach.ts (HumanSeatedReach.need, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanSeatedReach.IJoint identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
