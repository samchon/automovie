import { createHorse, rideHorse } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanSegment,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanRefusal, HumanSignature } from "@automovie/motions";
import { HumanFoot, HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { mountedHorseScene } from "../../../features/internal/mountedHorseScene";

/** The campaign's held-contact bound, metres. */
const CONTACT: number = 0.01;

/** Seconds the horse stands while the rider sits on. */
const WAIT: number = 6;

/** Seconds from each aid's onset to the transition it cues: the author's. */
const LATENCY: number = 0.4;

/** The stirrups and reins the rider keeps. */
const HOLD: IAutoMovieMotionHumanMounted.ISupports = {
  leftFoot: "leftStirrup",
  rightFoot: "rightStirrup",
  leftHand: "leftRein",
  rightHand: "rightRein",
};

/**
 * Visible aids that cue a ridden horse's transitions: a leg squeeze before
 * the walk-to-trot change and a take-up of both reins before the
 * trot-to-walk change, each `LATENCY` ahead of the horse's own change and
 * released after it.
 *
 * Scenarios:
 * 1. Each aid's event lies `LATENCY` before the horse's own gait change, read from the ride's published `gait:` instants, at the left fore landing that begins the new gait.
 * 2. The displayed heel leaves its rest in the stirrup's frame by more than 5 mm only after the squeeze's onset, while the ball of the foot stays within 10 mm of the tread through the whole aid (the campaign's held-contact bound).
 * 3. The displayed palm draws back along its rein by more than 20 mm at the downward change and is back within 10 mm of its run half a second later: the rein is given back after the horse responds.
 * 4. In a second take a left kick moves the left heel more than 5 mm and more than twice the right while the left ball stays within 10 mm of its tread; at the downward change an opening left rein carries the left hand more than 20 mm outward and a right neck rein the right hand more than 20 mm toward the left; a seat aid tips the trunk more than 2 degrees back against the saddle; and a voice cue's event lies `LATENCY` before the change.
 * 5. A take that requires aided riding on the upward changes but aids only the downward one is refused on `aided`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the takes, their five scenarios and each bound's source.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the mounted law's aids over an actual horse whose course changes gait, and reads the displayed heel, ball and palm against the moving stirrups and reins and the horse's own change instants; an aid at the wrong time, a foot off its stirrup, a rein never given back or an unaided transition accepted fails.
 * @evidence contracts/development/testing.md#independent-expectations The transitions are the archetype ride's own instants; the latency is the authored input; the contact bounds are the campaign's.
 * @evidence contracts/development/testing.md#distinguishing-cases A leg aid against a hand aid, the aided side against the other, outward against across the neck, before against after the onset, an aided against an unaided required transition.
 * @evidence contracts/development/testing.md#execution-ownership Two in-memory films of one polygon man over one archetype ride, plus one refused plan.
 */
export function test_motion_mount_equestrian_aids(): void {
  const findings: string[] = [];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const horse: mountedHorseScene.Horse = createHorse(
    { withersHeight: 1.65, stirrupDrop: 0.66, tempo: 0 },
    8,
  );
  const course: mountedHorseScene.Ride = rideHorse(horse, {
    start: { x: 0, z: 0, heading: 0 },
    legs: [
      { kind: "straight", length: 8 },
      { kind: "straight", length: 24 },
      { kind: "straight", length: 10 },
      { kind: "straight", length: 6 },
    ],
    speeds: [1.4, 3.4, 1.4, 1.4],
    cruise: 3.4,
    startSpeed: 1.4,
    acceleration: 1,
    deceleration: 1,
  });
  const changes = (label: string): number[] =>
    course.instants
      .filter((e): boolean => e.label === label)
      .map((e): number => WAIT + e.seconds);
  const up: number[] = changes("gait:walk-trot");
  const down: number[] = changes("gait:trot-walk");
  const cues: Record<string, { name: string; seconds: number }[]> = {
    up: up.map((seconds: number) => ({ name: "walk-trot", seconds })),
    down: down.map((seconds: number) => ({ name: "trot-walk", seconds })),
  };
  const aids: IAutoMovieMotionHumanMounted.IAid[] = [
    { kind: "squeeze", cue: "up", latency: LATENCY },
    { kind: "takeUp", cue: "down", latency: LATENCY },
  ];
  const scene: mountedHorseScene.IScene = stage(
    horse,
    body,
    course,
    cues,
    aids,
  );
  const take: IAutoMovieMotionHumanSegment =
    scene.segments[scene.segments.length - 1]!;
  const span: number = take.end - take.start;
  const event = (name: string): number | undefined => {
    const found = take.plan.events.find((e): boolean =>
      e.name.startsWith(name),
    );
    return found === undefined ? undefined : take.start + found.share * span;
  };

  // 1. The aids' onsets lead the horse's own changes by the latency.
  const squeeze: number | undefined = event("aid:squeeze");
  const takeUp: number | undefined = event("aid:takeUp");
  if (
    up.length !== 1 ||
    down.length !== 1 ||
    squeeze === undefined ||
    takeUp === undefined ||
    Math.abs(up[0]! - squeeze - LATENCY) > 1e-6 ||
    Math.abs(down[0]! - takeUp - LATENCY) > 1e-6
  )
    findings.push(
      `aids at ${squeeze} and ${takeUp}, changes at ${JSON.stringify(up)} and ${JSON.stringify(down)} among ${course.instants
        .filter((e) => e.label.startsWith("gait:"))
        .map((e) => e.label)
        .join(", ")}`,
    );

  // 2. The squeeze moves the heel about the ball in the stirrup.
  const socket = (
    side: "left" | "right",
    name: IAutoMovieMotionHumanFoot.ISocket["socket"],
    at: number,
  ): IAutoMovieVector3 =>
    mountedHorseScene.local(
      scene.part(`${side}Stirrup`, at),
      HumanFoot.sockets(
        body,
        HumanSignature.bones(scene.reader, at),
        side,
      ).find(
        (s: IAutoMovieMotionHumanFoot.ISocket): boolean => s.socket === name,
      )!.point,
    );
  if (squeeze !== undefined) {
    const rest: IAutoMovieVector3 = socket("left", "heel", squeeze - 0.3);
    const ball: IAutoMovieVector3 = socket("left", "ball", squeeze - 0.3);
    let moved: number | undefined;
    for (let k: number = -12; k <= 60; ++k) {
      const at: number = squeeze + k / 60;
      if (
        moved === undefined &&
        Vector3.distance(socket("left", "heel", at), rest) > 0.005
      )
        moved = at;
      if (Vector3.distance(socket("left", "ball", at), ball) > CONTACT)
        findings.push(
          `squeeze: the left ball leaves its stirrup at ${at.toFixed(3)} s`,
        );
    }
    if (moved === undefined || moved < squeeze - 1 / 60)
      findings.push(
        `squeeze: the heel moves at ${moved}, the aid begins at ${squeeze.toFixed(3)} s`,
      );
  }

  // 3. The take-up draws the rein back and gives it again.
  const run = (side: "left" | "right", at: number): number => {
    const hand = scene.film.bones("rider", at).get(`${side}Hand`)!;
    const palm: IAutoMovieVector3 = Vector3.add(
      hand.worldPosition,
      Quaternion.rotateVector(
        hand.worldRotation,
        HumanHand.offset(body, side, "palm").point,
      ),
    );
    const rein: IAutoMovieTransform = scene.part(`${side}Rein`, at);
    return Vector3.dot(
      Vector3.subtract(palm, rein.translation),
      Quaternion.rotateVector(rein.rotation, { x: 1, y: 0, z: 0 }),
    );
  };
  if (takeUp !== undefined)
    for (const side of ["left", "right"] as const) {
      const before: number = run(side, takeUp - 0.2);
      if (!(before - run(side, down[0]!) > 0.02))
        findings.push(
          `take-up: the ${side} palm draws back only ${(before - run(side, down[0]!)).toFixed(3)} m`,
        );
      if (Math.abs(run(side, down[0]! + 0.5) - before) > CONTACT)
        findings.push(
          `take-up: the ${side} rein is not given back after the change`,
        );
    }

  // 4. The other aids, in a second take: a left kick before the upward change; an opening left rein, a right neck rein, a seat aid and a voice cue before the downward one.
  const other: mountedHorseScene.IScene = stage(horse, body, course, cues, [
    { kind: "kick", side: "left", cue: "up", latency: LATENCY },
    { kind: "openRein", side: "left", cue: "down", latency: LATENCY },
    { kind: "neckRein", side: "right", cue: "down", latency: LATENCY },
    { kind: "seat", cue: "down", latency: LATENCY },
    { kind: "voice", cue: "down", latency: LATENCY },
  ]);
  const second: IAutoMovieMotionHumanSegment =
    other.segments[other.segments.length - 1]!;
  const named = (name: string): number | undefined => {
    const found = second.plan.events.find((e): boolean =>
      e.name.startsWith(name),
    );
    return found === undefined
      ? undefined
      : second.start + found.share * (second.end - second.start);
  };
  const voiced: number | undefined = named("aid:voice");
  if (voiced === undefined || Math.abs(down[0]! - voiced - LATENCY) > 1e-6)
    findings.push(
      `the voice cue is at ${voiced}, wanted ${down[0]! - LATENCY}`,
    );
  const kicked: number = up[0]!;
  const toe = (
    side: "left" | "right",
    name: IAutoMovieMotionHumanFoot.ISocket["socket"],
    at: number,
  ): IAutoMovieVector3 =>
    mountedHorseScene.local(
      other.part(`${side}Stirrup`, at),
      HumanFoot.sockets(
        body,
        HumanSignature.bones(other.reader, at),
        side,
      ).find(
        (s: IAutoMovieMotionHumanFoot.ISocket): boolean => s.socket === name,
      )!.point,
    );
  const heel = (side: "left" | "right"): number =>
    Vector3.distance(
      toe(side, "heel", kicked),
      toe(side, "heel", kicked - LATENCY - 0.3),
    );
  if (!(heel("left") > 0.005 && heel("left") > 2 * heel("right")))
    findings.push(
      `kick: the left heel moves ${heel("left").toFixed(4)} m, the right ${heel("right").toFixed(4)} m`,
    );
  if (
    Vector3.distance(
      toe("left", "ball", kicked),
      toe("left", "ball", kicked - LATENCY - 0.3),
    ) > CONTACT
  )
    findings.push("kick: the left ball leaves its stirrup");
  const across = (side: "left" | "right", at: number): IAutoMovieVector3 =>
    mountedHorseScene.local(
      other.part("seat", at),
      mountedHorseScene.joint(other, `${side}Hand`, at),
    );
  const calm: number = down[0]! - LATENCY - 0.2;
  const outward: number =
    (across("left", down[0]!).x - across("left", calm).x) *
    Math.sign(across("left", calm).x - across("right", calm).x);
  const over: number =
    (across("right", down[0]!).x - across("right", calm).x) *
    Math.sign(across("left", calm).x - across("right", calm).x);
  if (!(outward > 0.02 && over > 0.02))
    findings.push(
      `the opening left rein moves the left hand ${outward.toFixed(3)} m outward and the right neck rein the right hand ${over.toFixed(3)} m toward the left`,
    );
  const tilt = (at: number): number => {
    const up3: IAutoMovieVector3 = mountedHorseScene.turned(
      other.part("seat", at),
      Vector3.subtract(
        Vector3.lerp(
          mountedHorseScene.joint(other, "leftUpperArm", at),
          mountedHorseScene.joint(other, "rightUpperArm", at),
          0.5,
        ),
        Vector3.lerp(
          mountedHorseScene.joint(other, "leftUpperLeg", at),
          mountedHorseScene.joint(other, "rightUpperLeg", at),
          0.5,
        ),
      ),
    );
    return (Math.atan2(up3.z, up3.y) * 180) / Math.PI;
  };
  if (!(tilt(calm) - tilt(down[0]!) > 2))
    findings.push(
      `the seat aid tips the trunk ${(tilt(calm) - tilt(down[0]!)).toFixed(1)} degrees back`,
    );

  // 5. A required transition without its aid is refused.
  let error: unknown = null;
  try {
    const bare: mountedHorseScene.IScene = stage(
      horse,
      body,
      course,
      cues,
      [aids[1]!],
      "up",
    );
    bare.film.bones("rider", bare.film.duration - 0.1);
  } catch (failure) {
    error = failure;
  }
  if (!(error instanceof HumanRefusal && error.axis === "aided"))
    findings.push(
      `an unaided required change must be refused on aided, got ${String(error)}`,
    );

  assertTakeClean("the aided take", scene.film);
  assertTakeClean("the second aided take", other.film);
  TestValidator.equals("aids that cue the horse's transitions", findings, []);
}

/** Sit, ride on with the stirrups and reins, then hold the seat while the aids cue the horse's changes. */
function stage(
  horse: mountedHorseScene.Horse,
  body: IAutoMovieMotionHumanBody,
  course: mountedHorseScene.Ride,
  cues: Record<string, { name: string; seconds: number }[]>,
  aids: IAutoMovieMotionHumanMounted.IAid[],
  aided?: string,
): mountedHorseScene.IScene {
  return mountedHorseScene.build({
    horse,
    body,
    gait: "walk",
    wait: WAIT,
    course,
    cues,
    from: { x: 0.6, y: 0, z: -0.2 },
    acts: (seated) =>
      seated
        .registered("ride", {
          on: "horse",
          duration: 0.6,
          seat: "seat",
          feet: { left: "leftStirrup", right: "rightStirrup" },
          hands: { left: "leftRein", right: "rightRein" },
        })
        .registered("mounted", {
          on: "horse",
          frame: "seat",
          aids,
          ...(aided === undefined ? {} : { aided }),
          figures: [
            {
              seat: "entered",
              transfer: 0.3,
              hold: course.duration + WAIT - 4,
              supports: HOLD,
            },
          ],
        }),
  });
}
