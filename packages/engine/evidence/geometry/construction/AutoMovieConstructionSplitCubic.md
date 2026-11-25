# src/geometry/construction/AutoMovieConstructionSplitCubic.ts#AutoMovieConstructionSplitCubic.Cubic

## @evidence contracts/development/common.md#meaningful-documentation

Names the four ordered world-space controls of one cubic Bézier curve.

## @evidence contracts/development/design.md#principled-representation

The tuple fixes degree and control order in world millimetres. It does not certify increasing course, distinct endpoints or regular tangents.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The construction's saddle and generating courses use the same four-point control type as their evaluators.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Opposite and interior branches share the same tuple and preserve their own direction and position through their controls.

# src/geometry/construction/AutoMovieConstructionSplitCubic.ts#AutoMovieConstructionSplitCubic.Clock

## @evidence contracts/development/common.md#meaningful-documentation

Names the phase mapping, its directional rate and the owning rail jet.

## @evidence contracts/development/design.md#principled-representation

The phase is in radians and the directional rate comes from the caller's specified world-space displacement. The caller's rail evaluator supplies the world jet.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A branch supplies one angular address system and inverse reader for its original receiving curve.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Original points and jets remain with their rail. Runtime admission verifies that addressed phases visit the rail in cyclic order.

# src/geometry/construction/AutoMovieConstructionSplitCubic.ts#AutoMovieConstructionSplitCubic.Clock.phase

## @evidence contracts/development/common.md#meaningful-documentation

Computes the physical polar angle of a supplied world point around the fixed receiving section.

## @evidence contracts/development/implementation.md#principled-implementation

Projects the point on the receiving plane axes and uses the physical polar angle. The prepared clock owns the axis signs and the native source bounds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One clock converts the point, reads the matching native jet and computes the corresponding angle rate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The angle follows the supplied point and receiving frame. No phase correspondence is inferred from sampled meshes or exemplar geometry.

## @evidence contracts/development/implementation.md#efficient-algorithms

One angle read uses a constant number of vector products and one polar angle.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same native frame and originating point supply all reads of this prepared receiving section.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The clock retains the supplied receiving frame within the prepared split.

# src/geometry/construction/AutoMovieConstructionSplitCubic.ts#AutoMovieConstructionSplitCubic.Clock.rate

## @evidence contracts/development/common.md#meaningful-documentation

Computes the directed polar angle derivative at a world point in the supplied direction.

## @evidence contracts/development/implementation.md#principled-implementation

Differentiates the atan2 projection through the fixed receiving frame. The curve allocator preserves the resulting direction sign and uses its magnitude when converting to physical speed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The calculation uses the same frame and origin as the angle and receiving-jet readers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The derivative comes from the actual world direction and fixed frame. An inadmissible receiver fails its physical-clock construction.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each derivative needs only the projected position and direction products.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The derivative shares the frame already used for the angle.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The result is a scalar. Only the prepared clock owns its originating frame.

# src/geometry/construction/AutoMovieConstructionSplitCubic.ts#AutoMovieConstructionSplitCubic.Clock.read

## @evidence contracts/development/common.md#meaningful-documentation

Returns the exact native receiving surface jet and its original phase for a physical angle.

## @evidence contracts/development/implementation.md#principled-implementation

Inverts the directed native section angle on a complete ordered period and reads the original position and derivatives at the resolved native phase.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One prepared clock binds the section and orientation. The caller supplies the requested angle only.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The returned address refers to the original receiving surface, whose regularity and ordered angle are checked before the clock is used.

## @evidence contracts/development/implementation.md#efficient-algorithms

The inversion uses a bounded single-variable bracket on prepared section readers. It does not repeat the source station preparation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All receiving reads on this rail reuse the same fixed section and orientation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned jet belongs to the requested source phase. The scoped clock retains the prepared station reader.

# src/geometry/construction/AutoMovieConstructionSplitCubic.ts#AutoMovieConstructionSplitCubic.Course

