# src/kinematics/resolveAttachment.ts#resolveAttachment

## @evidence contracts/development/implementation.md#principled-implementation

Rigid composition of the bone's resolved world frame with the offset transform, the fixed-joint relation; it premises unit-length rotations and treats the bone frame as unscaled, since a resolved bone carries no scale, so the offset's scale passes through unchanged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reuses raw resolvePose or the genuine same-rig prepared demand for FK, then keeps one attachment-offset composition. compileAttach supplies the actual prepared producer only for its explicit immutable-parent path; no private chain formula is duplicated.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unresolvable bone throws instead of falling back to the root or skipping the frame, and no rig or bone is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States output frame, offset composition, missing-bone refusal, matching renderer mappings and explicit prepared-demand/operation ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

Raw omission retains O(J+B) complete admission/FK and a B-bone lookup. Explicit prepared demand still admits J records but computes only demanded ancestry and returns the requested bone before constant offset composition. The bounded first-match loop preserves find's entry length/index reads without a per-sample predicate closure. An optional reader shares exact completed math; runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller may supply this exact parent rig/mapping's genuine immutable demand and same-bake operation reader; only static indices and actual scalar FK dependencies share. Every current pose remains admitted and the returned attachment transform stays fresh, without a pose/target cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the resolved bones are local to the call and the returned transform, including its copied scale, is owned by the caller.
