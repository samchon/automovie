# src/human/generation/IAutoMovieHumanTrunkNeckSeat.ts#IAutoMovieHumanTrunkNeckSeat

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanTrunkNeckSeat exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups ISeat, ILateral. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanTrunkNeckSeat; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the ISeat, ILateral contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/IAutoMovieHumanTrunkNeckSeat.ts#IAutoMovieHumanTrunkNeckSeat.ISeat

## @evidence contracts/development/common.md#meaningful-documentation

The neck's bottom ring.

## @evidence contracts/development/design.md#principled-representation `y`: Mean height, mm. `width`: Half width: the left side neck point's lateral place, mm. `middle`: Forward place of the widest point, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanTrunkNeckSeat.read. Read by AutoMovieHumanTrunkConstruction.prepare. Also types AutoMovieHumanTrunkSolver.seat.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `y`, `width`, `middle`, `front`, `back`, `side`, `lateral`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanTrunkNeckSeat.ts#IAutoMovieHumanTrunkNeckSeat.ILateral

## @evidence contracts/development/common.md#meaningful-documentation

The ring's lateral outline: the left extreme as a function of height at the ring's bottom.

## @evidence contracts/development/design.md#principled-representation `y`: Height of the ring, mm. `z`: Half width: the left extreme's lateral place, mm. `slope`: First derivative of the extreme with respect to height, mm per mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanTrunkNeckSeat.lateral. Read by AutoMovieHumanShoulderLine.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `y`, `z`, `slope`, `curvature`; callers supply the complete record.
