# src/kinematics/AutoMovieHumanoidSurfacePlacement.ts#AutoMovieHumanoidSurfacePlacement

## @evidence contracts/development/implementation.md#principled-implementation

A point is bone position plus the bone quaternion's rotated local point; directions use that same quaternion with no translation or added normalization. All original scalar expressions remain with their quaternion owner.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Point owns position placement, normal owns direction rotation, pointNormal reads them in order, and full placement adds optional forward to that same fresh wrapper. The resolver delegates without another representation or cache.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No pose fit, contact, numeric admission or normal calculation is skipped upstream. Field demands omit only unused output reads/rotations; full placement keeps both original forward property reads when it is present.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant-size work. Point adds into its exclusively owned rotated offset rather than allocating another vector. PointNormal omits unused forward reads/rotation; full placement adds forward directly without an extra spread wrapper. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Full placement and point-only hit/carry consumers share point's exact expression. Strike/touch, clinch and held-coupling observations share pointNormal; the guard reads only normal. Every call reads current frame/bone values without an identity, target or result memo.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns only fresh numeric vectors and at most one fresh wrapper. No input frame/bone, source callback, reader, body or query history is retained.

## @evidence contracts/development/common.md#meaningful-documentation

Defines world metres, admitted bone-local directions, field-read order, fresh ownership and the point, normal and pointNormal demand companions.
