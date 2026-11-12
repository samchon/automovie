import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLeanInto } from "../compose/AutoMovieMotionHumanLeanInto";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionHumanTouch } from "../compose/AutoMovieMotionHumanTouch";
import { AutoMovieMotionHumanTouchEffector } from "../compose/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchForm } from "../compose/AutoMovieMotionHumanTouchForm";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanFrame } from "../posture/HumanFrame";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * A touch while standing: one hand, or both, laid on a region of a partner
 * or of the performer's own body and moved on it by a kind of social touch
 * (Jung et al. 2017): a tap, a pat, a stroke, a rub, a press, a squeeze, a
 * hold or a scratch. It is the one law of the affectionate and social touch
 * family (#3284: a pat on the head, a tap on the shoulder, a hand on the
 * arm) and of the self-directed family (#3285: a belly pat, a nape rub, a
 * forearm scratch, a self hug, hands over the ears), each item a row of
 * `(effector, region, kind, timing)`.
 *
 * The hand reaches the region in the free-space transport time of the
 * distance (`AutoMovieMotionHumanTiming.transport`), repeats the kind's
 * stroke `count` times (`AutoMovieMotionHumanTouchForm.FORMS`), dwells for the
 * hold and goes back in the reach's time; the manner's tempo scales every
 * span and its extent the lift and the travel. The feet stay planted and the
 * body keeps the entry posture. A region of the performer's limbs is read on
 * the entry pose, so it must ride a limb the touch does not move, except a
 * region on the other arm: a person scratching or patting their own forearm
 * first brings it up, so that arm is carried on the same envelope to its
 * forearm held across the front of the waist, palm down, and the region is
 * read on the arm held there (`present`). A region beyond the standing arm
 * (a thigh slapped while standing) is leaned into as far as the hand needs
 * (`AutoMovieMotionHumanLeanInto`), a leg's region then read on the legs as
 * the lean leaves them; one still out of reach at the lean's limit is refused.
 *
 * Events: the phrase instants (`ready` on the region, `strokeStart` to
 * `strokeEnd` the repetitions, `relax` leaving). A touch may be cut before
 * it arrives or from `relax` on, into standing, a walk, a gesture or another
 * touch, the declined handshake's rule.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the families it serves, the timing, the source of the kinds, what stays still and the events and cuts.
 * @evidence contracts/development/design.md#principled-representation A law record composed of the touch primitive per hand over a held base.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts One law for every touch row; no row is a law of its own.
 */
export namespace touch {
  /** The action's name. */
  export const name: HumanActionName = "touch";

  /** Cancel table. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    ...AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      gesture: ["fromRelax", "smooth"],
      touch: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
      flinch: ["anytime", "reflex"],
    }),
  };

  /** Which part of the hand touches. */
  export type With = "palm" | "fingertips" | "handBack" | "fist";

  /** Each part's effector. */
  export const EFFECTORS: Readonly<
    Record<With, AutoMovieMotionHumanTouchEffector.IEffector>
  > = {
    palm: { surface: "palm", shape: "flat" },
    fingertips: { surface: "indexTip", shape: "flat" },
    handBack: { surface: "handBack", shape: "relaxed" },
    fist: { surface: "fist", shape: "fist" },
  };

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The region as the shared target union, the kind and the effector as closed unions, timing as counts and seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the target union and the manner.
   */
  export interface IParams {
    /** The region touched: a partner's (`person`) or the performer's own (`self`). */
    target: AutoMovieMotionTarget;

    /** The kind; `pat` when absent. */
    kind?: AutoMovieMotionHumanTouchForm.Kind;

    /** The part of the hand; the palm when absent. */
    with?: With;

    /** The hand; `right` when absent. */
    side?: HumanHand.Side;

    /** The other hand's region, touched the same way at the same time; one hand when absent. */
    other?: AutoMovieMotionTarget;

    /** Repetitions; 3 for a tap, a pat, a rub or a scratch and 1 otherwise when absent. */
    count?: number;

    /** Seconds the hand stays after the repetitions; 0.4, or 1.2 for a press, a squeeze or a hold, when absent. */
    hold?: number;

    /** The travel's direction on the region; `up` when absent. */
    tangent?: AutoMovieMotionHumanTouchForm.Tangent;

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /** The share of the arm's length (upper arm and forearm) the wrist is kept within before the trunk leans in, so the elbow never locks straight on a region (provisional, as `operate.REACH`). */
  export const REACH: number = 0.97;

