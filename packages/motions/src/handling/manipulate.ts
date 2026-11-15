import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { typeText } from "../everyday/typeText";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanProp } from "../perform/IHumanProp";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { HumanSkill } from "../skill/HumanSkill";
import { manipulateFingering } from "./manipulateFingering";

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
 * tip, in a flat hand, stands over its site at the hover height, moving
 * between placements on minimum-jerk paths; the digit's own inverse
 * kinematics (`IHumanPosture.digits`) then takes the tip down by the key's
 * travel and up again. Times come from `at` when every contact gives it, or
 * from typing skill otherwise (the interval of `typeText`, Salthouse 1986),
 * each press taking the first 40 % of its interval to reach the key and the
 * rest to lift, as `typeText` does. The body holds the posture it is entered
 * in. Events `press1` to `pressN`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the sites, the fingering and its source status, the two goals of a press, the timing and the events.
 * @evidence contracts/development/design.md#principled-representation A law record over a prop's affordances and a list of contacts, with a pure plan.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the parameters and the plan; rows fix the layout.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the hand, the posture's digit goals, typing's layout and timing.
 * @evidence contracts/development/implementation.md#principled-implementation Arm placement by the pressing digit's flat-hand tip and the digit's own inverse kinematics for the press; fingering by an exact Viterbi path minimizing wrist travel.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Sites, times, fingering, placements, then each posture.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unknown site or key is refused with the alternatives; the fingering's cost is a measured distance, no weight.
 * @evidence contracts/development/implementation.md#efficient-algorithms The fingering is linear in contacts times the square of the five digits; each posture is constant work over the contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The plan is computed once per instance.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan's closures hold the instance's inputs only.
 */
export namespace manipulate {
  /** The law's name, as productions register it. */
  export const name: string = "manipulate";

  /** Cancel table: the act may stop between presses. */
  export const interrupts: IHumanActionLaw["interrupts"] = {};

  /** A digit of a hand. */
  export type Finger = (typeof FINGERS)[number];

  /** The digits of {@link Finger}, as data, thumb to little finger. */
  export const FINGERS = ["thumb", "index", "middle", "ring", "little"] as const;

  /** One contact of the sequence. */
  export interface IContact {
    /** The prop's affordance pressed. */
    site: string;

    /** The digit that presses it; the fingering chooses when absent. */
    digit?: Finger;

    /** The hand; the act's `side` when absent, the right when both hands play. */
    side?: HumanHand.Side;

    /** Seconds from the act's start to the press; every contact gives it or none does. */
    at?: number;

    /** How far the site gives under the press, metres; the affordance's `travel`, else typing's key travel. */
    depth?: number;
  }

  /** Parameters. */
  export interface IParams {
    /** The prop pressed. */
    prop: string;

    /** The contacts, in order; or none with a `text`. */
    contacts?: readonly IContact[];

    /** A text typed on a keyboard prop (`createKeyboard`'s `homeRow` and `keys`), instead of `contacts`. */
    text?: string;

    /** The hand when contacts do not name one, or both. */
    side?: HumanHand.Side | "both";

    /** The digit of every contact that names none, so the fingering does not choose: a thumb texting, a forefinger dialling. */
    digit?: Finger;
  }

  /** A press as planned. */
  export interface IPress {
    /** The pressing hand. */
    side: HumanHand.Side;

    /** The pressing digit. */
    digit: Finger;

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
   * Plan the sequence.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} On no contacts, an unknown site or key, or times given for some contacts and not others.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const hold: IHumanPosture = context.entry.posture;
    const presses: IPress[] = sequence(context);
    const rotation: Record<HumanHand.Side, IAutoMovieQuaternion> = {
      left: facing(hold, presses, "left"),
      right: facing(hold, presses, "right"),
    };

    // Where the wrist stands for a press: the pressing digit's flat-hand tip
    // over its site at the hover height.
    const wrist: (p: IPress) => IAutoMovieVector3 = (
      p: IPress,
    ): IAutoMovieVector3 =>
      HumanHand.place(
        body,
        p.side,
        `${p.digit}Tip` as HumanHand.Surface,
        Vector3.add(p.site, Vector3.scale(p.normal, typeText.HOVER)),
        rotation[p.side],
        "flat",
      ).point;
    const duration: number =
      presses[presses.length - 1]!.time + REACH * interval(context);
    const sides: HumanHand.Side[] = (["left", "right"] as const).filter(
      (side: HumanHand.Side): boolean =>
        presses.some((p: IPress): boolean => p.side === side),
    );

