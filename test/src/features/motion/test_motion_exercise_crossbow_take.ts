import { createBow, createProjectile } from "@automovie/archetypes";
import { Quaternion, Transform, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanPropFrame,
} from "@automovie/motions";

import { assertTakeClean } from "../internal/assertTakeClean";
import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/** The target, world metres. */
const TARGET: IAutoMovieVector3 = { x: 0, y: 1.4, z: 15 };
/** The bolt's authored flight speed after the cue, metres per second: a crossbow bolt's typical speed. */
const SPEED: number = 90;
/** A declared hit crosses the target's plane within this of its centre, metres: the 122 cm face's radius (World Archery). */
const FACE: number = 0.61;
/** A carried prop rides its carrier rigidly within this, metres: the worn-prop bound. */
const RIGID: number = 0.002;

/**
 * A character takes up a loaded crossbow, presents it to the cheek on the
 * line to a target and shoots (#3868): the staged bolt leaves on an
 * authored carrier at the cue.
 *
 * Scenarios, on two bodies:
 * 1. Both hands, the right on the grip and the left on the fore-end, keep
 *    the crossbow rigidly from the pick-up to the end.
 * 2. The bolt rides the crossbow's nock until the cue and the carrier after
 *    it: exactly one separation, at the cue, with no jump.
 * 3. The bolt crosses the target's plane on the face.
 * 4. The take passes the shipped verdict report.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the take's entry, presentation, departure and outcome and what each check pins.
 * @evidence contracts/development/testing.md#behavioral-verification Composes pick-ups and the registered crossbow rows through HumanPerformance and reads both hands, the crossbow, the bolt and the verdict report.
 * @evidence contracts/development/testing.md#independent-expectations The target and the speed are authored; the face is World Archery's; the rigid bound is the worn-prop bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, both hands, before and after the cue.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_exercise_crossbow_take(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const label of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(label);
    try {
      const crossbow: ReturnType<typeof createBow> = createBow({
        kind: "crossbow",
      });
      const bolt: ReturnType<typeof createProjectile> = createProjectile({
        kind: "bolt",
      });
      const stature: number = body.measure.stature / 1.75;
      const placed: IAutoMovieRigidTransform = {
        position: { x: 0, y: 0.95 * stature, z: 0.4 * stature },
        rotation: Quaternion.identity(),
      };
      const loaded: IAutoMovieMotionHumanProp = {
        ...HumanObject.prop("bolt", bolt, placed),
        mounted: {
          prop: "crossbow",
          point: "nock",
          offset: {
            position: { x: 0, y: 0, z: 0 },
            rotation: Quaternion.identity(),
          },
        },
      };
      const film: HumanPerformance = new HumanPerformance({
        seed: "crossbow-take",
        laws: Object.values(HUMAN_LEXICON).flat(),
        props: [
          HumanObject.prop("crossbow", crossbow, placed),
          loaded,
          carrier(),
        ],
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
          .pickUp({ prop: "crossbow", handle: "grip", hand: "right" }, "grip")
          .pickUp(
            { prop: "crossbow", handle: "foreEnd", hand: "left", lift: 0 },
            "support",
          )
          .act(
            "presentCrossbow",
            { target: { kind: "point", at: TARGET, frame: "world" } },
            "present",
          )
          .act(
            "shootCrossbow",
            {
              continuation: {
                source: "crossbow",
                prop: "bolt",
                onto: "flight",
                point: "mark",
              },
            },
            "cue",
          )
          .stand({ seconds: 0.6, sway: 0 }).node,
      });
      const cue: number = film.instant({ of: "cue", event: "strokeStart" });
      const from: number = film.instant({ of: "support", event: "end" });
      const inHand: (
        side: AutoMovieHumanSide,
        t: number,
      ) => IAutoMovieRigidTransform = (
        side: AutoMovieHumanSide,
        t: number,
      ): IAutoMovieRigidTransform =>
        HumanPropFrame.relative(
          HumanPropFrame.bone(film.bones("a", t).get(`${side}Hand`)!),
          film.prop("crossbow", t),
        );
      const onNock: (t: number) => IAutoMovieRigidTransform = (
        t: number,
      ): IAutoMovieRigidTransform =>
        HumanPropFrame.relative(film.prop("crossbow", t), film.prop("bolt", t));
      for (const side of ["right", "left"] as const) {
        const first: IAutoMovieRigidTransform = inHand(side, from);
        for (let i: number = 1; i <= 6; ++i) {
          const t: number = from + ((film.duration - from) * i) / 6;
          checks.check(
            `${label}: the ${side} hand keeps the crossbow at ${t.toFixed(2)}`,
            Vector3.distance(inHand(side, t).position, first.position) <= RIGID,
          );
        }
      }
      const seated: IAutoMovieRigidTransform = onNock(0);
      for (let i: number = 0; i <= 6; ++i) {
        const t: number = ((cue - 0.01) * i) / 6;
        checks.check(
          `${label}: the bolt stays nocked at ${t.toFixed(2)}`,
          Vector3.distance(onNock(t).position, seated.position) <= RIGID,
        );
      }
      checks.check(
        `${label}: the bolt does not jump at the cue`,
        Vector3.distance(
          film.prop("bolt", cue - 1e-4).position,
          film.prop("bolt", cue + 1e-4).position,
        ) <=
          SPEED * 2e-4 + RIGID,
      );
      checks.check(
        `${label}: the bolt leaves the nock after the cue`,
        Vector3.distance(onNock(cue + 0.1).position, seated.position) > 1,
      );
      const loosed: IAutoMovieVector3 = film.prop("bolt", cue).position;
      const crossing: IAutoMovieVector3 = film.prop(
        "bolt",
        cue + (TARGET.z - loosed.z) / SPEED,
      ).position;
      const miss: number = Math.hypot(
        crossing.x - TARGET.x,
        crossing.y - TARGET.y,
      );
      checks.check(
        `${label}: the bolt hits the face (${miss.toFixed(3)} m off centre)`,
        miss <= FACE,
      );
      assertTakeClean(`${label} crossbow take`, film);
    } catch (error: unknown) {
      checks.check(`${label} refused: ${String(error)}`, false);
    }
  }
  checks.assert("crossbow take");
}

/** The bolt's authored flight: a carrier travelling down range at `SPEED`; the bolt takes its travel from the cue. */
function carrier(): IAutoMovieMotionHumanProp {
  return {
    subject: "flight",
    frame: { position: { x: 0, y: 0, z: 0 }, rotation: Quaternion.identity() },
    points: {},
    affordances: [
      {
        id: "mark",
        kind: "socket",
        frame: Transform.of({ x: 0, y: 0, z: 0 }, Quaternion.identity()),
        extent: null,
      },
    ],
    motion: (seconds: number): IAutoMovieRigidTransform => ({
      position: { x: 0, y: 0, z: SPEED * seconds },
      rotation: Quaternion.identity(),
    }),
  };
}
