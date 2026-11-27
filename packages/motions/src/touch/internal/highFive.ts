import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanHighFive,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSeatedReach,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionHumanTargetGrid,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieMotionHumanTouchForm,
  IAutoMovieMotionMeeting,
  IAutoMovieMotionMeetingKind,
  IAutoMovieMotionMeetingRole,
  IAutoMovieMotionMeetingTiming,
  IAutoMovieResolveMutualGoal,
  IAutoMovieVector3,
} from "@automovie/interface";

import { motionClock } from "../../compose/internal/motionClock";
import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanTouchLaid } from "../../compose/internal/AutoMovieMotionHumanTouchLaid";
import { AutoMovieMotionHumanTouchUpright } from "../../compose/internal/AutoMovieMotionHumanTouchUpright";
import { motionMeeting } from "../../compose/internal/motionMeeting";
import { composeMotionHumanAction } from "../../compose/internal/composeMotionHumanAction";
import { touchPrimitive } from "../../compose/internal/touchPrimitive";
import { HumanHeld } from "../../handling/internal/HumanHeld";
import { handshake } from "../../handling/internal/handshake";
import { poseBones } from "../../posture/internal/poseBones";
import { HumanSeatedReach } from "./HumanSeatedReach";
import { highFiveContact } from "./highFiveContact";
import { touchReach } from "./touchReach";

/*
 * A high five, a low five or a fist bump between two standing partners: both
 * bring one hand to one shared point between them and meet there at one shared
 * instant, the mutual goal the handshake uses (`motionMeeting`).
 *
 * The meeting point is the pair's mutual goal (`resolveMutualGoal` on
 * the true wrist reach of the two opposed hand frames): the action prefers the
 * mean of the two crown heights for a high five, of their waist heights for a
 * low five and of their chest heights for a fist bump (provisional), and the
 * point lies at that height where both arms are the same share of their
 * comfortable reaches, moved down or up only as far as both arms' reach
 * demands. Partners of unequal stature therefore meet where the shorter one can
 * reach. Seated partners whose arms alone fall short lean their trunks forward
 * over the seat, the arm's target first, in equal shares of each hip's flexion
 * room (`HumanSeatedReach`, Chan and Dubey 1995); partners no point lies within
 * both arms of, leaned as far as they can, are refused, never stretched. Each
 * role's hand reaches it in the free-space transport time of its distance
 * (`motionHumanTiming.transport`), and at least the time its arm's arc
 * takes within the audit's travel bound (`touchReach.meeting`); the pair meets
 * when the slower arrives, both stay 0.1 s (provisional, the rebound) and go
 * back in the reach's time. The palms (or the fists) face each other, each
 * surface's skin on the point.
 *
 * With `prop`, each role brings the prop its hand holds instead of the hand:
 * the prop's point (a glass's `lip`) comes to the shared point with the vessel
 * upright, so two glasses meet rim to rim as in a toast, and the hand keeps its
 * prop afterwards (`HumanHeld`).
 *
 * Events: the phrase instants, with `meet` at `ready` and `rebound` at `relax`;
 * both partners share `meet`.
 */
export namespace highFive {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionName = "highFive";

  /*
   * Cancel table.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      touch: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
    });

  /*
   * Each variant's meeting height.
   */
  export const HEIGHTS: Readonly<
    Record<
      IAutoMovieMotionHumanHighFive.Kind,
      IAutoMovieMotionHumanTargetGrid.Height
    >
  > = { high: "crown", low: "waist", fist: "chest" };

  /*
   * How long the hands stay together, seconds (provisional).
   */
  export const REBOUND: number = 0.1;

  /*
   * How a held prop is brought to the meeting: stood upright in the closed
   * hand, the side of its rim the palm faces toward the partner.
   */
  export const HELD: IAutoMovieMotionHumanHeld.IUse = {
    effector: {
      surface: "grip",
      shape: "fist",
      facing: "palm",
      along: "grasp",
    },
    upright: true,
    point: "lip",
  };

  /*
   * The meeting kind of a variant for a hand.
   * Parameter kind: The variant.
   * Parameter side: The hand both roles use.
   * Parameter bare: Whether the acting surfaces are the hands themselves.
   * Returns: The kind.
   */
  export function meeting(
    kind: IAutoMovieMotionHumanHighFive.Kind,
    side: AutoMovieHumanSide,
    bare: boolean = true,
  ): IAutoMovieMotionMeetingKind {
    const height: IAutoMovieMotionHumanTargetGrid.Height = HEIGHTS[kind];
    const surface: IAutoMovieMotionHumanHand.Surface =
      kind === "fist" ? "fist" : "palm";
    return {
      name: `highFive-${kind}`,
      roles: ["slapper", "slapper"],
      contacts: { meet: { height: 0.9, range: 0.8, facing: "performer" } },
      place: (roles) => highFiveContact.place(roles, kind, side, bare, height),
      surfaces: bare
        ? (roles) => highFiveContact.surface(roles, kind, side, height)
        : undefined,
      timing: (role, contacts) => {
        const reach: number = touchReach.meeting(
          role.body,
          role.bones,
          role.entry,
          side,
          surface,
          contacts.meet!,
        );
        return { ready: reach, stroke: reach, relax: reach + REBOUND };
      },
    };
  }

