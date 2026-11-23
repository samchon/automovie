import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMoviePose } from "../../../pose/IAutoMoviePose";
import type { IAutoMoviePoseResolution } from "../../../pose/IAutoMoviePoseResolution";
import type { IAutoMovieMotionHumanContactWindow } from "../law/IAutoMovieMotionHumanContactWindow";
import type { IAutoMovieMotionPropHold } from "../law/IAutoMovieMotionPropHold";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";

/**
 * The load a workout is done with: a prop the performer already holds (a
 * barbell, a dumbbell, a kettlebell taken by `pickUp`), carried through the
 * exercise's keys instead of being refused.
 *
 * The hand that holds keeps its grip: the plan declares the grip and leaves the
 * hold as it found it, so the prop rides that hand. A prop held in one hand
 * asks no more. A prop with a second handle (a bar) is laid level: the holding
 * hand stays where the key's arm puts it and is turned so the line to the other
 * handle runs to the performer's other side with the knuckles continuing the
 * forearm, and the other hand is laid on that handle by the arm's solve, as a
 * long gun's support hand is.
 *
 * A lift whose kind says so (`WorkoutKind.midfoot`) carries the bar's middle
 * over the middle of the feet, so the bar of a deadlift or a press travels in a
 * vertical line over it. The rule is provisional: it is the coaching rule of
 * the Starting Strength method, whose own pages refused this session's reading,
 * and the one measurement read is narrower. Hancock, Wyatt and Kilgore,
 * "Variation in Barbell Position Relative to Shoulder and Foot Anatomical
 * Landmarks Alters Movement Efficiency", International Journal of Exercise
 * Science 5(3):183-195, 2012 (https://digitalcommons.wku.edu/ijes/vol5/iss3/1),
 * abstract: six weightlifters' deadlifts started with the bar over the
 * navicular (the mid-foot) moved it 37.5 +/- 13.7 mm horizontally backward,
 * against 66.7 +/- 12.9 mm when started over the metatarsophalangeal joint; a
 * vertical path is the limit that start approaches, and no source was read for
 * the press. The holding hand is swung about its shoulder at the arm's own
 * reach, forward or back and to either side, by what the key's arms leave the
 * bar's middle off that line, so the bar hangs centred between the hands and
 * each handle is as far out of its own shoulder; the mid-foot is the middle
 * between the heel and the toe of each foot the entry stands on.
 *
 * First pass: the load weighs nothing in the motion (no lean, no slower tempo,
 * no bar path round the knees); a bar is kept level across the body whatever
 * the key, so a one-sided or turned carry is not written; the holding hand's
 * turn about the bar is the straight wrist's, whatever the lift (no hook or
 * mixed grip).
 */
export namespace IAutoMovieMotionHumanWorkoutLoad {
  /** The load's parameters. */
  export interface IParams {
    /** The held prop's subject id. */
    prop: string;

    /** The hand that holds it; `right` when absent. */
    hand?: AutoMovieHumanSide;

    /**
     * The prop's affordance the other hand takes (a bar's second handle); one
     * hand holds when absent.
     */
    other?: string;

    /**
     * The prop's affordance the holding hand took, which with `other` gives the
     * bar's own line; the line from the hand's grip to `other` when absent,
     * which leaves a bar a few degrees out of level by the palm's depth.
     */
    handle?: string;
  }

  /** What a load gives the workout's plan. */
  export interface ILoad {
    /**
     * The posture with its hands on the load.
     *
     * @param posture The posture the exercise's key gives.
     * @param resolution Optional FK source borrowed from this same synchronous
     *   write.
     * @param projection Optional genuine same-body ROM metadata from that
     *   write.
     * @returns The same posture with the holding arms' goals.
     */
    apply(
      posture: IAutoMovieMotionHumanPosture,
      resolution?: IAutoMoviePoseResolution.ISource,
      projection?: (pose: IAutoMoviePose) => IAutoMoviePose,
    ): IAutoMovieMotionHumanPosture;

    /**
     * Check the support grip in the resolved posture of a two-handed phase. The
     * load owner supplies the check only for a two-handed prop.
     *
     * @param posture The loaded posture before transition offsets.
     * @throws {HumanRefusal} When either arm cannot keep the support grip in
     *   its measured frame.
     */
    admit?(posture: IAutoMovieMotionHumanPosture): void;

    /** The grip contacts, including the support hand when specified. */
    contacts: IAutoMovieMotionHumanContactWindow[];

    /** The hold the action leaves as it found it. */
    holds: IAutoMovieMotionPropHold[];

    /** The hands the load drives. */
    hands: AutoMovieHumanSide[];
  }
}
