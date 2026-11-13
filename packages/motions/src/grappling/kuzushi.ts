import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionKey } from "../HumanActionKey";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { HumanBound } from "../law/HumanBound";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * A broken base (kuzushi): the receiver of a judo throw drawn off balance
 * forward, the whole body tipped about the ankles over the toes while the
 * feet stay on the floor, the stage before a throw carries the body over.
 *
 * The body turns as one about the midpoint of its two ankles by `depth`
 * degrees forward over `TIP` seconds, holds there for `hold` seconds and
 * comes back over `TIP` seconds; the feet keep their planted goals, so the
 * ankles bend and the centre of mass passes ahead of the toes. A balanced
 * person leans from the hips and moves them back (`gesture.bow`); a broken
 * base is the lean that does not, which is what the partner's pull and the
 * thrower's entry produce.
 *
 * What follows, the body carried over the thrower's hip and its fall, is
 * set by the forces of the throw and is the force-determined follow-up
 * (#3439), not staged here; nor are the receiver's grips and the
 * breakfall.
 *
 * Events: `broken` when the lean is full, `relax` when it starts back.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the movement, its pivot and timing, why it differs from a balanced lean, the events and what is left to the follow-up.
 * @evidence contracts/development/design.md#principled-representation A whole-body rotation about the ankles over a planted base, the kinematic definition of a base broken forward.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, two constants, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The fall is not faked kinematically: it is named as the force-determined campaign's.
 */
export namespace kuzushi {
  /** The action's name. */
  export const name: HumanActionKey = "kuzushi";

  /** Cancel table: a broken base may be cut into anything once it is full, as a throw cuts it. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    any: [{ window: ["broken", 1], kind: "inertialize", entry: 0 }],
  };

  /** Seconds the body takes to tip and to come back (provisional). */
  export const TIP: number = 0.5;

  /** How far forward the body tips when none is asked, degrees (provisional: past the toes for an adult). */
  export const DEPTH: number = 15;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and default.
   * @evidence contracts/development/design.md#principled-representation The tip's size and how long it is held.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The partner is named for the composition's mutual join; the tip itself reads only the body.
   */
  export interface IParams {
    /** The partner who breaks the base, for the mutual join; unread by the tip. */
    partner?: string;

    /** How far forward the body tips about the ankles, degrees in (0, 30]; `DEPTH` when absent. */
    depth?: number;

    /** Seconds the tip is held; 1 when absent. */
    hold?: number;
  }

  /**
   * Plan a broken base.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the depth lies outside (0, 30] degrees or the hold is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The root is turned about the ankles' midpoint by the pitch, the rest skeleton's midpoint kept in place, so the body rotates rigidly about it while the planted leg goals bend the ankles.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The pivot, the clock, the posture.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both bounds refuse; nothing is clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture resolve at plan time; constant work per frame.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the base under the action and the posture resolver's heading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the base plan and the pivot.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body = context.body;
    const depth: number = p.depth ?? DEPTH;
    HumanBound.within("depth", depth, 0, 30, "degrees", "minimum");
    const hold: number = p.hold ?? 1;
    HumanBound.least("hold", hold, 0, "s");
    const duration: number = 2 * TIP + hold;
    const base: IHumanActionPlan = AutoMovieMotionHumanBase.under(
      context,
      duration,
    );

    // The pivot: the ankles' midpoint, in the world and in the rest body.
    const feet = context.entry.feet;
    const pivot: IAutoMovieVector3 = Vector3.scale(
      Vector3.add(feet.left.ankle, feet.right.ankle),
      0.5,
    );
    const rest: IAutoMovieVector3 = Vector3.scale(
      Vector3.add(body.rest.get("leftFoot")!, body.rest.get("rightFoot")!),
      0.5,
    );
    const tipped = (posture: IHumanPosture, pitch: number): IHumanPosture => {
      const turned: IHumanPosture = { ...posture, pitch: posture.pitch + pitch };
      return {
        ...turned,
        root: Vector3.subtract(
          pivot,
          Quaternion.rotateVector(resolveHumanPosture.heading(turned), rest),
        ),
      };
    };
    return {
      duration,
      events: [
        { name: "broken", share: TIP / duration },
        { name: "relax", share: (TIP + hold) / duration },
      ],
      contacts: base.contacts,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const s: number =
          t < TIP
            ? minimumJerk(t / TIP).s
            : t <= TIP + hold
              ? 1
              : 1 - minimumJerk((t - TIP - hold) / TIP).s;
        return tipped(base.posture(t), depth * s);
      },
    };
  }
}
