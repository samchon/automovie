# src/human/generation/IAutoMovieHumanTrunkSolver.ts#IAutoMovieHumanTrunkSolver

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanTrunkSolver exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IFixed. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanTrunkSolver; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IFixed contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/IAutoMovieHumanTrunkSolver.ts#IAutoMovieHumanTrunkSolver.IFixed

## @evidence contracts/development/common.md#meaningful-documentation

The fixed inputs of a solve.

## @evidence contracts/development/design.md#principled-representation `inputs`: The person's tapes, courses and controls in calibration millimetres. `stature`: Stature in calibration millimetres. `crotch`: Height of the crotch ring, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanTrunkSolver.solve, AutoMovieHumanTrunkSolver.converge, AutoMovieHumanTrunkSolver.replay. Also types AutoMovieHumanTrunkSolver.kept, AutoMovieHumanTrunkSolver.SOLVED.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `neck`: Already requested legacy neck chain; absent during direct original preparation. `neckBoundary`: Same physical internal cut's original support descriptor, before any chain. `rawNeck`: Explicit legacy raw supplier; original solving and metadata never call it. `thigh`: The thigh tape, mm, for the groin width; absent, the references' median ratio is used. `groinRatio`: The crotch ring's half girth over the thigh tape, as the leg reports it.
