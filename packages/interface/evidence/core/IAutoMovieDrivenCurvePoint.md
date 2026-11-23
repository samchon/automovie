# src/core/IAutoMovieDrivenCurvePoint.ts#IAutoMovieDrivenCurvePoint

## @evidence contracts/development/design.md#principled-representation `evaluateDrivenCurve` checks each point is an object with finite `source` and `output` and that sources strictly increase, then uses adjacent points as the ends of one linear segment.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A named pair instead of a two-element tuple, so an author cannot swap input and output by position.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A point equal to or below its predecessor's source throws rather than being reordered or merged with it.

## @evidence contracts/development/common.md#meaningful-documentation

States the mapping each point expresses, the finiteness rule, and the strict ordering against the previous point.
