# src/kinematics/swingTwistRange.ts#swingTwistRange.of

## @evidence contracts/development/common.md#meaningful-documentation

States the precedence, the fallback and the empty case.

## @evidence contracts/development/implementation.md#principled-implementation

The skeleton's own axes win over the family table, the precedence every engine entry with a skeleton reads.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolves skeleton axis precedence through skeletonJointAxes, then delegates frame assembly to fromAxes, which also serves operation-scoped rig preparation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No bone is special-cased.

## @evidence contracts/development/implementation.md#efficient-algorithms

A supplied skeleton requires one O(B) axis merge and a constant-time frame assembly; no-skeleton lookup is constant work. Multi-joint operations can resolve the table once and call fromAxes without repeating the scan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares axis precedence with skeletonJointAxes and frame assembly with fromAxes; fresh calls observe replaced axes on the same bones list instead of trusting a skeleton-identity cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no skeleton or table; the caller owns a fresh frame record borrowing the resolved axes and canonical rest frame.

# src/kinematics/swingTwistRange.ts#swingTwistRange.fromAxes

## @evidence contracts/development/common.md#meaningful-documentation

States the already-resolved-axis premise, canonical rest frame, undefined result and borrowed members.

## @evidence contracts/development/implementation.md#principled-implementation

Pairs the supplied clinical axes with the same bone's HUMANOID_REST_FRAME entry, exactly the frame assembly used by of after skeleton precedence is resolved.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One frame constructor lets standalone lookup and operation-scoped multi-joint preparation share the clinical mapping without a synthetic skeleton.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Performs no alternate precedence, axis repair or normalization; numerical admission remains with the existing consumers of the frame.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work and at most one fixed-size record, with no skeleton scan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Borrows the caller's already-resolved axes and canonical rest-frame table; changed rotations still go through the actual swing-twist computation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no state; the caller owns the optional returned frame and its borrowed members' lifetime.

# src/kinematics/swingTwistRange.ts#swingTwistRange.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States explicit preparation, borrowed unchanged axes/frame, lazy first admission and wrapper ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Only the operation-invariant swing-twist basis is shared; the existing basis admission and cross product still execute at the first actual numerical reading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates private prepared-record ownership to SwingTwistFramePreparation, which the existing numerical readers also consult without copying any rotation algorithm.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Ordinary IJoint records retain live admission; no rotation, chart result, constraint or failed admission is remembered, and no tolerance changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant wrapper creation and one lazy axis admission plus swing-basis assembly per explicit operation avoid repeated normalization comparisons and basis/cross-vector allocation on read/project/placed calls; prepared clamps also borrow the admitted axes for their actual composition and inverse. The wrapper owns three small closures, and speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller's unchanged axes/frame scope proves basis equivalence; every incoming quaternion or chart coordinate still receives the original numerical computation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One wrapper owns three lazy reader closures, at most one admitted-axis reference and one swing basis plus borrowed frame records, released with the operation; no global registry, skeleton identity cache, resource handle or task is introduced.

# src/kinematics/swingTwistRange.ts#swingTwistRange.read

## @evidence contracts/development/common.md#meaningful-documentation

States the input, its frame and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The twist is the angle of the rotation's twist about the rest axis (the engine's `swingTwist`), so the swing that remains carries the rest axis to the limb's direction by the shortest turn.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rotation of the axis, one projection and two angles.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The twist is lifted by the joint's own rest frame, so its sign is the clinical one.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses swingTwist and wrapDegrees, plus only an explicit prepared wrapper's unchanged basis; ordinary joint frames retain live admission.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/kinematics/swingTwistRange.ts#swingTwistRange.overshoot

## @evidence contracts/development/common.md#meaningful-documentation

States the two parts of the measure and its unit.

## @evidence contracts/development/implementation.md#principled-implementation

Degrees past the swing's radius and past the twist's interval, the two limits the range states, so a solver ranks candidates by how far out they are.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reading, one radius and one interval.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The twist is aliased to the interval before it is measured, so a full turn is never counted.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work once the radius table is built.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads `read` and the cached `radius`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/kinematics/swingTwistRange.ts#swingTwistRange.project

## @evidence contracts/development/common.md#meaningful-documentation

States how the swing and the twist are each brought back and that a rotation inside is returned as given.

## @evidence contracts/development/implementation.md#principled-implementation