    const contacts: IHumanContactWindow[] = (["leftFoot", "rightFoot"] as const).map(
      (part: "leftFoot" | "rightFoot"): IHumanContactWindow => ({
        part,
        kind: "plant",
        from: 0,
        to: 1,
        support: { kind: "ground" },
      }),
    );
    return {
      duration,
      events: presses.map((p: IPress, i: number) => ({
        name: `press${i + 1}`,
        share: p.time / duration,
      })),
      contacts,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        let posture: IHumanPosture = { ...hold, joints: { ...hold.joints } };
        const digits: NonNullable<IHumanPosture["digits"]> = {};
        for (const side of sides) {
          posture.joints = { ...posture.joints, ...HumanHand.shape(side, "flat") };
          const mine: IPress[] = presses.filter((p: IPress): boolean => p.side === side);

          // The current press: the last whose approach has begun.
          const span: number = interval(context);
          let k: number = 0;
          for (let i: number = 0; i < mine.length; i++)
            if (t >= mine[i]!.time - REACH * span) k = i;
          const press: IPress = mine[k]!;
          const previous: IPress = mine[Math.max(0, k - 1)]!;
          const approach: number = minimumJerk(
            Math.min(1, Math.max(0, (t - (press.time - REACH * span)) / (REACH * span))),
          ).s;
          const point: IAutoMovieVector3 = Vector3.lerp(wrist(previous), wrist(press), approach);
          posture = {
            ...posture,
            limbs: {
              ...posture.limbs,
              [`${side}Arm`]: {
                point,
                rotation: rotation[side],
                bend: AutoMovieMotionHumanBend.hang(body, hold, side, 0.1),
              },
            },
          };

          // The digit comes down by the travel and lifts again.
          const down: number =
            t < press.time
              ? approach * approach
              : 1 - minimumJerk(Math.min(1, (t - press.time) / ((1 - REACH) * span))).s;
          const lift: number = typeText.HOVER - (typeText.HOVER + press.depth) * down;
          digits[`${side}${press.digit[0]!.toUpperCase()}${press.digit.slice(1)}` as IHumanPosture.Digit] = {
            point: Vector3.add(press.site, Vector3.scale(press.normal, lift)),
            normal: press.normal,
            surface: "tip",
          };
        }
        return { ...posture, digits };
      },
    };
  }

  /**
   * The presses of a sequence, with their sites, digits and times.
   *
   * @param context The action's context.
   * @returns The presses, in order.
   */
  export function sequence(context: IHumanActionContext<IParams>): IPress[] {
    const params: IParams = context.params;
    const read: IHumanActionContext.IProp = context.prop(params.prop);
    const frame: IHumanProp.IFrame = read.frame(context.start);
    const side: HumanHand.Side = params.side === "left" ? "left" : "right";

    // A text on a keyboard: each key's site from typing's layout and its
    // digit from the touch-typing chart.
    const given: IContactAt[] =
      params.text !== undefined
        ? typed(context, params.text)
        : (params.contacts ?? []).map((c: IContact): IContactAt => {
            const affordance: IAutoMovieAffordance = site(read.prop, c.site);
            return {
              ...c,
              ...(c.digit ?? params.digit) === undefined
                ? {}
                : { digit: c.digit ?? params.digit },
              point: Vector3.add(
                frame.position,
                Quaternion.rotateVector(frame.rotation, affordance.frame.translation),
              ),
              normal: Quaternion.rotateVector(
                Quaternion.multiply(frame.rotation, affordance.frame.rotation),
                { x: 0, y: 1, z: 0 },
              ),
              depth: c.depth ?? affordance.travel ?? typeText.TRAVEL,
            };
          });
    if (given.length === 0)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "contacts",
        value: 0,
        reason: "a keyed sequence needs at least one contact",
        fix: "give contacts or a text",
      });
    const timed: number = given.filter((c: IContactAt): boolean => c.at !== undefined).length;
    if (timed !== 0 && timed !== given.length)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "contacts.at",
        value: timed,
        reason: `${timed} of ${given.length} contacts give a time`,
        fix: "give every contact a time, or none",
      });

    // Times from skill: typing's interval with its variability.
    const span: number = interval(context);
    let clock: number = REACH * span;
    const times: number[] = given.map((c: IContactAt, i: number): number => {
      if (c.at !== undefined) return c.at;
      const now: number = clock;
      clock += HumanSkill.jitter(context.skill, context.random(`press${i}`), span);
      return now;
    });

    // The fingering, hand by hand.
    const sides: HumanHand.Side[] = given.map(
      (c: IContactAt): HumanHand.Side => c.side ?? side,
    );
    const digits: Finger[] = manipulateFingering(context.body, given, sides);
    return given.map((c: IContactAt, i: number): IPress => ({
      side: sides[i]!,
      digit: digits[i]!,
      site: c.point,
      normal: c.normal,
      time: times[i]!,
      depth: c.depth,
    }));
  }

  /** A contact with its site resolved into the world. */
  export interface IContactAt extends IContact {
    /** The site, world metres. */
    point: IAutoMovieVector3;

    /** The site's outward normal, world. */
    normal: IAutoMovieVector3;

    /** The press depth, metres. */
    depth: number;
  }
}

