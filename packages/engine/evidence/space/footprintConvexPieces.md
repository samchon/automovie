# src/space/footprintConvexPieces.ts#footprintConvexPieces

## @evidence contracts/development/implementation.md#principled-implementation

Region hygiene precedes a winding-aware convex-turn fast path or even-odd vertical slab sweep. Raw orientation signs preserve admitted concavity, and every distinct positive-width slab and nonidentical corner survives without a second feature-size tolerance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The decomposition owner feeds surface clipping and support/anchor queries while the shared region gate owns topology admission; the original rings remain the region definition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Rejected regions return no pieces and a cached zero-area ring also yields none; callers must rebuild after mutation. No admitted band is dropped or notch filled to fit containment's separate rim tolerance, though binary64 cancellation or unrepresentable interior abscissae still limit extreme coordinates.

## @evidence contracts/development/common.md#meaningful-documentation

States exact-region intent, hygiene refusal, positive plan winding and preservation of small admitted features; finite coordinates alone do not certify exact binary64 orientation or interpolation arithmetic.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N vertices, hygiene is O(N^2), the convex-turn walk O(N), hull construction O(N log N), and the slab sweep scans/sorts crossings over up to N cuts in O(N^2 log N), with up to O(N^2) returned piece vertices.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One sorted cut population and each slab's sorted crossings serve all bands in that slab; source projections are reused but mutable region results are not cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns returned piece arrays; slab points are fresh, while the convex fast path retains original hull point references. Call-local rings, cuts and crossings leave scope without renderer handles.
