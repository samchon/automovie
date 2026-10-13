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
 * @evidence contracts/common.md#principled-implementation Tags the producer of each event: `compileLaunch` writes `collisionSolver` and `impactOutput`, `handoffEvents` writes `scriptedCue`, and `detectBodyCollision`, `detectFreeFall` and `detectSupportToppling` write `sampledProximity`.
 * @evidence contracts/common.md#clear-and-simple-design Kept separate from the event kind so one category such as `contact` can come from either a solved trajectory or a sampled proximity test without multiplying kind names.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No consumer in the repository branches on the source; only `appendShotMetadataArtifact` checks membership, through an untyped `Set` that must be kept in step with this union by hand.
 * @evidence contracts/common.md#meaningful-documentation Maps each value to its producer and states that the tag describes provenance rather than the visual result.
 * @author Samchon
 */
export type AutoMovieInteractionEventSource =
  | "collisionSolver"
  | "scriptedCue"
  | "sampledProximity"
  | "impactOutput";
