# src/kinematics/AutoMovieHumanoidSurfaceRays.ts#AutoMovieHumanoidSurfaceRays.tools

## @evidence contracts/development/common.md#meaningful-documentation

Names the readers, unchanged-body epoch, bundle release point and independent returned bounds.

## @evidence contracts/development/implementation.md#principled-implementation

The rest pose resolved once; bounds are the union of the colliders' exact bounds; a ray's exit is the farthest exit over the segment's convex colliders, its normal that collider's. A level station reads the stature as the top of every collider at rest, as `measureAutoMovieHumanoidBody` does, and stands at the share of its segment that reaches the level's height; a level outside the segment throws.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rest pose and first-name index serve the bundle; lazy bounds and fixed rest-shape exit/physical-normal reader pairs keep invariant geometry separate from every current station, ray and normal. One private trace owns farthest-hit selection for both point-only exit and complete surface observations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing bone, segment or hit still throws. Every current ray tests all original colliders with the same discriminants, plane/slab order, BOUNDARY and 1e-12 branches; only fixed frames, capsule axes/endpoints and hull planes are prepared.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pose indexed directly without a mapped B-tuple array and an O(S) profile index precede lazy bounds/exits. Fixed exits, centre stations and ray points reuse fresh offset/sum storage; spheres omit unused orientation. Repeated actual head/neck/chest stations share local origins and lazily observed hull heights after three exact scalar matches; changing directions retain every plane speed/clip. Point-only exits omit unused normals; full surfaces prepare their winner's normal. Local conversion compares four quaternion coordinates before inverse reuse; hull bounds rotate V points once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The unchanged rig/profile epoch fixes bounds and shape frames; a genuine profile handle can share preceding exact extrema. Each box/hull exit copies/checks actual origin XYZ with Object.is before lending local point/plane heights, clearing heights on change; no origin identity or ray result certifies a hit. Local inverses capture actual rest quaternion XYZW once and use that tuple for key and inverse, including edits to an at result. Duplicate precedence, current directions, clip checks and outward normals remain unchanged.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The bundle owns O(B) rest/inverse keys, O(S) names/bounds and one fixed exit per queried collider. Each box/hull exit holds only its last copied origin/local coordinates and at most F lazy plane heights, without retaining an input point or ray history. A normal reader is acquired only for a normal-demanding winner; point-only exit has no surface wrapper. All readers/scratch end on completion or throw, with no body-global posed/query result cache.
