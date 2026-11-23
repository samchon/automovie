# src/core/math/IAutoMovieQuadraticRow.ts#IAutoMovieQuadraticRow

## @evidence contracts/development/design.md#principled-representation

An index list and parallel weights represent one sparse affine row, transposed to CSC by assembly; nullable endpoints express equality, one-sided and two-sided rows that the engine expands into zero and nonnegative conic constraints.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A plain record with no row kind or flags, because the endpoints alone say whether a row is an equality, one-sided or two-sided, and the same shape serves the program solver, the working-set step, the displacement solvers and the human garment and face closure fits.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unbounded is a null endpoint rather than an infinity or a large stand-in number, so the kernel's `1e30` sentinel stays private to the assembly and no caller can pass a magnitude that collides with it.

## @evidence contracts/development/common.md#meaningful-documentation

States the inequality the row encodes, that unlisted variables have zero coefficients, what equal endpoints and an empty row mean, and per member the index range and uniqueness, the parallel length, finiteness, the sentinel limit, inclusiveness and what null means.
