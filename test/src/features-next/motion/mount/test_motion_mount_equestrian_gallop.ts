import { createHorse } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanRide,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanSignature } from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { archetypeHorseRide } from "../../../features/internal/archetypeHorseRide";
import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { mountedHorseScene } from "../../../features/internal/mountedHorseScene";

/** The campaign's held-contact bound, metres. */
const CONTACT: number = 0.01;

/** Seconds the horse stands while the rider sits on. */
const WAIT: number = 6;

/**
 * Riding the gallop (#3949): seated with the ride's gallop response, then in the racing crouch out of the saddle.
 *
 * Scenarios:
 * 1. Seated at the gallop, the pelvis rocks against the saddle by more than a degree over each stride, and its roll against the saddle on a left lead runs opposite to the same ride on a right lead (their correlation is negative).
 * 2. Seated at the gallop the seat region stays within 10 mm of the saddle and both balls within 10 mm of their stirrups' treads.
 * 3. In the crouch at the gallop the seat region stays above the saddle by more than 30 mm, both balls on their treads within 10 mm, and both wrists within 0.7 hand lengths of their reins.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two seats, their checks and each bound's source.
 * @evidence contracts/development/testing.md#behavioral-verification Rides an actual galloping horse with the ride's gallop strides keyed to its own leading fore landings and with the mounted crouch, and reads the displayed pelvis, seat, balls and wrists against its moving saddle, stirrups and reins; no rocking, a roll blind to the lead, or a lost contact fails.
 * @evidence contracts/development/testing.md#independent-expectations The strides are the ride's own footfalls; the lead's side is the authored one; the bounds are the campaign's and the crouch's clearance.
 * @evidence contracts/development/testing.md#distinguishing-cases A left against a right lead; seated against crouched.
 * @evidence contracts/development/testing.md#execution-ownership In-memory films of one polygon man on one archetype horse.
 */
