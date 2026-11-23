# src/geometry/construction/witnessAutoMovieSolidChartTriangle.ts#witnessAutoMovieSolidChartTriangle

## @evidence contracts/development/implementation.md#principled-implementation

Uses exact signs for point-in-triangle and proper segment crossings, plus endpoint-on-segment checks, to reject a probe corridor containing any other represented boundary.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One local triangle witness is shared by left-side probes and rounded bridge-midpoint membership; it evaluates no source surface.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not equate an approximate clearance with exact topology or weld coincident IDs. Unsupported phase width or contact returns false, while unavailable endpoints and unrepresentable local images return named arithmetic failure.

## @evidence contracts/development/common.md#meaningful-documentation

States original-ID exclusions, local-image premise, represented-number meaning and absence of curved/world certification.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans V point entries and E constraint segments with at most five neighbouring images, in O(V+E) exact-predicate calls for the admitted local family.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One source-endpoint lookup and triangle orientation serve both segment-side checks; no repeated source evaluation or geometry cache is introduced.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

An O(E) incident-ID set and fixed-size coordinate/image scratch are local; returns a boolean or string and retains no map, segment or callback.
