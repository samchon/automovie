# src/audit/AutoMovieMotionHumanAuditTangleModel.ts#AutoMovieMotionHumanAuditTangleModel.IPart

## @evidence contracts/development/common.md#meaningful-documentation

Defines the carrying bone, ordered shape/axis probes, surface prefix, metre-valued local sphere, extent and the probes' offset outside the shapes.

## @evidence contracts/development/design.md#principled-representation

Actual collider corners and along-bone points share one segment-local frame, its conservative bounding sphere, and the probes' measured offset outside the segment's own shapes, which a link pair's certificate subtracts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Model construction produces every field for the canonical audit, arm-frame and trajectory reference readers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No probe is invented from a scene, no physical radius is padded and surface/axis ownership stays explicit.

# src/audit/AutoMovieMotionHumanAuditTangleModel.ts#AutoMovieMotionHumanAuditTangleModel.IModel

## @evidence contracts/development/common.md#meaningful-documentation

States ordered parts, own-body exclusions, the two actual reference placements and lazy ordered-pair depth readings.

## @evidence contracts/development/design.md#principled-representation

A body's actual build and fixed reference poses define its probe allowances; external bodies receive no such own-body reference.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shared model supplies the audit and arm planner without duplicating collider construction or reference policy.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The existing live-body cache holds this build only; current candidate poses and scores are not represented as model state.

# src/audit/AutoMovieMotionHumanAuditTangleModel.ts#AutoMovieMotionHumanAuditTangleModel.group

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the result and the two grouped parts.

## @evidence contracts/development/implementation.md#principled-implementation

A finger belongs to its hand and a toe to its foot by the rig's naming.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One side test and two suffix tests.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A bone with no side is its own part.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/audit/AutoMovieMotionHumanAuditTangleModel.ts#AutoMovieMotionHumanAuditTangleModel.model

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the result and that it is remembered.

## @evidence contracts/development/implementation.md#principled-implementation

Probes are the shapes' corners and three points along the bone to each child joint; two segments are related when they are one part or one's nearest ancestor with a collider is the other; the reference postures are the rest T-pose and the quiet stance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The skeleton's relations, the probes and spheres, the related pairs, then the stance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A bone without a collider is skipped to its ancestor, never treated as a joint of its own.

## @evidence contracts/development/implementation.md#efficient-algorithms

Built once per body; pairs are quadratic in the segments, a few dozen.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Remembered in a `WeakMap` keyed by the body.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One model per live body, released with it.

# src/audit/AutoMovieMotionHumanAuditTangleModel.ts#AutoMovieMotionHumanAuditTangleModel.centre

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

The part's centre carried by the segment's pose.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One transform.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Carries the supplied canonical centre without replacing it by the bone origin or modifying its radius.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/audit/AutoMovieMotionHumanAuditTangleModel.ts#AutoMovieMotionHumanAuditTangleModel.depths

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the unit and the outside value.

## @evidence contracts/development/implementation.md#principled-implementation

Interior depth of a point in a convex hull is its least distance to the face planes; other shapes are read by the engine's shape distance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reading through `prepareAutoMovieMotionHumanAuditDepths`, which owns the arithmetic; a caller reading many segments against `b` in one pose prepares `b` once there (`beyond`'s `targets`).

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The engine still owns every hull face and shape distance. Shape DTO transforms remain unchanged during this synchronous depth read; no query, bound, face order, deepest comparison or tolerance changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

One preparation of `b` and one reading: sphere screening, selected point transforms and the face loop's early cut, with each selected hull's inverse computed once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Nothing is shared between calls here; the preparation lives for this one reading.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The preparation is dropped on return; only the fresh depth array escapes.

# src/audit/AutoMovieMotionHumanAuditTangleModel.ts#AutoMovieMotionHumanAuditTangleModel.reference

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the unit, who reads it and the value of a pair the audit sets aside.

## @evidence contracts/development/implementation.md#principled-implementation

The reference depth is the deeper of the rest pose's and the quiet stance's; corners share their pair's deepest reference depth, set aside past `BUILT`, and a point of the bone's axis keeps its own.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two depth readings, one maximum per probe, then the corners' shared depth.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only the corners share a depth, so a crossing limb's axis is read in full.

## @evidence contracts/development/implementation.md#efficient-algorithms

Computed once per ordered pair.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Remembered in the model's baseline map, which `beyond` reads too.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The baselines live with the model, bounded by the segment pairs.

# src/audit/AutoMovieMotionHumanAuditTangleModel.ts#AutoMovieMotionHumanAuditTangleModel.beyond

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the unit, the sign, the room's use, and whose the list of prepared segments is and how long it holds.

## @evidence contracts/development/implementation.md#principled-implementation

The depth now less the reference depth, probe by probe.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The reference, one depth reading, then one subtraction per probe.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every probe is read against its own reference, none skipped.

## @evidence contracts/development/implementation.md#efficient-algorithms

One depth reading per call, the room read off its own sphere distances; the reference is computed once per ordered pair, and with `targets` what a reading needs of segment `j` alone once per pose rather than once per pair.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads `reference`. A prepared segment is shared only through the list its caller made for the same `placed`, by that segment's index, so it is the preparation of `placed[j]` as placed.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh array and fills the caller's room array; the list, one entry per segment read in, is the caller's and ends with its reading.

# src/audit/AutoMovieMotionHumanAuditTangleModel.ts#AutoMovieMotionHumanAuditTangleModel.excess

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the unit and the zero.

## @evidence contracts/development/implementation.md#principled-implementation

The greatest of `beyond`'s readings, floored at zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps every original beyond reading and the zero floor without a new margin or pair exemption.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the probes, with no algorithm to choose.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `beyond`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
