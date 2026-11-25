# src/weapons/SiegeClearance.ts#SiegeClearance.minimum

## @evidence contracts/development/common.md#meaningful-documentation

Height and cosine/sine coefficients are metres relative to a fixed pivot; interval endpoints are degrees. Directed arithmetic is numerical enclosure rather than physical clearance.

## @evidence contracts/development/implementation.md#principled-implementation

Evaluate both endpoints and include H-hypot(y,z) when atan2(z,y)+pi lies in the interval modulo a full turn. An interval spanning a full turn necessarily includes that minimum. Products/sums round downward and stationary amplitude upward by adjacent binary64 values; computed zeros remain zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit scalars, evaluate endpoints and test the periodic stationary minimum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sampling, angular tolerance or displaced geometry approximates a missed extremum; nonrepresentable support refuses.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant arithmetic and one periodic-inclusion test.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Box corners, cylinder support and the complete section-design predicate use this same analytic minimum.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one scalar and retains no state.

# src/weapons/SiegeClearance.ts#SiegeClearance.box

## @evidence contracts/development/common.md#meaningful-documentation

Centre/full dimensions and pivot height are metres; angle interval is degrees; no mesh or proxy is consumed.

## @evidence contracts/development/implementation.md#principled-implementation

All four YZ corner combinations supply the box's complete analytic support for an X-axis carrier. At endpoint/stationary angles and adjacent representable angle inputs, the same generic turn/move arithmetic independently admits rounded primitive transforms and eight corners.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reduce four analytic corner minima, then inspect transformed corners at the finite critical-clock representation boundary.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Never replaces a box by its centre or discards longitudinal half-depth.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four analytic minima and a bounded endpoint/stationary-neighbor set of eight-corner transform checks; no angle grid or model build.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses minimum for every corner rather than another angular solver.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no input or external resource.

# src/weapons/SiegeClearance.ts#SiegeClearance.cylinder

## @evidence contracts/development/common.md#meaningful-documentation

Endpoint/radius metres, fixed pivot and degree interval describe the source cylinder; supported axes are the siege's X crossshafts and YZ-plane rods.

## @evidence contracts/development/implementation.md#principled-implementation

For an X crossshaft, vertical radial support is radius. For a YZ axis u, support is radius*abs(u.z*cos(angle)-u.y*sin(angle)); two signs at each endpoint cover the complete flat-capped solid. The builder's vector length/rotationBetween and generic turn/move arithmetic also admit rounded cylinder support at the finite critical clocks and their adjacent inputs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reduce endpoint/circular-support analytic minima, construct the same primitive rigid frame and check its critical-clock representability.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No capsule cap, centre-only floor test or invented projection substitutes for the flat-capped cylinder; unsupported axes refuse.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most four analytic minima and a bounded critical-neighbor set of constant-size primitive-frame checks, independent of interval length.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares minimum with box corners and the section design.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no cylinder or pose history.

# src/weapons/SiegeClearance.ts#SiegeClearance.radius

## @evidence contracts/development/common.md#meaningful-documentation

Defines the authored cap, zero-radius limiting premise, monotone homothetic section domain and admitted positive binary64 boundary value; no physical safety gap is added.

## @evidence contracts/development/implementation.md#principled-implementation

Positive binary64 encodings are ordered integers. Bisect the finite cap's encoding against feasible zero until adjacent encodings remain, using the same rounded CAD definition and analytic support predicate for each candidate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit cap/zero limit, keep an already feasible cap or search its finite representation interval, then admit the positive result.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fixed radius fraction, epsilon, floor shift, angle grid or capture-only correction chooses the section. Finite critical-clock representability checks supplement the full analytic support domain rather than replacing it.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most 63 encoding halvings plus three boundary admissions, each calling the fixed-size analytic construction predicate; no model build, integration or mesh search occurs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller's same dimension-derived cradle records serve admission and final emission; the engine owns adjacent-float rounding.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One call-local eight-byte view and scalar encodings; no retained query, model, cache or external resource.
