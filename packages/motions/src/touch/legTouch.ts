import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionKey } from "../HumanActionKey";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { HumanBalance } from "../everyday/HumanBalance";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * A touch with the leg while standing (#3357's effectors below the hip): the
 * toes, the heel or the knee of one leg is brought onto a place and held
 * there, the other leg bearing the body.
 *
 * The body first moves over its standing foot: the root is shifted level
 * until the centre of mass lies over that ankle (`HumanBalance.support`),
 * the standing leg keeping its planted goal. The moving leg is then a goal
 * of the posture resolver, as an arm is: for the toes and the heel the
 * ankle is placed so that part of the foot, read in the foot's rest frame
 * and turned as the foot stood at the entry, lies on the place; for the knee
 * the thigh's length fixes where the hip must be, so the root is shifted
 * further along the level line to the place until the knee, the leg's bend
 * hint, is exactly a thigh from the displayed hip, and the shank hangs
 * from it with the foot left free, since a foot held as it stood would
 * state another plane for the knee. A place the leg does not reach so is
 * refused.
 *
 * Events: `ready` on the place, `strokeEnd` and `relax` at the hold's end,
 * as a touch's. The leg may be cut from `relax` on.
 *
 * First pass: the foot's parts are offsets of the ankle (provisional where
 * marked), the shin is the round kick's and has no slow stroke here, the
 * contact is not declared as a window, and the standing balance is the
 * static one, not checked through the lift.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the balance, how each part of the leg is placed, the events and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation A law record over the posture resolver's leg goal on a standing base, the leg's counterpart of the touch stroke's arm goal.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the parts, two pads, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The knee is placed by the thigh's length, not by a correction pass; no region or body is special-cased.
 */
export namespace legTouch {
  /** The action's name. */
  export const name: HumanActionKey = "legTouch";

  /** Cancel table: the leg is left once it starts back. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    any: [{ window: ["relax", 1], kind: "inertialize", entry: 0 }],
  };

  /** The part of the leg that touches. */
  export type With = "toes" | "heel" | "knee";

  /** How far the knee's joint centre lies under its front skin, metres (provisional). */
  export const KNEE: number = 0.05;

  /** How far behind the ankle's joint the heel's pad lies, metres (provisional). */
  export const HEEL: number = 0.04;

  /** The farthest the root is shifted along the level line to put the knee a thigh from the hip, metres (provisional). */
  export const SHIFT: number = 0.25;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and default.
   * @evidence contracts/development/design.md#principled-representation The place as the shared target union, the part as a closed union, the hold in seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the target union.
   */
  export interface IParams {
    /** The place touched. */
    target: AutoMovieMotionTarget;

    /** The part of the leg; the toes when absent. */
    with?: With;

    /** The leg; `right` when absent. */
    side?: "left" | "right";

    /** Seconds the leg stays on the place; 0.5 when absent. */
    hold?: number;
  }

