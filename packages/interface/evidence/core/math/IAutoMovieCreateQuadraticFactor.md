# src/core/math/IAutoMovieCreateQuadraticFactor.ts#IAutoMovieCreateQuadraticFactor.IResult

## @evidence contracts/development/common.md#meaningful-documentation

States the KKT matrix, source lifetime, update state, refusal values and owned outputs.

## @evidence contracts/development/design.md#principled-representation

H and RHS use conic numerical scaling; dimensions are m and n+m rather than geometry units. Admission belongs to the numerical caller except for documented method checks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The interior solver reuses update/solve; nonzeros exposes actual strict-lower fill for diagnostics.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A failed update invalidates the factor and an unavailable solution stays undefined; finite factors do not imply solved program status.
