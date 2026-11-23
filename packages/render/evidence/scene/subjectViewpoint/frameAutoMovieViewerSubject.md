# src/index.ts#frameAutoMovieViewerSubject

## @evidence contracts/development/implementation.md#principled-implementation

Sphere-fit distance r/sin(min half-fov) handles portrait/wide lenses, conventional radius flooring handles vertex-free boxes and radius-scaled clips avoid a fixed world depth range; scalar comparisons reject ordinary lens range violations only.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pure framing owner converts bounds/direction/lens to a pose; it does not inspect geometry or promise fitted pixels for arbitrary camera state.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 0.5-metre floor and clip margins are explicit inspection conventions, not hidden measured geometry; incomplete nonfinite/order/multiplier validation and overflow limits remain visible.

## @evidence contracts/development/common.md#meaningful-documentation

Documents sphere-fit rule, metre floor, finite input premises and scale invariance only above the floor.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed box arithmetic and trigonometry allocate one center/span/position/pose; deriving current bounds and rendering remain upstream/downstream costs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each call uses its current bounds, direction and lens without caching; returned lens reference is borrowed and later mutation changes metadata.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owns only small returned value records and retains no scene or native handle; the caller owns subsequent camera and image resources.
