# src/lexicon/fixedSeatTrunk.ts#fixedSeatTrunk

## @evidence contracts/development/implementation.md#principled-implementation

Rotation about one fixed clinical axis gives two distance-squared sinusoids. Ends, stationary points and equal-distance crossings minimize their maximum on that coordinate. The two signs of trunk turn allow either arm above the other.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only independent clinical axis ranges are admitted. No phase, handle dimensions, stored pose or actor-specific angles enter the fit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads the two shoulders and their ancestors only. Coordinates stop improving to the rig's angular resolution. This coordinate minimum is a candidate and does not certify global feasibility or contact.
