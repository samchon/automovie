# src/kinematics/decomposeJointRotationOnBasis.ts#decomposeJointRotationOnBasis

## @evidence contracts/development/implementation.md#principled-implementation

Closed-form Euler extraction reads each angle's sine and projected cosine through atan2; a projected cosine within the square root of the binary64 unit roundoff, where a rounding error and the pin's truncation error meet, takes the undetermined-angle convention. Among the principal chart, the alternate chart and each angle's full-turn alias nearest its range, the least ROM overshoot wins, and every candidate is the same rotation. Nonnegative fault distances prove that an exact zero score is an unbeatable lower bound under the existing strict-improvement tie rule. A constraint's `swingTwist` is set aside while the readings are ranked, since both readings of one rotation lie equally inside such a gate; the three-angle box ranks them, so the reading a pose reports stays the one it always was.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Direct/prepared readers share one extraction owner. One rotation helper, `readRotatedVector`'s expressions, writes three completed columns into nine module cells; original dots follow all rotations through one column reader. Clinical/align/lift helpers receive actual metadata/affine readers without per-call closures; conversion, scoring and aliases retain their owners and raw decomposition still admits the basis first.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Selection compares the caller's unchanged constraint and never clamps an angle into range; the gimbal pin is the standard convention for an undetermined pair and no bone is special-cased. Only exact zero terminates further alias construction/scoring; quaternion admission and the principal chart's conversion keep their original order, and the alternate chart, three sums of the finite principal angles through the frame the principal admitted, is converted only where the principal overshoots, since it can neither fail nor improve on a zero. prepareQueries reads no numerical input at construction, shares successful affine operands only under declared unchanged frame lifetime and admits replaced axis-frame objects at their next actual conversion. Failed admission installs no successful reading. No quaternion, extracted angle, alias, score or target result crosses queries. Pure numeric aliases that cannot improve zero need not be built, and no tolerance/projected answer is substituted. Weak handedness provenance recognizes only the normalizer's actual owned records, never caller-controlled freeze/descriptors or matching values.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three rotations/fixed dots and at most three ROM scores remain constant work. Nine module-owned cells receive the three rotated axes, with no per-call array, vector record or callback (the arm-goal allocation profile showed about 65 MB of a 1 GB run in the former column array, its pushes and the rotation callback's boxed numbers). Exact zero stops further aliases/scoring, saving at most two aliases/six turn calculations/two fault scans and the former candidate array; a principal inside the box omits the alternate chart and its conversion. Fixed projectors share three lazy affine readers. Genuine owned handedness hits omit snapshots/nine comparisons; unowned inputs retain all nine reads first. Gated-box hits keep original key/count/member checks. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller supplies an admitted basis. The actual projector's prepareQueries shares only successful fixed toClinicalAngle operands; every quaternion still extracts/ranks its own charts. Weak handedness trusts only genuine normalizer-owned immutable results. Unowned/copy/inherited/user-frozen/accessor bases complete the original nine reads once before comparing local snapshots, including misses. A known gated constraint completes Object.keys before private-count gating; only equal counts enter the original ordered member predicate. First misses keep the original spread without a preceding input key pass. No added descriptor-based trust, prototype enumeration or target-dependent result establishes reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Outputs are fresh local angles; one nine module cells hold only the extraction in progress, every dot reading them before the chart choice runs. A prepared source borrows basis/frame/domain, owns three affine closures with at most one frame/two scalars each and one stateless closure per query; release those with the source/query. Direct calls retain no such preparation. Existing weak maps keep one nine-scalar handedness snapshot/signed twist vector/owner flag per basis and one member-box/key-count record per gated constraint; provenance stays weak. No quaternion, extracted coordinate, alias, score, output history, handle or task is retained.

## @evidence contracts/development/common.md#meaningful-documentation

States the caller's prior basis admission, shared inverse conventions, error/invalid-basis behavior and optional domain. prepareQueries documents unchanged rig metadata, no constructor numerical admission, original first-use clinical ordering, independent query readers and fresh outputs/release lifetime.
