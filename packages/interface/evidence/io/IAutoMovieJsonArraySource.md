# src/io/IAutoMovieJsonArraySource.ts#IAutoMovieJsonArraySource

## @evidence contracts/development/common.md#meaningful-documentation

Separates producer-owned JSON/count validity from the writer's hash, bracket and empty-array checks.

## @evidence contracts/development/design.md#principled-representation

The item count measures array entries, not bytes or generated vertices; SHA-256 covers the complete fragment.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Array publication and mesh-spool channels share this fragment descriptor without retaining file handles or decoded arrays.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A verified digest does not independently prove valid JSON, matching nonempty item count or admitted geometry.