## @evidence contracts/development/common.md#meaningful-documentation

Associates each generating cubic with its absolute receiving phase.

## @evidence contracts/development/design.md#principled-representation

The controls are ordered in world millimetres and `phase` identifies where the curve ends on its receiving rail, in radians.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Tessellation and course evaluation consume the same association so the mesh can reference the native rail.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The field is shared by exterior sectors and both sides of an internal saddle.

# src/geometry/construction/AutoMovieConstructionSplitCubic.ts#AutoMovieConstructionSplitCubic.prepareSaddle

## @evidence contracts/development/common.md#meaningful-documentation

Defines the shared saddle, its chord bound and two departure directions.

## @evidence contracts/development/implementation.md#principled-implementation

Both inner controls advance by four thirds of the selected apex depth, which gives the cubic's exact midpoint height. The complementary-parameter chord spacing supplies an injection bound.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closure owns both sibling departure directions. The accepted endpoint jets determine the two fork planes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The endpoint directions follow from regular original fields. Half the measured available course is the documented estimate for a tip outside this range. A linear transverse estimate preserves both measured fork directions.

## @evidence contracts/development/implementation.md#efficient-algorithms

Construction and evaluation use a fixed number of three-dimensional vector operations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same controls and endpoint transverse directions serve both incident strips over their supplied saddle parameter.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The result owns four controls and the source vectors captured by its direction closures throughout that invocation.

# src/geometry/construction/AutoMovieConstructionSplitCubic.ts#AutoMovieConstructionSplitCubic.connection

## @evidence contracts/development/common.md#meaningful-documentation

Defines the endpoint-tangent cubic connecting one start point and one receiving jet.

## @evidence contracts/development/implementation.md#principled-implementation

One third of forward reach apportions the cubic end derivatives. The endpoint directions share this projection and derive from the actual registered jets.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The cubic constructor keeps control arithmetic together and leaves source direction and phase selection with the caller.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The caller establishes positive reach and admissible endpoint directions. No dependent source is reconstructed from a sampled fit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads each endpoint once and performs a fixed number of vector operations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A single returned record carries the control net and originating receiving phase.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owns four controls and a phase scalar for the asking course, with no persistent state.

# src/geometry/construction/AutoMovieConstructionSplitCubic.ts#AutoMovieConstructionSplitCubic.value

## @evidence contracts/development/common.md#meaningful-documentation

Evaluates the cubic curve at the supplied normalized parameter.

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates the cubic Bernstein basis in world millimetres.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The same evaluator is used by shape, differential construction and diagnostics.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Parameter validity belongs to the requesting chart. The endpoint weights preserve the original controls exactly.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed four-term summation per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Takes the caller's own exact control net.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps no state between evaluations.

# src/geometry/construction/AutoMovieConstructionSplitCubic.ts#AutoMovieConstructionSplitCubic.first

## @evidence contracts/development/common.md#meaningful-documentation

Evaluates the first derivative of the cubic curve.

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates the quadratic Bernstein basis of the three scaled forward control differences.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shares the curve order with the value evaluator and keeps derivative weights at the same operator.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The endpoint rays retain the control directions. The caller converts the normalized derivative to its physical parameter.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed three-term summation per query.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the same controls as the curve evaluator.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps no state between evaluations.

# src/geometry/construction/AutoMovieConstructionSplitCubic.ts#AutoMovieConstructionSplitCubic.unitCross

## @evidence contracts/development/common.md#meaningful-documentation

Returns the station direction with the edge's tangential speed removed.

## @evidence contracts/development/implementation.md#principled-implementation

Projects the native station jet off the phase vector and normalizes the remaining component in the original tangent plane.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The direction calculation operates on a source jet independent of the shape that consumes it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The source admits a nonzero phase derivative and a nondegenerate original tangent plane.

## @evidence contracts/development/implementation.md#efficient-algorithms

The direction uses a fixed set of dot products and vector operations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the original supplied jet without a second evaluation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one vector and owns no retained state.