/** The share of a press's interval spent reaching the key, as `typeText` times it. */
const REACH: number = 0.4;

/** The touch-typing chart: each letter's finger on the standard home row (left hand on ASDF, right on JKL;), the space under the right thumb. */
const CHART: Readonly<Record<string, readonly [HumanHand.Side, manipulate.Finger]>> = {
  ...Object.fromEntries(
    (
      [
        ["qaz", "left", "little"],
        ["wsx", "left", "ring"],
        ["edc", "left", "middle"],
        ["rfvtgb", "left", "index"],
        ["yhnujm", "right", "index"],
        ["ik", "right", "middle"],
        ["ol", "right", "ring"],
        ["p", "right", "little"],
      ] as const
    ).flatMap(
      ([keys, side, finger]: readonly [
        string,
        HumanHand.Side,
        manipulate.Finger,
      ]): [string, readonly [HumanHand.Side, manipulate.Finger]][] =>
        [...keys].map(
          (k: string): [string, readonly [HumanHand.Side, manipulate.Finger]] => [
            k,
            [side, finger],
          ],
        ),
    ),
  ),
  " ": ["right", "thumb"],
};

/** The interval between presses at the performer's skill: typing's, 0.5 s for a novice to 0.15 s for an elite (Salthouse 1986). */
const interval: (
  context: IHumanActionContext<manipulate.IParams>,
) => number = (context: IHumanActionContext<manipulate.IParams>): number =>
  HumanSkill.quantity(context.skill, "speed", 0.5, 0.15);

/** The affordance a contact names, refused with the prop's sites when it has none by that id. */
const site: (prop: IHumanProp, id: string) => IAutoMovieAffordance = (
  prop: IHumanProp,
  id: string,
): IAutoMovieAffordance => {
  const affordances: readonly IAutoMovieAffordance[] = prop.affordances ?? [];
  const found: IAutoMovieAffordance | undefined = affordances.find(
    (a: IAutoMovieAffordance): boolean => a.id === id,
  );
  if (found === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "contacts.site",
      value: id,
      feasible: {
        kind: "alternatives",
        values: affordances.map((a: IAutoMovieAffordance): string => a.id),
      },
      reason: `${prop.subject} has no site ${id}`,
      fix: "press one of the prop's affordances",
    });
  return found;
};

/** A text's presses on a keyboard prop: typing's key layout, the chart's digits. */
const typed: (
  context: IHumanActionContext<manipulate.IParams>,
  text: string,
) => manipulate.IContactAt[] = (
  context: IHumanActionContext<manipulate.IParams>,
  text: string,
): manipulate.IContactAt[] => {
  const board: typeText.IBoard = typeText.board(context, context.params.prop);
  const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, board.yaw);
  return [...text].map((letter: string): manipulate.IContactAt => {
    const key: { at: IAutoMovieVector3; side: HumanHand.Side } =
      typeText.key(letter);

    // A named digit types every key with the hand on the key's side, as two-
    // finger typing does; otherwise the touch-typing chart assigns it.
    const digit: manipulate.Finger | undefined = context.params.digit;
    const entry: readonly [HumanHand.Side, manipulate.Finger] | undefined =
      digit !== undefined ? [key.side, digit] : CHART[letter.toLowerCase()];
    return {
      site: letter,
      ...(entry === undefined ? {} : { side: entry[0], digit: entry[1] }),
      point: Vector3.add(board.at, Quaternion.rotateVector(turn, key.at)),
      normal: { x: 0, y: 1, z: 0 },
      depth: typeText.TRAVEL,
    };
  });
};

/** The hand's rotation for the act: the fingers toward the sites across their normal, the palm against it. */
const facing: (
  hold: IHumanPosture,
  presses: readonly manipulate.IPress[],
  side: HumanHand.Side,
) => IAutoMovieQuaternion = (
  hold: IHumanPosture,
  presses: readonly manipulate.IPress[],
  side: HumanHand.Side,
): IAutoMovieQuaternion => {
  const mine: manipulate.IPress[] = presses.filter(
    (p: manipulate.IPress): boolean => p.side === side,
  );
  const first: manipulate.IPress = mine.length > 0 ? mine[0]! : presses[0]!;
  const toward: IAutoMovieVector3 = Vector3.subtract(first.site, hold.root);
  const along: IAutoMovieVector3 = Vector3.subtract(
    toward,
    Vector3.scale(first.normal, Vector3.dot(toward, first.normal)),
  );
  return HumanHand.rotation(side, {
    fingers: Vector3.length(along) > 1e-9 ? along : { x: 0, y: 0, z: 1 },
    palm: Vector3.scale(first.normal, -1),
  });
};
