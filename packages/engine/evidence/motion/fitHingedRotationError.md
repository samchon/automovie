# src/motion/fitHingedRotationError.ts#fitHingedRotationError

## @evidence contracts/development/common.md#meaningful-documentation

Defines degree-valued displayed error, fixed intermediate frame, shared final split/projection, immutable fit premises and actual residual reporting.

## @evidence contracts/development/implementation.md#principled-implementation

Prepared FK composes the candidate's exact completed prefix or recomputes it in the original grouping. solveDistalTwist and prepareJointRotationProjection are final display's same owners, and the selected raw effector composition is reused before the original world normalization and angle read.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Per-fit bases, clamps and projection precede one candidate closure. It reads lower angles once per unchanged scalar quaternion, commits only successful readings, applies the shared split/projection and scores the shown world rotation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Skeleton axes/ROM and the last authored effector match full FK. No forced-zero residual or claim that the five distal candidates globally solve the combined joints replaces actual composition.

## @evidence contracts/development/implementation.md#efficient-algorithms

Standalone setup is O(B+J); a workspace rig shares fixed lookup/basis/clamp/projector data across its target fits. A non-distal candidate queries once. A distal candidate makes at most five twist-score queries; its winning projection also serves final display whenever the recomputed local demand is component-identical, otherwise one final query runs. Eligible queries score at most nineteen unique actual articulations; generic fallback retains four sweeps and at most 528 recompositions. Chain FK/final world-error work remains, and runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One unchanged workspace shares admitted bases, clamps, held raw/inverse, fixed effector data and projector. This scorer reuses lower clinical/raw/untwisted readings only after all four current components match its private Object.is snapshot, preserving signed zero and mutable caller-record updates. It commits that snapshot only after successful decomposition and non-distal clamp/composition, so a failure cannot identify old data as current. Angle/frame admissions and fresh products remain. Distal projection reuse additionally requires an exactly identical recomputed local demand; final world error still uses the original requested rotation, without an answer crossing scorers.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The target fit releases its scorer, private four-scalar lower snapshot, latest lower clinical/raw/untwisted readings and standalone held raw/inverse data; each is constant-size and the caller's lower quaternion record is not retained. Shared source-held data/projector remain the workspace's. Paired projection is same-query only, with no global handle or growing result cache.
