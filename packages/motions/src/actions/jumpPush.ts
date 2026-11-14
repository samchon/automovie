import {
  Quaternion,
  carriedAcceleration,
  carriedRate,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanEntryState } from "../law/IHumanEntryState";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { hipJoints } from "../posture/hipJoints";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { jumpPath } from "./jumpPath";
import type { standUpright } from "./standUpright";
import { walkLeg } from "./walkLeg";

/**
 * A jump's push-off, from the entry exactly: the pelvis and the heading
 * from the entry's own angles and rates to the jump's, the take-off foot
 * laid flat about its heel if it was on its heel rocker and then risen about
 * its toes' joint by the rule a walking stance rises by, and the reaching
 * leg withdrawn under the body carrying the velocity, spin and acceleration
 * it was entered with, each rate for no longer than its room affords
 * (`jump` states the law).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the push-off moves and from what; the law's own documentation gives the sources.
 * @evidence contracts/development/design.md#principled-representation The push-off phase of the jump as one record of paths over the push's seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The inputs, the paths the jump reads and their builder.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every path starts at the entry's own value and rate.
 */
export namespace jumpPush {
  /**
   * What the push-off is built from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, frame and unit.
   * @evidence contracts/development/design.md#principled-representation The entry, the two feet's roles and places, and the jump's heading, root path and knee rule.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The members the push-off reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The root path and the knee rule are the jump's own, passed in.
   */
  export interface IProps {
    /** The body. */
    body: IHumanBody;

    /** The state the jump is entered from. */
    entry: IHumanEntryState;

    /** The foot that pushes off. */
    takeoff: "left" | "right";

    /** The foot that leaves at once. */
    reaching: "left" | "right";

    /** The take-off foot as entered. */
    support: HumanFoot.IPlacement;

    /** The take-off foot's heading, degrees. */
    supportHeading: number;

    /** The take-off foot's pitch as entered, degrees; positive with the toes up. */
    supportPitch: number;

    /** The take-off foot's heel, world metres. */
    heel: IAutoMovieVector3;

    /** The take-off foot's toes' joint once flat, world metres. */
    ball: IAutoMovieVector3;

    /** The upright stand the pelvis comes to. */
    upright: standUpright.IAlignment;

    /** The jump's heading, degrees. */
    heading: number;

    /** The push-off's seconds. */
    push: number;

    /** Where the reaching ankle is drawn to in the body's frame, metres. */
    tuck: IAutoMovieVector3;

    /** The jump's root at a second. */
    rootAt: (t: number) => IAutoMovieVector3;

    /** The knee's bend point for a root, a side and a heading. */
    knee: (
      root: IAutoMovieVector3,
      side: "left" | "right",
      yaw: number,
    ) => IAutoMovieVector3;
  }

  /**
   * The push-off's paths.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it gives.
   * @evidence contracts/development/design.md#principled-representation The paths the jump's posture reads through the push and after.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, all read by the jump.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The legs are written whole, so no caller recombines their parts.
   */
  export interface IPush {
    /** What an entry rate adds to a push-off path that starts at rest: the rate times this term, whose slope is one at the cut. */
    carry: (t: number) => number;

    /** The heading at a second, from the entry's own and its rate. */
    yawAt: (t: number) => number;

    /** An upper arm's entry flexion rate, degrees per second. */
    swinging: (side: "left" | "right") => number;

    /** Write the pelvis, both legs and the take-off toes at a second of the push. */
    write: (
      t: number,
      root: IAutoMovieVector3,
      joints: Partial<
        Record<AutoMovieHumanoidBone, readonly [number, number, number]>
      >,
      limbs: IHumanPosture["limbs"],
    ) => void;
  }

