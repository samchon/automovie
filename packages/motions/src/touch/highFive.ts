import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionHumanTouch } from "../compose/AutoMovieMotionHumanTouch";
import { AutoMovieMotionHumanTouchEffector } from "../compose/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchLaid } from "../compose/AutoMovieMotionHumanTouchLaid";
import { AutoMovieMotionHumanTouchUpright } from "../compose/AutoMovieMotionHumanTouchUpright";
import { AutoMovieMotionMeeting } from "../compose/AutoMovieMotionMeeting";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanHeld } from "../handling/HumanHeld";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";

/**
 * A high five, a low five or a fist bump between two standing partners: both
 * bring one hand to one shared point between them and meet there at one
 * shared instant (#3284), the mutual goal the handshake uses
 * (`AutoMovieMotionMeeting`).
 *
 * The meeting point lies on the floor midpoint of the two performers, at the
 * mean of their crown heights for a high five, of their waist heights for a
 * low five and of their chest heights for a fist bump (provisional). Each
 * role's hand reaches it in the free-space transport time of its distance
 * (`AutoMovieMotionHumanTiming.transport`); the pair meets when the slower
 * arrives, both stay 0.1 s (provisional, the rebound) and go back in the
 * reach's time. The palms (or the fists) face each other, each surface's
 * skin on the point.
 *
 * With `prop`, each role brings the prop its hand holds instead of the hand:
 * the prop's point (a glass's `lip`) comes to the shared point with the
 * vessel upright, so two glasses meet rim to rim as in a toast, and the
 * hand keeps its prop afterwards (`HumanHeld`).
 *
 * Events: the phrase instants, with `meet` at `ready` and `rebound` at
 * `relax`; both partners share `meet`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the movement, the meeting's geometry and timing, the provisional values and the shared event.
 * @evidence contracts/development/design.md#principled-representation A mutual action read from one meeting record, each role a touch row on the meeting's point.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the kind, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Neither role derives the other's side: both read the meeting.
 */
export namespace highFive {
  /** The action's name. */
  export const name: HumanActionName = "highFive";

