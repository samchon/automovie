import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanManipulate,
  IAutoMovieMotionHumanManipulateFacing,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanTypeText,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { typeText } from "../everyday/typeText";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanSkill } from "../skill/HumanSkill";
import { manipulateFacing } from "./manipulateFacing";
import { manipulateFingering } from "./manipulateFingering";
import { manipulatePlan } from "./manipulatePlan";

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
 * @evidence contracts/development/implementation.md#efficient-algorithms The fingering is linear in contacts times the square of five digits; the plan prepares contact geometry once and selects each hand's active contact in logarithmic time.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Contact placement, hand shapes and activation windows are prepared once per plan (`manipulatePlan`).
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the resolved sequence and refusals; the namespace documents finger, site, timing and hand-goal conventions.
   * @evidence contracts/development/implementation.md#principled-implementation The existing sequence/fingering result is prepared by manipulatePlan with the same minimum-jerk wrist and digit goal equations.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Sequence owns contact admission and timing; manipulatePlan owns invariant preparation and active-contact evaluation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No press, authored order, key depth, time, event or hand goal is discarded or approximated.
   * @evidence contracts/development/implementation.md#efficient-algorithms Sequence keeps its Viterbi cost while fixed contact geometry/windows are prepared once and each displayed posture selects at most two contacts by binary search.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only fixed body, entry posture, sequence and skill interval share prepared geometry; each requested second evaluates its actual active press.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns O(N) prepared contacts and windows until release and stores no evaluated-time pose history.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanManipulate.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    return manipulatePlan(
      context.body,
      context.entry.posture,
      sequence(context),
      interval(context),
      REACH,
    );
  }

  /**
   * The presses of a sequence, with their sites, digits and times.
   *
   * @param context The action's context.
   * @returns The presses, in order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States resolved sites, fingers and action-relative press times; parameter declarations give the site/digit/time/depth meanings.
   * @evidence contracts/development/implementation.md#principled-implementation Prop affordances are placed at the original action-start frame, skill/random timing remains in original contact order and the same exact fingering owner chooses free digits.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Site resolution, time admission, clock draws and hand-wise fingering precede the returned press records.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing sites, empty sequences and partly supplied times retain their original refusals; no random draw or contact ordering changes.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each distinct named site is resolved once per sequence, plus the original linear timing and bounded-state fingering work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Repeated site names share only the same prop/start-frame point, normal and default travel; individual depths, hands and times stay contact-specific.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The local distinct-site map ends with this call; returned presses retain only the geometry and values they use.
   */
  export function sequence(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanManipulate.IParams>,
  ): IAutoMovieMotionHumanManipulate.IPress[] {
    const params: IAutoMovieMotionHumanManipulate.IParams = context.params;
    const read: IAutoMovieMotionHumanPropReader = context.prop(params.prop);
    const frame: IAutoMovieRigidTransform = read.frame(context.start);
    const side: AutoMovieHumanSide = params.hand === "left" ? "left" : "right";
    const sites: Map<
      string,
      {
        point: IAutoMovieVector3;
        normal: IAutoMovieVector3;
        travel: number | undefined;
      }
    > = new Map();

    // A text on a keyboard: each key's site from typing's layout and its
    // digit from the touch-typing chart.
    const given: IAutoMovieMotionHumanManipulate.IContactAt[] =
      params.text !== undefined
        ? typed(context, params.text)
        : (params.contacts ?? []).map(
            (
              c: IAutoMovieMotionHumanManipulate.IContact,
            ): IAutoMovieMotionHumanManipulate.IContactAt => {
              let placed:
                | {
                    point: IAutoMovieVector3;
                    normal: IAutoMovieVector3;
                    travel: number | undefined;
                  }
                | undefined = sites.get(c.site);
              if (placed === undefined) {
                const affordance: IAutoMovieAffordance = site(
                  read.prop,
                  c.site,
                );
                placed = {
                  point: Vector3.add(
                    frame.position,
                    Quaternion.rotateVector(
                      frame.rotation,
                      affordance.frame.translation,
                    ),
                  ),
                  normal: Quaternion.rotateVector(
                    Quaternion.multiply(
                      frame.rotation,
                      affordance.frame.rotation,
                    ),
                    { x: 0, y: 1, z: 0 },
                  ),
                  travel: affordance.travel,
                };
                sites.set(c.site, placed);
              }
              return {
                ...c,
                ...((c.digit ?? params.digit) === undefined
                  ? {}
                  : { digit: c.digit ?? params.digit }),
                point: placed.point,
                normal: placed.normal,
                depth: c.depth ?? placed.travel ?? typeText.TRAVEL,
              };
            },
          );
    if (given.length === 0)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "contacts",
        value: 0,
        reason: "a keyed sequence needs at least one contact",
        fix: "give contacts or a text",
      });
    const timed: number = given.filter(
      (c: IAutoMovieMotionHumanManipulate.IContactAt): boolean =>
        c.at !== undefined,
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
    const times: number[] = given.map(
      (c: IAutoMovieMotionHumanManipulate.IContactAt, i: number): number => {
        if (c.at !== undefined) return c.at;
        const now: number = clock;
        clock += HumanSkill.jitter(
          context.skill,
          context.random(`press${i}`),
          span,
        );
        return now;
      },
    );

    // The fingering, hand by hand.
    const sides: AutoMovieHumanSide[] = given.map(
      (c: IAutoMovieMotionHumanManipulate.IContactAt): AutoMovieHumanSide =>
        c.hand ?? side,
    );
    // Each hand keeps one rotation for the act, the one the plan gives it,
    // so the fingering reads every digit's tip where that rotation puts it.
    const placed: readonly IAutoMovieMotionHumanManipulateFacing.ISite[] =
      given.map(
        (
          c: IAutoMovieMotionHumanManipulate.IContactAt,
          i: number,
        ): IAutoMovieMotionHumanManipulateFacing.ISite => ({
          site: c.point,
          normal: c.normal,
          side: sides[i]!,
        }),
      );
    const digits: IAutoMovieMotionHumanManipulate.Finger[] =
      manipulateFingering(context.body, given, sides, {
        left: manipulateFacing(context.entry.posture, placed, "left"),
        right: manipulateFacing(context.entry.posture, placed, "right"),
      });
    return given.map(
      (
        c: IAutoMovieMotionHumanManipulate.IContactAt,
        i: number,
      ): IAutoMovieMotionHumanManipulate.IPress => ({
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
  Record<
    string,
    readonly [AutoMovieHumanSide, IAutoMovieMotionHumanManipulate.Finger]
  >
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
        AutoMovieHumanSide,
        IAutoMovieMotionHumanManipulate.Finger,
      ]): [
        string,
        readonly [AutoMovieHumanSide, IAutoMovieMotionHumanManipulate.Finger],
      ][] =>
        [...keys].map(
          (
            k: string,
          ): [
            string,
            readonly [
              AutoMovieHumanSide,
              IAutoMovieMotionHumanManipulate.Finger,
            ],
          ] => [k, [side, finger]],
        ),
    ),
  ),
  " ": ["right", "thumb"],
};