  /**
   * Build a jump's push-off.
   *
   * @param props What it is built from.
   * @returns Its paths.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result; the namespace and the law give the rules.
   * @evidence contracts/development/implementation.md#principled-implementation Each moved part follows a path at rest plus the entry rate times the engine's carried-rate term, carried no longer than its room affords; the heel rises by the walking stance's rule.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The carries, the pelvis and heading, the foot's rocker, then one writer.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A foot rolling on its heel is laid flat before its heel rises, so the pivot never passes at a rate.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three rule reads at build time; each instant reads the rule once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `walkLeg.heelRise`, `hipJoints`, `HumanFoot` and the engine's carried terms.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The paths hold only the jump's own values.
   */
  export function of(props: IProps): IPush {
    const {
      body,
      entry,
      takeoff,
      reaching,
      support,
      supportHeading,
      supportPitch,
      heel,
      ball,
      upright,
      heading,
      tuck,
      rootAt,
      knee,
    } = props;
    const P: number = props.push;
    // What an entry rate adds to a push-off path that starts at rest: the
    // rate times this term, whose slope is one at the cut.
    const carry = (t: number): number => carriedRate(P, t);
    const stride: IAutoMovieVector3 = entry.feet[reaching].velocity;
    const spin: IAutoMovieVector3 = entry.feet[reaching].spin;
    const spinRate: number = Math.hypot(spin.x, spin.y, spin.z);
    // The reaching foot's velocity and spin are one rigid motion, carried for
    // no longer than brings a sole point to the floor: a point `h` above it
    // coming down at `v` affords `h / (PEAK v)` seconds. A point descending
    // slower than 1 cm/s is one the foot was turning about, and is passed.
    let reachingCarry: number = P;
    for (const point of ["heel", "ball"] as const) {
      const arm: IAutoMovieVector3 = Quaternion.rotateVector(
        entry.feet[reaching].rotation,
        HumanFoot.offset(body, reaching, point),
      );
      const falling: number = -(stride.y + spin.z * arm.x - spin.x * arm.z);
      if (falling > 0.01)
        reachingCarry = Math.min(
          reachingCarry,
          Math.max(0, entry.feet[reaching].ankle.y + arm.y) /
            (carriedRate.PEAK * falling),
        );
    }
    const reach = (t: number): number =>
      reachingCarry > 1e-6 ? carriedRate(reachingCarry, t) : 0;
    // The reaching ankle's entry acceleration fades over the same carry, so
    // the leg continues what the root's carried acceleration asks of it.
    const surge: IAutoMovieVector3 = entry.feet[reaching].acceleration;
    const reachBend = (t: number): number =>
      reachingCarry > 1e-6 ? carriedAcceleration(reachingCarry, t) : 0;
    // The take-off foot's pitch rate about its lateral axis, degrees per
    // second, positive lifting the toes.
    const lateral: IAutoMovieVector3 = Quaternion.rotateVector(
      support.rotation,
      { x: 1, y: 0, z: 0 },
    );
    const roll: IAutoMovieVector3 = entry.feet[takeoff].spin;
    const rolling: number =
      (-(roll.x * lateral.x + roll.y * lateral.y + roll.z * lateral.z) * 180) /
      Math.PI;
    // The pelvis joint through the push, from the entry's own angles and
    // their rates to the upright ones. The hip joints hang from the pelvis,
    // so a pelvis listed and turned by a stride puts the take-off hip
    // millimetres from where an upright one has it, and the heel's rule would
    // read a leg the entry does not show.
    const level: readonly [number, number, number] = upright.joints.hips ?? [
      0, 0, 0,
    ];
    const listed: readonly [number, number, number] =
      entry.posture.joints.hips ?? level;
    const listing: readonly [number, number, number] =
      entry.velocity.joints.get("hips") ?? [0, 0, 0];
    const pelvisAt = (t: number): readonly [number, number, number] => {
      if (t >= P) return level;
      const s: number = minimumJerk(t / P).s;
      const k: number = carry(t);
      return [
        listed[0] + (level[0] - listed[0]) * s + listing[0] * k,
        listed[1] + (level[1] - listed[1]) * s + listing[1] * k,
        listed[2] + (level[2] - listed[2]) * s + listing[2] * k,
      ];
    };
    // The take-off leg's hip joint under a root, a heading and that pelvis.
    const hipAt = (t: number): IAutoMovieVector3 =>
      hipJoints(
        body,
        rootAt(t),
        resolveHumanPosture.heading({ yaw: yawAt(t), pitch: 0, roll: 0 }),
        pelvisAt(t),
      )[takeoff];
    const turning: number = (entry.velocity.angular.y * 180) / Math.PI;
    const swinging = (side: "left" | "right"): number =>
      entry.velocity.joints.get(`${side}UpperArm`)?.[0] ?? 0;
    // The heading through the push, from the entry's own and its rate.
    const yawAt = (t: number): number =>
      entry.posture.yaw +
      (heading - entry.posture.yaw) * minimumJerk(t / P).s +
      turning * carry(t);

    // A foot entered on its heel rocker is laid flat before its heel rises,
    // as a walking foot is (Perry and Burnfield), so the pivot passes from
    // the heel to the toes' joint with the foot at rest: passed at a rate,
    // the ankle's velocity would step by that rate times the foot's length.
    // The foot comes flat in the share of the push its pitch is of the whole
    // turn, and no later than keeps a foot entered rolling down above the
    // floor: toward the end the carried rate's term falls as four times the
    // cube of the time left and the pitch as ten times it.
    const lowered: number =
      supportPitch > 0
        ? Math.min(
            (P * supportPitch) / (supportPitch + 40),
            rolling < 0 ? (2.5 * supportPitch) / -rolling : P,
          )
        : 0;
    const span: number = P - lowered;
    const start: number = Math.min(supportPitch, 0);
    // The flat foot's heel then rises by the rule a walking stance rises by:
    // asked from flat to its take-off pitch, and no later than the ankle's
    // dorsal limit asks. A foot the walk held by that rule is met by it.
    const ruled = (t: number): number =>
      walkLeg.heelRise(
        body,
        takeoff,
        hipAt(t),
        ball,
        supportHeading,
        Math.min(start, -40) * minimumJerk((t - lowered) / span).s,
        walkLeg.ROCKER,
      );
    // What the entry's pitch and pitch rate differ from the rule's by is
    // eased out over the rise. A heel coming down about the ball is carried
    // no longer than lays the foot flat, where the pivot would pass to the
    // heel.
    const met: number = ruled(lowered);
    const gap: number = start - met;
    const excess: number =
      (supportPitch > 0 ? 0 : rolling) -
      (-3 * met + 4 * ruled(lowered + 1e-3) - ruled(lowered + 2e-3)) / 2e-3;
    const carried: number =
      excess > 0 ? Math.min(span, -start / (carriedRate.PEAK * excess)) : span;
    const pitchAt = (t: number): number =>
      t < lowered
        ? supportPitch * (1 - minimumJerk(t / lowered).s) +
          rolling * carriedRate(lowered, t)
        : ruled(t) +
          gap * (1 - minimumJerk((t - lowered) / span).s) +
          (carried > 1e-6 ? excess * carriedRate(carried, t - lowered) : 0);

    return {
      carry,
      yawAt,
      swinging,
      write: (t, root, joints, limbs): void => {
        joints.hips = pelvisAt(t);
        // Push-off: the take-off foot rolls over its ball; the reaching leg withdraws under the body.
        // From the entry's own pitch and pitch rate, so a foot rolling on
        // its heel or its ball keeps rolling.
        const pitch: number = pitchAt(t);
        const about: "heel" | "mtp" = t < lowered ? "heel" : "mtp";
        const foot: HumanFoot.IPlacement = HumanFoot.pivot(
          body,
          takeoff,
          about,
          about === "heel" ? heel : ball,
          supportHeading,
          pitch,
        );
        limbs[`${takeoff}Leg`] = {
          point: foot.ankle,
          rotation: foot.rotation,
          bend: knee(root, takeoff, supportHeading),
          planted: true,
          // The point the foot turns about is the one that stays on the floor.
          contact: HumanFoot.offset(body, takeoff, about),
        };
        joints[`${takeoff}Toes`] = [-pitch, 0, 0];
        // The reaching foot leaves at once on a minimum-jerk path, carrying
        // the velocity and the spin it was entered with.
        const s: number = minimumJerk(t / P).s;
        const k: number = reach(t);
        const b: number = reachBend(t);
        const from: IAutoMovieVector3 = entry.feet[reaching].ankle;
        const into: IAutoMovieVector3 = HumanFrame.point(
          { origin: root, yaw: heading },
          tuck,
        );
        const path: IAutoMovieVector3 = jumpPath.lerp(from, into, s);
        const turned: IAutoMovieQuaternion = Quaternion.slerp(
          entry.feet[reaching].rotation,
          HumanFoot.rotation(heading, 0),
          s,
        );
        limbs[`${reaching}Leg`] = {
          point: {
            x: path.x + stride.x * k + surge.x * b,
            y: path.y + stride.y * k + surge.y * b,
            z: path.z + stride.z * k + surge.z * b,
          },
          rotation:
            spinRate < 1e-9
              ? turned
              : Quaternion.normalize(
                  Quaternion.multiply(
                    Quaternion.fromAxisAngle(
                      {
                        x: spin.x / spinRate,
                        y: spin.y / spinRate,
                        z: spin.z / spinRate,
                      },
                      (spinRate * k * 180) / Math.PI,
                    ),
                    turned,
                  ),
                ),
          bend: knee(root, reaching, heading),
        };
      },
    };
  }
}
