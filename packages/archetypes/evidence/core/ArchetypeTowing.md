# src/core/ArchetypeTowing.ts#ArchetypeTowing.IFront

## @evidence contracts/development/common.md#meaningful-documentation

The pivot is a model-space metre point and turn names the source's steering articulation.

## @evidence contracts/development/design.md#principled-representation

An existing source point/id pair describes one steerable front axle; the reader admits support geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Shared by producer support descriptors and the existing front option.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No independently adjustable wheelbase or steering angle duplicates the model.

# src/core/ArchetypeTowing.ts#ArchetypeTowing.Support

## @evidence contracts/development/common.md#meaningful-documentation

Axle points are neutral wheel centres in metres; their Y is their floor clearance. A four-wheeler may name a real drawbar pitch articulation, otherwise coupling height is fixed.

## @evidence contracts/development/design.md#principled-representation

A closed union separates whole-body axle pitch from a level two-axle chassis; optional pitch is an articulation, not permission to deform a rigid pole.

## @evidence contracts/development/design.md#minimal-and-owned-surface

createCart.towing/createCannon.towing read this from their source models for the generic towing owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No kind tag, numerical correction knob, mutable registry or unmeasured mechanical angle limit is added.

# src/core/ArchetypeTowing.ts#ArchetypeTowing.IPlane

## @evidence contracts/development/common.md#meaningful-documentation

Names a world-metre point on the plane and its upward unit normal.

## @evidence contracts/development/design.md#principled-representation

A point and a normal fix one plane, the form an authored footing's landing query returns.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read only by `prepare`'s terrain support; a footing owner adapts its own surfaces to it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No height field or inferred terrain: the caller names the plane under each queried point.

# src/core/ArchetypeTowing.ts#ArchetypeTowing.Ground

## @evidence contracts/development/common.md#meaningful-documentation

Takes world X and Z in metres and returns the plane under that point.

## @evidence contracts/development/design.md#principled-representation

A pure query over the scene's authored ground, so the wheels' support is the ground under the axle rather than under the leader.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Supplied by a caller that owns footing, such as a draft take, and read by `prepare`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A query that finds no plane must refuse; it never returns a default height.

# src/core/ArchetypeTowing.ts#ArchetypeTowing.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Exposes front steering, rear/front separation, height-dependent projected reach and a supported rigid pose with real articulation travels.

## @evidence contracts/development/design.md#principled-representation

Both integration and sample placement consume one admitted geometry snapshot and the same height equation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the existing towing integrator/emitter uses this prepared record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No stored sampled pose, independent reach estimate or hidden body lift supplies a coupling.

# src/core/ArchetypeTowing.ts#ArchetypeTowing.IPrepared.height

## @evidence contracts/development/common.md#meaningful-documentation

Inputs are world metre heights and output reach is positive metres with pitch in radians.

## @evidence contracts/development/implementation.md#principled-implementation

Keep the axle/pivot height and rigid link length, solve its vertical component, and take the positive horizontal projection; a level rigid support refuses a different height.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One finite height admission and closed-form circle projection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No whole-body translation, distance clamp or geometric reach outside the declared circle is accepted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant scalar/trigonometric work without a new integration loop.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same operation supplies heading and final placement.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh scalars and retains no samples.

# src/core/ArchetypeTowing.ts#ArchetypeTowing.IPrepared.ground

## @evidence contracts/development/common.md#meaningful-documentation

Inputs are the world hitch point, the planar heading in radians and the course datum in metres; the output is the world datum `height` and `pose` read, metres.

## @evidence contracts/development/implementation.md#principled-implementation

On a plane of upward normal n the wheel's centre stands r/n_y above the plane under it; the axle lies `reach` behind the hitch along the heading, so the lever circle and the plane's line along the heading intersect in one quadratic, solved in closed form and re-solved while the plane under the solved axle changes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Without terrain return the datum; with it solve the circle-line intersection on the queried plane.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A plane sloping across the axle, an unreachable lever or a plane that will not settle under the axle refuses; no wheel is lifted or sunk to hide it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per plane query, at most four queries.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the lever, wheel clearance and refusal of `prepare` with `height` and `pose`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one scalar and retains nothing.

# src/core/ArchetypeTowing.ts#ArchetypeTowing.IPrepared.pose

## @evidence contracts/development/common.md#meaningful-documentation

Hitch is a world point, ground a world Y datum, theta/phi are planar link headings in radians, and output is a rigid model placement plus source articulation degrees.

## @evidence contracts/development/implementation.md#principled-implementation

Put the axle/front pivot at its ground clearance behind the hitch, then rotate about that point; a four-wheel body stays level while its declared pole hinge changes pitch.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve shared height, construct yaw/pitch, anchor the support point and return independent travel/frame records.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Never scale a wheel, stretch a pole, alter its contact or translate a chassis to hide a height mismatch.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant quaternion/vector work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the admitted support and height operation with integration.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh transforms/travels without retaining caller points.

# src/core/ArchetypeTowing.ts#ArchetypeTowing.IOptions

## @evidence contracts/development/common.md#meaningful-documentation

Names each optional geometry declaration and its unit.

## @evidence contracts/development/design.md#principled-representation

Each member is an independent declaration; contradictions between them are refused at runtime by `prepare`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The subset of `AutoMovieArchetypeRide.towed`'s options this owner reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Ground is admitted only with single-axle support, the one support whose body may pitch onto it.

# src/core/ArchetypeTowing.ts#ArchetypeTowing.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States support ownership, legacy level-only admission, duplicate-option contradictions, pitch freedoms and strict positive projected reach.

## @evidence contracts/development/implementation.md#principled-implementation

A rigid lever around a grounded axle/pivot satisfies h=qY*cos(pitch)-qZ*sin(pitch); its horizontal projection is sqrt(length²-h²). Both existing heading integration and pose emission share that lever, while fixed supports refuse unsupported height.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit options/source pivot data, prepare one lever, then expose its closed height solution and rigid placement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No kind/part-name heuristic, 4 cm compensation, global epsilon, replacement of source methods or extra physics loop changes the model.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(A) source contact reads during preparation and constant work per geometry query; the caller keeps its existing single heading trajectory.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Source coordinates are snapshotted once and one height law determines both projected heading reach and exact support placement.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only fixed scalar geometry and source articulation ids; returned frames/travels are independent and no model buffers, handles or sampled cache survive.

# src/core/ArchetypeTowing.ts#ArchetypeTowing.checkSteering

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the front axle articulation and the completed planar heading trajectory in radians.

## @evidence contracts/development/implementation.md#principled-implementation

Measure the maximum absolute link-heading difference across the existing knots against the articulation's own degree limit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Apply one knot scan for a steerable axle and a single original refusal when it exceeds the lock.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No different sampling time, steering clamp or substitute articulation limit.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(K) reads for K prepared knots, O(1) auxiliary space.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Read the existing continuous heading trajectory at its knots without a new integration.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The synchronous validation keeps only the current maximum.
