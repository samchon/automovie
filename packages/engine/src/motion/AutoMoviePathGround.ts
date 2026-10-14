/**
 * Ground elevation in metres for a walked path: a constant plane or a callback
 * from world XZ metres to world Y metres. followPathMotion ignores waypoint Y
 * and refuses non-finite results; spaceGround adapts a support-space query.
 *
 * @evidence contracts/common.md#principled-implementation A scalar represents a plane and a two-coordinate function represents single-valued terrain height; followPathMotion evaluates this source at path samples instead of treating waypoint Y as competing ground data.
 * @evidence contracts/common.md#clear-and-simple-design One scalar-or-function seam accepts flat ground and spaceGround's surface query without coupling path baking to support-space internals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Terrain is supplied by authored height data or a callback, with no special surface id or slope built into the union.
 * @evidence contracts/common.md#meaningful-documentation States world-axis units, ignored waypoint elevation, finite-result admission and the existing support-space adapter.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased union imposes no lookup algorithm; the callback owner determines cost per terrain sample.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Height callbacks may be effectful, so their type promises no shared evaluation across path samples.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Captured terrain remains the callback creator's responsibility; this union acquires no storage or handle.
 */
export type AutoMoviePathGround = number | ((x: number, z: number) => number);
