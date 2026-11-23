/**
 * Where an interaction event came from.
 *
 * The value names the producer, not the visual result, so a client can decide
 * how much trust or extra solving it needs downstream:
 *
 * - `collisionSolver`: a projectile contact solved by `compileLaunch`.
 * - `impactOutput`: a hit or knock-down fall derived from that solved contact.
 * - `scriptedCue`: an `attachTo` handoff placed at the authored action times.
 * - `sampledProximity`: a contact or fall found by sampling body geometry in the
 *   collision, free-fall and toppling detectors.
 */
export type AutoMovieInteractionEventSource =
  | "collisionSolver"
  | "scriptedCue"
  | "sampledProximity"
  | "impactOutput";
