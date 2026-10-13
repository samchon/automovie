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
 * @evidence contracts/common.md#principled-implementation `performShot` orders events by time, then a fixed kind rank, then id code units, and its emitters build `id` from kind, participants and a time key, so identical inputs reproduce an identical event list.
 * @evidence contracts/common.md#clear-and-simple-design Nullable participant fields let one record express projectile hits, mount handoffs and sampled contacts without per-kind interfaces, and `reaction` links an event to the motion it scheduled.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The artifact gate checks `id` only for being non-blank, not unique, and `actionIndex` only for being an integer, not for naming a real action; the exported detectors number their own ids from `contact:0` and `fall:0`.
 * @evidence contracts/common.md#meaningful-documentation Documents shot-local seconds, the world frame of `point`, the null meaning of every participant, and that id uniqueness is a producer convention the artifact gate does not enforce.
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
