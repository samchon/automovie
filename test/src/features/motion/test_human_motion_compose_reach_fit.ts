import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanLean,
  AutoMovieMotionHumanReach,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A limb's reach on real bodies: the measurement on a posture, the least
 * lean that reaches, and the three policies for a goal out of reach.
 *
 * The contract: a limb's end reaches every point no farther from its root
 * joint (the shoulder or the hip) than its two segments laid straight. The
 * root is compared with the displayed bone and the length with the distances
 * between the displayed bones of the standing body. A lean's answer is known
 * by construction: a point exactly one arm's length from where the shoulder
 * stands when the body is tipped by a chosen pitch, along the line the
 * shoulder moves on, is reached at that pitch and at none smaller.
 *
 * Scenarios, on each of the fourteen people of the sweep:
 * 1. `check` for each of the four limbs, on a standing body and on one
 *    turned 90 degrees and pitched 20, measures from the displayed root
 *    joint, with the displayed segments' length, the distance to the point,
 *    and a shortfall of the excess or 0.
 * 2. `lean` for each arm is 0 within reach, the chosen pitch for points
 *    placed at 10, 25 and 40 degrees, reaches at the pitch it returns and not
 *    0.05 degrees earlier, honours a smaller limit, and refuses a point still
 *    out of reach at the limit.
 * 3. `fit` returns the posture and the point unchanged within reach under
 *    every policy; beyond reach `clamp` moves the point along its line from
 *    the root onto the reach and keeps the posture, `lean` tips the posture
 *    by the least pitch without moving the hips and keeps the point, and
 *    `refuse` throws naming the limb and the shortfall in millimetres; a leg
 *    asked to lean beyond its reach is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Compares the measurement with the displayed bones and each policy's result with its definition; a root read from the rest pose, a lean that stops short or overshoots, a clamp off the line or a leg that silently clamps fails.
 * @evidence contracts/development/testing.md#independent-expectations Roots and lengths come from the resolver's bones, lean answers from the construction of the point, the clamp from the line and the stated length.
 * @evidence contracts/development/testing.md#distinguishing-cases Four limbs, two postures, inside and outside reach, three chosen pitches, two limits, three policies, fourteen bodies; every failing cell is named with its body, its parameters and its measured numbers.
 * @evidence contracts/development/testing.md#execution-ownership In memory on the fourteen prepared bodies; named `test_human_` because preparing a body takes seconds, so the CI test job leaves it to local runs.
 * @evidence contracts/development/common.md#meaningful-documentation States the contract, how a lean's answer is known and lists the 3 scenarios.
 */
