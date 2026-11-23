# src/soft/shortestRestLength.ts#shortestRestLength

## @evidence contracts/development/implementation.md#principled-implementation

A row-major horizontal/vertical walk uses the same scalar distance arithmetic as the solver, after checking one triple per declared particle. Typed admitted dimensions and dense finite rest entries are premises; extreme square overflow/underflow is not normalized away.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The travel-number validator and budget reuse one shortest-edge owner, and canonical particle distance keeps budgeting arithmetic aligned with solver rest lengths.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Length mismatch exits before a potentially huge lattice walk; Infinity is the existing no-edge sentinel and does not certify malformed domains, which validation reports independently.

## @evidence contracts/development/common.md#meaningful-documentation

States edge families, no-edge/mismatch meaning and numeric premises.

## @evidence contracts/development/implementation.md#efficient-algorithms

With P admitted lattice particles, at most two outgoing edges per particle make O(P) time and constant extra storage; a length mismatch takes constant time.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each edge is considered once; a changed rest field or dimensions require a new minimum, so no cross-call cache is used.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only a scalar is returned; the authored rest array is read without copying, mutating or retaining it.
