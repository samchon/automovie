# src/math/Quaternion.ts#Quaternion.identity

## @evidence contracts/development/implementation.md#principled-implementation

The multiplicative identity of the Hamilton product, zero vector part and unit scalar part, which rotates no vector.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A function rather than a shared constant, because callers build on the result and must never alias one global record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Returns the same exact value for every call with no cached or caller-specific record.

## @evidence contracts/development/common.md#meaningful-documentation

States the component values and that each call returns a new record, which a caller that mutates the result needs.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Four literal components construct the neutral Hamilton rotation in constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A fresh record is the contract, so sharing one would be wrong rather than cheaper.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each neutral rotation owns its four components, so caller mutation cannot alter another identity result.

# src/math/Quaternion.ts#Quaternion.multiply

## @evidence contracts/development/implementation.md#principled-implementation

The Hamilton product formula, `w = aw·bw − a·b` and `v = aw·bv + bw·av + av × bv`, written out per component; composing rotations by it applies the right operand first.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One product for every rotation composition, joints, drivers, cameras and placements, without a normalizing variant, because unit inputs already give a unit result.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The result is not renormalized, so rounding drift stays visible to the callers that normalize at their own boundary rather than being hidden on every product.

## @evidence contracts/development/common.md#meaningful-documentation

States the application order of the operands and how the result's length follows from the inputs'.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Sixteen multiplications and twelve additions in constant time, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of two quaternions that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The Hamilton product owns four computed components and keeps no references to either operand quaternion.

# src/math/Quaternion.ts#Quaternion.normalize

## @evidence contracts/development/implementation.md#principled-implementation

Positive uniform rescaling leaves quaternion direction unchanged, so dividing extreme finite components by their largest magnitude before the Euclidean norm prevents underflow and overflow; zero is the only finite input without a recoverable direction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

readNormalizedQuaternion owns normalization arithmetic for this record constructor and projector scalar scores. quaternionNormalizationDivisor shares binary64 magnitude bounds with axis-angle construction, while ordinary near-unit quaternions retain their existing multiplication order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The identity for a zero quaternion is the stated degenerate value, not a fallback for bad arithmetic; a non-finite input still yields a non-finite result instead of being replaced.

## @evidence contracts/development/common.md#meaningful-documentation

States zero identity, finite extreme-component rescaling, preserved ordinary arithmetic and nonfinite propagation.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Four magnitude comparisons and one fixed-size norm take constant time, with four extra divisions only for extreme inputs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The largest magnitude supplies one common rescaling for all four components; normalization retains no rotation history between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

An extreme input adds one temporary scaled quaternion; the returned unit record belongs to the caller and no input is retained.

# src/math/Quaternion.ts#Quaternion.inverse

## @evidence contracts/development/implementation.md#principled-implementation

The conjugate `(−x, −y, −z, w)` is the inverse of a unit quaternion, and dividing by the length makes it the inverse of the rotation a near-unit quaternion represents.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Sends the conjugate's four original scalar expressions to the shared normalization owner instead of constructing a temporary quaternion or dividing by squared length. Its static record visitor returns the same unit result, including the zero quaternion's identity.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Normalizes every input the same way, so no caller depends on whether its quaternion was exactly unit.

## @evidence contracts/development/common.md#meaningful-documentation

States the exact-inverse property for unit input, the normalization for near-unit input, and the callers that use it.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A sign flip and one normalization in constant time, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one quaternion that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only the fresh normalized output record is allocated; conjugate and extreme scaled components remain scalars, and no input is retained.

# src/math/Quaternion.ts#Quaternion.fromAxisAngle

## @evidence contracts/development/implementation.md#principled-implementation

The axis-angle formula uses a unit axis and half-angle sine/cosine; extreme finite axes are positively rescaled before the norm, preserving direction without overflowing or losing a nonzero subnormal axis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Takes degrees because every authored angle in the interface is in degrees, so callers never convert, and accepts an unnormalized axis because cross products and authored directions arrive unnormalized.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The zero-axis identity is the one input with no defined axis, not a fallback for a failed computation; any other axis takes the same formula.

## @evidence contracts/development/common.md#meaningful-documentation

States the angle unit, the rotation sense, that the axis needs no normalization, and the zero-axis result.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed-size magnitude check precedes one square root, sine and cosine; only extreme finite axes require three rescaling divisions.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Direct and prepared construction share one private axis-angle owner; this direct entry supplies no state and allocates no preparation metadata.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

An extreme axis creates one temporary scaled direction, while the output owns four rotation components and keeps no axis reference.

# src/math/Quaternion.ts#Quaternion.prepareAxisAngle

## @evidence contracts/development/common.md#meaningful-documentation

Defines borrowed unchanged-axis lifetime, lazy first-use component reads, degree arithmetic, fresh output, zero identity and nonfinite propagation.

## @evidence contracts/development/implementation.md#principled-implementation