  /**
   * Plan a touch.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the count is not a positive whole number or the hold is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals; the law's doc gives the timing and the sources.
   * @evidence contracts/development/implementation.md#principled-implementation A phrase clock from the free-space transport of the farther hand, the kind's repetitions and the hold, with one touch stroke per hand over a held standing base.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Defaults, the reach, the clock, one stroke per hand, the composition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Defaults are named per kind; a negative hold throws; no region or body is special-cased.
   * @evidence contracts/development/implementation.md#efficient-algorithms One entry resolve and one elbow solve per hand at plan time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to the touch stroke, the timing owner and the manner.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the entry bones and the clock.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body = context.body;
    const kind: AutoMovieMotionHumanTouchForm.Kind = p.kind ?? "pat";
    const still: boolean =
      kind === "press" || kind === "squeeze" || kind === "hold";
    const count: number = p.count ?? (kind === "stroke" || still ? 1 : 3);
    const hold: number = p.hold ?? (still ? 1.2 : 0.4);
    if (!(hold >= 0)) throw new Error("A touch's hold is not negative");
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);
    const effector: AutoMovieMotionHumanTouchEffector.IEffector =
      EFFECTORS[p.with ?? "palm"];
    const tangent: AutoMovieMotionHumanTouchForm.Tangent = p.tangent ?? "up";
    const entry: IHumanPosture = context.entry.posture;
    const first: HumanHand.Side = p.side ?? "right";
    const shown: IPresented | null =
      p.other === undefined ? present(context, first, p.target) : null;
    const bones = shown?.bones ?? poseBones(body, context.entry.pose);
    const hands: [HumanHand.Side, AutoMovieMotionTarget][] = [
      [first, p.target],
      ...(p.other === undefined
        ? []
        : [
            [first === "right" ? "left" : "right", p.other] as [
              HumanHand.Side,
              AutoMovieMotionTarget,
            ],
          ]),
    ];
    // A leg's region moves with the hips once the trunk leans, so with `legs`
    // it is read on the legs the posture so far places; otherwise on the
    // entry's bones.
    const placed =
      (target: AutoMovieMotionTarget, legs: boolean) =>
      (posture: IHumanPosture, seconds: number) =>
        AutoMovieMotionHumanTouch.region(
          context,
          target,
          context.start + seconds,
          posture,
          legs && onLeg(body, target)
            ? poseBones(
                body,
                resolveHumanPosture(body, {
                  ...posture,
                  limbs: {
                    ...(posture.limbs.leftLeg === undefined
                      ? {}
                      : { leftLeg: posture.limbs.leftLeg }),
                    ...(posture.limbs.rightLeg === undefined
                      ? {}
                      : { rightLeg: posture.limbs.rightLeg }),
                  },
                }),
              )
            : bones,
        );

    // The lean into a region beyond the standing arm, measured to the first
    // hand's wrist laid on its region.
    const lean: AutoMovieMotionHumanLeanInto.ILean =
      AutoMovieMotionHumanLeanInto.solve({
        body,
        standing: entry,
        side: first,
        share: REACH,
        wrist: (posture: IHumanPosture): IAutoMovieVector3 =>
          AutoMovieMotionHumanTouch.rest(
            body,
            posture,
            first,
            effector,
            placed(p.target, true)(posture, 0),
            tangent,
            AutoMovieMotionHumanBend.hang(body, posture, first),
            "arm",
          ).point,
        refuse: (beyond: number, limit: number): string =>
          `The touched region is ${(beyond * 1000).toFixed(0)} mm beyond the ${first} arm at a lean of ${limit} degrees`,
      });
    // Leaning when the region at either end of the strokes or between them is
    // beyond the kept share at the entry.
    const leaning: boolean =
      lean.pitch(entry, 0) > 0 ||
      lean.pitch(entry, 0.5) > 0 ||
      lean.pitch(entry, 1) > 0;
    const region = (target: AutoMovieMotionTarget) => placed(target, leaning);
    // The reach's length: the farther hand's distance to its region at the entry.
    let far: number = 0;
    for (const [side, target] of hands) {
      const at: IAutoMovieVector3 = region(target)(entry, 0).point;
      const from: IAutoMovieVector3 = AutoMovieMotionHumanTouchEffector.point(
        body,
        bones,
        side,
        effector,
      );
      far = Math.max(
        far,
        Math.hypot(at.x - from.x, at.y - from.y, at.z - from.z),
      );
    }
    const reach: number = AutoMovieMotionHumanTiming.transport(far);
    const repetition: number = AutoMovieMotionHumanTouchForm.period(
      body,
      kind,
      AutoMovieMotionHumanTiming.seconds(
        AutoMovieMotionHumanTouchForm.FORMS[kind].period,
      ),
    );
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: reach,
        attack: count * repetition,
        hold,
        retract: reach,
      }),
      modifiers,
    );

    const primitives: IAutoMovieMotionHumanPrimitive[] = [];
    if (leaning) primitives.push(lean.primitive(clock));
    if (shown !== null)
      primitives.push(
        AutoMovieMotionHumanArm.carried({
          body,
          side: shown.side,
          from: 0,
          to: clock.duration,
          rest: AutoMovieMotionHumanArm.angles(context.entry.pose, shown.side),
          goal: (): IHumanPosture.IGoal => shown.goal,
          weight: (seconds: number): number =>
            clock.envelope(["start", "ready"], ["relax", "end"], seconds),
        }),
      );
    for (const [side, target] of hands) {
      const support: IHumanContactWindow.Support | undefined =
        target.kind === "person"
          ? { kind: "person", subject: target.subject, region: target.region }
          : target.kind === "self"
            ? {
                kind: "person",
                subject: context.subject,
                region: target.region,
              }
            : undefined;
      const bend: IAutoMovieVector3 = AutoMovieMotionHumanTouch.bend(
        body,
        entry,
        side,
        effector,
        region(target)(entry, 0),
        tangent,
        "arm",
      );
      primitives.push(
        ...AutoMovieMotionHumanTouch.touch({
          body,
          clock,
          side,
          rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
          effector,
          region: region(target),
          kind,
          count,
          tangent,
          extent: modifiers.extent,
          bend,
          reference: AutoMovieMotionHumanTouch.laid(
            body,
            entry,
            side,
            effector,
            region(target)(entry, 0),
            tangent,
            bend,
            "arm",
          ),
          lay: "arm",
          entry,
          ...(support === undefined ? {} : { contact: support }),
          ...(target.kind === "person"
            ? {
                others: (_: IHumanPosture, seconds: number) => {
                  const partner = context.performer(target.subject);
                  return HumanColliders.placed(
                    partner.body,
                    partner.bones(context.start + seconds),
                  );
                },
              }
            : {}),
        }),
      );
    }
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(
        clock.duration,
        entry,
        AutoMovieMotionHumanBase.plants(),
      ),
      clock,
      primitives,
      contact: "ready",
    });
  }
}

/** An arm brought up to be touched. */
interface IPresented {
  /** The arm. */
  side: HumanHand.Side;

