import {
  createHorse,
  createLariat,
  createOx,
  rideQuadruped,
} from "@automovie/archetypes";
import { AutoMovieGravity, Vector3 } from "@automovie/engine";
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
  HumanClasp,
  HumanLasso,
  HumanObject,
  HumanRide,
  HumanUnseat,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../internal/assertTakeClean";
import { motionHumanBody } from "../internal/motionHumanBody";
import { mountedHorseScene } from "../internal/mountedHorseScene";

/** Seconds the horse stands while the rider sits on. */
const WAIT: number = 6;

/** How near a working hand stays to the animal's part, metres: a hand's breadth round the part's centre. */
const HOLD: number = 0.15;

/**
 * Cattle work from the saddle (#3952): tie-down roping, steer wrestling and team roping, composed of the lasso, unseat and clasp laws over a running ox.
 *
 * Scenarios:
 * 1. Tie-down: the roper catches the calf's head, steps off the stopping horse onto the feet (hips at standing height within 30 mm), and holds the calf's hind leg with both hands, each wrist within 0.15 m of it.
 * 2. Steer wrestling: from the galloping horse the bulldogger takes the running steer's head with both hands (each wrist within 0.15 m of it), slides off onto the feet and keeps both hands on the head.
 * 3. Team roping: the header's loop meets the steer's head and the heeler's loop its hind legs at their catches within 50 mm, each read from its own launch under standard gravity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each event, its composition and bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the lasso, unseat and clasp laws with polygon men on actual horses at an actual running ox and reads the displayed hips and wrists against the ox's displayed parts and the launched loops against them; a missed catch, a rider left in the air or a hand off the animal fails.
 * @evidence contracts/development/testing.md#independent-expectations Every target is the ox's own displayed part; the bounds are the campaign's.
 * @evidence contracts/development/testing.md#distinguishing-cases A calf against a steer; one roper against a header and a heeler.
 * @evidence contracts/development/testing.md#execution-ownership In-memory films of polygon men on archetype animals.
 */
