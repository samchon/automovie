import {
  AutoMovieArchetypeEquineStance,
  createHorse,
  createLariat,
  createOx,
  rideHorse,
  rideQuadruped,
} from "@automovie/archetypes";
import { AutoMovieGravity, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanArchery,
  AutoMovieMotionHumanMount,
  AutoMovieMotionHumanTouch,
  HumanObject,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { mountedHorseScene } from "../../../features/internal/mountedHorseScene";

/** Where the rider stands before sitting on, in the seat's frame on the floor. */
const FROM: IAutoMovieVector3 = { x: 0.6, y: 0, z: -0.2 };

/** Seconds the horse stands while the rider sits on. */
const WAIT: number = 6;

/** How near a working hand stays to the animal's part, metres: a hand's breadth round the part's centre. */
const HOLD: number = 0.15;

/**
 * Cattle work from the saddle (#3952): tie-down roping, steer wrestling and team roping, composed of the lasso, unseat and clasp laws over a running ox.
 *
 * Scenarios:
 * 0. The ox's `head` contact lies on the head's surface within 10 mm and its `horns` contact halfway between the two horns.
 * 1. Tie-down: the roper catches the calf's head and dallies; the standing rope, laid by `createLariat.standing` between the horn and the calf's head with 0.5 m of slack at the catch, keeps both ends at every sample, hangs slack just after the catch and is taut while the stopped horse sets back; the roper steps off onto the feet (hips at standing height within 30 mm), runs down the rope (hips within 0.6 m of its line) and holds the calf's hind leg (each wrist within 0.15 m).
 * 2. Steer wrestling: from the galloping horse the bulldogger takes the running steer's head with both hands (each wrist within 0.15 m of it), slides off onto the feet and keeps both hands on the head.
 * 3. Team roping: the header's loop meets the steer's head and the heeler's loop its hind legs at their catches within 50 mm, each read from its own launch under standard gravity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each event, its composition and bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the lasso, unseat and clasp laws with polygon men on actual horses at an actual running ox and reads the displayed hips and wrists against the ox's displayed parts and the launched loops against them; a missed catch, a rider left in the air or a hand off the animal fails.
 * @evidence contracts/development/testing.md#independent-expectations Every target is the ox's own displayed part; the bounds are the campaign's.
 * @evidence contracts/development/testing.md#distinguishing-cases A calf against a steer; one roper against a header and a heeler.
 * @evidence contracts/development/testing.md#execution-ownership In-memory films of polygon men on archetype animals.
 */
export function test_motion_mount_equestrian_cattle(): void {
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
  // The lariat waits on a rack where the standing rider's right hand rests and is picked up on the ground before mounting, as an author would: the hold rides the hand through sitting on and riding.
  const onRack: IAutoMovieMotionHumanProp = HumanObject.prop("lariat", lariat, {
    position: Vector3.subtract(
      mountedHorseScene.rack(horse, body, FROM),
      lariat.affordance("spoke").frame.translation,
    ),
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  });
  const pick: mountedHorseScene.Before = (chain) =>
    chain.pickUp({ prop: "lariat", handle: "spoke", hand: "right" });
  // Where an animal walking at the ox's 0.71 m/s must start to be beside the horse when the work begins, about the sit, the ride and two swings in: level with the horse a metre ahead.
  const MEET: number = 2 * WAIT + 1.5;
  const met = (horseRide: mountedHorseScene.Ride): number =>
    horseRide.at(Math.min(horseRide.duration, MEET - WAIT)).placement
      .translation.z +
    1 -
    0.71 * (MEET - WAIT);
  const ox = createOx({ mass: 250 } as Parameters<typeof createOx>[0], 5);
  const run = rideQuadruped(ox, {
    start: { x: -1.6, z: met(course), heading: 0 },
    legs: [{ kind: "straight", length: 80 }],
    cruise: 0.71,
    startSpeed: 0.71,
    endSpeed: 0.71,
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
    run.frame(id as Parameters<typeof run.frame>[0], local(at));
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

  // 0. The ox's roping contacts lie on its own geometry: the head's on the head's surface, the horns' halfway between the horns' roots, the heel loop's halfway between the hocks.
  const headPart = ox.parts.find((p) => p.id === "head")!;
  const headShape =
    headPart.geometry.type === "primitive" ? headPart.geometry.shape : null;
  const headRadius: number | undefined =
    headShape === null
      ? undefined
      : (Reflect.get(headShape, "radius") as number | undefined);
  const onHead: number = Vector3.distance(
    ox.affordance("head").frame.translation,
    headPart.transform!.translation,
  );
  if (headRadius === undefined || Math.abs(onHead - headRadius) > 0.01)
    findings.push(
      `ox: the head contact lies ${onHead.toFixed(3)} m from the head's centre, its radius ${headRadius}`,
    );
  const root = (id: string): IAutoMovieVector3 =>
    ox.parts.find((p) => p.id === id)!.transform!.translation;
  const hornsAt: IAutoMovieVector3 = ox.affordance("horns").frame.translation;
  if (
    Math.abs(
      Vector3.distance(hornsAt, root("leftHorn")) -
        Vector3.distance(hornsAt, root("rightHorn")),
    ) > 1e-6
  )
    findings.push("ox: the horns' contact is not halfway between the horns");
  // 1. Tie-down: catch, the horse stops and sets back on the rope, the roper steps off, runs down the rope and holds the hind leg.
  const stopping: mountedHorseScene.Ride = rideHorse(horse, {
    start: { x: 0, z: 0, heading: 0 },
    legs: [
      { kind: "straight", length: 24 },
      { kind: "straight", length: 8 },
      { kind: "straight", length: 3 },
    ],
    // From the canter through the walk to a square halt, which a set back starts from.
    speeds: [5, 1.2, 0],
    cruise: 5,
    startSpeed: 5,
    acceleration: 2,
    deceleration: 2.5,
  });
  const tieCourse: mountedHorseScene.Ride =
    AutoMovieArchetypeEquineStance.after(horse, stopping, [
      {
        kind: "setBack",
        pitch: 6,
        from: stopping.duration + 0.2,
        entry: 0.5,
        hold: 4,
        exit: 0.5,
      },
    ]);
  const fleeing = rideQuadruped(ox, {
    start: { x: -1.6, z: met(stopping), heading: 0 },
    legs: [{ kind: "straight", length: 40 }],
    cruise: 0.71,
    startSpeed: 0.71,
    endSpeed: 0.71,
    acceleration: 1,
    deceleration: 1.5,
  } as Parameters<typeof rideQuadruped>[1]);
  const fleeAt = (at: number): number =>
    Math.max(0, Math.min(fleeing.duration, at - WAIT));
  const fleePlace = (at: number): IAutoMovieRigidTransform => {
    const frame: IAutoMovieTransform = fleeing.at(fleeAt(at)).placement;
    return { position: frame.translation, rotation: frame.rotation };
  };
  const fleePart = (id: string, at: number): IAutoMovieTransform =>
    fleeing.frame(id as Parameters<typeof fleeing.frame>[0], fleeAt(at));
  const calfStop: IAutoMovieVector3 = fleePlace(
    WAIT + fleeing.duration,
  ).position;
  const tie: mountedHorseScene.IScene = mountedHorseScene.build({
    horse,
    body,
    gait: "canter",
    wait: WAIT,
    course: tieCourse,
    laws: [
      AutoMovieMotionHumanArchery.HumanLasso,
      AutoMovieMotionHumanMount.unseat,
      AutoMovieMotionHumanTouch.HumanClasp,
    ],
    props: [
      HumanObject.prop("calf", ox, fleePlace(0), fleePlace, fleePart),
      onRack,
    ],
    from: FROM,
    before: pick,
    acts: (seated) =>
      seated
        .registered("ride", {
          on: "horse",
          duration: WAIT,
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
          side: "left",
          release: 0.2,
        })
        .walk({ to: { x: calfStop.x + 0.6, y: 0, z: calfStop.z - 0.8 } })
        .registered("clasp", {
          duration: 2,
          left: { subject: "calf", contact: "hind" },
          right: { subject: "calf", contact: "hind" },
        }),
  });
  assertTakeClean("tie-down roping", tie.film);
  const tied: IAutoMovieMotionHumanSegment[] =
    tie.segments as IAutoMovieMotionHumanSegment[];
  const roped: IAutoMovieMotionHumanSegment = tied.find((s) =>
    s.plan.events.some((e) => e.name === "catch"),
  )!;
  const caught: number =
    roped.start +
    roped.plan.events.find((e) => e.name === "catch")!.share *
      (roped.end - roped.start);
  const head = (at: number): IAutoMovieVector3 =>
    fleePart("head", at).translation;
  const length: number =
    Vector3.distance(tie.part("horn", caught).translation, head(caught)) + 0.5;
  // The rope: its ends on the horn and the catch at every sample, slack just after the catch, taut while the horse sets back.
  for (let k: number = 0; k <= 20; ++k) {
    const at: number = caught + ((tie.film.duration - caught) * k) / 20;
    const rope: createLariat.IStanding = createLariat.standing(
      tie.part("horn", at).translation,
      head(at),
      length,
    );
    if (
      Vector3.distance(rope.points[0]!, tie.part("horn", at).translation) >
        1e-9 ||
      Vector3.distance(rope.points.at(-1)!, head(at)) > 1e-9
    )
      findings.push(`tie-down: the rope leaves its ends at ${at.toFixed(2)} s`);
  }
  if (
    createLariat.standing(
      tie.part("horn", caught + 0.1).translation,
      head(caught + 0.1),
      length,
    ).taut
  )
    findings.push("tie-down: the rope is taut before the horse sets back");
  const holdBack: number = WAIT + stopping.duration + 2;
  if (
    !createLariat.standing(
      tie.part("horn", holdBack).translation,
      head(holdBack),
      length,
    ).taut
  )
    findings.push("tie-down: the rope is slack while the horse sets back");
  // The roper steps off onto the feet and runs down the rope: the hips stay within 0.6 m of the rope's line.
  const off: IAutoMovieMotionHumanSegment = tied[tied.length - 3]!;
  const stood: number = tie.film.bones("rider", off.end - 0.01).get("hips")!
    .worldPosition.y;
  if (Math.abs(stood - body.measure.hipHeight) > 0.03)
    findings.push(
      `tie-down: the roper steps off with the hips at ${stood.toFixed(3)} m`,
    );
  const runDown: IAutoMovieMotionHumanSegment = tied[tied.length - 2]!;
  for (let k: number = 1; k <= 8; ++k) {
    const at: number = runDown.start + ((runDown.end - runDown.start) * k) / 8;
    const a: IAutoMovieVector3 = tie.part("horn", at).translation;
    const b: IAutoMovieVector3 = head(at);
    const p: IAutoMovieVector3 = tie.film
      .bones("rider", at)
      .get("hips")!.worldPosition;
    const ab: IAutoMovieVector3 = { x: b.x - a.x, y: 0, z: b.z - a.z };
    const u: number = Math.max(
      0,
      Math.min(
        1,
        ((p.x - a.x) * ab.x + (p.z - a.z) * ab.z) / (ab.x * ab.x + ab.z * ab.z),
      ),
    );
    const off2: number = Math.hypot(
      p.x - (a.x + u * ab.x),
      p.z - (a.z + u * ab.z),
    );
    if (off2 > 0.6)
      findings.push(
        `tie-down: running down the rope the roper is ${off2.toFixed(3)} m off it at ${at.toFixed(2)} s`,
      );
  }
  const holdAt: number = tied[tied.length - 1]!.end - 0.5;
  for (const w of wrists(tie, "rider", holdAt))
    if (Vector3.distance(w, fleePart("hind", holdAt).translation) > HOLD)
      findings.push("tie-down: a hand is off the calf's hind leg");
  // 2. Steer wrestling: hands on the head from the saddle, off onto the feet, hands still on the head.
  const wrestle: mountedHorseScene.IScene = mountedHorseScene.build({
    horse,
    body,
    gait: "canter",
    wait: WAIT,
    course,
    laws: [
      AutoMovieMotionHumanMount.unseat,
      AutoMovieMotionHumanTouch.HumanClasp,
    ],
    props: [HumanObject.prop("steer", ox, place(0), place, part)],
    from: FROM,
    acts: (seated) =>
      seated
        .registered("ride", {
          on: "horse",
          duration: WAIT,
          seat: "seat",
          feet: { left: "leftStirrup", right: "rightStirrup" },
          hands: { left: "leftRein", right: "rightRein" },
        })
        .registered("clasp", {
          on: "horse",
          frame: "seat",
          duration: 1,
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
          duration: 1.5,
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
    laws: [AutoMovieMotionHumanArchery.HumanLasso],
    props: [HumanObject.prop("steer", ox, place(0), place, part), onRack],
    from: FROM,
    before: pick,
    acts: (seated) =>
      seated
        .registered("ride", {
          on: "horse",
          duration: WAIT,
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
    laws: [AutoMovieMotionHumanArchery.HumanLasso],
    props: [HumanObject.prop("steer", ox, place(0), place, part), onRack],
    from: FROM,
    before: pick,
    acts: (seated) =>
      seated
        .registered("ride", {
          on: "horse",
          duration: WAIT + 1,
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
