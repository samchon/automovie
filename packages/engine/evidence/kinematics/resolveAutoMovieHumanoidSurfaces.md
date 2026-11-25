# src/kinematics/resolveAutoMovieHumanoidSurfaces.ts#resolveAutoMovieHumanoidSurfaces

## @evidence contracts/development/implementation.md#principled-implementation

Exact ray exits use anatomical stations/directions and the exited collider's physical normal; sole/seat/back use exact bounds. Point and place share bone.worldPosition plus the bone quaternion's rotation of the local point, with the same arithmetic as original full-frame placement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Definition tables use one ray and bounds owner. Placement entries delegate to one SurfacePlacement owner: point, pointNormal and full place add only demanded fields in the original point/normal/forward order; full place remains a plain callable facade.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing bone, segment or hit throws rather than inventing a point. Point-only observations omit unused direction work without changing the point expression, admitting another frame or altering complete place outputs; posed input admission remains with callers.

## @evidence contracts/development/implementation.md#efficient-algorithms

Resolution is linear in definitions times colliders; a genuine same-profile epoch shares exact neutral bounds. Point-only hit/carry/force/impact reads omit unused directions and reuse the owned rotated offset. Strike/touch, clinch and held-coupling reads request pointNormal without forward. Full place adds optional forward to the same wrapper, without an extra spread object.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

SurfaceRays owns one unchanged rest bundle and can share exact segment extrema from preceding measurement through a genuine live profile epoch. Point and place share one numerical expression; every posed call reads current coordinates/rotation without a point or frame-result cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Fresh surface records escape; ray/rest readers remain local and withSurfaces releases its neutral epoch in finally. Point returns one caller-owned vector without retaining inputs; place adds its own fresh wrapper/directions. No posed query history or source reader escapes these numeric outputs.

## @evidence contracts/development/common.md#meaningful-documentation

States canonical frame, each surface's point/normal rule, measured defect, grip size and local result frame. Namespace entries expose fresh world point, point/normal or complete placement under the same admitted bone, with field demand owned by SurfacePlacement.
