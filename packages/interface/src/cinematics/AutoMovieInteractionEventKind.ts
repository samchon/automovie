/**
 * Interaction event categories the engine emits while assembling a shot.
 *
 * These are semantic contact points for downstream motion, review and render
 * systems: a renderer can read the same computed hit, fall and attach timing
 * the engine used instead of re-deriving it from raw clips. `compileLaunch`
 * emits `contact` for every landed projectile, `hit` when it was aimed at a
 * node, and `fall` when an `onHit` reaction unbalances that node; an `attachTo`
 * handoff emits `grab` and `attach` at its start and `detach` and `release` at
 * its end; the exported collision and support detectors emit `contact` and
 * `fall`.
 *
 * - "contact": Two bodies meet: a solved projectile contact or a sampled collision.
 * - "hit": A landed projectile strikes the node it was aimed at.
 * - "grab": An `attachTo` child is taken by its parent at the action start.
 * - "release": An `attachTo` child is let go by its parent at the action end.
 * - "attach": The child starts riding the parent's bone at the action start.
 * - "detach": The child stops riding the parent's bone at the action end.
 * - "fall": A body loses support: an unbalancing hit, a free fall or a topple.
 */
export type AutoMovieInteractionEventKind =
  | "contact"
  | "hit"
  | "grab"
  | "release"
  | "attach"
  | "detach"
  | "fall";
