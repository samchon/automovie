# src/perform/HumanPerformanceFlightRotation.ts#HumanPerformanceFlightRotation

## @evidence contracts/development/common.md#meaningful-documentation

Input times are film seconds, start is the action's film start, root orientations and centres are world values, and the returned callback reads action-local seconds. The numeric orientation reader can be a physical dense trajectory or an explicitly staged authored curve; it receives the current unturned root and implies no conservation claim.

## @evidence contracts/development/implementation.md#principled-implementation

Returns q(t,R(t)) R(t)^-1 about the tabulated centre, with the existing linear centre and slerped unturned root. The supplied physical trajectory reads its dense extension, while the staged owner supplies exact unwrapped authored angles under that same current heading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Clamp the action time to the flight, find its tabulated interval and form the relative rigid rotation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the original playback arithmetic; no displayed pose or shape history is read after planning, and an authored orientation is not reported as a physical trajectory.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant-time table lookup plus the supplied orientation reader's own cost. Each visited interval lazily prepares its endpoint dot, shorter-arc branch and spherical constants once; each actual read still evaluates its own weights and normalization.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both orientation policies share the numeric centre/root table reader. Copied root endpoint coordinates are compared with Object.is before sharing a prepared slerp, so editing a caller-owned table entry invalidates that interval without relying on identity.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Captures only numeric table data, the completed numeric orientation reader and at most one fixed-size endpoint interpolation per visited table interval; shrinking the table truncates old slots. Performance, body, action segment, history and right-hand side are outside this factory's scope.
