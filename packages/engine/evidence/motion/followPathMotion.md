# src/motion/followPathMotion.ts#followPathMotion

## @evidence contracts/development/implementation.md#principled-implementation

Addresses each positive finite stretch by cumulative arc length and uses the shared earlier-boundary binary search; one segment index supplies position and yaw. Corner half-windows are capped by adjacent half-lengths, while source gait timing/easing repeats with incoming seam easing preserved.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The baker owns path length, heading and repeated root placement; supplied gait articulation remains source content, ground is a scalar/callback seam, and later plantStanceFeet owns contact correction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid authored scalars, coincident XZ, nonfinite/lost cumulative arc and unrepresentable cycle/duration arithmetic refuse before repetition; finite ground samples are required. Turn-window and minimum-stretch constants express stated path tolerances rather than fixture-specific steering.

## @evidence contracts/development/common.md#meaningful-documentation

States XZ metres, ignored waypoint Y, sampled height, model +Z heading, corner window, exact arrival, source gait admission and out-of-scope pathfinding; outputs report baseline frames separately from carried gait sway/bob.

## @evidence contracts/development/implementation.md#efficient-algorithms

For W waypoints and F baked frames, preparation is O(W), segment lookup O(log W) per frame and output O(F), replacing two repeated linear segment scans. Private canonical +Y magnitude work is prepared at the first actual emitted-frame axis-angle read and reused; each yaw retains its original trigonometry. Each ground callback is sampled once per emitted frame and output grows with requested cycles. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The frame's located segment serves position/yaw, fixed segments/corner windows serve the bake and one module-owned lazy reader shares only the private unchanged +Y axis scalars. Each source yaw and actual quaternion are computed anew after the original ground/profile reads. Gait values share without caching effectful ground samples or yaw results across requests.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned motion/sidecar arrays grow with baked frame population and belong to the caller; source nested joints/expression and authored nonnull scale may remain shared, but fallback identity scale is freshly owned per output frame. The module additionally retains at most one lazy fixed-axis reader with UP/direction-length metadata until module release; no path, ground callback, emitted frame or quaternion result is retained in it. No retained path cache or handles exist.
