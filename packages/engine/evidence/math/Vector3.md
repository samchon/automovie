# src/math/Vector3.ts#Vector3.create

## @evidence contracts/development/implementation.md#principled-implementation

Copies the three arguments into a record, with zero defaults so `create()` is the origin.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Positional components with defaults, the shortest way for callers to build the origin or an axis-aligned vector inline.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Stores exactly the given components with no rounding or validation special case.

## @evidence contracts/development/common.md#meaningful-documentation

States the zero default and that the record is new.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One record literal with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A fresh record per call that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The new coordinate record owns three supplied scalars, including zero defaults, and no global origin object is shared.

# src/math/Vector3.ts#Vector3.add

## @evidence contracts/development/implementation.md#principled-implementation

Vector addition is defined per component, so each output component is the binary64 sum of the matching inputs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One two-operand sum, the form every caller needs; a longer sum chains it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every coordinate is added directly; zero or axis-aligned operands receive no special arithmetic path.

## @evidence contracts/development/common.md#meaningful-documentation

States the operation and that it is component-wise, the one fact the name leaves implicit.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Three additions with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Position and offset sums depend on current coordinate values, and this operation stores no prior addition result.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Three coordinate sums transfer into one fresh record, leaving both input objects unretained and unchanged.

# src/math/Vector3.ts#Vector3.subtract

## @evidence contracts/development/implementation.md#principled-implementation

Vector subtraction is defined per component, and `a − b` is the displacement that carries point `b` to point `a`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Its own function because a displacement between two points is the most common vector query, and computing it directly takes one allocation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The displacement keeps the same operand order on every axis, without snapping small differences to zero.

## @evidence contracts/development/common.md#meaningful-documentation

States the operand order and its geometric meaning, which is the fact a caller gets wrong when it is implicit.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Three subtractions with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A displacement belongs to its current endpoint coordinates; there is no retained endpoint-pair result to invalidate.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

One fresh displacement record holds three differences and retains neither source point.

# src/math/Vector3.ts#Vector3.scale

## @evidence contracts/development/implementation.md#principled-implementation

Scalar multiplication is defined per component, so the direction is kept for positive `s` and reversed for negative `s`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A uniform scalar factor only; the one non-uniform scaling the engine needs happens through matrices.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Multiplies every component by the same factor with no special case for zero or one.

## @evidence contracts/development/common.md#meaningful-documentation

States that the factor is one scalar applied to every component.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Three multiplications with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one vector and a scalar that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The returned scaled coordinates are independent scalar values; no factor object or source vector is retained.

# src/math/Vector3.ts#Vector3.addScaled

## @evidence contracts/development/common.md#meaningful-documentation

States fresh output, scale-before-add association, complete product/read order, frame/unit premises and original signed-zero/nonfinite behavior.

## @evidence contracts/development/implementation.md#principled-implementation

Computes b.x*s, b.y*s and b.z*s in scale's order before a.x+offsetX, a.y+offsetY and a.z+offsetZ in add's order; each original binary64 multiply/add boundary remains.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One affine point operation serves the actual collision ray marcher, beside independent add and scale for callers that consume those separate values; no ray rule is copied into math.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No normalization, fused/reassociated arithmetic, scalar clipping, finite gate or zero shortcut replaces the original six expressions, and neither input is changed.

## @evidence contracts/development/implementation.md#efficient-algorithms

The same three products and additions use three scalar locals and one fresh point, omitting the scaled offset allocation at every actual march step; ray count, thresholds and physical queries remain with the caller. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the existing scale/add mathematical convention on the exact current inputs; only a discarded intermediate representation is removed, with no point, ray, scalar or result cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only three offset scalars live during the call; the caller owns one fresh output and the math layer retains no input, output, handle or task.

# src/math/Vector3.ts#Vector3.dot

## @evidence contracts/development/implementation.md#principled-implementation

The Euclidean inner product, the sum of component products, evaluated left to right so the rounding is the same on every call.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Returns the bare scalar; projection, angle and length callers build on it instead of each summing products themselves.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Sums the three products in a fixed order with no compensated or reordered summation for particular inputs.