export function test_motion_equestrian_cattle(): void {
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
  const ox = createOx({ mass: 250 } as Parameters<typeof createOx>[0], 5);
  const run = rideQuadruped(ox, {
    start: { x: -1.6, z: 3, heading: 0 },
    legs: [{ kind: "straight", length: 80 }],
    cruise: 5,
    startSpeed: 5,
    endSpeed: 5,
    acceleration: 1,
    deceleration: 1,
  } as Parameters<typeof rideQuadruped>[1]);
  const local = (at: number): number =>
    Math.max(0, Math.min(run.duration, at - WAIT));
  const place = (at: number): IAutoMovieRigidTransform => {
    const frame: IAutoMovieTransform = run.at(local(at)).placement;
    return { position: frame.translation, rotation: frame.rotation };
  };
  const part = (id: string, at: number): IAutoMovieTransform =>
    run
      .at(local(at))
      .archetype.parts.find((p) => p.id.toLowerCase().includes(id))!
      .transform as IAutoMovieTransform;
  const point = (id: string, at: number): IAutoMovieVector3 =>
    part(id, at).translation;
  const wrists = (
    scene: mountedHorseScene.IScene,
    who: string,
    at: number,
  ): IAutoMovieVector3[] =>
    (["left", "right"] as const).map(
      (side) => scene.film.bones(who, at).get(`${side}Hand`)!.worldPosition,
    );
  // The ride, holding the lariat by its spoke from its end: a fixture as the precision-sport specs use.
  const holding: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanRide> = {
    ...HumanRide.ride,
    name: "cattleFixtureRide",
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRide>,
    ): IAutoMovieMotionHumanActionPlan => ({
      ...HumanRide.ride.plan(context),
      holds: [{ side: "right", prop: "lariat", from: 1 }],
    }),
  };

  // 1. Tie-down: catch, step off, hold the hind leg.
  const tie: mountedHorseScene.IScene = mountedHorseScene.build({
    horse,
    body,
    gait: "canter",
    wait: WAIT,
    course,
    laws: [holding, HumanLasso, HumanUnseat, HumanClasp],
    props: [
      HumanObject.prop("calf", ox, place(0), place, part),
      HumanObject.prop("lariat", lariat, {
        position: { x: -0.3, y: 2, z: 0.2 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      }),
    ],
    from: { x: 0.6, y: 0, z: -0.2 },
    acts: (seated) =>
      seated
        .registered("cattleFixtureRide", {
          on: "horse",
          seconds: WAIT,
          seat: "seat",
          feet: { left: "leftStirrup", right: "rightStirrup" },
          hands: { left: "leftRein" },
        })
        .registered("lasso", {
          on: "horse",
          frame: "seat",
          lariat: "lariat",
          target: { subject: "calf", contact: "head" },
          swings: 2,
          dally: { horn: "horn", turns: 1 },
        })
        .registered("unseat", {
          on: "horse",
          frame: "seat",
          fall: "clear",
          side: "right",
          release: 0.2,
        })
        .registered("clasp", {
          seconds: 2,
          left: { subject: "calf", contact: "hind" },
          right: { subject: "calf", contact: "hind" },
        }),
  });
  assertTakeClean("tie-down roping", tie.film);
  const tied: IAutoMovieMotionHumanSegment[] =
    tie.segments as IAutoMovieMotionHumanSegment[];
  const off: IAutoMovieMotionHumanSegment = tied[tied.length - 2]!;
  const stood: number = tie.film.bones("rider", off.end - 0.01).get("hips")!
    .worldPosition.y;
  if (Math.abs(stood - body.measure.hipHeight) > 0.03)
    findings.push(
      `tie-down: the roper steps off with the hips at ${stood.toFixed(3)} m`,
    );
  const holdAt: number = tied[tied.length - 1]!.end - 0.5;
  for (const w of wrists(tie, "rider", holdAt))
    if (Vector3.distance(w, point("hind", holdAt)) > HOLD)
      findings.push("tie-down: a hand is off the calf's hind leg");

  // 2. Steer wrestling: hands on the head from the saddle, off onto the feet, hands still on the head.
  const wrestle: mountedHorseScene.IScene = mountedHorseScene.build({
    horse,
    body,
    gait: "canter",
    wait: WAIT,
    course,
    laws: [HumanUnseat, HumanClasp],
    props: [HumanObject.prop("steer", ox, place(0), place, part)],
    from: { x: 0.6, y: 0, z: -0.2 },
    acts: (seated) =>
      seated
        .registered("ride", {
          on: "horse",
          seconds: WAIT,
          seat: "seat",
          feet: { left: "leftStirrup", right: "rightStirrup" },
          hands: { left: "leftRein", right: "rightRein" },
        })
        .registered("clasp", {
          on: "horse",
          frame: "seat",
          seconds: 1,
          left: { subject: "steer", contact: "head" },
          right: { subject: "steer", contact: "head" },
        })
        .registered("unseat", {
          on: "horse",
          frame: "seat",
          fall: "clear",
          side: "right",
        })
        .registered("clasp", {
          seconds: 1.5,
          left: { subject: "steer", contact: "head" },
          right: { subject: "steer", contact: "head" },
        }),
  });
  assertTakeClean("steer wrestling", wrestle.film);
  const steps: IAutoMovieMotionHumanSegment[] =
    wrestle.segments as IAutoMovieMotionHumanSegment[];
  for (const segment of [steps[steps.length - 3]!, steps[steps.length - 1]!]) {
    const at: number = segment.end - 0.2;
    for (const w of wrists(wrestle, "rider", at))
      if (Vector3.distance(w, point("head", at)) > HOLD)
        findings.push(
          `steer wrestling: a hand is off the steer's head at ${at.toFixed(2)} s`,
        );
  }

  // 3. Team roping: the header's loop at the head, the heeler's at the hind legs.
  const team: mountedHorseScene.IScene = mountedHorseScene.build({
    horse,
    body,
    gait: "canter",
    wait: WAIT,
    course,
    laws: [holding, HumanLasso],
    props: [
      HumanObject.prop("steer", ox, place(0), place, part),
      HumanObject.prop("lariat", lariat, {
        position: { x: -0.3, y: 2, z: 0.2 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      }),
    ],
    from: { x: 0.6, y: 0, z: -0.2 },
    acts: (seated) =>
      seated
        .registered("cattleFixtureRide", {
          on: "horse",
          seconds: WAIT,
          seat: "seat",
          feet: { left: "leftStirrup", right: "rightStirrup" },
          hands: { left: "leftRein" },
        })
        .registered("lasso", {
          on: "horse",
          frame: "seat",
          lariat: "lariat",
          target: { subject: "steer", contact: "head" },
          swings: 2,
        }),
  });
  const throwAt = (scene: mountedHorseScene.IScene, contact: string): void => {
    const take: IAutoMovieMotionHumanSegment =
      scene.segments[scene.segments.length - 1]!;
    const launch = take.plan.launches![0]!;
    const caught: number =
      take.start +
      take.plan.events.find((e) => e.name === "catch")!.share *
        (take.end - take.start);
    const t: number = caught - launch.seconds;
    const loop: IAutoMovieVector3 = Vector3.add(
      Vector3.add(launch.point, Vector3.scale(launch.velocity, t)),
      { x: 0, y: -0.5 * AutoMovieGravity.STANDARD * t * t, z: 0 },
    );
    if (Vector3.distance(loop, point(contact, caught)) > 0.05)
      findings.push(
        `team roping: the ${contact} loop misses by ${Vector3.distance(loop, point(contact, caught)).toFixed(3)} m`,
      );
  };
  throwAt(team, "head");
  const heeler: mountedHorseScene.IScene = mountedHorseScene.build({
    horse,
    body,
    gait: "canter",
    wait: WAIT,
    course,
    laws: [holding, HumanLasso],
    props: [
      HumanObject.prop("steer", ox, place(0), place, part),
      HumanObject.prop("lariat", lariat, {
        position: { x: -0.3, y: 2, z: 0.2 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      }),
    ],
    from: { x: 0.6, y: 0, z: -0.2 },
    acts: (seated) =>
      seated
        .registered("cattleFixtureRide", {
          on: "horse",
          seconds: WAIT + 1,
          seat: "seat",
          feet: { left: "leftStirrup", right: "rightStirrup" },
          hands: { left: "leftRein" },
        })
        .registered("lasso", {
          on: "horse",
          frame: "seat",
          lariat: "lariat",
          target: { subject: "steer", contact: "hind" },
          swings: 2,
        }),
  });
  throwAt(heeler, "hind");

  TestValidator.equals("cattle work from the saddle", findings, []);
}
