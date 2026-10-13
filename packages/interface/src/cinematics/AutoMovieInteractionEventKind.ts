/**
 * Interaction event categories emitted by the engine while assembling a shot.
 *
 * These are semantic contact points for downstream motion, review, and render
 * systems: a renderer can inspect the same computed hit/fall/attach timing the
 * engine used instead of re-deriving it from raw clips. `compileLaunch` emits
 * `contact`, `hit` and `fall`; an `attachTo` handoff emits `grab` and `attach`
 * at its start and `detach` and `release` at its end; the exported collision
 * and support detectors emit `contact` and `fall`.
 *
 * @author Samchon
 */
export type AutoMovieInteractionEventKind =
  | "contact"
  | "hit"
  | "grab"
  | "release"
  | "attach"
  | "detach"
  | "fall";
