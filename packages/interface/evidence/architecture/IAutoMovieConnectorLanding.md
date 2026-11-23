# src/architecture/IAutoMovieConnectorLanding.ts#IAutoMovieConnectorLanding

## @evidence contracts/development/design.md#principled-representation

A stop is a space id plus an arc-length fraction of the 3D route polyline, so its position is the route point at that share of total length, independent of how unevenly the route points are spaced.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Endpoints stay on the connector's `from` and `to`, and a landing names only an intermediate space, so the stop list of a run is `from`, the landings in order, then `to`, with nothing stated twice.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Containment of the stop point is deliberately not tested, for the stated facade-ladder reason, and the check moves to the carriage that physically stands there rather than being skipped.

## @evidence contracts/development/common.md#meaningful-documentation

States why the stop point is not tested for containment and what is tested instead, that the space resolves, appears once, and is not an endpoint, and the open range and strict ordering of `at`.
