import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionHumanTouch } from "../compose/AutoMovieMotionHumanTouch";
import { AutoMovieMotionHumanTouchEffector } from "../compose/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchPath } from "../compose/AutoMovieMotionHumanTouchPath";
import { AutoMovieMotionMeeting } from "../compose/AutoMovieMotionMeeting";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
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
  }

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
   * @evidence contracts/development/implementation.md#principled-implementation Both roles read one meeting and pin their phrase clocks to its shared instants; the hand is a press of the touch stroke on the meeting point.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Meeting, clock, one stroke, composition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A meeting instant before the action's start is lifted to 0.05 s of reach rather than a negative phase.
   * @evidence contracts/development/implementation.md#efficient-algorithms One meeting and one elbow solve per plan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `AutoMovieMotionMeeting` and the touch stroke.
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
    );
    const local: AutoMovieMotionMeeting.ITiming = AutoMovieMotionMeeting.local(
      met,
      context.start,
    );
    const place: AutoMovieMotionHumanTarget.IPlace =
      AutoMovieMotionMeeting.place(met, "meet", entry);
    const reach: number = Math.max(0.05, local.ready);
    const timed: AutoMovieMotionClock.IClock = AutoMovieMotionClock.phrase({
      prepare: reach,
      attack: 0,
      hold: Math.max(0, local.relax - local.ready),
      retract: reach,
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
      kind === "fist"
        ? { surface: "fist", shape: "fist" }
        : { surface: "palm", shape: "flat" };
    // The palm faces the partner with the fingers up: the region's normal
    // faces back at this performer, so laying the palm against it turns it
    // toward the partner.
    const region = (): Pick<
      AutoMovieMotionHumanTarget.IPlace,
      "point" | "normal"
    > => place;
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(
        clock.duration,
        entry,
        AutoMovieMotionHumanBase.plants(),
      ),
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
        bend: AutoMovieMotionHumanTouch.bend(
          body,
          entry,
          side,
          effector,
          place,
          "up",
        ),
        origin: AutoMovieMotionHumanTouchPath.origin(
          body,
          poseBones(body, context.entry.pose),
          side,
          effector,
        ),
        entry,
      }),
      contact: "meet",
    });
  }
}