export function test_human_motion_compose_reach_fit(): void {
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  const all: motionComplaints.IGatherer = motionComplaints();
  const gap = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const mm = (metres: number): string => (metres * 1000).toFixed(2);
  const move = (
    p: IAutoMovieVector3,
    d: IAutoMovieVector3,
    s: number,
  ): IAutoMovieVector3 => ({
    x: p.x + d.x * s,
    y: p.y + d.y * s,
    z: p.z + d.z * s,
  });
  const CHAINS = {
    leftArm: ["leftUpperArm", "leftLowerArm", "leftHand"],
    rightArm: ["rightUpperArm", "rightLowerArm", "rightHand"],
    leftLeg: ["leftUpperLeg", "leftLowerLeg", "leftFoot"],
    rightLeg: ["rightUpperLeg", "rightLowerLeg", "rightFoot"],
  } as const;
  const LIMBS = ["leftArm", "rightArm", "leftLeg", "rightLeg"] as const;
  const POLICIES = ["refuse", "lean", "clamp"] as const;

  for (const name of motionHumanBody.SWEEP) {
    const body: IHumanBody = motionHumanBody(name);
    const bones = (posture: IHumanPosture): Bones =>
      poseBones(body, resolveHumanPosture(body, posture));
    const standing: IHumanPosture = stand.posture(
      body,
      { x: 0, y: 0, z: 0 },
      0,
    );
    const upright: Bones = bones(standing);
    const length = (limb: (typeof LIMBS)[number]): number =>
      gap(
        upright.get(CHAINS[limb][0])!.worldPosition,
        upright.get(CHAINS[limb][1])!.worldPosition,
      ) +
      gap(
        upright.get(CHAINS[limb][1])!.worldPosition,
        upright.get(CHAINS[limb][2])!.worldPosition,
      );

    // 1. The measurement.
    for (const [label, posture] of [
      ["standing", standing],
      [
        "turned and pitched",
        AutoMovieMotionHumanLean.pivot(
          body,
          stand.posture(body, { x: 0.4, y: 0, z: -0.2 }, 90),
          { pitch: 20, roll: 0 },
        ),
      ],
    ] as const) {
      const pose: Bones = bones({ ...posture, limbs: {} });
      for (const limb of LIMBS) {
        const root: IAutoMovieVector3 = pose.get(
          CHAINS[limb][0],
        )!.worldPosition;
        for (const share of [0.6, 1.5] as const) {
          const point: IAutoMovieVector3 = move(
            root,
            { x: 0.6, y: -0.48, z: 0.64 },
            share * length(limb),
          );
          const got: AutoMovieMotionHumanReach.ICheck =
            AutoMovieMotionHumanReach.check(body, posture, limb, point);
          all.check(
            `${name}: the ${limb} of the ${label} body toward ${share} of its length measures from its root joint, off by ${mm(gap(got.root, root))} mm, a length of ${mm(got.length)} mm against the bones' ${mm(length(limb))} mm`,
            gap(got.root, root) <= 1e-6 &&
              Math.abs(got.length - length(limb)) <= 0.001 &&
              Math.abs(got.distance - share * length(limb)) <= 1e-6 &&
              Math.abs(
                got.shortfall - Math.max(0, got.distance - got.length),
              ) <= 1e-12,
          );
        }
      }
    }

    for (const limb of ["leftArm", "rightArm"] as const) {
      const reach: number = AutoMovieMotionHumanReach.check(
        body,
        standing,
        limb,
        { x: 0, y: 0, z: 0 },
      ).length;
      const shoulder = (posture: IHumanPosture): IAutoMovieVector3 =>
        bones({ ...posture, limbs: {} }).get(CHAINS[limb][0])!.worldPosition;
      const tipped = (pitch: number): IHumanPosture =>
        AutoMovieMotionHumanLean.tip(body, standing, pitch, 0);
      // The unit line the shoulder moves along between two nearby pitches.
      const line = (pitch: number): IAutoMovieVector3 => {
        const a: IAutoMovieVector3 = shoulder(tipped(pitch - 0.5));
        const b: IAutoMovieVector3 = shoulder(tipped(pitch + 0.5));
        const d: number = gap(a, b);
        return { x: (b.x - a.x) / d, y: (b.y - a.y) / d, z: (b.z - a.z) / d };
      };
      const placed = (pitch: number, beyond: number = 0): IAutoMovieVector3 =>
        move(shoulder(tipped(pitch)), line(pitch), reach + beyond);

      // 2. The least lean.
      all.check(
        `${name}: the ${limb} needs no lean for a point within reach`,
        AutoMovieMotionHumanReach.lean(
          body,
          standing,
          limb,
          move(shoulder(standing), { x: 0, y: 0, z: 1 }, 0.7 * reach),
        ) === 0,
      );
      for (const chosen of [10, 25, 40] as const) {
        const point: IAutoMovieVector3 = placed(chosen);
        const pitch: number = AutoMovieMotionHumanReach.lean(
          body,
          standing,
          limb,
          point,
        );
        const at = (degrees: number): number =>
          AutoMovieMotionHumanReach.check(body, tipped(degrees), limb, point)
            .shortfall;
        all.check(
          `${name}: the ${limb} leans ${pitch.toFixed(3)} degrees for a point placed at ${chosen}, short by ${mm(at(pitch))} mm there and ${mm(at(pitch - 0.05))} mm at 0.05 degrees less`,
          Math.abs(pitch - chosen) <= 0.05 &&
            at(pitch) === 0 &&
            at(pitch - 0.05) > 0,
        );
      }
      all.check(
        `${name}: the ${limb}'s lean honours a smaller limit`,
        Math.abs(
          AutoMovieMotionHumanReach.lean(body, standing, limb, placed(15), 20) -
            15,
        ) <= 0.05,
      );
      all.refuses(
        `${name}: the ${limb}'s lean refuses a point placed at 30 degrees under a limit of 20`,
        (): void => {
          AutoMovieMotionHumanReach.lean(body, standing, limb, placed(30), 20);
        },
      );
      all.refuses(
        `${name}: the ${limb}'s lean refuses a point 50 mm beyond reach at the limit`,
        (): void => {
          AutoMovieMotionHumanReach.lean(
            body,
            standing,
            limb,
            placed(AutoMovieMotionHumanReach.LEAN_LIMIT, 0.05),
          );
        },
      );

      // 3. The policies, for an arm.
      const within: IAutoMovieVector3 = move(
        shoulder(standing),
        { x: 0, y: 0, z: 1 },
        0.7 * reach,
      );
      for (const policy of POLICIES)
        all.equals(
          `${name}: the ${limb} within reach is unchanged under ${policy}`,
          AutoMovieMotionHumanReach.fit(body, standing, limb, within, policy),
          { posture: standing, point: within },
        );
      const far: IAutoMovieVector3 = placed(25);
      const clamped: AutoMovieMotionHumanReach.IFit =
        AutoMovieMotionHumanReach.fit(body, standing, limb, far, "clamp");
      const root: IAutoMovieVector3 = shoulder(standing);
      const distance: number = gap(root, far);
      all.check(
        `${name}: the ${limb}'s clamp moves the point onto the reach along its line from the shoulder, ${mm(gap(root, clamped.point))} mm out of ${mm(reach)} mm`,
        gap(
          clamped.point,
          move(
            root,
            {
              x: (far.x - root.x) / distance,
              y: (far.y - root.y) / distance,
              z: (far.z - root.z) / distance,
            },
            reach,
          ),
        ) <= 1e-9 &&
          distance > reach &&
          JSON.stringify(clamped.posture) === JSON.stringify(standing),
      );
      const leaned: AutoMovieMotionHumanReach.IFit =
        AutoMovieMotionHumanReach.fit(body, standing, limb, far, "lean");
      all.check(
        `${name}: the ${limb}'s lean policy tips the body ${leaned.posture.pitch.toFixed(3)} degrees for a point placed at 25, keeps the point and the hips`,
        Math.abs(leaned.posture.pitch - 25) <= 0.05 &&
          gap(leaned.point, far) === 0 &&
          gap(
            bones(leaned.posture).get("hips")!.worldPosition,
            upright.get("hips")!.worldPosition,
          ) <= 1e-9 &&
          AutoMovieMotionHumanReach.check(body, leaned.posture, limb, far)
            .shortfall === 0,
      );
      const beyond: IAutoMovieVector3 = move(
        root,
        { x: 0, y: 0, z: 1 },
        reach + 0.25,
      );
      let message: string = "";
      try {
        AutoMovieMotionHumanReach.fit(body, standing, limb, beyond, "refuse");
      } catch (error) {
        message = (error as Error).message;
      }
      all.check(
        `${name}: the ${limb}'s refusal names the limb and the 250 mm shortfall, saying "${message}"`,
        message.includes(limb) && message.includes("250"),
      );
    }

    // 3. The policies, for a leg.
    for (const limb of ["leftLeg", "rightLeg"] as const) {
      const hip: IAutoMovieVector3 = upright.get(
        CHAINS[limb][0],
      )!.worldPosition;
      const reach: number = AutoMovieMotionHumanReach.check(
        body,
        standing,
        limb,
        hip,
      ).length;
      const far: IAutoMovieVector3 = move(
        hip,
        { x: 0, y: -0.6, z: 0.8 },
        reach + 0.1,
      );
      all.refuses(
        `${name}: the ${limb} asked to lean beyond its reach is refused`,
        (): void => {
          AutoMovieMotionHumanReach.fit(body, standing, limb, far, "lean");
        },
      );
      all.refuses(
        `${name}: the ${limb} beyond its reach is refused`,
        (): void => {
          AutoMovieMotionHumanReach.fit(body, standing, limb, far, "refuse");
        },
      );
      const clamped: AutoMovieMotionHumanReach.IFit =
        AutoMovieMotionHumanReach.fit(body, standing, limb, far, "clamp");
      all.check(
        `${name}: the ${limb}'s clamp moves the point onto the reach along its line from the hip`,
        gap(clamped.point, move(hip, { x: 0, y: -0.6, z: 0.8 }, reach)) <= 1e-6,
      );
      for (const policy of POLICIES)
        all.equals(
          `${name}: the ${limb} within reach is unchanged under ${policy}`,
          AutoMovieMotionHumanReach.fit(
            body,
            standing,
            limb,
            standing.limbs[limb]!.point,
            policy,
          ),
          { posture: standing, point: standing.limbs[limb]!.point },
        );
    }
  }
  all.assert("the reach holds on every body");
}
