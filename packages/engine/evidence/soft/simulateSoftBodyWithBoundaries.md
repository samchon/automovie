# src/soft/simulateSoftBodyWithBoundaries.ts#simulateSoftBodyWithBoundaries

## @evidence contracts/development/implementation.md#principled-implementation

Every boundary step, moving-anchor particle and body-capsule id must cover its authored counterpart exactly, with finite target vectors and positive finite radii, before the shared fixed-clock core runs. Core domain validity remains a separate caller premise.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Boundary completeness is checked once before integration, while one shared core owns both static and moving trajectories and their numeric ordering.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing, foreign and duplicate targets are refused; static anchors are not invented for absent moving samples, and no frame interpolation repairs an incomplete history.

## @evidence contracts/development/common.md#meaningful-documentation

States inclusive step coverage, static-plus-moving semantics, core premise and unwired host reach.

## @evidence contracts/development/implementation.md#efficient-algorithms

For K samples, A authored moving anchors and B capsules, admission scans samples and their target records using sets; replay adds O(P*K*(I+C+B+A)) in its moving-anchor find path, with O(P+A+B) local working storage excluding supplied history.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Authored moving particle/capsule sets are reused across all samples, and the core reuses prepared lattice data across steps; different boundary histories are not treated as equivalent cached trajectories.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Admission sets are call-local, boundary rows are read only, and only fresh state arrays survive successful integration; refusal acquires no actor, animation cursor or render host.
