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
 */
export const enum AutoMovieInteractionEventKind {
  /** Two bodies meet: a solved projectile contact or a sampled collision. */
  Contact = "contact",

  /** A landed projectile strikes the node it was aimed at. */
  Hit = "hit",

  /** An `attachTo` child is taken by its parent at the action start. */
  Grab = "grab",

  /** An `attachTo` child is let go by its parent at the action end. */
  Release = "release",

  /** The child starts riding the parent's bone at the action start. */
  Attach = "attach",

  /** The child stops riding the parent's bone at the action end. */
  Detach = "detach",

  /** A body loses support: an unbalancing hit, a free fall or a topple. */
  Fall = "fall",
}