  /** Cancel table. */
  export const interrupts: IHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      touch: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
    });

  /** The variants. */
  export type Kind = "high" | "low" | "fist";

  /** Each variant's meeting height. */
  export const HEIGHTS: Readonly<
    Record<Kind, AutoMovieMotionHumanTarget.Height>
  > = { high: "crown", low: "waist", fist: "chest" };

  /** How long the hands stay together, seconds (provisional). */
  export const REBOUND: number = 0.1;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The partner, the variant and the hand.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The variant is a closed union.
   */
  export interface IParams {
    /** The partner. */
    partner: string;

    /** The variant; `high` when absent. */
    kind?: Kind;

    /** The hand; `right` when absent. */
    side?: HumanHand.Side;

    /** The subject id of the prop the hand holds, whose point meets the partner's in place of the hand: two glasses clinked in a toast. No prop when absent. */
    prop?: string;

    /** The prop's point that meets, one of its affordance ids; `lip` when absent. */
    point?: string;

    /** The film seconds the hands meet over (`AutoMovieMotionMeeting.IWindow`), which both roles give alike: they meet no earlier than `from`, each hand leaving its rest only its own reach's time before, and part at `to`; the natural meeting when absent. */
    window?: AutoMovieMotionMeeting.IWindow;

    /** A world point the hand is brought to in place of the pair's own meeting point, metres: the one point several pairs meet at, as glasses in a toast of four. The pair's shared instants are kept. The pair's own point when absent. */
    at?: IAutoMovieVector3;
  }

  /** How a held prop is brought to the meeting: stood upright in the closed hand, the side of its rim the palm faces toward the partner. */
  export const HELD: HumanHeld.IUse = {
    effector: {
      surface: "grip",
      shape: "fist",
      facing: "palm",
      along: "grasp",
    },
    upright: true,
    point: "lip",
  };

  /**
   * The meeting kind of a variant for a hand.
   *
   * @param kind The variant.
   * @param side The hand both roles use.
   * @returns The kind.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the variant's geometry and timing.
   * @evidence contracts/development/implementation.md#principled-implementation The contact on the roles' floor midpoint at the mean of their named heights; each role's natural timing the free-space transport of its hand to it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record with a placement and a timing.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Heights are named body heights; the default place is used only when a role is alone.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the target heights, `HumanHand.frame` and the timing owner.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Two roles, constant work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function meeting(
    kind: Kind,
    side: HumanHand.Side,
  ): AutoMovieMotionMeeting.IKind {
    const height: AutoMovieMotionHumanTarget.Height = HEIGHTS[kind];
    const surface: HumanHand.Surface = kind === "fist" ? "fist" : "palm";
    return {
      name: `highFive-${kind}`,
      roles: ["slapper", "slapper"],
      contacts: { meet: { height: 0.9, range: 0.8, facing: "performer" } },
      place: (roles) => {
        let sum: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
        for (const r of roles)
          sum = Vector3.add(sum, {
            x: r.posture.root.x,
            y:
              AutoMovieMotionHumanTarget.height(r.body, height) *
              r.body.measure.stature,
            z: r.posture.root.z,
          });
        return { meet: Vector3.scale(sum, 1 / roles.length) };
      },
      timing: (role, contacts) => {
        const from: IAutoMovieVector3 = HumanHand.frame(
          role.body,
          role.bones,
          side,
          surface,
          "relaxed",
        ).point;
        const reach: number = AutoMovieMotionHumanTiming.transport(
          Vector3.length(Vector3.subtract(contacts.meet!, from)),
        );
        return { ready: reach, stroke: reach, relax: reach + REBOUND };
      },
    };
  }

  /**
   * Plan one role of a high five.
   *
   * @param context The action's context.
   * @returns The plan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the plan; the law's doc gives the geometry and timing.
   * @evidence contracts/development/implementation.md#principled-implementation Both roles read one meeting and pin their phrase clocks to its shared instants; the hand, or the point of the prop it holds stood upright on its steadiest side (`HumanHeld`), is a press of the touch stroke on the meeting point.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Meeting, clock, one stroke, composition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A meeting instant before the action's start is lifted to 0.05 s of reach rather than a negative phase.
   * @evidence contracts/development/implementation.md#efficient-algorithms One meeting and one elbow solve per plan; with a held prop, the eight sides of its rim are each solved once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `AutoMovieMotionMeeting`, the touch stroke, the laid arm and `HumanHeld`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the meeting's place and the clock.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body = context.body;
    const kind: Kind = p.kind ?? "high";
    const side: HumanHand.Side = p.side ?? "right";
    const entry: IHumanPosture = context.entry.posture;
    const met: AutoMovieMotionMeeting.IMeeting = context.meeting(
      meeting(kind, side),
      "slapper",
      { role: "slapper", subject: p.partner },
      p.window,
    );
    const local: AutoMovieMotionMeeting.ITiming = AutoMovieMotionMeeting.local(
      met,
      context.start,
    );
    const paired: AutoMovieMotionHumanTarget.IPlace =
      AutoMovieMotionMeeting.place(met, "meet", entry);

    // A stated point is faced as the pair's own is: its normal looks back at
    // this performer, level.
    const back: IAutoMovieVector3 | undefined =
      p.at === undefined
        ? undefined
        : { x: entry.root.x - p.at.x, y: 0, z: entry.root.z - p.at.z };
    const place: AutoMovieMotionHumanTarget.IPlace =
      p.at === undefined || back === undefined
        ? paired
        : {
            ...paired,
            point: p.at,
            normal:
              Vector3.length(back) > 1e-6
                ? Vector3.normalize(back)
                : paired.normal,
          };
    // A meeting a window holds later than this hand needs is waited for at
    // rest: the hand leaves only its own reach's time before it.
    const own: number = AutoMovieMotionHumanTiming.transport(
      Vector3.length(
        Vector3.subtract(
          AutoMovieMotionMeeting.place(met, "meet", entry).point,
          HumanHand.frame(
            body,
            poseBones(body, context.entry.pose),
            side,
            kind === "fist" ? "fist" : "palm",
            "relaxed",
          ).point,
        ),
      ),
    );
    const lead: number =
      p.window === undefined
        ? 0
        : Math.max(0, local.ready - Math.max(0.05, own));
    const reach: number = Math.max(0.05, local.ready - lead);
    const timed: AutoMovieMotionClock.IClock = AutoMovieMotionClock.phrase({
      prepare: reach,
      attack: 0,
      hold: Math.max(0, local.relax - local.ready),
      retract: p.window === undefined ? reach : Math.max(0.05, own),
    });
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.of(
      timed.duration,
      [
        ...timed.instants,
        { name: "meet", seconds: timed.at("ready") },
        { name: "rebound", seconds: timed.at("relax") },
      ],
    );
    const effector: AutoMovieMotionHumanTouchEffector.IEffector =
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
        : kind === "fist"
          ? { surface: "fist", shape: "fist" }
          : { surface: "palm", shape: "flat" };

    // A held vessel stands upright at the meeting and the fingers keep it.
    const lay: "upright" | "tangent" =
      p.prop === undefined ? "tangent" : "upright";

    // A held vessel faces the way its arm turns it best at the meeting.
    const facing: IAutoMovieVector3 | undefined =
      p.prop === undefined
        ? undefined
        : AutoMovieMotionHumanTouchUpright.solve(
            body,
            entry,
            side,
            effector,
            place,
            AutoMovieMotionHumanBend.hang(body, entry, side),
          ).facing;

    // The palm faces the partner with the fingers up: the region's normal
    // faces back at this performer, so laying the palm against it turns it
    // toward the partner.
    const region = (): Pick<
      AutoMovieMotionHumanTarget.IPlace,
      "point" | "normal"
    > => place;
    const bend: IAutoMovieVector3 = AutoMovieMotionHumanTouchLaid.bend(
      body,
      entry,
      side,
      effector,
      place,
      "up",
      lay,
      facing,
    );
    const plan: IHumanActionPlan = composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.under(context, clock.duration),
      clock,
      primitives: AutoMovieMotionHumanTouch.touch({
        body,
        clock,
        side,
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
        effector,
        region,
        kind: "press",
        count: 1,
        tangent: "up",
        bend,
        reference: AutoMovieMotionHumanTouchLaid.laid(
          body,
          entry,
          side,
          effector,
          place,
          "up",
          bend,
          lay,
          facing,
        ),
        lay,
        ...(facing === undefined ? {} : { facing }),
        ...(p.prop === undefined ? {} : { fingers: "keep" as const }),
        entry,
      }),
      contact: "meet",
    });
    const waited: IHumanActionPlan = lead > 0 ? delayed(plan, lead) : plan;
    return p.prop === undefined
      ? waited
      : HumanHeld.kept(context, waited, side, p.prop);
  }

  /**
   * A plan begun later: the body holds the plan's first posture for `lead`
   * seconds, then performs it.
   *
   * @param plan The plan.
   * @param lead Seconds of waiting before it, positive.
   * @returns The longer plan, its events and contact windows at the same film seconds after the wait.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is held, for how long, and where the instants move.
   * @evidence contracts/development/implementation.md#principled-implementation Waiting at rest is the plan's first posture held; every share is rescaled to the longer duration so each instant keeps its seconds after the wait.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record of the same plan with its time moved.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The posture is the plan's own, read at a clamped second; nothing is written for the wait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the plan's events and windows.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The record closes over the plan.
   */
  export function delayed(
    plan: IHumanActionPlan,
    lead: number,
  ): IHumanActionPlan {
    const duration: number = plan.duration + lead;
    const share = (s: number): number => (lead + s * plan.duration) / duration;
    return {
      ...plan,
      duration,
      events: plan.events.map((e) => ({ ...e, share: share(e.share) })),
      contacts: plan.contacts.map((c: IHumanContactWindow) =>
        c.from <= 0 && c.to >= 1
          ? c
          : { ...c, from: c.from <= 0 ? 0 : share(c.from), to: share(c.to) },
      ),
      ...(plan.contact === undefined ? {} : { contact: plan.contact + lead }),
      posture: (seconds: number): IHumanPosture =>
        plan.posture(Math.max(0, seconds - lead)),
    };
  }
}
