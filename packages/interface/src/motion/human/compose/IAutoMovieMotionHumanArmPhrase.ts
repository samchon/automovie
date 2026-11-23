import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanContactWindow } from "../law/IAutoMovieMotionHumanContactWindow";
import type { IAutoMovieMotionWeaponPath } from "../law/IAutoMovieMotionWeaponPath";
import type { IAutoMovieMotionHumanHand } from "../posture/IAutoMovieMotionHumanHand";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionClock } from "./IAutoMovieMotionClock";
import type { IAutoMovieMotionHumanArmTarget } from "./IAutoMovieMotionHumanArmTarget";
import type { IAutoMovieMotionHumanTiming } from "./IAutoMovieMotionHumanTiming";
import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";

/**
 * Arm primitives: a hand surface carried to a target, kept on it and taken
 * back.
 *
 * A target is a frame evaluated at each second on the posture the action has so
 * far (a region of the performer's own trunk, a partner's hand, a prop, a point
 * of the world), so the same row fits every body and follows whatever the
 * target rides on. The hand is an effector goal solved by the arm's inverse
 * kinematics: the goal carries the surface as its contact, so where the arm
 * cannot turn the hand as asked the resolver re-aims the wrist until the
 * surface stays on its point and the rotation gives way
 * (`IAutoMovieHumanLimbGoal.contact`).
 *
 * Between its origin and its target the surface moves on a straight path, or
 * one that bows to the arm's own side when the movement states a curvature, and
 * the hand turns by spherical interpolation, both by one weight, and the
 * fingers go from the relaxed cascade to the target's shape by the same weight
 * (Jeannerod 1984: the hand is shaped during its transport). The origin is held
 * in the performer's own floor frame, so it follows the body.
 */
export namespace IAutoMovieMotionHumanArmPhrase {
  /**
   * Primitive factories retain this borrowed record and its callbacks until the
   * returned primitive is released. Keep captured inputs stable; callback
   * exceptions propagate. Contact-window construction reads named clock
   * instants immediately and propagates an unknown-instant failure.
   *
   * What every arm phrase takes: the arm, the clock whose standard instants
   * (`AutoMovieMotionClock.PHRASE`) it moves on, and where the hand leaves from
   * and returns to.
   */
  export interface IPhrase {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** A clock with the standard instants of a phrase. */
    clock: IAutoMovieMotionClock;

    /** The arm. */
    side: AutoMovieHumanSide;

    /** Where the hand is before and after the phrase. */
    origin: IAutoMovieMotionHumanArmTarget.IOrigin;

    /**
     * What the hand bears on while it is on its place, when the place is solid;
     * absent for a place in the air, which gives no contact window.
     */
    contact?: Pick<IAutoMovieMotionHumanContactWindow, "kind" | "support">;

    /**
     * The manner's sizes: the extent scales a place in the air and a free-space
     * amplitude, and the curvature bows the hand's way out and back. A phrase
     * that states a contact keeps its place whatever the extent. Extent
     * defaults to 1 and curvature to 0 when absent.
     */
    manner?: Pick<IAutoMovieMotionManner.IModifiers, "extent" | "curvature">;
  }

  /**
   * An arm's joint angles in a swing: clinical degrees of the shoulder and the
   * elbow.
   */
  export interface ISwing {
    /** The upper arm's `[flexion, abduction, twist]`, degrees. */
    upper: readonly [number, number, number];

    /** The elbow's flexion, degrees. */
    elbow: number;
  }

  /** The phrase. */
  export type Phrase = (readonly ["visit", "stroke", "oscillate"])[number];

  /** A point offset in the performer's frame by shares of the arm's length. */
  export interface IOffset {
    /** Away from the midline on the acting side. */
    out: number;

    /** Upward. */
    up: number;

    /** Forward. */
    forward: number;
  }

  /** Parameters. */
  export interface IParams {
    /** The phrase. */
    phrase: IAutoMovieMotionHumanArmPhrase.Phrase;

    /**
     * Where the hand's surface goes: the visit's place, the stroke's end, the
     * oscillation's pose.
     */
    target: IAutoMovieMotionTarget;

    /**
     * The target's point moved in the performer's frame by shares of the arm's
     * length; none when absent.
     */
    offset?: IAutoMovieMotionHumanArmPhrase.IOffset;

    /**
     * A stroke's start, by the same shares from the target's point; the
     * target's point when absent.
     */
    from?: IAutoMovieMotionHumanArmPhrase.IOffset;

    /**
     * An oscillation's swing, by the same shares at the swing's ends; a tenth
     * of the arm out and in when absent.
     */
    swing?: IAutoMovieMotionHumanArmPhrase.IOffset;

    /**
     * The oscillation's cycles; 2 when absent (provisional: no measured count
     * read).
     */
    count?: number;

    /**
     * `true` when the target is written for the right hand, as a row writes it:
     * a self region of a side (`hipRight`) is read on the acting arm's own side
     * (`hipLeft` for the left hand, `handToFace.mirrored`), and a midline
     * region is its own mirror. The target as named when absent.
     */
    mirror?: boolean;

    /**
     * The hand, or both hands on one clock with their offsets mirrored (a clap,
     * palms rubbed together); the right when absent.
     */
    hand?: AutoMovieHumanSide | "both";

