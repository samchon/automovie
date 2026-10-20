import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { AutoMovieInteractionEventKind } from "./AutoMovieInteractionEventKind";
import { AutoMovieInteractionEventSource } from "./AutoMovieInteractionEventSource";

/**
 * One engine-visible interaction on a shot-local clock.
 *
 * `actor` is the initiator or affected performer when one is known, `target` is
 * the receiver or parent when one is known, and `object` is the prop or
 * projectile involved when the event is object-mediated. `reaction` names the
 * actor whose downstream motion was scheduled from this event, or `null` when
 * the event is only observational.
 *
 * `compileLaunch`, the `attachTo` handoff, and the collision, free-fall and
 * toppling detectors produce events; `sequenceEventTimeline` places them on the
 * output clock and `reviewVisualRead` measures `point` against the `target`
 * body to flag a contact that reads as a miss.
 *
 * @evidence contracts/common.md#principled-implementation Each producer writes the time it actually computed or scheduled (a solved landing, the authored handoff instants, a sampled detection), and `appendShotMetadataArtifact` checks a stored event against the closed kind and source unions, a finite time inside `[0, duration + 1e-9]` matching `performShot`'s own landing slack, non-blank participant ids, a finite point, and an integer action index.
 * @evidence contracts/common.md#clear-and-simple-design One flat record with four nullable participant roles serves every producer, so a consumer reads contacts, handoffs and falls through the same fields instead of one type per kind.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown participants stay null; structural admission checks nonblank participant strings, not their existence or causal truth. It refuses times outside the clock plus its 1e-9 end allowance without clamping. Event-id uniqueness is unchecked, and formatted times or delimiter-containing participant ids can collide.
 * @evidence contracts/common.md#meaningful-documentation States the role of each participant field and what `null` means for it, who produces and who consumes the record, the clock and range of `time`, the frame of `point`, and that id uniqueness is not gated.
 */
export interface IAutoMovieInteractionEvent {
  /**
   * Intended event identity within the shot. Producers embed kind, participants and formatted time, which can collide; the artifact gate checks nonblank spelling without uniqueness.
   */
  id: string;

  /** Semantic event category. */
  kind: AutoMovieInteractionEventKind;

  /** Producer that created the event. */
  source: AutoMovieInteractionEventSource;

  /** Finite shot-local seconds; artifact admission accepts `[0, duration + 1e-9]`. */
  time: number;

  /** Initiating or affected node id, or `null` when no single node is known. */
  actor: string | null;

  /** Receiving node or parent id, or `null` when no single node is known. */
  target: string | null;

  /** Projectile or carried object node id, or `null` when none is involved. */
  object: string | null;

  /**
   * World point of contact in metres, or `null` when the engine computed none;
   * review skips a contact whose point or target is missing.
   */
  point: IAutoMovieVector3 | null;

  /**
   * Integer index of the source action in the performance action list, or
   * `null` when the event has no single source action.
   */
  actionIndex: number | null;

  /** Node id whose reaction was scheduled from this event, or `null`. */
  reaction: string | null;
}