  /*
   * Plan one role of a high five.
   * Parameter context: The action's context.
   * Returns: The plan.
   * A `reach` refusal on `partner` when no point lies
   * within both partners' arms.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHighFive.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanHighFive.IParams = context.params;
    const body = context.body;
    const kind: IAutoMovieMotionHumanHighFive.Kind = p.kind ?? "high";
    const side: AutoMovieHumanSide = p.hand ?? "right";
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const met: IAutoMovieMotionMeeting = context.meeting(
      meeting(kind, side, p.prop === undefined),
      "slapper",
      { role: "slapper", subject: p.partner },
      p.window,
    );
    const local: IAutoMovieMotionMeetingTiming = motionMeeting.local(
      met,
      context.start,
    );
    const target: IAutoMovieMotionHumanTarget.IPlace =
      motionMeeting.place(met, "meet", entry);
    const paired: IAutoMovieMotionHumanTarget.IPlace =
      met.solid &&
      p.prop === undefined &&
      met.roles[0]!.subject !== context.subject
        ? { ...target, normal: AutoMovieEngineVector3.scale(target.normal, -1) }
        : target;

    // A stated point is faced as the pair's own is: its normal looks back at
    // this performer, level.
    const back: IAutoMovieVector3 | undefined =
      p.at === undefined
        ? undefined
        : { x: entry.root.x - p.at.x, y: 0, z: entry.root.z - p.at.z };
    const place: IAutoMovieMotionHumanTarget.IPlace =
      p.at === undefined || back === undefined
        ? paired
        : {
            ...paired,
            point: p.at,
            normal:
              AutoMovieEngineVector3.length(back) > 1e-6
                ? AutoMovieEngineVector3.normalize(back)
                : paired.normal,
          };
    // A meeting a window holds later than this hand needs is waited for at
    // rest: the hand leaves only its own reach's time before it.
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      context.entry.pose,
    );
    const own: number =
      p.window === undefined
        ? 0
        : touchReach.meeting(
            body,
            bones,
            context.entry,
            side,
            kind === "fist" ? "fist" : "palm",
            paired.point,
          );
    const lead: number =
      p.window === undefined
        ? 0
        : Math.max(0, local.ready - Math.max(0.05, own));
    const reach: number = Math.max(0.05, local.ready - lead);
    const timed: IAutoMovieMotionClock = motionClock.phrase({
      prepare: reach,
      attack: 0,
      hold: Math.max(0, local.relax - local.ready),
      retract: p.window === undefined ? reach : Math.max(0.05, own),
    });
    const clock: IAutoMovieMotionClock = motionClock(timed.duration, [
      ...timed.instants,
      { name: "meet", seconds: timed.at("ready") },
      { name: "rebound", seconds: timed.at("relax") },
    ]);
    const effector: IAutoMovieMotionHumanTouchEffector.IEffector =
      p.prop !== undefined
        ? HumanHeld.steadiest(
            context,
            HELD,
            side,
            p.prop,
            p.point,
            entry,
            place,
          )
        : highFiveContact.hand(kind);

    // A held vessel stands upright at the meeting and the fingers keep it.
    const lay: PlanLay = p.prop === undefined ? "tangent" : "upright";
    const tangent: IAutoMovieMotionHumanTouchForm.Tangent =
      p.prop === undefined ? highFiveContact.tangent(kind) : "up";

    // Seated, the trunk leans forward over the seat as far as this arm
    // needs to reach the meeting, the arm's target first
    // (`HumanSeatedReach.need`); standing, it leans none.
    const role: IAutoMovieMotionMeetingRole = {
      name: "slapper",
      subject: context.subject,
      body,
      posture: entry,
      bones,
      entry: { posture: entry, pose: context.entry.pose },
      seated: context.entry.supports.some(
        (s: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
          s.kind === "seat",
      ),
    };
    const shoulder: IAutoMovieVector3 = bones.get(
      `${side}UpperArm`,
    )!.worldPosition;
    const wrist: IAutoMovieResolveMutualGoal.ISide =
      p.prop === undefined
        ? highFiveContact.arm(role, side, effector, tangent, place, shoulder)
        : handshake.arm(body, side, shoulder);
    const need = (
      limit: number,
    ): IAutoMovieMotionHumanSeatedReach.INeedResult =>
      HumanSeatedReach.need(
        role,
        shoulder,
        AutoMovieEngineVector3.add(place.point, AutoMovieEngineVector3.subtract(shoulder, wrist.shoulder)),
        limit,
        `${side}UpperArm`,
      );
    // A seated reach can keep swivel room at the meeting by using more of
    // its available trunk flexion. The comfortable radius is the same
    // named radius the meeting already prefers in placing the contact.
    const held: IAutoMovieMotionHumanSeatedReach.INeedResult = need(
      wrist.limit,
    );
    const lean: IAutoMovieMotionHumanSeatedReach.INeedResult =
      role.seated === true && p.prop === undefined && held.share > 0
        ? need(wrist.reach)
        : held;
    const reached: IAutoMovieMotionHumanPosture = HumanSeatedReach.posed(
      body,
      entry,
      lean.joints,
      lean.share,
    );
    const clear: IAutoMovieMotionHumanColliders.IPlaced[] =
      met.solid && p.prop === undefined
        ? highFiveContact.blocking(context, p.partner, side)
        : [];
    // The elbow and wrist are fitted on the same trunk the meeting displays.
    const facing: IAutoMovieVector3 | undefined =
      p.prop === undefined
        ? undefined
        : AutoMovieMotionHumanTouchUpright.solve(
            body,
            reached,
            side,
            effector,
            place,
            AutoMovieMotionHumanBend.hang(body, reached, side),
          ).facing;
    const bend: IAutoMovieVector3 = AutoMovieMotionHumanTouchLaid.bend(
      body,
      reached,
      side,
      effector,
      place,
      tangent,
      lay,
      facing,
    );
    const under: IAutoMovieMotionHumanActionPlan =
      AutoMovieMotionHumanBase.under(context, clock.duration);
    const plan: IAutoMovieMotionHumanActionPlan =
      composeMotionHumanAction({
        base:
          lean.share === 0
            ? under
            : {
                ...under,
                posture: (
                  seconds: number,
                  _channels?: Parameters<
                    IAutoMovieMotionHumanActionPlan["posture"]
                  >[1],
                  source?: Parameters<
                    IAutoMovieMotionHumanActionPlan["posture"]
                  >[2],
                  projection?: Parameters<
                    IAutoMovieMotionHumanActionPlan["posture"]
                  >[3],
                ): IAutoMovieMotionHumanPosture =>
                  HumanSeatedReach.posed(
                    body,
                    under.posture(seconds, undefined, source, projection),
                    lean.joints,
                    lean.share *
                      clock.envelope(
                        ["start", "ready"],
                        ["relax", "end"],
                        seconds,
                      ),
                  ),
              },
        clock,
        primitives: touchPrimitive({
          body,
          clock,
          side,
          rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
          effector,
          region: (): IAutoMovieMotionHumanTarget.IPlace => place,
          ...(clear.length === 0
            ? {}
            : {
                others: (): IObstacles => ({ clear, rests: [] }),
              }),
          kind: "press",
          count: 1,
          tangent,
          bend,
          reference: AutoMovieMotionHumanTouchLaid.laid(
            body,
            reached,
            side,
            effector,
            place,
            tangent,
            bend,
            lay,
            facing,
          ),
          lay,
          ...(facing === undefined ? {} : { facing }),
          ...(p.prop === undefined ? {} : { fingers: "keep" as const }),
          entry: reached,
        }),
        contact: "meet",
      });
    const waited: IAutoMovieMotionHumanActionPlan =
      lead > 0 ? delayed(plan, lead) : plan;
    return p.prop === undefined
      ? waited
      : HumanHeld.kept(context, waited, side, p.prop);
  }

  /*
   * A plan begun later: the body holds the plan's first posture for `lead`
   * seconds, then performs it.
   * Parameter plan: The plan.
   * Parameter lead: Seconds of waiting before it, positive.
   * Returns: The longer plan, its events and contact windows at the same film
   * seconds after the wait.
   */
  export function delayed(
    plan: IAutoMovieMotionHumanActionPlan,
    lead: number,
  ): IAutoMovieMotionHumanActionPlan {
    const duration: number = plan.duration + lead;
    const share = (s: number): number => (lead + s * plan.duration) / duration;
    return {
      ...plan,
      duration,
      events: plan.events.map((e) => ({ ...e, share: share(e.share) })),
      contacts: plan.contacts.map((c: IAutoMovieMotionHumanContactWindow) =>
        c.from <= 0 && c.to >= 1
          ? c
          : { ...c, from: c.from <= 0 ? 0 : share(c.from), to: share(c.to) },
      ),
      ...(plan.contact === undefined ? {} : { contact: plan.contact + lead }),
      posture: (
        seconds: number,
        _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        source?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture =>
        plan.posture(
          Math.max(0, seconds - lead),
          undefined,
          source,
          projection,
        ),
    };
  }
}

/*
 * The alternatives of `PlanLay`'s site.
 */
type PlanLay = "upright" | "tangent";

/*
 * The shared motion's fixed obstruction reading.
 */
interface IObstacles {
  /*
   * The other body's shapes outside the acting arm.
   */
  clear: IAutoMovieMotionHumanColliders.IPlaced[];

  /*
   * The contacting hand is handled by the shared frame.
   */
  rests: IAutoMovieMotionHumanColliders.IPlaced[];
}
