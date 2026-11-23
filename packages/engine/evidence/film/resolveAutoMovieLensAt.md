# src/film/resolveAutoMovieLensAt.ts#resolveAutoMovieLensAt

## @evidence contracts/development/implementation.md#principled-implementation

Selects the intent with the greatest start at or before the second, measures each mark's depth `(P − C) · forward` from the camera's current placement, and eases a pull with the smoothstep `u²(3 − 2u)`, whose zero end slopes match a puller's start and landing. Depths are measured per second, so a moving camera changes focus as a fixed mark would on a set; marks are fixed world points, so there is no follow focus. A non-positive depth resolves null because no plane in front of the camera exists to focus on.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function; the film's `optics` composes it with the camera placement it already has.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The ease is the issue's stated curve; no intent or mark is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States the active-intent rule, each null case, the depth formula, the pull curve and the absence of follow focus.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(I) over the shot's intents, which number a handful.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One second per call; nothing is shared.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
