# src/architecture/validateBuiltSpaceShell.ts#validateBuiltSpaceShell

## @evidence contracts/development/implementation.md#principled-implementation

Counts each directed edge and its reverse once, refuses non-finite or negligible computed cross-product length and requires finite positive signed volume. These are local pairing and aggregate-orientation checks under binary64 arithmetic; they do not certify full manifold topology, non-self-intersection or every component's orientation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The shell half of building space validation, separated from `validateBuiltEnvironment` so that file stays one orchestration, and it reuses the shared volume measure the containment queries read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No shell is repaired, re-wound or special-cased; the early stops exist because a later test would only restate the first failure, as documented.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states each condition and why it matters, the count floors, the check order and where it stops, and each parameter's role.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in vertices and triangle indices: one index scan, one pass building the directed-edge counts in a hash map, one pass over those edges, and one volume sum.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A check of one shell per call; each space's shell is checked once per validation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The local edge map has at most three entries per triangle. Findings include at most one vertex-count and one later structural/volume finding, plus one per non-finite component; the caller owns them.