export function test_motion_mount_equestrian_gallop(): void {
  const findings: string[] = [];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const horse: mountedHorseScene.Horse = createHorse(
    { withersHeight: 1.65, stirrupDrop: 0.66, tempo: 0 },
    8,
  );
  const course: mountedHorseScene.Ride = mountedHorseScene.course(
    horse,
    "gallop",
  );
  const landings: { name: string; seconds: number }[] = archetypeHorseRide
    .footfalls(course, "leftFore")
    .map((seconds: number) => ({ name: "lead", seconds: WAIT + seconds }));
  const seated = (
    lead: IAutoMovieMotionHumanRide.EquestrianLead,
  ): mountedHorseScene.IScene =>
    mountedHorseScene.build({
      horse,
      body,
      gait: "gallop",
      wait: WAIT,
      course,
      cues: { lead: landings },
      from: { x: 0.6, y: 0, z: -0.2 },
      acts: (chain) =>
        chain.registered("ride", {
          on: "horse",
          duration: WAIT + 6,
          seat: "seat",
          feet: { left: "leftStirrup", right: "rightStirrup" },
          hands: { left: "leftRein", right: "rightRein" },
          equestrian: { stride: { cue: "lead", gait: "gallop", lead } },
        }),
    });
  const left: mountedHorseScene.IScene = seated("left");
  const right: mountedHorseScene.IScene = seated("right");
  assertTakeClean("a seated gallop", left.film);
  const attitude = (
    scene: mountedHorseScene.IScene,
    at: number,
  ): { pitch: number; roll: number } => {
    const hips = scene.film.bones("rider", at).get("hips")!;
    const local: IAutoMovieVector3 = mountedHorseScene.turned(
      scene.part("seat", at),
      Quaternion.rotateVector(hips.worldRotation, { x: 0, y: 1, z: 0 }),
    );
    const side: IAutoMovieVector3 = mountedHorseScene.turned(
      scene.part("seat", at),
      Quaternion.rotateVector(hips.worldRotation, { x: 1, y: 0, z: 0 }),
    );
    return {
      pitch: (Math.atan2(local.z, local.y) * 180) / Math.PI,
      roll: (Math.asin(Math.max(-1, Math.min(1, side.y))) * 180) / Math.PI,
    };
  };

  // 1. The rock and the lead's roll over three strides.
  const strides: number[] = landings
    .map((l) => l.seconds)
    .filter((s: number): boolean => s > WAIT + 2 && s < WAIT + 5);
  for (let i: number = 0; i + 1 < strides.length; ++i) {
    let low: number = Infinity;
    let high: number = -Infinity;
    for (let k: number = 0; k <= 16; ++k) {
      const p: number = attitude(
        left,
        strides[i]! + ((strides[i + 1]! - strides[i]!) * k) / 16,
      ).pitch;
      low = Math.min(low, p);
      high = Math.max(high, p);
    }
    if (!(high - low > 1))
      findings.push(
        `gallop: the pelvis rocks ${(high - low).toFixed(2)} degrees over the stride at ${strides[i]!.toFixed(2)} s`,
      );
  }
  let product: number = 0;
  for (let k: number = 0; k <= 60; ++k) {
    const at: number = WAIT + 2 + (3 * k) / 60;
    product += attitude(left, at).roll * attitude(right, at).roll;
  }
  if (!(product < 0))
    findings.push("gallop: the pelvis's roll does not follow the lead");

  // 2. Seated contacts at the gallop.
  const ball = (
    scene: mountedHorseScene.IScene,
    side: "left" | "right",
    at: number,
  ): IAutoMovieVector3 =>
    mountedHorseScene.local(
      scene.part(`${side}Stirrup`, at),
      HumanFoot.sockets(
        body,
        HumanSignature.bones(scene.reader, at),
        side,
      ).find(
        (s: IAutoMovieMotionHumanFoot.ISocket): boolean => s.socket === "ball",
      )!.point,
    );
  const seat = (
    scene: mountedHorseScene.IScene,
    at: number,
  ): IAutoMovieVector3 =>
    mountedHorseScene.local(
      scene.part("seat", at),
      HumanSignature.region(scene.reader, "seat", at),
    );
  for (let k: number = 0; k <= 12; ++k) {
    const at: number = WAIT + 1 + (4 * k) / 12;
    if (Math.abs(seat(left, at).y) > CONTACT)
      findings.push(
        `gallop: the seat is ${seat(left, at).y.toFixed(3)} m off the saddle at ${at.toFixed(2)} s`,
      );
    for (const side of ["left", "right"] as const)
      if (Math.abs(ball(left, side, at).y) > CONTACT)
        findings.push(
          `gallop: the ${side} ball leaves its stirrup at ${at.toFixed(2)} s`,
        );
  }

  // 3. The racing crouch at the gallop.
  const crouch: mountedHorseScene.IScene = mountedHorseScene.build({
    horse,
    body,
    gait: "gallop",
    wait: WAIT,
    course,
    from: { x: 0.6, y: 0, z: -0.2 },
    acts: (chain) =>
      chain
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
          figures: [
            {
              seat: "entered",
              transfer: 0.3,
              hold: WAIT - 2,
              supports: {
                leftFoot: "leftStirrup",
                rightFoot: "rightStirrup",
                leftHand: "leftRein",
                rightHand: "rightRein",
              },
            },
            {
              seat: "crouch",
              transfer: 0.8,
              hold: 3,
              supports: {
                leftFoot: "leftStirrup",
                rightFoot: "rightStirrup",
                leftHand: "leftRein",
                rightHand: "rightRein",
              },
            },
            {
              seat: "entered",
              transfer: 0.8,
              hold: 0.5,
              supports: {
                leftFoot: "leftStirrup",
                rightFoot: "rightStirrup",
                leftHand: "leftRein",
                rightHand: "rightRein",
              },
            },
          ],
        }),
  });
  assertTakeClean("the racing crouch at the gallop", crouch.film);
  for (let k: number = 0; k <= 8; ++k) {
    const at: number = WAIT + 0.5 + (2.5 * k) / 8;
    if (!(seat(crouch, at).y > 0.03))
      findings.push(
        `crouch: the seat is ${seat(crouch, at).y.toFixed(3)} m over the saddle at ${at.toFixed(2)} s`,
      );
    for (const side of ["left", "right"] as const) {
      if (Math.abs(ball(crouch, side, at).y) > CONTACT)
        findings.push(
          `crouch: the ${side} ball leaves its stirrup at ${at.toFixed(2)} s`,
        );
      const wrist: number = Vector3.length(
        mountedHorseScene.local(
          crouch.part(`${side}Rein`, at),
          mountedHorseScene.joint(crouch, `${side}Hand`, at),
        ),
      );
      if (wrist > 0.7 * body.measure.hand)
        findings.push(
          `crouch: the ${side} wrist leaves its rein at ${at.toFixed(2)} s`,
        );
    }
  }

  TestValidator.equals("riding the gallop", findings, []);
}
