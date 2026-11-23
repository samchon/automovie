# src/posture/hipJoints.ts#hipJoints

## @evidence contracts/development/common.md#meaningful-documentation

States world-metre root/outputs, clinical pelvis degrees and the exact two requested origins.

## @evidence contracts/development/implementation.md#principled-implementation

Upper-leg origins follow their complete root-to-pelvis ancestry under canonical prepared FK; only pelvis articulation is authored because other limb joints cannot move those origins.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One demanded poseBones read supplies both origins; the local side lookup alone owns the missing-hip diagnostic.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No neutral pelvis approximation or fixed offset replaces the rig's actual FK, and a missing upper leg throws rather than inventing its hip.

## @evidence contracts/development/implementation.md#efficient-algorithms

The two-name demand is prepared once per body. Each read admits at most one joint, checks only the two hips' ancestry and returns two fresh records instead of the full hierarchy; runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The unchanged body owns static canonical prerequisites and the fixed HIP_BONES selection. A weakly owned bound demand reuses only those indices; a supplied same-person reader shares actual exact dependencies with lowering/guard reads. No pose or query result is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One static demand closure per weak live-body key releases with that body and retains no operation reader or pose. Each call owns a small pose/map and two fresh output points, without history, handles or tasks.
