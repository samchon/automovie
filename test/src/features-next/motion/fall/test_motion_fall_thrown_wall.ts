import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanFall,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The wall's face, metres behind the performer along -z. */
const WALL: number = 1.2;
/** A body part stays this far in front of the wall's face, metres: the skin. */
const SKIN: number = 0.01;
/** The bones read against the wall. */
const BACK: readonly AutoMovieHumanoidBone[] = [
  "hips",
  "spine",
  "chest",
  "head",
];

/**
 * A blast throws the body back into a wall (#3972): the flight stops on the
 * wall's face and the body slides down it to sit on the floor, on two
 * bodies.
 *
 * Scenarios:
 * 1. The throw has one impact, its hit, before it would have landed.
 * 2. From the impact on, no part of the trunk or the head passes the wall's
 *    face.
 * 3. After the impact the hips only come down, ending low against the wall.
 * 4. The take passes the shipped verdict report.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the throw, the impact, the slide and what each check pins.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the registered thrown law with a wall through HumanPerformance and reads its events, the trunk's bones and the verdict report.
 * @evidence contracts/development/testing.md#independent-expectations The wall's place and the throw are authored; the skin is the contact allowance.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, before and after the impact.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_fall_thrown_wall(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const label of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(label);
    try {
      const film: HumanPerformance = new HumanPerformance({
        seed: "thrown-wall",
        laws: [AutoMovieMotionHumanFall.thrown],
        props: [wall()],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a")
          .stand({ hold: 0.3, sway: 0 })
          .registered(AutoMovieMotionHumanFall.thrown.name, {
            rig: "blast",
            target: { kind: "point", at: { x: 0, y: 1, z: 2 }, frame: "world" },
            distance: 3,
            height: 0.5,
            wall: { kind: "prop", subject: "wall", point: "face" },
          }).node,
      });
      const throw_: IAutoMovieMotionHumanSegment = film.segments("a")[1]!;
      const impacts: IAutoMovieMotionEvent[] = throw_.plan.events.filter(
        (e: IAutoMovieMotionEvent): boolean => e.name === "impact",
      );
      const land: IAutoMovieMotionEvent = throw_.plan.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === "land",
      )!;
      checks.check(
        `${label}: one impact before the landing`,
        impacts.length === 1 && impacts[0]!.share < land.share,
      );
      if (impacts.length === 1) {
        const impact: number =
          throw_.start + throw_.plan.duration * impacts[0]!.share;
        let last: number = Infinity;
        for (let i: number = 0; i <= 12; ++i) {
          const t: number = impact + ((film.duration - impact) * i) / 12;
          const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
            film.bones("a", t);
          for (const bone of BACK)
            checks.check(
              `${label}: the ${bone} stays in front of the wall at ${t.toFixed(2)}`,
              bones.get(bone)!.worldPosition.z >= -WALL + SKIN,
            );
          const hips: number = bones.get("hips")!.worldPosition.y;
          checks.check(
            `${label}: the hips only come down at ${t.toFixed(2)}`,
            hips <= last + 1e-6,
          );
          last = hips;
        }
        checks.check(
          `${label}: the body ends sitting low against the wall (${last.toFixed(3)} m)`,
          last <= 0.25 * body.measure.stature,
        );
      }
      assertTakeClean(`${label} thrown into a wall`, film);
    } catch (error: unknown) {
      checks.check(`${label} refused: ${String(error)}`, false);
    }
  }
  checks.assert("thrown into a wall");
}

/** A fixed wall behind the performer, its `face` looking toward it. */
function wall(): IAutoMovieMotionHumanProp {
  return {
    subject: "wall",
    fixed: true,
    frame: {
      position: { x: 0, y: 0, z: -WALL },
      rotation: Quaternion.identity(),
    },
    points: {
      face: { point: { x: 0, y: 1, z: 0 }, normal: { x: 0, y: 0, z: 1 } },
    },
    affordances: [],
    shapes: [
      {
        id: "slab",
        kind: "box",
        halfExtents: { x: 2, y: 1.5, z: 0.1 },
        material: "stone",
        transform: {
          position: { x: 0, y: 1.5, z: -0.1 },
          rotation: Quaternion.identity(),
        },
      },
    ],
  };
}
