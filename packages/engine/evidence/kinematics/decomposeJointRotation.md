# src/kinematics/decomposeJointRotation.ts#decomposeJointRotation

## @evidence contracts/development/implementation.md#principled-implementation

Closed-form Euler extraction reads sine and projected cosine through atan2, preserving resolvable near-gimbal rotations that asin can round to ninety degrees; only a projected cosine within the square root of the binary64 unit roundoff, where a rounding error and the pin's truncation error meet, takes the undetermined-angle convention. Normalized orthogonal axes and unit input rotations are the premises, and alternate charts/full turns retain the same rotation up to roundoff.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The extraction, the handedness correction, the clinical lift and the ROM chart choice sit in one inverse because each depends on the others' convention; ROM scoring is delegated to `jointRomOvershoot` and frame arithmetic to `toClinicalAngle`, so the gate and this inverse read one rule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Selection compares the caller's unchanged constraint and never clamps an angle into range; the gimbal pin is the standard convention for an undetermined pair, not a compensation, and no bone is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States the inverse relationship, all three composition orders, the gimbal convention, the handedness correction, the frame lift, the alternate charts and the tie rule, the thrown inputs, the unit-quaternion premise, and each parameter's default.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: one basis validation, three vector rotations and at most a dozen dot products, plus, with a domain, at most three ROM scorings. Both clinical charts retain their original conversion order; the inverse stops before further alias construction/scoring once exact zero reaches the nonnegative fault sum's lower bound, retaining the original tie rule. No matrix is built and speedup is unmeasured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one rotation that coordinates no work across calls; the arm solve calls it per candidate with a different rotation each time.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned angles.