Only the positive-rescaled direction and its original left-associated Euclidean length are invariant. Every angle still divides its half-angle sine by that length before multiplying each direction component, so no rounding association changes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lazy state and closure initialize at the first actual read. Warm reads go straight to the shared angle-on-prepared-axis formula, avoiding the direct path's preparation-state dispatch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No axis admission, normalization or angle work moves into construction. The existing 2**-511/2**510 rescaling boundaries, zero-axis fresh identity, signed zeros and nonfinite arithmetic are preserved without a new guard or unit-axis substitution.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fixed-size rescaling and square root per unchanged-axis reader, then one sine, cosine, division and three component products per nonzero-axis angle. Zero axes return a fresh identity without angle trigonometry, as before. Runtime speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The actual OnBasis factor consumer borrows one reader per query axis. Both public entries share axisAngle, while only this entry retains its fixed scalar preparation; no complete rotation or target-dependent answer is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closure owns one small state and its lazy direction/length reading, borrowing the axis and retaining an extra scaled vector only for extreme inputs. Every returned quaternion is fresh; release the closure with its fixed-axis operation. No global cache or external handle exists.

# src/math/Quaternion.ts#Quaternion.fromEuler

## @evidence contracts/development/implementation.md#principled-implementation

Intrinsic Euler composition is the product of single-axis factors in stated letter order, so XYZ is qx*qy*qz for all six declared orders. Private canonical axes use the same axis-angle arithmetic owner with only their unchanged direction/length prepared lazily; every angle keeps original half-angle sine/division/components/cosine and Hamilton association.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop reads order letters and their original Euler fields; three private fixed-axis readers serve all valid letters without six handwritten products. Unsupported runtime letters retain the original axis-table/fromAxisAngle failure path, and no placement-specific heading math is introduced.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Angles are not wrapped, normalized, cached or skipped when zero. Original order/angle getter sequence, identity seed and every factor/product remain; private axis preparation admits no caller input and unsupported letters retain their original lookup/conversion path.

## @evidence contracts/development/common.md#meaningful-documentation

States the angle unit, that the rotation is intrinsic, the order convention and its equivalence to the `three.js` product, with an example.

## @evidence contracts/development/implementation.md#efficient-algorithms

Every declared order retains three angle-dependent conversions/three products and the identity seed. Three module-private readers omit repeated fixed-axis magnitude/length work after their first actual uses. No output, factor or sample count changes; runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All actual placement/heading Euler reads share only the private canonical axes' original direction/length preparation. Every current angle, factor and product is evaluated normally through the existing math owners, without a target/angle result cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Three fixed-axis readers and at most three direction/length readings live with the module's existing private axes. No Euler record or angle/result history is retained; factors, identity seed and each public output remain fresh and caller-owned.

# src/math/Quaternion.ts#Quaternion.rotateVector

## @evidence contracts/development/implementation.md#principled-implementation

The expansion `v' = v + w·t + q⃗ × t` with `t = 2·(q⃗ × v)`, algebraically equal to `q · v · q*` for a unit quaternion, where the conjugate is the inverse.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The shared internal scalar owner rotates directly from the quaternion, preserving original q/v read order; this static record visitor returns fresh vectors while inverse extraction consumes numeric columns without temporary vectors.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The quaternion is not normalized here, so a caller passing a non-unit rotation gets the stated distortion instead of a hidden correction.

## @evidence contracts/development/common.md#meaningful-documentation

States the operation, the unit-length premise and what happens without it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two cross products and eighteen multiplications in constant time, fewer operations than forming the full product `q · v · q*` or a 3×3 matrix for one vector.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The scalar rotation owner serves this fresh-record adapter and actual inverse column extraction, keeping every current vector calculation and original expression without a target cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates only the returned vector and retains nothing.

# src/math/Quaternion.ts#Quaternion.rotateVectorY

## @evidence contracts/development/common.md#meaningful-documentation

Defines equivalence to the existing Y component, output frame inherited from v/q, unit-input premise, scalar ownership and unchanged nonunit/nonfinite behavior.

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates the same tx, ty and tz in their original order, then exactly v.y + q.w*ty + (q.z*tx-q.x*tz). Omitting independent X/Z outputs leaves this binary64 expression and its signed-zero/nonfinite behavior unchanged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One genuinely demanded component serves the actual hull min-Y scan, beside the same math owner's complete vector operation; no matrix, callback wrapper or result cache is introduced.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The quaternion is not normalized or assumed cardinal, and neither cross products nor output arithmetic are reassociated. No tolerance, component repair or scene/shape condition selects the result.

## @evidence contracts/development/implementation.md#efficient-algorithms

Keeps the shared two-cross-product intermediates and only one output component, omitting six products, six output additions/subtractions and one vector allocation versus full rotateVector. Work/storage are constant and runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The actual physical-shape floor query requests only world Y; each current rotation/vertex is evaluated normally, with no cached point or rotation result.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one number, allocates no vector/collection and retains neither quaternion nor vertex, with no state, handle or task.

# src/math/Quaternion.ts#Quaternion.slerp