/** The interval between presses at the performer's skill: typing's, 0.5 s for a novice to 0.15 s for an elite (Salthouse 1986). */
const interval: (
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanManipulate.IParams>,
) => number = (
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanManipulate.IParams>,
): number => HumanSkill.quantity(context.skill, "speed", 0.5, 0.15);

/** The affordance a contact names, refused with the prop's sites when it has none by that id. */
const site: (
  prop: IAutoMovieMotionHumanProp,
  id: string,
) => IAutoMovieAffordance = (
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
  const board: IAutoMovieMotionHumanTypeText.IBoard = typeText.board(
    context,
    context.params.prop,
  );
  const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    board.yaw,
  );
  return [...text].map(
    (letter: string): IAutoMovieMotionHumanManipulate.IContactAt => {
      const key: { at: IAutoMovieVector3; side: AutoMovieHumanSide } =
        typeText.key(letter);

      // A named digit types every key with the hand on the key's side, as two-
      // finger typing does; otherwise the touch-typing chart assigns it.
      const digit: IAutoMovieMotionHumanManipulate.Finger | undefined =
        context.params.digit;
      const entry:
        | readonly [AutoMovieHumanSide, IAutoMovieMotionHumanManipulate.Finger]
        | undefined =
        digit !== undefined ? [key.side, digit] : CHART[letter.toLowerCase()];
      return {
        site: letter,
        ...(entry === undefined ? {} : { hand: entry[0], digit: entry[1] }),
        point: Vector3.add(board.at, Quaternion.rotateVector(turn, key.at)),
        normal: { x: 0, y: 1, z: 0 },
        depth: typeText.TRAVEL,
      };
    },
  );
};
