/**
 * Ground elevation in metres for a walked path: a constant plane or a callback
 * from world XZ metres to world Y metres. followPathMotion ignores waypoint Y
 * and refuses non-finite results; spaceGround adapts a support-space query.
 */
export type AutoMoviePathGround = number | ((x: number, z: number) => number);
