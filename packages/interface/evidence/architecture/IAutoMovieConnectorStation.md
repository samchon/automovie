# src/architecture/IAutoMovieConnectorStation.ts#IAutoMovieConnectorStation

## @evidence contracts/development/design.md#principled-representation

One record per authored route point whose `at` is the cumulative 3D length to that point over the total, so stations share the arc-length parameter landings and sections use.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Position, optional facing and fraction are what a traversal reads per point; a facing the author did not state stays null instead of a derived heading.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No heading is invented for a connector without orientations, which keeps a later analysis from treating a guess as a design decision.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer and order, how `at` is computed with its end values, that `position` and `rotation` alias the record's objects, and what a null rotation means.
