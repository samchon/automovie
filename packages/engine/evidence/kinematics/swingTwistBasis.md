# src/kinematics/swingTwistBasis.ts#swingTwistBasis.of

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the members of the result.

## @evidence contracts/development/implementation.md#principled-implementation

The axes are admitted and normalized by the engine's own owner, then the second circle axis is the rest direction crossed with the first.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One admission and one cross product.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An invalid basis throws.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `normalizeJointAxes`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/kinematics/swingTwistBasis.ts#swingTwistBasis.fromNormalized

## @evidence contracts/development/common.md#meaningful-documentation

States prior admission, unchanged-basis lifetime and which returned vectors are borrowed or fresh.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the same admitted twist/flexion axes and their cross product as of; normalization remains with normalizeJointAxes before this entry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This one assembly serves of and explicit operation preparation without copying the frame convention.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Performs no repair or alternative normalization; callers must supply the already admitted orthonormal basis, as the engine's other OnBasis entries require.

## @evidence contracts/development/implementation.md#efficient-algorithms

One cross product and one fixed-size frame replace repeated raw-axis admission comparisons for an explicitly prepared operation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

of delegates after its original admission, while explicit preparation shares its same successful normalized basis with composition and inverse consumers; each frame assembly still computes its actual cross product.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one fresh frame with a fresh cross vector and borrowed admitted axes; retains no state or resource.

# src/kinematics/swingTwistBasis.ts#swingTwistBasis.azimuth

## @evidence contracts/development/common.md#meaningful-documentation

States the circle's reference and unit.

## @evidence contracts/development/implementation.md#principled-implementation

The direction's parts along the circle axes give its angle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One arctangent.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/kinematics/swingTwistBasis.ts#swingTwistBasis.direction

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, their units and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The rest direction turned toward the circle's direction by the swing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One private direction owner turns three scalar weights into a vector, retaining the original outer rest-axis product plus the grouped two circle-axis products; prepareRay shares that same formula.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the same trigonometric weights and per-component multiplication/addition grouping, without approximation, normalization or changed angular bounds.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant scalar work creates one result vector instead of three scaled vectors and two summed vectors; all region-ray, projection and chart-inversion queries remain, with no measured speedup claim.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same deterministic sin(swing) value supplies both circle weights and each weight supplies all three components; no direction or quaternion result is cached.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one fresh caller-owned vector and retains no input, intermediate vector, reader or handle.

# src/kinematics/swingTwistBasis.ts#swingTwistBasis.prepareRay

## @evidence contracts/development/common.md#meaningful-documentation

States fixed azimuth, degree-valued swing queries, borrowed frame vectors, fresh results and one-ray release scope.

## @evidence contracts/development/implementation.md#principled-implementation

Retains only the fixed azimuth's sine and cosine; every swing still uses the same directionOnRay trigonometric weights and component grouping as direction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One small reader connects actual region scan/bisection queries to the same direction owner used by ordinary projection and chart inversion.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No ray, scan step, bisection, direction normalization or angular bound changes; no sampled direction or approximate trigonometric table is substituted.

## @evidence contracts/development/implementation.md#efficient-algorithms

One azimuth conversion and two trigonometric values serve the ray; each query retains the original swing sine/cosine and one result vector, avoiding two repeated azimuth trig calls per reach test. One extra closure per ray is the setup cost, and speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The actual region loop fixes one numeric azimuth while testing many swings; only those two invariant scalar values are shared, and the basis vectors and every current swing still feed the common numerical owner.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One reader owns two azimuth scalars and a borrowed basis until the ray loop ends; it retains no constraint, direction population, table, quaternion or global cache.

# src/kinematics/swingTwistBasis.ts#swingTwistBasis.clamp

## @evidence contracts/development/common.md#meaningful-documentation

States the result.

## @evidence contracts/development/implementation.md#principled-implementation

The least with the greatest.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
