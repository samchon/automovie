# src/service/IAutoMovieServiceSegment.ts#IAutoMovieServiceSegment

## @evidence contracts/development/design.md#principled-representation

A world-meter polyline joins compatible ports within the gate's 1e-6 metre endpoint tolerance. Positive radius supplies swept clash bounds; declared section matches nonnull port sections within the existing 1e-9 square-metre tolerance, and sleeve references undergo fit and crossing checks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Route geometry and its two-port topology stay together, with boundary-owned sleeves referenced rather than embedded into each run.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Endpoint and section tolerances are explicit. Crossings inspect route vertices rather than every point of a leg, and shared-node run pairs are exempt from clash comparison; axis-aligned swept bounds do not establish exact cylindrical separation or hydraulic performance.

## @evidence contracts/development/common.md#meaningful-documentation

Defines system and direction-compatible ports, world route endpoints, positive radius/section and sleeve references.
