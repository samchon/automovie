import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { AutoMovieHumanoidRegion } from "../skeleton/AutoMovieHumanoidRegion";
import type { AutoMovieInteractionEventKind } from "./AutoMovieInteractionEventKind";
import type { AutoMovieInteractionEventSource } from "./AutoMovieInteractionEventSource";

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
 */
export interface IAutoMovieInteractionEvent {
  /**
   * Intended event identity within the shot. Producers embed kind, participants
   * and formatted time, which can collide; the artifact gate does not check
   * uniqueness.
   */
  id: string;

  /** Semantic event category. */
  kind: AutoMovieInteractionEventKind;

  /** Producer that created the event. */
  source: AutoMovieInteractionEventSource;

  /**
   * Finite shot-local seconds; artifact admission accepts `[0, duration +
   * 1e-9]`.
   */
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

  /** The struck person's bone, when the target is a person; absent otherwise. */
  bone?: AutoMovieHumanoidBone;

  /**
   * The struck person's named region nearest the contact, when the target is a
   * person; absent otherwise.
   */
  region?: AutoMovieHumanoidRegion;

  /**
   * The striking object's world velocity at contact, metres per second; absent
   * when the producer computed none.
   */
  velocity?: IAutoMovieVector3;

  /**
   * The struck surface's outward unit normal at `point`, world frame; absent
   * when the producer computed none.
   */
  normal?: IAutoMovieVector3;

  /**
   * The striking object's mass in kilograms: a projectile's, or a limb's
   * effective striking mass; absent when the producer has none.
   */
  mass?: number;

  /**
   * The impulse delivered, world newton seconds, set only by a producer that
   * has no striking mass, such as a blast; a consumer uses it unchanged.
   */
  impulse?: IAutoMovieVector3;

  /**
   * What the striking object did at the contact, which decides the momentum it
   * delivers: `stick` stops in the struck body (a melee stop, an arrow in a
   * butt), `bounce` and `roll` leave its surface, `pass` goes through. Absent
   * when the producer decided none.
   */
  outcome?: "stick" | "bounce" | "roll" | "pass";

  /**
   * The striking object's world velocity just after the contact, metres per
   * second: zero for `stick`; with `velocity` and `mass` it gives the momentum
   * delivered, `mass (velocity - exit)`.
   */
  exit?: IAutoMovieVector3;
}
