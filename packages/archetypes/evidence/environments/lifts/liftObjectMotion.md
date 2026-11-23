# src/environments/lifts/liftObjectMotion.ts#liftObjectMotion

## @evidence contracts/development/common.md#meaningful-documentation

States the source pose, clock, channels, interpolation and endpoint behavior.

## @evidence contracts/development/implementation.md#principled-implementation

All keyed transforms use the admitted local sill heights and the exact source slider travel along its +X axis. Linear weights keep closed doors closed during travel and preserve a static open plateau at stops.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The clip writes flat stage-node tracks, including constant rotation for the existing carrier sampling path. Geometry and timing admission happen before this step.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fake moving support or duplicated time sampler; ordinary track sampling drives the cab and its entire stage frame.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads the current built placement once. Per active landing and cab door it takes O(K) work to lower K keys. Never-open landings stay as staged and need no tracks.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same canonical records drive the display and the motion consumers. Tracks reuse one array of times and share one constant yaw per node.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns plain tracks bounded by schedule keys times participating nodes, with no process or external resources.
