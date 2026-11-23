# src/architecture/IAutoMovieDesignWithholding.ts#IAutoMovieDesignWithholding

## @evidence contracts/development/design.md#principled-representation `promoteDesignObservations` runs six gates in a fixed sequence and returns at the first failure: no observed analysis produced it, it lists an alternative, it lists an open issue, its confidence is below the floor, a primitive is not line, polyline, or region, or a frame has no settled scale.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One closed reason plus an engine-written detail per candidate, so a caller can branch on the reason and show the detail without parsing either.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A candidate with rivals is withheld rather than resolved by picking the most confident one, and only the first reason is reported instead of a list a caller might read as a checklist.

## @evidence contracts/development/common.md#meaningful-documentation

States the gate order, that only the first failing reason is recorded, and what facts the detail sentence names for each reason.