  /** Its goal, world, on the entry posture. */
  goal: IHumanPosture.IGoal;

  /** The body's bones with that arm at its goal. */
  bones: ReturnType<typeof poseBones>;
}

/**
 * The other arm brought up for a hand to touch a region on it: its forearm
 * held across the front of the waist, the wrist on the body's midline half
 * way from the hips to the shoulders and a forearm's length ahead of the
 * hips, the palm down and the fingers toward the touching hand, the elbow on
 * the hanging arm's side. Null when the region does not ride the other arm.
 */
function present(
  context: IHumanActionContext<touch.IParams>,
  side: HumanHand.Side,
  target: AutoMovieMotionTarget,
): IPresented | null {
  if (target.kind !== "self") return null;
  const body = context.body;
  const other: HumanHand.Side = side === "right" ? "left" : "right";
  const bone = body.surfaces.regions[target.region].bone;
  if (
    bone !== `${other}UpperArm` &&
    bone !== `${other}LowerArm` &&
    bone !== `${other}Hand`
  )
    return null;
  const entry: IHumanPosture = context.entry.posture;
  const frame: HumanFrame.IFrame = { origin: entry.root, yaw: entry.yaw };
  const hips: IAutoMovieVector3 = body.rest.get("hips")!;
  const shoulder: IAutoMovieVector3 = body.rest.get(`${other}UpperArm`)!;
  const at: IAutoMovieVector3 = HumanFrame.point(frame, {
    x: 0,
    y: (hips.y + shoulder.y) / 2,
    z: hips.z + body.measure.forearm,
  });
  // The fingers point toward the touching hand's side: world +X is the
  // body's left at yaw 0.
  const across: IAutoMovieVector3 = Quaternion.rotateVector(
    HumanFrame.turn(entry.yaw),
    { x: side === "left" ? 1 : -1, y: 0, z: 0 },
  );
  const goal: IHumanPosture.IGoal = AutoMovieMotionHumanTouchEffector.goal(
    body,
    other,
    touch.EFFECTORS.palm,
    at,
    { x: 0, y: 1, z: 0 },
    across,
    AutoMovieMotionHumanBend.arm(body, entry, other, "hang"),
  );
  return {
    side: other,
    goal,
    bones: poseBones(
      body,
      resolveHumanPosture(body, {
        ...entry,
        limbs: { ...entry.limbs, [`${other}Arm`]: goal },
      }),
    ),
  };
}

/** Whether a self region rides a leg, which a lean moves with the hips. */
function onLeg(
  body: IHumanActionContext["body"],
  target: AutoMovieMotionTarget,
): boolean {
  if (target.kind !== "self") return false;
  return /(UpperLeg|LowerLeg|Foot|Toes)$/.test(
    body.surfaces.regions[target.region].bone,
  );
}
