# src/compose/AutoMovieMotionHumanTouchStanceMoves.ts#AutoMovieMotionHumanTouchStanceMoves

## @evidence contracts/development/common.md#meaningful-documentation

States the moves, what they read and who reads them.

## @evidence contracts/development/implementation.md#principled-implementation

The girdle rises by abduction of the working shoulder and the heels by the rise's lift; the trunk's turn is shared by the lumbar and thoracic spine in proportion to their own twist ranges and bounded by their whole range; the raised feet are fitted by each leg's goal on the risen foot and the body lowered onto them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The stance's posture moves, moved verbatim from `AutoMovieMotionHumanTouchStance.solve`, read the scope the solve hands them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every move reads the posture it is given; nothing is clamped beyond the bones' own ranges.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each move is closed-form but the shoulders' middle, which resolves only the shoulder bone group.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the stance's prepared reach check, the range table, the rise's lift and foot, the leg's goal and the raw lowering.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The moves retain only the scope, released with the stance that holds them.

# src/compose/AutoMovieMotionHumanTouchStanceMoves.ts#AutoMovieMotionHumanTouchStanceMoves.IScope

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what the stance holds.

## @evidence contracts/development/design.md#principled-representation

The solve's own values, named, so the moves read them explicitly.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five members, each read by a move.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The scope holds the solve's values as they are; nothing is copied or derived.

# src/compose/AutoMovieMotionHumanTouchStanceMoves.ts#AutoMovieMotionHumanTouchStanceMoves.Shoulder

## @evidence contracts/development/common.md#meaningful-documentation

Names the girdle bones a stance lifts.

## @evidence contracts/development/design.md#principled-representation

The skeleton's own bone names.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two names, one per side.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No other bone is admitted.

# src/compose/AutoMovieMotionHumanTouchStanceMoves.ts#AutoMovieMotionHumanTouchStanceMoves.IMoves

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its inputs, units and result.

## @evidence contracts/development/design.md#principled-representation

The solve's own move signatures.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six moves, each read by the solve or its primitives.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No move serves one law or a test.
