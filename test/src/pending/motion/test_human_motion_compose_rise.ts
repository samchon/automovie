import { type IAutoMovieResolvedBone, Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRise,
  HumanFoot,
  type IAutoMovieMotionHumanPrimitive,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";

import { motionComplaints } from "../../features/internal/motionComplaints";
import { motionHumanBody } from "../../features/internal/motionHumanBody";

/**
 * The rise onto the toes on real bodies: a foot turned about its toes'
 * joint, the root's lift, and the legs that display it.
 *
 * A foot raised by `d` degrees is a rigid turn about its toes' joint: the
 * joint stays where it stood, the joint-to-ankle lever keeps its length, and
 * a lever that stood `h` above and `b` behind the joint along the foot's own
 * line now stands `h cos d + b sin d` above it; the owner states the rise as
 * about 5 cm at 35 degrees on an average foot. The feet are the standing
 * body's own, toes turned out. The body rides both ankles, so the root's
 * lift is their mean travel. On the displayed body the ankles stand on the
 * raised placements while the toes' joints and the toes stay as they stood,
 * flat on the floor.
 *
 * Scenarios, on each of the fourteen people of the sweep, at headings of 0
 * and 90 degrees, for both feet and raises of 0, 10, 20 and 35 degrees:
 * 1. `foot` keeps the toes' joint, the lever's length and the foot's
 *    heading, pitches the foot toes-down by the raise, lifts the ankle by the
 *    closed form, more for each larger raise, and changes nothing at 0; the
 *    average man's ankle rises 3 to 7 cm at 35 degrees.
 * 2. `lift` is the mean of both ankles' travel: up, ahead along the heading
 *    and not sideways for a symmetric stance.
 * 3. `legs` gives one primitive per leg on that leg's channel over the span,
 *    asks the raise with the second written, plants both goals, and on the
 *    body lifted by `lift` shows each ankle on its raised placement, each
 *    toes' joint where it stood and the toes as flat as they stood.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the placements and the resolver's bones; a turn about the ankle or the toe tip, a lever that stretches, a lift of one foot only, or toes that turn up with the foot fails.
 * @evidence contracts/development/testing.md#independent-expectations The ankle's height is the rigid turn's closed form on the flat lever, the joint's place is the flat one and the displayed toes are compared with the standing body's.
 * @evidence contracts/development/testing.md#distinguishing-cases Four raises including none, both feet, two headings and fourteen foot sizes; every failing cell is named with its body, its parameters and its measured numbers.
 * @evidence contracts/development/testing.md#execution-ownership In memory on the fourteen prepared bodies; named `test_human_` because preparing a body takes seconds, so the CI test job leaves it to local runs.
 * @evidence contracts/development/common.md#meaningful-documentation States the rigid turn, its closed form and what the displayed body shows, and lists the 3 scenarios.
 */
export function test_human_motion_compose_rise(): void {
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  const RAD: number = Math.PI / 180;
  const all: motionComplaints.IGatherer = motionComplaints();
  const gap = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const mm = (metres: number): string => (metres * 1000).toFixed(2);
  const sides = ["left", "right"] as const;

  for (const name of motionHumanBody.SWEEP) {
    const body: IHumanBody = motionHumanBody(name);
    const bones = (posture: IHumanPosture): Bones =>
      poseBones(body, resolveHumanPosture(body, posture));
    for (const yaw of [0, 90] as const) {
      const standing: IHumanPosture = stand.posture(
        body,
        { x: 0.2, y: 0, z: -0.1 },
        yaw,
      );
      const flat: Bones = bones(standing);
      const along = (v: IAutoMovieVector3): number => (yaw === 90 ? v.x : v.z);
      const across = (v: IAutoMovieVector3): number => (yaw === 90 ? v.z : v.x);
      // The feet as the standing body has them, toes turned out.
      const stance: AutoMovieMotionHumanRise.Stance = {
        left: {
          ankle: standing.limbs.leftLeg!.point,
          rotation: standing.limbs.leftLeg!.rotation!,
        },
        right: {
          ankle: standing.limbs.rightLeg!.point,
          rotation: standing.limbs.rightLeg!.rotation!,
        },
      };

      // 1. A foot turned about its toes' joint.
      for (const side of sides) {
        const joint: IAutoMovieVector3 = HumanFoot.point(
          body,
          side,
          "mtp",
          stance[side],
        );
        const lever: IAutoMovieVector3 = {
          x: stance[side].ankle.x - joint.x,
          y: stance[side].ankle.y - joint.y,
          z: stance[side].ankle.z - joint.z,
        };
        const toeward: IAutoMovieVector3 = Quaternion.rotateVector(
          stance[side].rotation,
          { x: 0, y: 0, z: 1 },
        );
        // How far the ankle stands behind the joint along the foot's own line.
        const behind: number = -(
          lever.x * toeward.x +
          lever.y * toeward.y +
          lever.z * toeward.z
        );
        const heading: number = HumanFoot.heading(stance[side].rotation);
        let last: number = stance[side].ankle.y;
        for (const degrees of [0, 10, 20, 35] as const) {
          const cell: string = `${name}: the ${side} foot raised ${degrees} at a heading of ${yaw}`;
          const raised: HumanFoot.IPlacement = AutoMovieMotionHumanRise.foot(
            body,
            side,
            stance[side],
            degrees,
          );
          const moved: number = gap(
            HumanFoot.point(body, side, "mtp", raised),
            joint,
          );
          const expected: number =
            joint.y +
            lever.y * Math.cos(degrees * RAD) +
            behind * Math.sin(degrees * RAD);
          all.check(
            `${cell} keeps its toes' joint, off by ${mm(moved)} mm`,
            moved <= 1e-9,
          );
          all.check(
            `${cell} keeps its lever's length and its heading`,
            Math.abs(
              gap(raised.ankle, joint) - Math.hypot(lever.x, lever.y, lever.z),
            ) <= 1e-9 &&
              Math.abs(HumanFoot.heading(raised.rotation) - heading) <= 1e-6 &&
              Math.abs(HumanFoot.pitch(raised.rotation) + degrees) <= 1e-6,
          );
          all.check(
            `${cell} lifts its ankle to ${mm(raised.ankle.y)} mm, the rigid turn's ${mm(expected)} mm`,
            Math.abs(raised.ankle.y - expected) <= 1e-9 &&
              (degrees === 0
                ? gap(raised.ankle, stance[side].ankle) <= 1e-12
                : raised.ankle.y > last + 0.005),
          );
          if (degrees === 35 && name === "m-average")
            all.check(
              `${cell} rises about 5 cm, by ${mm(raised.ankle.y - stance[side].ankle.y)} mm`,
              raised.ankle.y - stance[side].ankle.y > 0.03 &&
                raised.ankle.y - stance[side].ankle.y < 0.07,
            );
          last = raised.ankle.y;
        }
      }

      // 2. The root's lift, and 3. the legs.
      for (const degrees of [0, 10, 20, 35] as const) {
        const cell: string = `${name}: a rise of ${degrees} at a heading of ${yaw}`;
        const feet: Record<"left" | "right", HumanFoot.IPlacement> = {
          left: AutoMovieMotionHumanRise.foot(
            body,
            "left",
            stance.left,
            degrees,
          ),
          right: AutoMovieMotionHumanRise.foot(
            body,
            "right",
            stance.right,
            degrees,
          ),
        };
        const lift: IAutoMovieVector3 = AutoMovieMotionHumanRise.lift(
          body,
          stance,
          degrees,
        );
        all.check(
          `${cell} lifts the root by the mean of both ankles' travel, ${mm(lift.y)} mm up and ${mm(along(lift))} mm ahead`,
          gap(lift, {
            x:
              (feet.left.ankle.x -
                stance.left.ankle.x +
                feet.right.ankle.x -
                stance.right.ankle.x) /
              2,
            y:
              (feet.left.ankle.y -
                stance.left.ankle.y +
                feet.right.ankle.y -
                stance.right.ankle.y) /
              2,
            z:
              (feet.left.ankle.z -
                stance.left.ankle.z +
                feet.right.ankle.z -
                stance.right.ankle.z) /
              2,
          }) <= 1e-12 &&
            Math.abs(across(lift)) <= 1e-9 &&
            (degrees === 0
              ? gap(lift, { x: 0, y: 0, z: 0 }) <= 1e-12
              : lift.y > 0.005 && along(lift) > 0),
        );
        const asked: number[] = [];
        const legs: IAutoMovieMotionHumanPrimitive[] =
          AutoMovieMotionHumanRise.legs({
            body,
            stance,
            from: 0.5,
            to: 2,
            degrees: (seconds: number): number => {
              asked.push(seconds);
              return degrees;
            },
          });
        all.equals(
          `${cell} gives each leg its channel over the span`,
          legs.map((leg: IAutoMovieMotionHumanPrimitive): unknown => [
            leg.channels,
            leg.from,
            leg.to,
          ]),
          [
            [["leftLeg"], 0.5, 2],
            [["rightLeg"], 0.5, 2],
          ],
        );
        const risen: IHumanPosture = legs.reduce(
          (
            posture: IHumanPosture,
            leg: IAutoMovieMotionHumanPrimitive,
          ): IHumanPosture => leg.write(posture, 1.25),
          {
            ...standing,
            root: {
              x: standing.root.x + lift.x,
              y: standing.root.y + lift.y,
              z: standing.root.z + lift.z,
            },
          },
        );
        all.check(
          `${cell} asks the raise with the second written and plants both feet`,
          asked.length === 2 &&
            asked.every((s: number): boolean => s === 1.25) &&
            risen.limbs.leftLeg?.planted === true &&
            risen.limbs.rightLeg?.planted === true,
        );
        const pose: Bones = bones(risen);
        for (const side of sides) {
          const ankle: number = gap(
            pose.get(`${side}Foot`)!.worldPosition,
            feet[side].ankle,
          );
          const joint: number = gap(
            pose.get(`${side}Toes`)!.worldPosition,
            flat.get(`${side}Toes`)!.worldPosition,
          );
          const turn: number = Math.max(
            ...[
              { x: 0, y: 1, z: 0 },
              { x: 0, y: 0, z: 1 },
            ].map((axis: IAutoMovieVector3): number => {
              const a: IAutoMovieVector3 = Quaternion.rotateVector(
                pose.get(`${side}Toes`)!.worldRotation,
                axis,
              );
              const b: IAutoMovieVector3 = Quaternion.rotateVector(
                flat.get(`${side}Toes`)!.worldRotation,
                axis,
              );
              return (
                Math.acos(
                  Math.min(1, Math.max(-1, a.x * b.x + a.y * b.y + a.z * b.z)),
                ) / RAD
              );
            }),
          );
          all.check(
            `${cell} shows the ${side} ankle on its raised placement, off by ${mm(ankle)} mm`,
            ankle <= 0.001,
          );
          all.check(
            `${cell} keeps the ${side} toes' joint and the toes flat, the joint off by ${mm(joint)} mm and the toes turned ${turn.toFixed(2)} degrees`,
            joint <= 0.001 && turn <= 1,
          );
        }
      }
    }
  }
  all.assert("the rise holds on every body");
}
