# src/recovery/mesh/IAutoMovieRecoverySectionsInput.ts#IAutoMovieRecoverySectionsInput

## @evidence contracts/development/design.md#principled-representation

Explicit physical plane coordinates and the existing registered mesh and fit policy define observations without automatic station generation or inferred correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One input selects only the mesh, frame and fitting fields consumed by finite named sections.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No part selection, specimen controls, source normals, mesh fallback or assumed continuation is accepted.

## @evidence contracts/development/common.md#meaningful-documentation

States physical coordinates, input ordering, component coverage and borrowed source lifetime; inherited fields retain the registered observation contract.
