# src/kinematics/prepareJointRotationFactor.ts#prepareJointRotationFactor

## @evidence contracts/development/implementation.md#principled-implementation

An unchanged axis and exact resolved rig angle determine one pure axis-angle factor. The current clinical input is always admitted and converted through its actual frame before exact-angle reuse; mutable frames use direct conversion. Initial/two-recent angle factors and declared rig factors retain original sine/division/component arithmetic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This internal companion owns scalar clinical admission, affine conversion and pure factor slots for actual OnBasis fresh/scalar/mutable composers. One private fixed-factor helper owns declared-angle sharing and identity masks; the composer retains Hamilton association and output ownership.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every clinical number is checked before factor reuse. Null keeps rig0 and bypasses unused frame admission; replacements use the original mapper even when another query changed its shared admitted frame. Mutable mode always runs direct current-frame admission and retains no actual frame. Failed reads publish no factor; call-local values survive reentry. No clinical-input shortcut, tolerance, target result or factor history crosses queries.

## @evidence contracts/development/implementation.md#efficient-algorithms

Current/previous/initial resolved-angle slots share three pure factors per axis at most. Shared axis scalars and at most two declared factors omit repeated fixed arithmetic. All actual clinical admission/conversion remains; this extraction changes no algorithmic work or result allocation. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Exact resolved-angle keys alone share pure query-owned factors after current clinical/frame conversion. Successful immutable affine/axis readers and predeclared rig constants alone share across queries. Mutable calls perform current conversion even for repeated clinical values; no target-dependent key enters operation state.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each reader retains at most three private factors/their angles and reader references, with no joint or actual mutable-frame reference. Shared operation state is bounded to three axis/affine readers, six declared factors, three identity masks, four fixed products and two support readers. Dynamic factors remain query-owned; no target, output history, visitor, task or handle is retained.

## @evidence contracts/development/common.md#meaningful-documentation

Defines query-owned factors, fixed versus mutable affine lifetime, original ordered clinical admission/null bypass, exact resolved-angle keys, independent failure/reentry and constructor/release boundaries.
