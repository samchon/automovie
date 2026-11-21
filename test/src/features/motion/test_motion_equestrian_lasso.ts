import {
  EquineStance,
  createHorse,
  createLariat,
  createOx,
  rideHorse,
  rideQuadruped,
} from "@automovie/archetypes";
import { AutoMovieGravity, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanRide,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanHand,
  HumanLasso,
  HumanObject,
  HumanRefusal,
  HumanRide,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { archetypeHorseRide } from "../internal/archetypeHorseRide";
import { assertTakeClean } from "../internal/assertTakeClean";
import { motionHumanBody } from "../internal/motionHumanBody";
import { mountedHorseScene } from "../internal/mountedHorseScene";

/** Seconds the horse stands while the rider sits on. */
const WAIT: number = 6;

/**
 * Roping a running calf from a cantering horse, the dally and the horse's set back (#3952).
 *
 * Scenarios:
 * 1. The swing's turns are one stride apart: the swing events lie on the horse's own leading fore landings within a millisecond.
 * 2. The launched loop's projectile, read from the plan's launch under standard gravity, meets the calf's displayed head within 50 mm at the catch.
 * 3. Through the dally the right wrist stays within 0.15 m of the horn.
 * 4. In the set back after the catch every hoof that stays planted slides less than 5 mm, and the horse's hindquarters drop.
 * 5. A calf twenty metres off is refused on `target`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each scenario and bound.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the lasso law over an actual cantering horse at an actual running ox calf and reads the swing's timing against the horse's footfalls, the launched loop against the calf's displayed head, and the wrist against the horn; a swing off the stride, a missed catch or a dally away from the horn fails.
 * @evidence contracts/development/testing.md#independent-expectations The stride is the horse's own footfalls; the head is the calf's displayed part; the bounds are the campaign's.
 * @evidence contracts/development/testing.md#distinguishing-cases A reachable against an unreachable calf; the swing against the dally.
 * @evidence contracts/development/testing.md#execution-ownership In-memory films of one polygon man on archetype animals.
 */
export function test_motion_equestrian_lasso(): void {
  const findings: string[] = [];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const horse: mountedHorseScene.Horse = createHorse(
    { withersHeight: 1.65, stirrupDrop: 0.66, tempo: 0, tack: "trick" },
    8,
  );
  const course: mountedHorseScene.Ride = mountedHorseScene.course(
    horse,
    "canter",
  );
  const lariat: ReturnType<typeof createLariat> = createLariat();
  const calf = createOx({ mass: 120 } as Parameters<typeof createOx>[0], 5);
  const run = (ahead: number) =>
    rideQuadruped(calf, {
      start: { x: -3, z: ahead, heading: 0 },
      legs: [{ kind: "straight", length: 80 }],
      cruise: 0.71,
      startSpeed: 0.71,
      endSpeed: 0.71,
      acceleration: 1,
      deceleration: 1,
    } as Parameters<typeof rideQuadruped>[1]);
  const strides: { name: string; seconds: number }[] = archetypeHorseRide
    .footfalls(course, "leftFore")
    .map((seconds: number) => ({ name: "stride", seconds: WAIT + seconds }));
  const stage = (
    ahead: number,
    grip: IAutoMovieVector3,
    rope: boolean = true,
  ): {
    scene: mountedHorseScene.IScene;
    head: (at: number) => IAutoMovieVector3;
  } => {
    const calfRide = run(ahead);
    const local = (at: number): number =>
      Math.max(0, Math.min(calfRide.duration, at - WAIT));
    const place = (at: number): IAutoMovieRigidTransform => {
      const frame: IAutoMovieTransform = calfRide.at(local(at)).placement;
      return { position: frame.translation, rotation: frame.rotation };
    };
    const head = (id: string, at: number): IAutoMovieTransform => {
      return calfRide.frame(
        id as Parameters<typeof calfRide.frame>[0],
        local(at),
      );
    };
    // The ride, holding the lariat by its spoke from its end: a fixture as the precision-sport specs use.
    const holding: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanRide> = {
      ...HumanRide.ride,
      name: "lassoFixtureRide",
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRide>,
      ): IAutoMovieMotionHumanActionPlan => ({
        ...HumanRide.ride.plan(context),
        holds: [{ side: "right", prop: "lariat", from: 1 }],
      }),
    };
    const scene: mountedHorseScene.IScene = mountedHorseScene.build({
      horse,
      body,
      gait: "canter",
      wait: WAIT,
      course,
      cues: { stride: strides },
      laws: [holding, HumanLasso],
      props: [
        HumanObject.prop("calf", calf, place(0), place, head),
        HumanObject.prop("lariat", lariat, {
          position: Vector3.subtract(
            grip,
            lariat.affordance("spoke").frame.translation,
          ),
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        }),
      ],
      from: { x: 0.6, y: 0, z: -0.2 },
      acts: (seated) => {
        const ridden = seated.registered("lassoFixtureRide", {
          on: "horse",
          seconds: WAIT,
          seat: "seat",
          feet: { left: "leftStirrup", right: "rightStirrup" },
          hands: { left: "leftRein" },
        });
        return !rope
          ? ridden
          : ridden.registered("lasso", {
              on: "horse",
              frame: "seat",
              lariat: "lariat",
              target: { subject: "calf", contact: "head" },
              stride: "stride",
              swings: 3,
              dally: { horn: "horn", turns: 2 },
            });
      },
    });
    return {
      scene,
      head: (at: number): IAutoMovieVector3 => head("head", at).translation,
    };
  };
  // A dry take, without the throw, finds where the right hand rests as the lasso act begins and where the horse is at the release, three strides on; the calf walks so that it is 4 m ahead of the horse then.
  const dry = stage(0, { x: 0, y: -10, z: 0 }, false).scene;
  const begun: number = dry.segments[dry.segments.length - 1]!.end;
  const released: number =
    begun + 3 * (strides[1]!.seconds - strides[0]!.seconds);
  const near: number =
    course.at(Math.max(0, released - WAIT)).placement.translation.z +
    4 -
    0.71 * (released - WAIT);
  const staged = stage(
    near,
    HumanHand.frame(body, dry.film.bones("rider", begun), "right", "grip")
      .point,
  );
  const scene: mountedHorseScene.IScene = staged.scene;
  assertTakeClean("roping a running calf", scene.film);
  const take: IAutoMovieMotionHumanSegment =
    scene.segments[scene.segments.length - 1]!;
  const at = (name: string): number =>
    take.start +
    take.plan.events.find((e) => e.name === name)!.share *
      (take.end - take.start);

  // 1. The swing keeps the stride.
  for (const k of [0, 1, 2]) {
    const swing: number = at(`swing:${k}`);
    if (!strides.some((s) => Math.abs(s.seconds - swing) < 1e-3))
      findings.push(`swing ${k} at ${swing.toFixed(3)} s lies on no stride`);
  }

  // 2. The loop meets the calf's head at the catch.
  const launch = take.plan.launches![0]!;
  const caught: number = at("catch");
  const t: number = caught - launch.seconds;
  const loop: IAutoMovieVector3 = Vector3.add(
    Vector3.add(launch.point, Vector3.scale(launch.velocity, t)),
    { x: 0, y: -0.5 * AutoMovieGravity.STANDARD * t * t, z: 0 },
  );
  const calfHead: IAutoMovieVector3 = staged.head(caught);
  if (Vector3.distance(loop, calfHead) > 0.05)
    findings.push(
      `the loop misses the calf's head by ${Vector3.distance(loop, calfHead).toFixed(3)} m`,
    );

  // 3. The dally at the horn.
  for (let k: number = 1; k <= 6; ++k) {
    const s: number = caught + (2 * 0.5 * k) / 6;
    const wrist: number = Vector3.distance(
      HumanHand.frame(body, scene.film.bones("rider", s), "right", "palm")
        .point,
      scene.part("horn", s).translation,
    );
    if (wrist > 0.15)
      findings.push(
        `dally: the right palm is ${wrist.toFixed(3)} m from the horn at ${s.toFixed(2)} s`,
      );
  }

  // 4. The set back holds the rope with the hind hooves planted.
  const halt = rideHorse(
    horse,
    {
      start: { x: 0, z: 0, heading: 0 },
      cruise: 1.2,
      startSpeed: 0,
      endSpeed: 0,
      acceleration: 1,
      deceleration: 1,
      startFromStanding: true,
      legs: [{ kind: "straight", length: 2 }],
    },
    "walk",
  );
  const set = EquineStance.after(horse, halt, [
    {
      kind: "setBack",
      pitch: 12,
      from: halt.duration + 1,
      entry: 0.6,
      hold: 1,
      exit: 0.6,
    },
  ]);
  for (const limb of [
    "leftHind",
    "rightHind",
    "leftFore",
    "rightFore",
  ] as const) {
    const rest: IAutoMovieVector3 = archetypeHorseRide.hoof(
      set,
      limb,
      halt.duration + 0.9,
    );
    for (let k: number = 1; k <= 8; ++k) {
      const s: number = halt.duration + 1 + (2.2 * k) / 8;
      if (
        Vector3.distance(archetypeHorseRide.hoof(set, limb, s), rest) > 0.005
      ) {
        findings.push(`set back: the ${limb} hoof slides at ${s.toFixed(2)} s`);
        break;
      }
    }
  }
  const croup = (s: number): number =>
    Quaternion.rotateVector(set.at(s).placement.rotation, { x: 0, y: 0, z: 1 })
      .y;
  if (!(croup(halt.duration + 2) > croup(halt.duration + 0.9) + 0.05))
    findings.push("set back: the hindquarters do not drop");

  // 5. A calf out of reach.
  let error: unknown = null;
  try {
    const far: mountedHorseScene.IScene = stage(
      near + 20,
      HumanHand.frame(body, dry.film.bones("rider", begun), "right", "grip")
        .point,
    ).scene;
    far.film.bones("rider", far.film.duration - 0.1);
  } catch (failure) {
    error = failure;
  }
  if (!(error instanceof HumanRefusal && error.axis === "target"))
    findings.push(
      `an unreachable calf must be refused on target, got ${String(error)}`,
    );

  TestValidator.equals("roping from the saddle", findings, []);
}
