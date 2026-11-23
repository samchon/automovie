# src/film/gaitPhaseOf.ts#gaitPhaseOf

## @evidence contracts/development/implementation.md#principled-implementation

A stride phase is a position on a circle of circumference `period`, so it is computed with the repository's positive modulo, and the carried phase plus elapsed time with `addPositiveModulo`, which normalizes both terms first so an in-range phase plus a whole period returns the same bits; it relies on a validated clip with a finite duration, and degenerate cycle fields answer `null` instead of propagating `NaN`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One phase rule read by both beat-boundary resolvers, so the end of one beat and the opening of the next can never disagree about where a stride is; the loop branch reuses `positiveModulo` instead of a private wrap.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no clip, gait or rig; the carried cycle wins over `loop` because it is the clip's own statement of its stride, and every degenerate form answers `null` by the same rule.

## @evidence contracts/development/common.md#meaningful-documentation

States which source wins, the formula for each branch, every `null` case, the unit and range of the phase, and which resolvers store it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed scalar work delegates wrapping to positiveModulo or addPositiveModulo; no keyframe or joint population is traversed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure scalar of one clip and one instant that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates and retains nothing; it returns a number.
