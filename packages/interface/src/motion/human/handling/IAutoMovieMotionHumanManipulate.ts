import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * A keyed contact sequence: digits of one hand or both pressing sites of a
 * prop one after another, timed by the caller or by skill. Typing, a piano's
 * keys, a guitar's frets, a phone's keypad and a dial are the same structure
 * and are rows of this law (`HumanManipulate`).
 *
 * The prop's sites are its affordances: each contact names one, whose
 * frame's translation is the site and whose `+Y` is the site's outward
 * normal, read in the prop's frame at the act's start. A contact names its
 * digit, or leaves it to the fingering: the digit chosen is the one whose
 * press keeps the hand still, by dynamic programming over the sequence of
 * each hand (the Viterbi path over digits, cost the distance the hand's
 * wrist must travel between consecutive presses), so a run of nearby keys
 * stays under one placement of the hand. This is the outcome Handrix
 * reports for its fretting hand, which begins on the middle finger to keep
 * the wrist still (ElKoura and Singh 2003, "Handrix: animating the human
 * hand", SCA 2003, pp. 110-119); its own cost terms (finger strength,
 * stretch) were not read at the source, so the wrist's travel alone is the
 * cost here, a first pass. A text with the touch-typing layout assigns every
 * letter's digit by the standard home-row chart instead.
 *
 * Each press is two goals. The arm carries the hand so the pressing digit's
 * tip, the digit straight and the others curled clear of the keys
 * (`manipulateShape`), stands over its site at the hover height, drawn back
 * by as much as its swing down to the key shortens its reach
 * (`manipulateReach`), moving
 * between placements on minimum-jerk paths; the digit's own inverse
 * kinematics (`IAutoMovieMotionHumanPosture.digits`) then takes the tip down by the key's
 * travel and up again. Times come from `at` when every contact gives it, or
 * from typing skill otherwise (the interval of `typeText`, Salthouse 1986:
 * 0.5 s a press for a novice, 0.15 s for an elite performer, in
 * proportion between, `manipulate`),
 * each press taking the first 40 % of its interval to reach the key and the
 * rest to lift, as `typeText` does. The body holds the posture it is entered
 * in. Events `press1` to `pressN`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation digit: The digit that presses it; the fingering chooses when absent. side: The hand; the act's `side` when absent, the right when both hands play. at: Seconds from the act's start to the press; every contact gives it or none does.
 * @evidence contracts/development/design.md#principled-representation digit: The digit that presses it; the fingering chooses when absent. side: The hand; the act's `side` when absent, the right when both hands play. at: Seconds from the act's start to the press; every contact gives it or none does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: handling/manipulate.ts (CHART, [keys, side, finger]); handling/manipulate.ts (CHART, return); handling/manipulateFingering.ts (manipulateFingering, return); handling/manipulate.ts (manipulate.plan, context); handling/manipulate.ts (manipulate.sequence, context); handling/manipulate.ts (interval, context).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanSide, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanManipulate {
  /**
   * A digit of a hand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A digit of a hand.
   * @evidence contracts/development/design.md#principled-representation Closed choices "thumb", "index", "middle", "ring", "little" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: handling/manipulate.ts (CHART, [keys, side, finger]); handling/manipulate.ts (CHART, return); handling/manipulateFingering.ts (manipulateFingering, return); handling/manipulate.ts (manipulate.FINGERS); handling/manipulate.ts (manipulate.sequence); handling/manipulate.ts (CHART).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in CHART.
   */
  export type Finger = (readonly [
    "thumb",
    "index",
    "middle",
    "ring",
    "little",
  ])[number];

  /**
   * One contact of the sequence.
   *
   * @evidence contracts/development/common.md#meaningful-documentation digit: The digit that presses it; the fingering chooses when absent. side: The hand; the act's `side` when absent, the right when both hands play. at: Seconds from the act's start to the press; every contact gives it or none does.
   * @evidence contracts/development/design.md#principled-representation digit: The digit that presses it; the fingering chooses when absent. side: The hand; the act's `side` when absent, the right when both hands play. at: Seconds from the act's start to the press; every contact gives it or none does.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: handling/manipulate.ts (manipulate.sequence.given, c).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanManipulate.Finger, AutoMovieHumanSide identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IContact {
    /** The prop's affordance pressed. */
    site: string;

    /** The digit that presses it; the fingering chooses when absent. */
    digit?: IAutoMovieMotionHumanManipulate.Finger;

    /** The hand; the act's `side` when absent, the right when both hands play. */
    side?: AutoMovieHumanSide;

    /** Seconds from the act's start to the press; every contact gives it or none does. */
    at?: number;

    /** How far the site gives under the press, metres; the affordance's `travel`, else typing's key travel. */
    depth?: number;
  }

  /**
   * Parameters.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation prop: The prop pressed. contacts: The contacts, in order; or none with a `text`. text: A text typed on a keyboard prop (`createKeyboard`'s `homeRow` and `keys`), instead of `contacts`.
   * @evidence contracts/development/design.md#principled-representation prop: The prop pressed. contacts: The contacts, in order; or none with a `text`. text: A text typed on a keyboard prop (`createKeyboard`'s `homeRow` and `keys`), instead of `contacts`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: handling/manipulate.ts (manipulate.plan, context); handling/manipulate.ts (manipulate.sequence, context); handling/manipulate.ts (interval, context); handling/manipulate.ts (typed, context); handling/manipulate.ts (manipulate.sequence); handling/manipulate.ts (interval).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanManipulate.IContact, AutoMovieHumanSide, IAutoMovieMotionHumanManipulate.Finger identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IParams {
    /** The prop pressed. */
    prop: string;

    /** The contacts, in order; or none with a `text`. */
    contacts?: readonly IAutoMovieMotionHumanManipulate.IContact[];

    /** A text typed on a keyboard prop (`createKeyboard`'s `homeRow` and `keys`), instead of `contacts`. */
    text?: string;

    /** The hand when contacts do not name one, or both. */
    side?: AutoMovieHumanSide | "both";

    /** The digit of every contact that names none, so the fingering does not choose: a thumb texting, a forefinger dialling. */
    digit?: IAutoMovieMotionHumanManipulate.Finger;
  }

  /**
   * A press as planned.
   *
   * @evidence contracts/development/common.md#meaningful-documentation site: The site, world metres. time: Seconds from the act's start to the press. depth: How far the site gives, metres.
   * @evidence contracts/development/design.md#principled-representation site: The site, world metres. time: Seconds from the act's start to the press. depth: How far the site gives, metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: handling/manipulate.ts (manipulate.plan.wrist, p); handling/manipulate.ts (manipulate.plan.sides, p); handling/manipulate.ts (manipulate.plan, p); handling/manipulate.ts (manipulate.plan.mine, p); handling/manipulate.ts (manipulate.sequence, return); handling/manipulate.ts (manipulate.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanSide, IAutoMovieMotionHumanManipulate.Finger, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IPress {
    /** The pressing hand. */
    side: AutoMovieHumanSide;

    /** The pressing digit. */
    digit: IAutoMovieMotionHumanManipulate.Finger;

    /** The site, world metres. */
    site: IAutoMovieVector3;

    /** The site's outward unit normal, world. */
    normal: IAutoMovieVector3;

    /** Seconds from the act's start to the press. */
    time: number;

    /** How far the site gives, metres. */
    depth: number;
  }

  /**
   * A contact with its site resolved into the world.
   *
   * @evidence contracts/development/common.md#meaningful-documentation point: The site, world metres. depth: The press depth, metres.
   * @evidence contracts/development/design.md#principled-representation point: The site, world metres. depth: The press depth, metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: handling/manipulate.ts (manipulate.sequence.given, return); handling/manipulate.ts (manipulate.sequence.timed, c); handling/manipulate.ts (manipulate.sequence.times, c); handling/manipulate.ts (manipulate.sequence.sides, c); handling/manipulate.ts (manipulate.sequence.placed, c); handling/manipulate.ts (manipulate.sequence, c).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IContactAt extends IAutoMovieMotionHumanManipulate.IContact {
    /** The site, world metres. */
    point: IAutoMovieVector3;

    /** The site's outward normal, world. */
    normal: IAutoMovieVector3;

    /** The press depth, metres. */
    depth: number;
  }
}