The swing is brought back along its own great circle from the rest direction, a radial map onto a region star-shaped about the rest direction, which moves continuously with the rotation wherever the radius does; the twist is clamped to its interval.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reading, one radius, one shortest turn (`rotationBetween`) and one twist.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No nearest point is sought, since a nearest point jumps where two tie.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work once the radius table is built.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads read and radius and shares only an explicit prepared wrapper's unchanged basis; each requested rotation still receives the actual projection.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/kinematics/swingTwistRange.ts#swingTwistRange.chart

## @evidence contracts/development/common.md#meaningful-documentation

States the three coordinates, why the region is the unit disc and why the chart is continuous over it.

## @evidence contracts/development/implementation.md#principled-implementation

A star-shaped region about a pole is mapped onto the unit disc by the swing's share of its radius along the azimuth, the polar form of the pole's chart, whose only singularity, the pole's antipode, lies outside the region.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reading, one radius and two products.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The twist is the reading's alias nearest the interval, never clamped.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work once the radius table is built.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `read`, `radius` and `nearestAngleAlias`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/kinematics/swingTwistRange.ts#swingTwistRange.placed

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The direction the swing of the disc's share of the radius reaches along the disc's azimuth, then the twist about the rest axis, composed as `project` composes a rotation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One azimuth, one radius, one direction and one composition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A place off the disc gives a rotation outside the region, never a clamped one.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work once the radius table is built.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses radius, direction, rotationBetween and toRigAngle with only an explicit prepared wrapper's unchanged basis; each coordinate still receives actual chart inversion.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/kinematics/swingTwistRange.ts#swingTwistRange.blend

## @evidence contracts/development/common.md#meaningful-documentation

States the blend, why it stays inside and is continuous and meets its ends, and the measured defect of the spherical interpolation.

## @evidence contracts/development/implementation.md#principled-implementation

A straight line between two points of a convex set stays in it, and the chart is a homeomorphism of the region onto the disc times the interval.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two charts, one straight blend and one inverse.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No projection is needed and none is taken.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work once the radius table is built.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `chart` and `placed`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/kinematics/swingTwistRange.ts#swingTwistRange.prepareBlend

## @evidence contracts/development/common.md#meaningful-documentation

States fixed rest-relative endpoints/rig lifetime, ordered eager chart admission, actual per-share inversion, fresh rotation and caller-owned release.

## @evidence contracts/development/implementation.md#principled-implementation

Endpoint chart coordinates depend only on those unchanged rotations and the same region/frame. Sharing their exact completed values leaves from+(to-from)*share and the existing placed inversion unchanged, including extrapolation/nonfinite share arithmetic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Direct blend and this fixed-pair reader share one private three-coordinate interpolation owner and the same chart/inversion owner; no chart algorithm is copied into a Human consumer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No share clamp, new endpoint shortcut, projection, tolerance or normalization skip is added. First construction preserves chart(a) before chart(b); later reads assume the declared immutable endpoints/constraint/frame and evaluate every current share normally.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation performs the original two constant-size chart computations once; each share retains three coordinate expressions and actual placed/radius/rotation work, omitting repeated endpoint readings and their records. The inversion reader additionally shares successful fixed basis/source/axis/affine work, first reached at its original numerical sites. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The actual fixed-endpoint Human joint blender borrows this reader only under one unchanged pair/rig. Endpoint coordinates and successful rig-only inversion preparation cross reads; share-dependent coordinates/quaternions and outputs remain fresh, with no result history or global key.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller-owned reader holds two three-scalar chart records, borrowed constraint/joint and one lazy inversion reader with at most one basis, normalized source, axis preparation and affine reader until pair release. Endpoint quaternions need not remain retained after construction. Every share returns its actual placed quaternion and retains no input share/output, handle or task.

# src/kinematics/swingTwistRange.ts#swingTwistRange.radius

## @evidence contracts/development/common.md#meaningful-documentation

States the reading and its interpolation.

## @evidence contracts/development/implementation.md#principled-implementation

The radius is read on `swingTwistBasis.RAYS` great circles once, from the farthest reached swing on each, found by a scan from the far end and a bisection, widened for a proximal twist by the reach of every twist in its interval, raised to turn no faster than `SLOPE` with the azimuth, and interpolated linearly between them, which is continuous in the azimuth.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One table lookup and one interpolation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The scan runs from the far end, so a ray the ranges leave and re-enter keeps its farthest reach: the radius is the star's, not the first exit's. `SLOPE` (3) is provisional; `SCAN` and `HALVINGS` are resolutions, not fitted to a case.

## @evidence contracts/development/implementation.md#efficient-algorithms

The table is built once per constraint and basis and kept.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every call after the first reads the cached table.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The tables are kept in a WeakMap keyed by the constraint object and released with it.
