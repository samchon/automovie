# src/posture/HumanArmTrajectoryEffector.ts#HumanArmTrajectoryEffector

## @evidence contracts/development/common.md#meaningful-documentation

States the path's frame, the roots and null space chosen, and how the actual trajectory is admitted.

## @evidence contracts/development/implementation.md#principled-implementation

Each target uses the engine's hinge law and exact half-angle coefficients. The swivel that maximizes the quaternion dot product is analytic, and the wrist is checked with rig-projected forward kinematics.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare endpoint geometry and hinge source once, then solve at most two branch candidates for a requested progress.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A rig projection that takes the wrist off its target refuses the analytic candidate. Clearance, speed, contacts and all other terms belong to the unchanged trajectory model.

## @evidence contracts/development/implementation.md#efficient-algorithms

Plan-time preparation: one placement of the start arm and its hand's probes against the shapes their spheres reach (`HumanArmTrajectoryLiftTurn`), once per transport; then at most two analytic branch poses and their single-arm FK per requested point, tried nearest the reference first and stopped at the first that passes, so a farther branch is posed only when the nearer fails. No posture fit, swivel sweep or collider placement occurs here.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares canonical hinge geometry, coordinate encoding and arm placement with the rig and trajectory owners.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The transport keeps endpoint poses and prepared rest geometry. Each actual target, branch and candidate releases before the next call.