## @evidence contracts/development/implementation.md#principled-implementation

Shoemake's slerp, `sin((1 − t)θ)/sin θ · a + sin(tθ)/sin θ · b` with `θ` the angle between the operands, after negating `b` when `a · b < 0` so the path takes the shorter of the two arcs that represent the same rotation pair.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One private interpolation owner serves this direct entry and prepareSlerp, including the shorter-arc and near-parallel branches. The direct entry supplies no retained preparation and allocates no arc metadata.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The `0.9995` threshold, shared through QUATERNION_NLERP_DOT_THRESHOLD with component-extrema admission, is the documented numerical switch for a vanishing `sin θ`, the same for every caller, not tuned to any clip or fixture.

## @evidence contracts/development/common.md#meaningful-documentation

States the endpoints, the shorter-arc choice, the near-parallel threshold with its angle and why it exists, extrapolation outside `[0, 1]`, and when the result is unit length.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One dot product, one arccosine and three sines in constant time, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of two rotations and a parameter that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each branch passes completed weighted scalars to the shared normalizer and creates only its fresh output quaternion; no temporary weighted/scaled record or endpoint is retained.

# src/math/Quaternion.ts#Quaternion.prepareSlerp

## @evidence contracts/development/common.md#meaningful-documentation

Defines unchanged unit endpoints, lazy endpoint/arc reads, extrapolation inherited from slerp, original weights/normalization, fresh output and operation lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

Shoemake's endpoint dot, shorter-arc sign, angle and angle sine depend only on the unchanged pair. Sharing those exact completed values leaves each t-dependent weight, weighted component and normalization expression unchanged in the common owner.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One small lazy state delegates every query to slerp's private arithmetic owner rather than maintaining a second interpolation algorithm.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The existing QUATERNION_NLERP_DOT_THRESHOLD, comparison order, sign flips, half-circle choice and all output normalization remain. No t clipping, endpoint shortcut, fitted arc, target-result cache or external replacement is introduced.

## @evidence contracts/development/implementation.md#efficient-algorithms

The dot and shorter-arc endpoint read occur once per pair; the spherical branch also shares one acos and one fixed sine. Each t still needs two weight sines and normalization, or the original linear arithmetic and normalization. Completed component scalars enter the common normalizer without a temporary weighted quaternion. Work/storage are constant and runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The actual flight-table playback shares one reader per unchanged interval endpoint pair. The closure shares only that pair's exact arc invariants; t-dependent weights, quaternions and normalization results remain fresh on every query.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns one closure, its two borrowed endpoints, one lazy arc record and at most seven scalar invariants until the interval table is released. Each read returns a fresh quaternion; no progress history, output, global cache, handle or task is retained.

# src/math/Quaternion.ts#Quaternion.angle

## @evidence contracts/development/implementation.md#principled-implementation

The relative rotation of two unit quaternions is `inverse(a) * b`, whose vector part has length `sin(θ/2)` and whose scalar part is `cos(θ/2)`; reading the half angle from both through atan2 is accurate at every angle, where arccosine of the dot product loses all digits of an angle below the square root of the unit roundoff.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

readQuaternionAngle owns the relative angle used by the chain fit's reference, effector and continuity terms. The inverse's same conjugate enters the shared scalar normalization owner, then one reusable visitor keeps multiply's original expressions without allocating normalized-inverse or relative-quaternion records.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No clamp of a dot product and no threshold: the absolute scalar part is the stated identification of `q` with `-q`, and the result is exact to rounding for every pair.

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, the range, the sign insensitivity, the formula and why the shorter arccosine form is not used, and the unit-length premise of both arguments.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One Hamilton product, one hypotenuse and one arctangent in constant time, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of two rotations that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Conjugate, normalized inverse and relative components remain scalars, including extreme rescaling. The returned angle is a number; no quaternion, callback closure, input or result is allocated or retained.

# src/math/Quaternion.ts#Quaternion.angleAfterNormalize

## @evidence contracts/development/common.md#meaningful-documentation

States literal normalize-then-angle semantics, operand order, radians, both normalization boundaries and omitted intermediate ownership.

## @evidence contracts/development/implementation.md#principled-implementation

A synchronous visitor transfers the first normalization's exact completed components to the same conjugate normalization and relative Hamilton/atan2 owner as angle; preserving both roundings preserves angle(normalize(a), b).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This scalar-demand entry serves actual distal/final chain errors through readQuaternionAngle, with no second normalization policy or angle formula.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Neither normalization is omitted, combined or replaced by a unit premise; original signed zeros, extreme scaling, zero identity, nonfinite propagation and Hamilton association remain.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant scalar work matches normalize then angle while omitting the first normalized quaternion record; the angle owner already omits its inverse/relative records. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared static visitors and normalization/relative-angle owners replace a discarded intermediate representation; all current operand values and required arithmetic still run, with no angle or target cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one number and retains neither operand; only the original first normalization's extreme scaled temporary may allocate, with no closure or normalized-output record per call.
