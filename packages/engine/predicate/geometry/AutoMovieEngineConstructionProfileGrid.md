# src/geometry/AutoMovieEngineConstructionProfileGrid.ts#AutoMovieEngineConstructionProfileGrid.create

## @evidence contracts/development/common.md#meaningful-documentation

States the finite-positive millimetre tolerance, original point inputs, loop order and finite sampled criterion.

## @evidence contracts/development/implementation.md#principled-implementation

A finite positive tolerance is required before building any grid. Each loop uses its actual piece surfaces at the candidate stations and piece coordinates. Opposite edges and the centre supply separate station, phase and diagonal chord comparisons. Unresolved work reaches a named refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

A loop indexes its original surface samples by piece, station and phase, reusing exact repeated reads during refinement. Cell and depth limits bound refinement, and the scratch maps die after each completed loop.
