# src/construction/IAutoMovieSolidIntersectionWalk.ts#IAutoMovieSolidIntersectionWalk.IWalk

## @evidence contracts/development/design.md#principled-representation

The seed tuple is [part station, part phase, host first coordinate, host second coordinate] at trace parameter zero; each surface owns its chart units.

## @evidence contracts/development/design.md#minimal-and-owned-surface

SolidIntersectionWalk returns the original seed and law together for SolidIntersectionTrace.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The tuple fixes four coordinates but neither valid face indices nor a closed intersection; tracing performs those checks.

## @evidence contracts/development/common.md#meaningful-documentation

Names the original starting preimages and retained parameter law.
