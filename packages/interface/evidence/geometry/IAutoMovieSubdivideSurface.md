# src/geometry/IAutoMovieSubdivideSurface.ts#IAutoMovieSubdivideSurface.IProps

## @evidence contracts/development/common.md#meaningful-documentation

A borrowed polygon cage and integer level from one through six define deterministic Catmull-Clark refinement in the cage's frame and unit. A number cannot enforce the refinement cap, and the cage type cannot prove manifoldness or nonvanishing limit normals.

## @evidence contracts/development/design.md#principled-representation

A borrowed polygon cage and integer level from one through six define deterministic Catmull-Clark refinement in the cage's frame and unit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

subdivideAutoMovieSurface consumes the canonical cage contract and owns topology, level and limit-normal admission.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A number cannot enforce the refinement cap, and the cage type cannot prove manifoldness or nonvanishing limit normals.
