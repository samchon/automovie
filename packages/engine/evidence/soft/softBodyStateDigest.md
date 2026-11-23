# src/soft/softBodyStateDigest.ts#softBodyStateDigest

## @evidence contracts/development/implementation.md#principled-implementation

Step, positions, velocities, maxSpeed, maxStrain and contacts form the ordered byte stream; identical selected bytes hash identically, while a 32-bit result cannot uniquely identify the field or certify cross-host replay.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One diagnostic helper serves portable determinism tests; no production/viewer consumer currently adopts this digest as content identity or admission evidence.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fixture-specific expected hash is built into production; collision limitations and omitted metadata remain explicit rather than being advertised as bit-identical proof.

## @evidence contracts/development/common.md#meaningful-documentation

States exact selected fields, encoding, collision limitation and test-only reach.

## @evidence contracts/development/implementation.md#efficient-algorithms

For P position and V velocity scalars, flattening and eight-byte hashing cost O(P+V) time and O(P+V) temporary numeric storage, plus one eight-byte view.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The byte view is reused for every scalar within a call; independent states are hashed anew and no identity cache assumes unchanged arrays.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Flattened values and the byte view are local; only a fixed eight-character hex string survives, without retaining the input arrays.