  /**
   * Plan a touch with the leg.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the hold is negative, or the knee cannot be put on the place by shifting the root within `SHIFT`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals; the law's doc gives the balance and the placement.
   * @evidence contracts/development/implementation.md#principled-implementation The root's shift over the standing ankle is the fixed point of the centre of mass under that shift; the knee's shift is the nearer root of the thigh's length along the level line to the place, taken again from the hip each shift displays, and the knee's goal asks no foot rotation, which would state the knee's plane against its bend point; the leg leaves and returns on one minimum-jerk envelope with a small lift.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The place, the balance, the leg's goal, the clock, the posture.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A knee out of the thigh's reach throws with the distance; nothing is clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four posture resolves for the balance and, for the knee, up to four for the shift at plan time; constant work per frame before the posture resolve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to the target resolver, `HumanBalance.support`, the timing owner and the posture resolver's leg goal.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the base plan and the solved goal.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body = context.body;
    const part: With = p.with ?? "toes";
    const side: "left" | "right" = p.side ?? "right";
    const standing: "left" | "right" = side === "right" ? "left" : "right";
    const hold: number = p.hold ?? 0.5;
    HumanBound.least("hold", hold, 0, "s");
    const entry: IHumanPosture = context.entry.posture;
    const foot = context.entry.feet[side];
    const place: AutoMovieMotionHumanTarget.IPlace =
      AutoMovieMotionHumanTarget.resolve(
        context,
        p.target,
        context.start,
        entry,
        AutoMovieMotionHumanTarget.DEFAULTS.ahead,
      );
    const level = (v: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: v.x,
      y: 0,
      z: v.z,
    });

    // The root over the standing ankle, with the moving leg's goal `at`.
    const moved = (
      posture: IHumanPosture,
      shift: IAutoMovieVector3,
      goal?: IHumanPosture.IGoal,
    ): IHumanPosture => ({
      ...posture,
      root: Vector3.add(posture.root, shift),
      ...(goal === undefined
        ? {}
        : { limbs: { ...posture.limbs, [`${side}Leg`]: goal } }),
    });
    const ankle: IAutoMovieVector3 = context.entry.feet[standing].ankle;
    let over: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (let i: number = 0; i < 4; i++)
      over = Vector3.add(
        over,
        level(
          Vector3.subtract(
            ankle,
            HumanBalance.support(body, moved(entry, over)).centre,
          ),
        ),
      );

    // The moving leg's goal on the place.
    const rest = (
      bone: "UpperLeg" | "LowerLeg" | "Foot" | "Toes",
    ): IAutoMovieVector3 => body.rest.get(`${side}${bone}`)!;

    // The leg's two lengths are this body's own, between its rest joints: the
    // knee falls on its place only on the circle those lengths allow.
    const thigh: number = Vector3.length(
      Vector3.subtract(rest("LowerLeg"), rest("UpperLeg")),
    );
    const shank: number = Vector3.length(
      Vector3.subtract(rest("Foot"), rest("LowerLeg")),
    );
    const turned = (local: IAutoMovieVector3): IAutoMovieVector3 =>
      Quaternion.rotateVector(foot.rotation, local);
    // The hip as the body displays it under a shift: the pelvis is fitted
    // over the planted leg, so the hip is read, not carried with the root.
    const hip = (by: IAutoMovieVector3): IAutoMovieVector3 =>
      poseBones(body, resolveHumanPosture(body, moved(entry, by))).get(
        `${side}UpperLeg`,
      )!.worldPosition;
    let shift: IAutoMovieVector3 = over;
    let goal: IHumanPosture.IGoal;
    if (part === "knee") {
      const knee: IAutoMovieVector3 = Vector3.add(
        place.point,
        Vector3.scale(place.normal, KNEE),
      );
      // The shift that puts the displayed hip a thigh from the knee: the
      // nearer root of the thigh's length along the level line to the knee,
      // taken again from the hip each shift displays, four times.
      let residual: number = Infinity;
      for (let i: number = 0; i < 4; i++) {
        const from: IAutoMovieVector3 = Vector3.subtract(knee, hip(shift));
        const line: IAutoMovieVector3 =
          Vector3.length(level(from)) > 1e-6
            ? Vector3.normalize(level(from))
            : { x: 0, y: 0, z: 1 };
        const along: number = Vector3.dot(from, line);
        const inside: number =
          along ** 2 - (Vector3.dot(from, from) - thigh ** 2);
        const far: number =
          inside < 0
            ? NaN
            : [along - Math.sqrt(inside), along + Math.sqrt(inside)].sort(
                (a: number, b: number): number => Math.abs(a) - Math.abs(b),
              )[0]!;
        shift = Vector3.add(shift, Vector3.scale(line, far));
        residual = Math.abs(
          Vector3.length(Vector3.subtract(knee, hip(shift))) - thigh,
        );
        if (!(Vector3.length(Vector3.subtract(shift, over)) <= SHIFT)) break;
      }
      if (
        !(Vector3.length(Vector3.subtract(shift, over)) <= SHIFT) ||
        !(residual <= 0.005)
      )
        throw new HumanRefusal({
          kind: "reach",
          axis: "target",
          value: `${(Vector3.length(Vector3.subtract(knee, hip(over))) * 1000).toFixed(0)} mm`,
          feasible: { kind: "alternatives", values: ["a nearer place"] },
          reason: `The knee is a thigh of ${(thigh * 1000).toFixed(0)} mm from the hip, and the place lies ${(Vector3.length(Vector3.subtract(knee, hip(over))) * 1000).toFixed(0)} mm from it, which a shift of the body within ${(SHIFT * 1000).toFixed(0)} mm does not close (the hip stays ${(residual * 1000).toFixed(0)} mm off the thigh's length)`,
          fix: "stand nearer the place, or aim the knee at a place at the hip's height or below",
        });
      const line: IAutoMovieVector3 = Vector3.normalize(
        level(Vector3.subtract(knee, hip(shift))),
      );
      const down: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract({ x: 0, y: -1, z: 0 }, Vector3.scale(line, 0.5)),
      );
      // No rotation is asked of the foot: a foot turned as it stood would
      // state the knee's plane against the bend point.
      goal = {
        point: Vector3.add(knee, Vector3.scale(down, shank)),
        bend: knee,
      };
    } else {
      const local: IAutoMovieVector3 =
        part === "toes"
          ? Vector3.subtract(rest("Toes"), rest("Foot"))
          : { x: 0, y: -rest("Foot").y, z: -HEEL };
      goal = {
        point: Vector3.subtract(place.point, turned(local)),
        rotation: foot.rotation,
        // The knee ahead of the hip, as the foot stood at the entry.
        bend: Vector3.add(hip(shift), turned({ x: 0, y: 0, z: thigh })),
      };
    }

    // The clock: out, the hold, back.
    const reach: number =
      1.5 *
      AutoMovieMotionHumanTiming.transport(
        Vector3.length(Vector3.subtract(goal.point, foot.ankle)),
      );
    const relax: number = reach + hold;
    const duration: number = relax + reach;
    const base: IHumanActionPlan = AutoMovieMotionHumanBase.under(
      context,
      duration,
    );
    const lift: number = 0.05;
    return {
      duration,
      events: [
        { name: "ready", share: reach / duration },
        { name: "strokeStart", share: reach / duration },
        { name: "strokeEnd", share: relax / duration },
        { name: "relax", share: relax / duration },
      ],
      contacts: base.contacts.filter(
        (c: IHumanContactWindow): boolean => c.part !== `${side}Foot`,
      ),
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const s: number =
          t < reach
            ? minimumJerk(t / reach).s
            : t <= relax
              ? 1
              : 1 - minimumJerk((t - relax) / reach).s;
        return moved(base.posture(t), Vector3.scale(shift, s), {
          point: Vector3.add(
            Vector3.add(
              foot.ankle,
              Vector3.scale(Vector3.subtract(goal.point, foot.ankle), s),
            ),
            { x: 0, y: lift * Math.sin(Math.PI * s), z: 0 },
          ),
          ...(goal.rotation === undefined ? {} : { rotation: goal.rotation }),
          // The hint rides the root, which is short of its full shift by 1 - s.
          bend: Vector3.subtract(goal.bend, Vector3.scale(shift, 1 - s)),
          ...(s === 0 ? { planted: true } : {}),
        });
      },
    };
  }
}
