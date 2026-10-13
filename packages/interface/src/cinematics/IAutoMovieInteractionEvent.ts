import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { AutoMovieInteractionEventKind } from "./AutoMovieInteractionEventKind";
import { AutoMovieInteractionEventSource } from "./AutoMovieInteractionEventSource";

/**
 * One engine-visible interaction on a shot-local clock.
 *
 * `actor` is the initiator or affected performer when one is known, `target` is
 * the receiver/parent when one is known, and `object` is the prop/projectile
 * involved when the event is object-mediated. `reaction` names the actor whose
 * downstream motion was scheduled from this event, or `null` when the event is
 * only observational.
 *
 * @author Samchon
 */
export interface IAutoMovieInteractionEvent {
  /**
   * Stable id within the shot. Producers make it unique; the artifact gate
   * checks only that it is non-blank.
   */
  id: string;

  /** Semantic event category. */
  kind: AutoMovieInteractionEventKind;

  /** Producer that created the event. */
  source: AutoMovieInteractionEventSource;

  /** Shot-local seconds, within `[0, duration]` of the shot. */
  time: number;

  /** Initiating or affected actor, when a single node is known. */
  actor: string | null;

  /** Receiving actor/parent, when a single node is known. */
  target: string | null;

  /** Projectile or carried object involved in the interaction. */
  object: string | null;

  /** World point of contact, when the engine computed one. */
  point: IAutoMovieVector3 | null;

  /** Source action index in the performance action list, when available. */
  actionIndex: number | null;

  /** Actor whose reaction was scheduled from this event, when any. */
  reaction: string | null;
}
