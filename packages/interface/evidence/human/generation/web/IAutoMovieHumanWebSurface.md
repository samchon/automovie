# src/human/generation/web/IAutoMovieHumanWebSurface.ts#IAutoMovieHumanWebSurface

## @evidence contracts/development/common.md#meaningful-documentation

The third stage of a web's build: the surface's laws, the points a row of a column takes.

## @evidence contracts/development/design.md#principled-representation `levelOf`: A row's level in the chart of a web's child. `rowOf`: The row at a level of the chart of a web's child: the inverse of `levelOf`. `lip`: A margin's lip at a depth past the ring, as a share of its radius.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanWebSurface.of. Read by AutoMovieHumanWebMesh.of. Also types AutoMovieHumanBodyWeb.surface.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `levelOf`, `rowOf`, `lip`, `chart`, `plainAt`; callers supply the complete record.

# src/human/generation/web/IAutoMovieHumanWebSurface.ts#IAutoMovieHumanWebSurface.Plain

## @evidence contracts/development/common.md#meaningful-documentation

A column away from the pinches.

## @evidence contracts/development/design.md#principled-representation

A column away from the pinches. Extract< IAutoMovieHumanWebColumn, { kind: "plain"; } > retains the referenced owner's constraints and mutability.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanWebSurface.Plain belongs to IAutoMovieHumanWebSurface; its public declaration is reached by the Human main-entry export closure.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A column away from the pinches. Its exported identity is retained for the existing Human public surface.
