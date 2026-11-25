# src/posture/HumanArmTrajectoryLaid.ts#HumanArmTrajectoryLaid.IAdmitted

## @evidence contracts/development/common.md#meaningful-documentation

States each member, when the course is kept and what the reading's context is for.

## @evidence contracts/development/design.md#principled-representation

The course's readers, its verdict with the refusing term, and the frame grid's context the verdict was read on.

## @evidence contracts/development/design.md#minimal-and-owned-surface

ArmPlanned reads the verdict and the readers, ArmCourse the refusing term, and `solve` the reading.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The context is the model's own record, handed on whole; no part of it is restated.

# src/posture/HumanArmTrajectoryLaid.ts#HumanArmTrajectoryLaid.admitted

## @evidence contracts/development/common.md#meaningful-documentation

States what the caller gives, how the transports are laid and timed, what is read, the fixed ends, the admission and its equivalence to `solve`'s refusal test.

## @evidence contracts/development/implementation.md#principled-implementation

A joint-space blend in the optimiser's own coordinates, time-scaled along the fastest probe's arc under the speed bound, read by the same context, hard-range projection and evaluation the optimiser's iterates are read by, in the same mirror image `solve` reads a left-first problem in, so an admitted course meets every requirement a solved one meets and a mirrored course is admitted alike.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One context, the hold's encoding, two transports, one evaluation, then the shared playback factory.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No bound is relaxed; a course that misses one is returned to the caller's optimisation.

## @evidence contracts/development/implementation.md#efficient-algorithms

One context build, `ARC` placements of each arm per transport for the arc, a forward pass through the waypoints and arc samples, and one model evaluation. A collision can add one Jacobian reading per detoured arm and one evaluation of only the waypoints replaced in that round, up to `DETOURS` rounds.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the context builder, the model's placement and evaluation and `solve`'s playback, so both paths are read alike; the builder and the context are returned for `solve` to read the same grid on.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The arc's samples live until return; the readers keep only setups, times and coordinates, as `solve`'s do, and the reading's context lives while the caller holds the result.
