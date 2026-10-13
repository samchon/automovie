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
 * @evidence contracts/common.md#principled-implementation Names the seven categories the engine's own producers write: `compileLaunch` for projectile contact, hit and knock-down fall, `handoffEvents` for the four coupling transitions, and the sampled detectors for body contact and unsupported falls.
 * @evidence contracts/common.md#clear-and-simple-design A flat union with no payload, because `IAutoMovieInteractionEvent` carries the participants, time and point that every category shares.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `appendShotMetadataArtifact` repeats the members in an untyped `Set`, while `performShot` orders same-time events through a `Record` keyed by this union, so only the second mirror is checked for completeness by the compiler.
 * @evidence contracts/common.md#meaningful-documentation States why the categories exist for downstream readers and which engine producer emits each one.
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
