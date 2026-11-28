# src/geometry/IAutoMovieSignedMeshQueryOptions.ts#IAutoMovieSignedMeshQueryOptions

## @evidence contracts/development/common.md#meaningful-documentation

The type distinguishes topology required in open and closed mode and states the caller-owned orientation and embedding premises.

## @evidence contracts/development/design.md#principled-representation

The creator admits only open or closed mode, pairs opposing edge uses and checks connected vertex fans. Open mode permits single-use rim edges, and omission selects closed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A single boundary mode selects the topology operation. It carries neither surface winding nor an embedding certificate.

# src/geometry/IAutoMovieSignedMeshQueryOptions.ts#IAutoMovieSignedMeshQueryOptions.boundary

## @evidence contracts/development/common.md#meaningful-documentation

Omitting the field selects closed pairing. Open mode additionally permits singly used rim edges.
