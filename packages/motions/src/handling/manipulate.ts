import type { IAutoMovieAffordance, IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanActionLaw, IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanHand, IAutoMovieMotionHumanManipulate, IAutoMovieMotionHumanManipulateFacing, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanProp, IAutoMovieMotionHumanTypeText, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";


import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { typeText } from "../everyday/typeText";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanSkill } from "../skill/HumanSkill";
import { manipulateFacing } from "./manipulateFacing";
import { manipulateFingering } from "./manipulateFingering";
import { manipulateReach } from "./manipulateReach";
import { manipulateShape } from "./manipulateShape";

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
 * kinematics (`HumanPosture.digits`) then takes the tip down by the key's
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
 * @evidence contracts/development/implementation.md#principled-implementation Arm placement by the pressing digit's tip in the pressing hand's shape and the digit's own inverse kinematics for the press; fingering by an exact Viterbi path minimizing wrist travel.
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
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {};

  /** The digits of {@link Finger}, as data, thumb to little finger. */
  export const FINGERS = [
    "thumb",
    "index",
    "middle",
    "ring",
    "little",
  ] as const satisfies readonly NonNullable<IAutoMovieMotionHumanManipulate.Finger>[];

  /**
   * Plan the sequence.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} On no contacts, an unknown site or key, or times given for some contacts and not others.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanManipulate.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const hold: IAutoMovieMotionHumanPosture = context.entry.posture;
    const presses: IAutoMovieMotionHumanManipulate.IPress[] = sequence(context);
    const rotation: Record<IAutoMovieMotionHumanHand.Side, IAutoMovieQuaternion> = {
      left: manipulateFacing(hold, presses, "left"),
      right: manipulateFacing(hold, presses, "right"),
    };

    // Where the wrist stands for a press (`manipulateReach`).
    const wrist: (p: IAutoMovieMotionHumanManipulate.IPress) => IAutoMovieVector3 = (
      p: IAutoMovieMotionHumanManipulate.IPress,
    ): IAutoMovieVector3 =>
      manipulateReach(
        body,
        p.side,
        p.digit,
        p.site,
        p.normal,
        p.depth,
        rotation[p.side],
      );
    const duration: number =
      presses[presses.length - 1]!.time + REACH * interval(context);
    const sides: IAutoMovieMotionHumanHand.Side[] = (["left", "right"] as const).filter(
      (side: IAutoMovieMotionHumanHand.Side): boolean =>
        presses.some((p: IAutoMovieMotionHumanManipulate.IPress): boolean => p.side === side),
    );

    const contacts: IAutoMovieMotionHumanContactWindow[] = (
      ["leftFoot", "rightFoot"] as const
    ).map(
      (part: "leftFoot" | "rightFoot"): IAutoMovieMotionHumanContactWindow => ({
        part,
        kind: "plant",
        from: 0,
        to: 1,
        support: { kind: "ground" },
      }),
    );
    return {
      duration,
      events: presses.map((p: IAutoMovieMotionHumanManipulate.IPress, i: number) => ({
        name: `press${i + 1}`,
        share: p.time / duration,
      })),
      contacts,
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        let posture: IAutoMovieMotionHumanPosture = { ...hold, joints: { ...hold.joints } };
        const digits: NonNullable<IAutoMovieMotionHumanPosture["digits"]> = {};
        for (const side of sides) {
          const mine: IAutoMovieMotionHumanManipulate.IPress[] = presses.filter(
            (p: IAutoMovieMotionHumanManipulate.IPress): boolean => p.side === side,
          );

          // The current press: the last whose approach has begun.
          const span: number = interval(context);
          let k: number = 0;
          for (let i: number = 0; i < mine.length; i++)
            if (t >= mine[i]!.time - REACH * span) k = i;
          const press: IAutoMovieMotionHumanManipulate.IPress = mine[k]!;

          // The pressing digit takes its position of rest and the others
          // curl clear of the keys, as typing's pointing hand does
          // (`typeText`).
          posture.joints = {
            ...posture.joints,
            ...manipulateShape(side, press.digit),
          };
          const previous: IAutoMovieMotionHumanManipulate.IPress = mine[Math.max(0, k - 1)]!;
          const approach: number = minimumJerk(
            Math.min(
              1,
              Math.max(0, (t - (press.time - REACH * span)) / (REACH * span)),
            ),
          ).s;
          const point: IAutoMovieVector3 = Vector3.lerp(
            wrist(previous),
            wrist(press),
            approach,
          );
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
              : 1 -
                minimumJerk(
                  Math.min(1, (t - press.time) / ((1 - REACH) * span)),
                ).s;
          const lift: number =
            typeText.HOVER - (typeText.HOVER + press.depth) * down;
          digits[
            `${side}${press.digit[0]!.toUpperCase()}${press.digit.slice(1)}` as IAutoMovieMotionHumanPosture.Digit
          ] = {
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
  export function sequence(context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanManipulate.IParams>): IAutoMovieMotionHumanManipulate.IPress[] {
    const params: IAutoMovieMotionHumanManipulate.IParams = context.params;
    const read: IAutoMovieMotionHumanActionContext.IProp = context.prop(params.prop);
    const frame: IAutoMovieMotionHumanProp.IFrame = read.frame(context.start);
    const side: IAutoMovieMotionHumanHand.Side = params.side === "left" ? "left" : "right";

    // A text on a keyboard: each key's site from typing's layout and its
    // digit from the touch-typing chart.
    const given: IAutoMovieMotionHumanManipulate.IContactAt[] =
      params.text !== undefined
        ? typed(context, params.text)
        : (params.contacts ?? []).map((c: IAutoMovieMotionHumanManipulate.IContact): IAutoMovieMotionHumanManipulate.IContactAt => {
            const affordance: IAutoMovieAffordance = site(read.prop, c.site);
            return {
              ...c,
              ...((c.digit ?? params.digit) === undefined
                ? {}
                : { digit: c.digit ?? params.digit }),
              point: Vector3.add(
                frame.position,
                Quaternion.rotateVector(
                  frame.rotation,
                  affordance.frame.translation,
                ),
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
    const timed: number = given.filter(
      (c: IAutoMovieMotionHumanManipulate.IContactAt): boolean => c.at !== undefined,
    ).length;
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
    const times: number[] = given.map((c: IAutoMovieMotionHumanManipulate.IContactAt, i: number): number => {
      if (c.at !== undefined) return c.at;
      const now: number = clock;
      clock += HumanSkill.jitter(
        context.skill,
        context.random(`press${i}`),
        span,
      );
      return now;
    });

    // The fingering, hand by hand.
    const sides: IAutoMovieMotionHumanHand.Side[] = given.map(
      (c: IAutoMovieMotionHumanManipulate.IContactAt): IAutoMovieMotionHumanHand.Side => c.side ?? side,
    );
    // Each hand keeps one rotation for the act, the one the plan gives it,
    // so the fingering reads every digit's tip where that rotation puts it.
    const placed: readonly IAutoMovieMotionHumanManipulateFacing.ISite[] = given.map(
      (c: IAutoMovieMotionHumanManipulate.IContactAt, i: number): IAutoMovieMotionHumanManipulateFacing.ISite => ({
        site: c.point,
        normal: c.normal,
        side: sides[i]!,
      }),
    );
    const digits: IAutoMovieMotionHumanManipulate.Finger[] = manipulateFingering(context.body, given, sides, {
      left: manipulateFacing(context.entry.posture, placed, "left"),
      right: manipulateFacing(context.entry.posture, placed, "right"),
    });
    return given.map(
      (c: IAutoMovieMotionHumanManipulate.IContactAt, i: number): IAutoMovieMotionHumanManipulate.IPress => ({
        side: sides[i]!,
        digit: digits[i]!,
        site: c.point,
        normal: c.normal,
        time: times[i]!,
        depth: c.depth,
      }),
    );
  }
}

/** The share of a press's interval spent reaching the key, as `typeText` times it. */
const REACH: number = 0.4;