## @evidence contracts/development/common.md#meaningful-documentation

States the geometric meaning a caller uses it for, beyond the name.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Three multiplications and two additions with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each inner product uses the current pair of vector components; projection callers own any reuse of the resulting scalar.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Component products sum directly to a scalar without allocating a record or retaining operands.

# src/math/Vector3.ts#Vector3.cross

## @evidence contracts/development/implementation.md#principled-implementation

The determinant expansion of the cross product in a right-handed frame, which is the handedness glTF and the engine's world frame use.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One right-handed product matching the engine's single world handedness.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Computes every component by the same formula with no normalization or zero special case, so a parallel pair yields the exact zero vector a caller can test for.

## @evidence contracts/development/common.md#meaningful-documentation

States the handedness with an example, the direction, and the length formula.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Six multiplications and three subtractions with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The oriented perpendicular depends on the current ordered pair; swapping or changing an operand requires a new product.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Three determinant components form one owned perpendicular record, and neither input direction is retained.

# src/math/Vector3.ts#Vector3.crossDifferenceInto

## @evidence contracts/development/common.md#meaningful-documentation

Defines the oriented differences, explicit mutable output, source read order, alias safety and unaltered raw arithmetic.

## @evidence contracts/development/implementation.md#principled-implementation

Computes the six differences in subtract(a, origin), subtract(b, origin) order, then the same three determinant expansions as cross before publishing X, Y and Z.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One write-target operation owns the compound cross of two point differences used by physical hull face candidates; ordinary cross and subtract remain the fresh-value operations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No normalization, finite gate, zero shortcut, reassociation or geometric tolerance changes the six subtractions and three cross-product expressions.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant scalar work replaces the raw hull candidate's two displacement records and cross record, with exactly the same arithmetic and no temporary vector allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A hull scan reuses its own private output record across candidate triples; every invocation recomputes the current point differences and determinant with no point or result cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only nine local scalars live during the call; the caller owns the target lifetime and no source or target is retained by the math layer.

# src/math/Vector3.ts#Vector3.length

## @evidence contracts/development/implementation.md#principled-implementation

The Euclidean norm; `Math.sqrt(dot(a, a))` is exact to rounding when no square leaves the normal range, and `Math.hypot`, which the ECMAScript specification directs implementations to compute without that overflow and underflow, covers the extreme magnitudes where squaring fails.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The private extremeScale owns the range gate for length, normalize and distance; normalizationScale keeps the existing vector-component read order for length and normalize.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The `2^-511` and `2^511` thresholds are the binary64 limits where a square underflows or overflows, not values tuned to a caller; ordinary input keeps `sqrt(dot)` so its result stays identical to that expression wherever callers compute it directly.

## @evidence contracts/development/common.md#meaningful-documentation

States which formula applies in which magnitude range and why, that ordinary results equal `sqrt(dot)` exactly, and the non-finite behavior.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One maximum of three magnitudes and one square root in constant time, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The magnitude range is read from the current components once; no length cache survives mutations of a vector record.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Magnitude checks and the returned norm use scalars only, with no allocated vector or retained source.

# src/math/Vector3.ts#Vector3.distance

## @evidence contracts/development/common.md#meaningful-documentation

States matching frames/units, operand-read order, exact length/subtract equivalence and scalar/nonfinite output.

## @evidence contracts/development/implementation.md#principled-implementation

Completes the same three differences and leftfold self-dot. A squared norm in [2^-1000,2^1000] proves the original ordinary branch: m<2^-511 gives each rounded square<=2^-1022 and sum<=3*2^-1022; m>2^511 gives one square>=2^1022 and the nonnegative sum at least that. Neither can enter the interval, so its exact squared norm goes directly to the original sqrt. Other inputs retain the original magnitude gate and sqrt/Math.hypot choice.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A completed-scalar point distance sits beside live-input length. Its exact self-dot also proves ordinary-range admission when safely bounded, while extremeScale remains the single owner of component magnitude thresholds and every other value retains that gate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps subtraction order, left-associated square sum, zero, NaN and infinity behavior and the existing extreme branch; no hypot-only replacement, distance tolerance, snapping or finite repair is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three scalar differences omit one displacement record. Certified ordinary norms also omit three absolute values, maximum and component-gate checks. Extreme inputs compute three unused raw squares before their original hypot; zero/nonfinite keep their original arithmetic. Every branch takes constant work, with runtime improvement unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The exact completed-difference self-dot serves both the conservative ordinary-range proof and original sqrt. Uncertified values keep the existing component gate; every point pair is actually evaluated with no distance, point or target cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one number, allocates no vector or collection and retains neither point nor any operation state.

