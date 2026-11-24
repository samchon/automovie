# src/sport/highJumpBar.ts#highJumpBar.IBar

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit and frame.

## @evidence contracts/development/design.md#principled-representation

World metres for the centre and the span; the axis has unit length.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The centre, the axis and the span the flight's crossing test and the approach rule read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The span is absent when the affordance declares none, rather than guessed.

# src/sport/highJumpBar.ts#highJumpBar

## @evidence contracts/development/common.md#meaningful-documentation

States what is read, where and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The affordance's translation and +X carried into the world by the prop's frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup and one rigid transform.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing bar is refused with the prop's contacts, never replaced by a number.

## @evidence contracts/development/implementation.md#efficient-algorithms

A first-match affordance scan and one world frame read.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads one placed prop once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/sport/highJumpBar.ts#highJumpBar.admit

## @evidence contracts/development/common.md#meaningful-documentation

States the rule, its source and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A flop takes off from the foot farther from the bar (Dapena 1980, "Mechanics of translation in the Fosbury-flop", Med Sci Sports Exerc 12:37-44): the bar's vertical plane lying on the runner's right asks the left foot and on the left the right one. The runner's left is up crossed with the run's heading; the plane's side is its horizontal normal, turned toward the plane from the planted ankle, projected on that left.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One side test and one refusal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The foot is refused, never swapped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads two records once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
