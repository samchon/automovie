/**
 * Where an interaction event came from. The value is intentionally about the
 * producer, not the visual result, so clients can decide how much trust or
 * extra solving they need downstream.
 *
 * - `collisionSolver`: a projectile contact solved by `compileLaunch`.
 * - `impactOutput`: a hit or knock-down fall derived from that solved contact.
 * - `scriptedCue`: an `attachTo` handoff placed at the authored action times.
 * - `sampledProximity`: a contact or fall found by sampling body geometry.
 *
 * @author Samchon
 */
export type AutoMovieInteractionEventSource =
  | "collisionSolver"
  | "scriptedCue"
  | "sampledProximity"
  | "impactOutput";
