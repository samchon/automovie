/**
 * Where an interaction event came from.
 *
 * The value names the producer, not the visual result, so a client can decide
 * how much trust or extra solving it needs downstream:
 *
 * - `collisionSolver`: a projectile contact solved by `compileLaunch`.
 * - `impactOutput`: a hit or knock-down fall derived from that solved contact.
 * - `scriptedCue`: an `attachTo` handoff placed at the authored action times.
 * - `sampledProximity`: a contact or fall found by sampling body geometry in
 *   the collision, free-fall and toppling detectors.
 *
 * @evidence contracts/common.md#principled-implementation Models provenance as a closed string union whose four members are exactly the values `compileLaunch`, `handoffEvents` and the three sampling detectors write, and the shot artifact validator checks a stored source against the same four values.
 * @evidence contracts/common.md#clear-and-simple-design Provenance is kept separate from `AutoMovieInteractionEventKind`, so one kind can come from several producers and a consumer filters on either axis without parsing ids.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Each producer writes its own fixed source, so a sampled contact is never labelled as solved, and the union carries no catch-all value.
 * @evidence contracts/common.md#meaningful-documentation States that the value names the producer and why, and for every member which producer writes it and what event it describes.
 */
export type AutoMovieInteractionEventSource =
  | "collisionSolver"
  | "scriptedCue"
  | "sampledProximity"
  | "impactOutput";
