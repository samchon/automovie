# src/human/generation/leg/IAutoMovieHumanLegCrotchFillet.ts#IAutoMovieHumanLegCrotchFillet

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanLegCrotchFillet exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups ILoop. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanLegCrotchFillet; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the ILoop contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/leg/IAutoMovieHumanLegCrotchFillet.ts#IAutoMovieHumanLegCrotchFillet.ILoop

## @evidence contracts/development/common.md#meaningful-documentation

The leg's start ring at the leg's phases.

## @evidence contracts/development/design.md#principled-representation `points`: Points of the loop at the leg's phases. `normals`: Outward horizontal normals there. `rates`: The trunk's station derivative at each point, per mm up.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLegCrotchFillet.of. Also types AutoMovieHumanLegCrotchFillet.out, AutoMovieHumanLegCrotchRoot.loop.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `points`, `normals`, `rates`, `seconds`, `edges`; callers supply the complete record.