    /** The hand's surface brought to the target; the palm when absent. */
    surface?: IAutoMovieMotionHumanHand.Surface;

    /** The hand's shape; flat when absent. */
    shape?: IAutoMovieMotionHumanHand.Shape;

    /**
     * How the hand is turned; against the target's normal with the fingers up
     * when absent.
     */
    facing?: IAutoMovieMotionHumanHand.IFacing;

    /** A visit's hold on its place; a beat when absent. */
    hold?: IAutoMovieMotionHumanTiming.Pause;

    /** The manner; neutral when absent. */
    manner?: IAutoMovieMotionManner;

    /**
     * A prop the hand holds through the phrase and keeps after it (a hammer, a
     * spoon, a hat on its way to the head): the phrase takes the hand's grip on
     * it over its whole span, so the prop rides the hand with the offset it was
     * held by, and leaves it held. The hand must hold it at entry; none when
     * absent.
     */
    held?: string;

    /**
     * The held prop's point brought to the target instead of the hand's
     * surface, one of its affordance ids (a cup's `lip` to the mouth, a fork's
     * `face`); it needs `held`. The hand's surface when absent.
     */
    point?: string;
  }

  /**
   * A visit: the hand goes to a place, stays on it and comes back (a touch, an
   * offered hand, a hand laid on a table, a mimed grasp). It travels from
   * `start` to `stroke`, stays until `relax` and is back at `end`. Input props
   * of AutoMovieMotionHumanArmPhrase.visit. The phrase and the place's target.
   */
  export type IVisitProps = IAutoMovieMotionHumanArmPhrase.IPhrase & {
    /**
     * Borrowed target-frame callback retained by the primitive and read on
     * writes in action-relative seconds, including zero-weight writes. Its
     * exceptions propagate.
     */
    target: IAutoMovieMotionHumanArmTarget.Frame;
  };

  /**
   * A stroke: the hand is brought to a ready pose by `ready`, waits until
   * `strokeStart`, follows a path until `strokeEnd`, stays at the path's end
   * until `relax` and is back at `end` (a gesture, a guard, a drawn line).
   * Input props of AutoMovieMotionHumanArmPhrase.stroke. The phrase and the
   * path: the target at the stroke's progress, 0 at the ready pose and 1 at the
   * stroke's end.
   */
  export type IStrokeProps = IAutoMovieMotionHumanArmPhrase.IPhrase & {
    /**
     * Retained synchronous target callback in action-relative seconds. At
     * positive progress each write calls it both at that progress and at zero
     * with the same posture and seconds, regardless of contact or extent;
     * zero-weight writes may call it. Keep captured inputs stable; exceptions
     * propagate. It may optionally borrow same-body FK and genuine ROM metadata
     * as its fourth/fifth arguments only during that invocation.
     */
    path: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      progress: number,
      resolution?: Parameters<IAutoMovieMotionHumanArmTarget.Frame>[2],
      projection?: Parameters<IAutoMovieMotionHumanArmTarget.Frame>[3],
    ) => IAutoMovieMotionHumanArmTarget.ITarget;
  };

  /**
   * A strike: the hand is drawn to a chamber by `ready`, extends from
   * `strokeStart` and passes its target at `stroke` at speed. With a follow
   * phase it travels on past the target and slows to rest at `strokeEnd` (a
   * punch in the air); with none it is arrested at the target (a fist met by a
   * body). It stays until `relax` and is back at `end`. Input props of
   * AutoMovieMotionHumanArmPhrase.strike. The phrase, the chamber, the target
   * and the weapons the strike carries.
   */
  export type IStrikeProps = IAutoMovieMotionHumanArmPhrase.IPhrase & {
    /**
     * Retained callback giving the prepared arm target in action-relative
     * seconds; sampled when the primitive writes, including zero-weight writes.
     * Exceptions propagate.
     */
    chamber: IAutoMovieMotionHumanArmTarget.Frame;
    /**
     * Retained strike target callback in action-relative seconds; captured
     * inputs must stay stable and callback exceptions propagate.
     */
    target: IAutoMovieMotionHumanArmTarget.Frame;
    /**
     * Borrowed weapon records passed through to the primitive; omitted means no
     * weapon declarations. The readonly array is not copied into an independent
     * ownership boundary.
     */
    weapons?: readonly IAutoMovieMotionWeaponPath[];
  };

  /**
   * An oscillation: the hand is brought to a pose by `ready`, moves back and
   * forth about it from `strokeStart` to `strokeEnd` and is back at `end` (a
   * wave, a pump, a rub). Input props of
   * AutoMovieMotionHumanArmPhrase.oscillate. The phrase, the cycle count and
   * the pose: the target at the base swing multiplied by free-space extent, or
   * the unscaled base swing when in contact.
   */
  export type IOscillateProps = IAutoMovieMotionHumanArmPhrase.IPhrase & {
    /** Number of oscillation cycles across the clock's moving interval. */
    cycles: number;
    /**
     * Retained synchronous callback in action-relative seconds. Swing is the
     * base wave in [-1, 1] multiplied by free-space extent (default 1); with
     * contact the multiplier is 1. Extent above 1 therefore permits larger
     * swing arguments. Called during writes, including zero-weight writes;
     * captured inputs must remain stable and exceptions propagate.
     */
    pose: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      swing: number,
    ) => IAutoMovieMotionHumanArmTarget.ITarget;
  };
}
