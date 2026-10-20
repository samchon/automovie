/**
 * Interaction event categories the engine emits while assembling a shot.
 *
 * These are semantic contact points for downstream motion, review and render
 * systems: a renderer can read the same computed hit, fall and attach timing
 * the engine used instead of re-deriving it from raw clips. `compileLaunch`
 * emits `contact` for every landed projectile, `hit` when it was aimed at a
 * node, and `fall` when an `onHit` reaction unbalances that node; an
 * `attachTo` handoff emits `grab` and `attach` at its start and `detach` and
 * `release` at its end; the exported collision and support detectors emit
 * `contact` and `fall`.
 *
 * @evidence contracts/common.md#principled-implementation Models the categories as a closed string union whose members are exactly the values the engine producers write, and `performShot` orders events by time, then by a fixed per-kind rank, then by id, so ties have one deterministic order.
 * @evidence contracts/common.md#clear-and-simple-design A bare literal union names what happened while the separate `AutoMovieInteractionEventSource` names who produced it, so a contact from the solver and one from sampled geometry share a kind and differ by source.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Paired handoff kinds are emitted as separate events at the same instant rather than merged, so a consumer never infers `attach` from `grab`; no producer writes a kind outside this union.
 * @evidence contracts/common.md#meaningful-documentation States what the events are for and, for every kind, which producer emits it and when.
 */
export type AutoMovieInteractionEventKind =
  /** Two bodies meet: a solved projectile contact or a sampled collision. */
  | "contact"

  /** A landed projectile strikes the node it was aimed at. */
  | "hit"

  /** An `attachTo` child is taken by its parent at the action start. */
  | "grab"

  /** An `attachTo` child is let go by its parent at the action end. */
  | "release"

  /** The child starts riding the parent's bone at the action start. */
  | "attach"

  /** The child stops riding the parent's bone at the action end. */
  | "detach"

  /** A body loses support: an unbalancing hit, a free fall or a topple. */
  | "fall";