# src/math/Vector3.ts#Vector3.normalize

## @evidence contracts/development/implementation.md#principled-implementation

Divides by the Euclidean length after original positive extreme rescaling. The selected value passes through length's own magnitude gate: a borrowed ordinary input may change through getters, and even a rescaled record contains the later component reads divided by the earlier magnitude. Re-reading actual value therefore preserves the original sqrt/hypot branch and zero/nonfinite propagation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

normalize uses the shared magnitude owner to select its original positive rescaling, delegates actual selected-value norm to length and delegates fresh output construction to scale. Completed-scalar distance alone uses its separately proved ordinary norm certificate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The zero vector for zero length is the stated degenerate value with no direction to keep, not a fallback; the rescaling thresholds are binary64 limits, and a non-finite input stays non-finite instead of being replaced.

## @evidence contracts/development/common.md#meaningful-documentation

States the zero-length result, the extreme-range rescaling and what it preserves, and the non-finite behavior.

## @evidence contracts/development/implementation.md#efficient-algorithms

Keeps the original first magnitude scan, selected-value length classification and sqrt/hypot calculation plus three output products. An extreme input creates the original scaled temporary; work/storage are constant and no live-record classification is omitted.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Normalization and length share the component magnitude policy while each reads its actual current input in the original order. No earlier raw-record reading certifies a later one, and no direction or magnitude result survives this call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates the rescaled vector when extreme and the returned record, and retains nothing.

# src/math/Vector3.ts#Vector3.lerp

## @evidence contracts/development/implementation.md#principled-implementation

The affine combination `a + (b − a)·t` per component, which returns `a` exactly at `t = 0`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One interpolation for positions and offsets; rotations interpolate through `Quaternion.slerp` instead.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `t` is not clamped, so a caller that extrapolates gets the line's value instead of a silently pinned endpoint.

## @evidence contracts/development/common.md#meaningful-documentation

States the formula, the endpoint values, and that an out-of-range `t` extrapolates.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Three subtractions, multiplications and additions with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of two vectors and a parameter that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each interpolated point owns three computed coordinates, with no endpoint or progress history retained.

# src/math/Vector3.ts#Vector3.prepareLerp

## @evidence contracts/development/common.md#meaningful-documentation

States matching endpoint frame/units, eager scalar snapshot and component-read order, fresh outputs, later edit behavior, exact affine grouping and unclipped parameters.

## @evidence contracts/development/implementation.md#principled-implementation

Copies each origin scalar and completes the same to-minus-from subtraction in x/y/z order as lerp. Every query then uses the original origin+(difference*t) multiply/add grouping with those fixed numerical operands.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One fixed-segment producer sits beside the live-endpoint lerp. Its private six-scalar closure separates invariant endpoint reads/subtractions from the changing scalar parameter without adding a path, clock or pose abstraction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not clamp t, snap endpoints, normalize coordinates, repair nonfinite values or cache sampled points. Signed-zero, cancellation and nonfinite behavior follow the same subtraction/product/addition sequence; the live lerp remains unchanged for mutable endpoints.

## @evidence contracts/development/implementation.md#efficient-algorithms

Construction takes three subtractions and fixed scalar reads once; every query takes three multiplications/additions and one fresh vector, omitting repeated endpoint reads/subtractions. All work and retention are constant-sized; runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Genuine fixed athletics/stair segments and prepared limb arcs can share completed component differences while every actual t is evaluated independently. No endpoint identity, target result or time history is consulted for reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned reader retains only six numeric origin/difference scalars, with neither endpoint record nor prior t/output retained. Each result owns its three coordinates and releasing the reader releases all operation state.
