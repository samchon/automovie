# src/posture/HumanArmTrajectoryLay.ts#HumanArmTrajectoryLay

## @evidence contracts/development/common.md#meaningful-documentation

States the transport, its blend and detours, its pace and what is written.

## @evidence contracts/development/implementation.md#principled-implementation

A straight wrist path in the carrier frame is tried first; otherwise the waypoints lie on the minimum-jerk time law of the joint arc (Flash and Hogan 1985), whose peak speed is `M.UNIT` times the arc over the span.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The transport's body, moved verbatim from the laid course, reads the scope the course hands it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every interior waypoint is laid; a pace past the law's is left for the model to refuse.

## @evidence contracts/development/implementation.md#efficient-algorithms

`ARC` placements for the arc, then one placement per interior waypoint.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the context's setups and frames, the bridge and the effector solvers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the waypoints are written into the caller's course.

# src/posture/HumanArmTrajectoryLay.ts#HumanArmTrajectoryLay.IScope

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what the course holds.

## @evidence contracts/development/design.md#principled-representation

The laid course's own values, named, so the transport reads them explicitly.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members, each read by the transport.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The course's coordinates are the caller's own array, written in place as the course lays them.

# src/posture/HumanArmTrajectoryLay.ts#HumanArmTrajectoryLay.ILaid

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit or meaning.

## @evidence contracts/development/design.md#principled-representation

The shares the waypoints stand at, the law's pace and the path kind.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, each read by the laid course.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The pace is the straight arc's, never a detour's.
