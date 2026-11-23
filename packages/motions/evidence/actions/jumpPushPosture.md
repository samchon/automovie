# src/actions/jumpPushPosture.ts#jumpPushPosture

## @evidence contracts/development/common.md#meaningful-documentation

Names the raw phase, local clock, entry arm rates and lowering stage.

## @evidence contracts/development/implementation.md#principled-implementation

The existing minimum-jerk arm swing and carried entry flexion rates, with the entered elbow's fading gap from the jump's elbow rule, accompany the same push writer and root Hermite; ordinary lowering retains the declared planted knee extension.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Clamp local time, apply the two prepared entry-arm tracks to this same phase sample, assemble joints, write both legs and lower once.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the push's own root path, never a future flight root or surrogate pose; original goals, entry velocity and acceleration remain intact.

## @evidence contracts/development/implementation.md#efficient-algorithms

One explicit phase sample shares root/progress/carry/yaw/pelvis across arm and leg assembly. Optional fixed-body writers prepare the joint prefix and cosine-law reach once; every current heel rule, plant collection, hip FK and lowering square root/comparison remains. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Arms, the heel's actual hip and the final posture consume the same phase sample. Explicit fixed writers share only unchanged relaxed/upright entries, arm separation and the body's minimum-knee reach; omission retains original live table/dimension reads. Terminal legs still share the endpoint writer. The heel's actual hip FK and lowering borrow one synchronous lazy workspace without retaining a pose, goal or fitted answer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh posture records and retains neither those records nor the optional borrowed reader/supplier, whose lifetime remains the synchronous caller's.
