# src/everyday/stepOverPath.ts#stepOverPath

## @evidence contracts/development/common.md#meaningful-documentation

States fixed body/obstacle geometry, footprint and action-time readers; the namespace supplies all clearance, angle and contact rules.

## @evidence contracts/development/implementation.md#principled-implementation

The lead trajectory clears its pitched sole. Each lead socket also owns a continuous height requirement at its actual forward position. The trail trajectory clears the obstacle expanded by its ankle-to-sole radius, allowing shank-relative pitch during crossing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Obstacle admission precedes fixed frame/flat/pivot/socket preparation, the same pitch/profile path builder and random-access foot readers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both trajectories use the declared obstacle margin, measured rig sockets, the shared taut-path construction and the scheduled minimum-jerk clock.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed heading axes, sole offsets and yaw/roll prefixes prepare once; one actual sole rotation serves all three original socket probes instead of reconstructing the same rotation three times.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One take fixes body, obstacle, frame, footprint headings and zero-toe sole geometry; each actual pitch, query point and second still evaluates its own dependent path/contact arithmetic.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned plan owns fixed footprint/socket/frame readers and two clearance paths until released; no sampled pose, queried foot placement or arbitrary-second cache is retained.
