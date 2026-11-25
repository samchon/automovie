# src/production/IAutoMovieReadGeometryGround.ts#IAutoMovieReadGeometryGround.IResult

## @evidence contracts/development/common.md#meaningful-documentation

States metre height, first-surface precedence, no-ground sentinel, declared walkability and fresh ownership.

## @evidence contracts/development/design.md#principled-representation

A nullable surface ID distinguishes absent ground from authored zero-height ground. The producer keeps the three fields coherent; the structural object type alone permits inconsistent combinations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Ground and formation queries need height, provenance ID and declared walkability without retaining an entire terrain record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Zero height with null surface is not a synthetic supporting plane; walkability is read from the selected surface even when a later surface would be walkable.
