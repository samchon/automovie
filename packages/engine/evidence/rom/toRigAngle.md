# src/rom/toRigAngle.ts#toRigAngle

## @evidence contracts/development/implementation.md#principled-implementation

Preserve null rest, validate supplied frame sign/neutral and invert degrees as (clinical-neutral)/sign, with absence preserving the input. A prepared reader captures the actual final neutral/sign reads after the first successful nonnull admission and keeps subtraction before division. The same unchanged frame therefore gives exactly the same raw arithmetic for every later clinical number, including overflowing intermediate rig values.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One private conversion owner serves direct and prepared reads, while the existing assertion owns diagnostics. Direct calls supply no state; prepare adds only one lazy last-frame scalar reading and no angle or joint layer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nonfinite clinical angles are not silently repaired and no new angle validation is introduced. Null bypasses unused frames before any lookup/admission. First use retains the original sign/neutral checks and neutral/subtraction/sign/division read order; failures install no reading. Same-identity reuse requires the documented unchanged-frame premise, replacement admits anew and intermediate nonfinite results propagate without a finite repair or reordered expression.

## @evidence contracts/development/implementation.md#efficient-algorithms

Direct conversion keeps its fixed admission and two scalar operations, without metadata allocation. One prepared frame's first nonnull read performs that same work; later same-frame reads need an identity comparison and the original subtraction/division, omitting repeated immutable-frame validation. Work/storage are constant and runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Actual OnBasis query/operation readers share each fixed axis frame's captured neutral/sign while still admitting every clinical angle before invoking this converter. Frame identity and the caller's unchanged-object lifetime decide equivalence; null does no preparation, replacements overwrite the single reading only after successful admission, and no converted angle or target answer is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Direct conversion retains nothing. Each caller-owned prepared closure retains one state and at most one borrowed frame plus two affine scalars, releasing replaced readings or all metadata with the owning query/operation. No angle, joint, pose population, global cache, handle or task is retained.

## @evidence contracts/development/common.md#meaningful-documentation

States exact inverse degrees, null/absent meanings, used-frame refusal, lazy prepared first use, unchanged-object lifetime, replacement behavior and unaltered intermediate propagation.
