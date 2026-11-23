import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanRise } from "../everyday/IAutoMovieMotionHumanRise";
import type { IAutoMovieHumanLimbGoal } from "../posture/IAutoMovieHumanLimbGoal";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { AutoMovieMotionHumanChannel } from "./AutoMovieMotionHumanChannel";
import type { IAutoMovieMotionClock } from "./IAutoMovieMotionClock";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

/**
 * What the body behind the arm does so a hand reaches a region its arm alone
 * does not: the shoulder girdle lifted and a rise onto the toes for a region
 * above the shoulder, then a lean from the hips for what is still beyond the
 * arm.
 *
 * A person reaching up to a taller person's face, or to a shelf, lifts the
 * shoulder with the arm (the scapula turns up as the arm is raised, Inman,
 * Saunders and Abbott 1944) and then raises the heels, because leaning forward
 * lowers the shoulder and takes it away from a place above it. Each moves by
 * the least angle that brings the wrist within the kept share of the arm, and
 * no further than the shoulder needs to come level with the wrist or than its
 * limit (`GIRDLE`, `RAISE`). What remains is leaned into
 * (`AutoMovieMotionHumanLeanInto`), which refuses a region still out of reach
 * at its limit.
 */
export namespace IAutoMovieMotionHumanTouchStance {
  /** What a stance is solved from. */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The posture the body stands in before it rises or leans. */
    standing: IAutoMovieMotionHumanPosture;

    /**
     * Adds shoulder-girdle assistance to the input posture before the stance
     * lifts the working shoulder or raises the heels. The reach envelope
     * supplies `share` in [0, 1], and stance preparation uses full assistance
     * at 1. When absent, the stance uses the input posture directly.
     */
    girdles?: (
      posture: IAutoMovieMotionHumanPosture,
      share: number,
    ) => IAutoMovieMotionHumanPosture;

    /**
     * Both feet as they stand flat, when the body stands on them alone and may
     * rise onto its toes; no rise when absent.
     */
    feet?: IAutoMovieMotionHumanRise.Stance;

    /**
     * Whether the lean balances its hips
     * (`IAutoMovieMotionHumanLeanInto.IProps.balance`); absent or false, no
     * centre of mass is computed.
     */
    balance?: boolean;

    /**
     * The wrist uses one anchored target for all stroke progress and the lean
     * is keyed from the reached stance.
     */
    fixed?: boolean;

    /**
     * The current ankle frames when the base's adjustment step moves them
     * during the stroke.
     */
    placements?: (
      posture: IAutoMovieMotionHumanPosture,
    ) => IAutoMovieMotionHumanRise.Stance;

    /**
     * The heel rise's share when a step has to finish before its foot rolls
     * onto the toes.
     */
    heels?: (clock: IAutoMovieMotionClock, seconds: number) => number;

    /** The working hand. */
    side: AutoMovieHumanSide;

    /**
     * The share of the arm's length (upper arm and forearm) the wrist is kept
     * within.
     */
    share: number;

    /**
     * The wrist's goal on a posture at a progress of the stroke in [0, 1],
     * world metres.
     */
    wrist: (
      posture: IAutoMovieMotionHumanPosture,
      progress: number,
    ) => IAutoMovieVector3;

    /**
     * The working arm's goal on a posture at the stroke's start, laid on its
     * region, so the lean's balance weighs the arm where it reaches
     * (`IAutoMovieMotionHumanLeanInto.IProps.arm`); the arm as the posture
     * holds it when absent.
     */
    arm?: (posture: IAutoMovieMotionHumanPosture) => IAutoMovieHumanLimbGoal;

    /**
     * The refusal's message for a wrist left `beyond` metres out of reach at a
     * lean of `limit` degrees.
     */
    refuse: (beyond: number, limit: number) => string;

    /**
     * A world point, metres, the trunk turns toward before it rises and leans:
     * the middle of two hands' regions lying off to one side of the shoulders,
     * so both arms reach from the side they lie on; no turn asked when absent.
     */
    faces?: IAutoMovieVector3;
  }

  /** A solved stance. */
  export interface IStance {
    /**
     * The working shoulder girdle's elevation at the region, degrees; 0 when it
     * stays down.
     */
    girdle: number;

    /** The heels' raise at the region, degrees; 0 when the body does not rise. */
    raise: number;

    /** Whether the trunk leans from the hips at some progress of the stroke. */
    leaning: boolean;

    /**
     * The standing posture with the girdle lifted by `girdle` and risen by
     * `raise`, before any lean: the posture the stroke is entered from.
     */
    risen: IAutoMovieMotionHumanPosture;

    /**
     * The risen posture leaned as far as the stroke's start asks: the posture
     * the arm reaches its region from, which the arm's hint and reference are
     * solved on. Solved on `risen` alone, a region only the lean brings within
     * reach straightened the elbow, where the split of the arm's twist between
     * the upper arm and the forearm is left undetermined.
     */
    reached: IAutoMovieMotionHumanPosture;

    /**
     * The primitives that rise and lean by `ready`, follow the stroke and come
     * back from `relax`: none when the arm reaches as it stands.
     */
    primitives: (
      clock: IAutoMovieMotionClock,
      correction?: ICorrection,
    ) => IAutoMovieMotionHumanPrimitive[];
  }

  /**
   * An admitted balance correction written after the stance and before the
   * reaching arm.
   */
  export interface ICorrection {
    /** The body channel the correction changes. */
    channel: AutoMovieMotionHumanChannel;

    /** The event-windowed posture correction. */
    write: IAutoMovieMotionHumanPrimitive["write"];
  }
}
