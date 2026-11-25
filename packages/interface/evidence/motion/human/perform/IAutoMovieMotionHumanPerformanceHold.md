# src/motion/human/perform/IAutoMovieMotionHumanPerformanceHold.ts#IAutoMovieMotionHumanPerformanceHold.IPropOwn

## @evidence contracts/development/common.md#meaningful-documentation

bones: Synchronous accessor for that performer's currently resolved bones, at least those `requested` (every bone when absent); the returned map is borrowed and must remain stable for the current query. Failures propagate to hold resolution.

## @evidence contracts/development/design.md#principled-representation

bones: Synchronous accessor for that performer's currently resolved bones, at least those `requested` (every bone when absent); the returned map is borrowed and must remain stable for the current query. Failures propagate to hold resolution.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanPerformanceHold.ts (HumanPerformanceHold.prop, own).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidBone, IAutoMovieResolvedBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
