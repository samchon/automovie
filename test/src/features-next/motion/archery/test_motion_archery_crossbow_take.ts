import { createBow, createProjectile } from "@automovie/archetypes";
import { Quaternion, Transform, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";
import { HUMAN_LEXICON, HumanPropFrame } from "@automovie/motions/internal";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The counter top above the floor, metres: the website's counter band middle. */
const TOP: number = 0.914;
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
export function test_motion_archery_crossbow_take(): void {
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
      // The loaded crossbow lies on a counter in front of the shooter.
      // Its grip at the shooter's right, within reach across the counter.
      const placed: IAutoMovieRigidTransform = {
        position: Vector3.subtract(
          { x: -0.18, y: TOP + 0.03, z: 0.42 },
          crossbow.affordance("grip").frame.translation,
        ),
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
          // Spanned: the crank held a third of its travel back, the string
          // drawn off its rest, as the fixture stages a loaded crossbow.
          HumanObject.prop("crossbow", crossbow, placed, undefined, undefined, [
            {
              articulation: "crank",
              start: 0,
              duration: 0.01,
              travel: (): number => crossbow.affordance("crank").travel! / 3,
            },
          ]),
          loaded,
          carrier(),
        ],
        performers: [
          {
            subject: "a",
            body,
            // Close to the counter, as a performer takes things from it.
            at: { x: 0, y: 0, z: 0.12 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a")
          // Taken for its use: the rail continuing the forearm, as the
          // presentation will aim it, so the grip is one the wrist can
          // present from.
          .pickUp(
            {
              prop: "crossbow",
              handle: "grip",
              hand: "right",
              use: { tip: "rail", line: "forearm" },
            },
            "grip",
          )
          .pickUp(
            { prop: "crossbow", handle: "foreEnd", hand: "left", lift: 0 },
            "support",
          )
          .registered(
            "presentCrossbow",
            {
              gun: "crossbow",
              hand: "right",
              hands: 2,
              target: { kind: "point", at: TARGET, frame: "world" },
            },
            "present",
          )
          .registered(
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
          .stand({ hold: 0.6, sway: 0 }).node,
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