/** The touch-typing chart: each letter's finger on the standard home row (left hand on ASDF, right on JKL;), the space under the right thumb. */
const CHART: Readonly<
  Record<string, readonly [IAutoMovieMotionHumanHand.Side, IAutoMovieMotionHumanManipulate.Finger]>
> = {
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
        IAutoMovieMotionHumanHand.Side,
        IAutoMovieMotionHumanManipulate.Finger,
      ]): [string, readonly [IAutoMovieMotionHumanHand.Side, IAutoMovieMotionHumanManipulate.Finger]][] =>
        [...keys].map(
          (
            k: string,
          ): [string, readonly [IAutoMovieMotionHumanHand.Side, IAutoMovieMotionHumanManipulate.Finger]] => [
            k,
            [side, finger],
          ],
        ),
    ),
  ),
  " ": ["right", "thumb"],
};

/** The interval between presses at the performer's skill: typing's, 0.5 s for a novice to 0.15 s for an elite (Salthouse 1986). */
const interval: (context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanManipulate.IParams>) => number = (
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanManipulate.IParams>,
): number => HumanSkill.quantity(context.skill, "speed", 0.5, 0.15);

/** The affordance a contact names, refused with the prop's sites when it has none by that id. */
const site: (prop: IAutoMovieMotionHumanProp, id: string) => IAutoMovieAffordance = (
  prop: IAutoMovieMotionHumanProp,
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
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanManipulate.IParams>,
  text: string,
) => IAutoMovieMotionHumanManipulate.IContactAt[] = (
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanManipulate.IParams>,
  text: string,
): IAutoMovieMotionHumanManipulate.IContactAt[] => {
  const board: IAutoMovieMotionHumanTypeText.IBoard = typeText.board(context, context.params.prop);
  const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    board.yaw,
  );
  return [...text].map((letter: string): IAutoMovieMotionHumanManipulate.IContactAt => {
    const key: { at: IAutoMovieVector3; side: IAutoMovieMotionHumanHand.Side } =
      typeText.key(letter);

    // A named digit types every key with the hand on the key's side, as two-
    // finger typing does; otherwise the touch-typing chart assigns it.
    const digit: IAutoMovieMotionHumanManipulate.Finger | undefined = context.params.digit;
    const entry: readonly [IAutoMovieMotionHumanHand.Side, IAutoMovieMotionHumanManipulate.Finger] | undefined =
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
