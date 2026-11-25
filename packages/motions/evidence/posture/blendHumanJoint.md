# src/posture/blendHumanJoint.ts#blendHumanJoint

## @evidence contracts/development/common.md#meaningful-documentation

States what is blended, why a ball joint is blended as a rotation, how a swing-twist range is kept with the measured case, why a joint with fewer freedoms is not, each argument with its unit, and what an end returns.

## @evidence contracts/development/implementation.md#principled-implementation

Spherical linear interpolation of the two joint rotations is the constant-speed shortest turn between them and depends on neither end's reading; a swing-twist joint is blended on its range's chart, a convex set on which the line between two ends stays, so the blend stays in the range and is continuous in its share and in both ends. A joint with fewer than three freedoms moves only about its own axes, so its angles are its coordinates and are interpolated as such.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One interpolation owner keeps endpoint/hinge ordering across standalone, operation-metadata and fixed-pair readers. Private rotation/readback helpers preserve existing forward/inverse argument order; fixed pairs share endpoint slerp or the engine's prepared chart blender, without copying chart mathematics into motions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No bone is named: actual ROM determines hinge/ball and chart gating. Every read clamps share with the original Math.min/max; endpoint shares return original tuples before any rig/numerical preparation, and NaN still follows the original interior arithmetic/refusal path. between requires unchanged body/canonical mappings/from/to until release, performs first-interior admission in original order and retains both the slerp's and caller's existing normalizations. No new tolerance, range, endpoint repair or sampled result is introduced.

## @evidence contracts/development/implementation.md#efficient-algorithms

Standalone lookup/axis merge is O(B) for B bones; prepare shares O(B+D) metadata across D actual names while keeping variable endpoints numerical. Each between reader performs one lazy O(B) lookup/merge plus original endpoint conversions/charts on first interior use, then each share needs only original linear/arc/chart interpolation and readback. Fixed hinges also share six affine operands. J independent fixed pairs may therefore cost O(B*J) initial metadata work; repeated queries omit endpoint preparation. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All reads share this interpolation owner, canonical mappings, engine chart/slerp owners and inverse box preparation. prepare shares only operation metadata for changing tuples. between instead holds one caller-declared unchanged pair: lazy hinge operands, two normalized endpoint rotations plus arc invariants, or two endpoint chart coordinates; every current share and blended readback still runs normally. No share-dependent output or target result is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Callers own fresh interior triples or borrow their original endpoint. Standalone locals end with the call; prepare owns O(B+D) metadata until operation release. Each between closure borrows body/bone/two tuples and owns at most one branch reader, one rig frame and either six hinge scalars, two private normalized quaternions/one arc record or two private chart records. The inverse retains only its existing weak metadata; fixed-pair state releases with the law plan and never retains a queried share, blended result, population, handle or task.
