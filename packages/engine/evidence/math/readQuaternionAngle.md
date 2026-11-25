# src/math/readQuaternionAngle.ts#readQuaternionAngle

## @evidence contracts/development/implementation.md#principled-implementation

The conjugate is normalized exactly as Quaternion.inverse before the original four Hamilton expressions and 2*atan2(hypot(vector),abs(scalar)). afterNormalization first receives normalize(a)'s exact completed X/Y/Z/W and then negates and normalizes that conjugate, preserving both distinct normalization roundings.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One internal relative-angle visitor serves Quaternion.angle and its actual normalize-then-angle consumers. The optional first boundary has one static forwarding visitor, while the shared normalization owner alone determines magnitude scaling and zero identity.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Neither normalization is skipped or collapsed. Every conjugate expression, Hamilton sum/subtraction order, hypot, absolute scalar and atan2 remains unchanged; no angle tolerance, unit shortcut, dot/acos replacement or nonfinite repair is introduced.

## @evidence contracts/development/implementation.md#efficient-algorithms

Both entries keep their original constant scalar work. Direct angle omits inverse/relative records; the normalize-then-angle entry additionally omits the first normalized output record while retaining its original extreme scaled temporary. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both actual Quaternion entries reuse static visitors and the same scalar normalization/Hamilton owner. Every incoming operand still supplies its actual required normalization and angle; no quaternion, angle, target or prior result is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only local scalars and borrowed synchronous arguments live during the call; an extreme first record normalization may allocate its original scaled temporary. No visitor closure, normalized-output record, operand, result, handle or task is allocated or retained by either angle entry.

## @evidence contracts/development/common.md#meaningful-documentation

Defines relative operand order, radians in [0, pi], the separate first-normalization entry and unchanged inverse/Hamilton/atan2 boundaries, including zero and nonfinite arithmetic.
