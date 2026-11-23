# src/soft/validateSoftBodyDomain.ts#validateSoftBodyDomain

## @evidence contracts/development/implementation.md#principled-implementation

Finite scalar and safe-integer rules enforce lattice/array budgets and anchor/state/collider references. Structural right/down rest edges are checked for squared zero length, and an authored dt*referenceSpeed/shortest-edge ratio above one is refused, including arithmetic overflow.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The domain owns admission separately from integration; shared primitive validators keep identical diagnostics while body-capsule world resolution remains with the moving-boundary consumer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Travel admission is a declared heuristic rather than stability or continuous-collision proof. Structural-edge checks do not certify all particle pairs or shear/bend directions, and direct-square magnitudes retain extreme-input limits.

## @evidence contracts/development/common.md#meaningful-documentation

States typed-record admission, fixed budgets, static rest embedding, moving-capsule deferral and unproved solver properties; malformed array/container shapes can still throw.

## @evidence contracts/development/implementation.md#efficient-algorithms

For P rest particles, A anchors, R state poses and K colliders, validation scans arrays/structural edges and reference sets, while static embedding is O(P*K); local sets and findings grow with those supplied populations, even when an over-budget input is reported.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One shortest structural-edge scan supplies the travel measure, and canonical primitive admission helpers replace duplicate rules; mutable rest arrays and references are rescanned rather than cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The collector and reference sets belong to the call; returned findings can retain authored offending values, while no integrated states, actor poses or host resources are retained.
