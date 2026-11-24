import { createHorse } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanSegment,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanRefusal, HumanSignature } from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { mountedHorseScene } from "../../../features/internal/mountedHorseScene";

/** The campaign's held-contact bound, metres. */
const CONTACT: number = 0.01;

/** Seconds the horse stands while the rider sits on. */
const WAIT: number = 6;

/**
 * Bareback riding at the trot against the ordinary saddle: the rider sits on
 * the horse's own back with the hands on the reins and the legs hanging, the
 * seat carried by the moving back, while the saddled rider keeps the
 * straddle seat with both soles in the stirrups.
 *
 * Scenarios:
 * 1. Both horses travel at least a metre while the samples are read.
 * 2. Bareback, the displayed seat region stays within 10 mm of the back's seat contact and slides less than 10 mm on it; each palm stays within 10 mm of its rein.
 * 3. Bareback, no sole is supported: the ride declares no foot window, and each displayed ball of the foot is more than 0.3 m above the ground.
 * 4. Pelvis attitude: standing still after sitting, the bareback seat region lies lower than the saddled one by the two seats' own height difference within 10 mm.
 * 5. The straddle is retained on both: the left knee lies left of the horse's midline and the right knee right of it; the saddled soles stay within 10 mm of their stirrups.
 * 6. Asking the bareback ride to keep a foot on a stirrup is refused on `feet`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both takes, the six scenarios and each bound's source.
 * @evidence contracts/development/testing.md#behavioral-verification Rides actual trotting bareback and saddled horses and reads the displayed seat, palms, soles and knees against their moving contacts; a seat left at saddle height, a hanging foot declared supported, a straddle lost or a missing stirrup accepted fails.
 * @evidence contracts/development/testing.md#independent-expectations Contact positions and the seat heights come from the archetypes; the 10 mm bound is the campaign's.
 * @evidence contracts/development/testing.md#distinguishing-cases A bareback seat with hanging feet against a saddle with supported soles, and an existing against a missing stirrup.
 * @evidence contracts/development/testing.md#execution-ownership Two in-memory films of one polygon man; the side-saddle and vaulting specs own their seats.
 */
export function test_motion_mount_equestrian_bareback(): void {
  const findings: string[] = [];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const dims = { withersHeight: 1.65, stirrupDrop: 0.66, tempo: 0 } as const;
  const bare: mountedHorseScene.IScene = stage(
    createHorse({ ...dims, tack: "bareback" }, 2),
    body,
    false,
  );
  const saddled: mountedHorseScene.IScene = stage(
    createHorse({ ...dims, tack: "saddle" }, 2),
    body,
    true,
  );
  const ridden = (
    scene: mountedHorseScene.IScene,
  ): IAutoMovieMotionHumanSegment =>
    scene.segments.find(
      (s: IAutoMovieMotionHumanSegment): boolean => s.end - s.start > WAIT,
    )!;
  const samples = (scene: mountedHorseScene.IScene): number[] =>
    [0.3, 0.33, 0.36].map(
      (share: number): number => WAIT + share * scene.ride.duration,
    );

  // 1. Both carriers move.
  for (const scene of [bare, saddled]) {
    const [a, , b] = samples(scene);
    if (
      Vector3.distance(scene.place(a!).position, scene.place(b!).position) < 1
    )
      findings.push(`${scene.horse.name}: the horse must trot on`);
  }

  // 2. The bareback seat and hands.
  const seatAt = (
    scene: mountedHorseScene.IScene,
    at: number,
  ): IAutoMovieVector3 =>
    mountedHorseScene.local(
      scene.part("seat", at),
      HumanSignature.region(scene.reader, "seat", at),
    );
  const first: IAutoMovieVector3 = seatAt(bare, samples(bare)[0]!);
  for (const at of samples(bare)) {
    const seat: IAutoMovieVector3 = seatAt(bare, at);
    if (Math.abs(seat.y) > CONTACT || Vector3.distance(seat, first) > CONTACT)
      findings.push(
        `bareback: the seat leaves the back at ${at.toFixed(2)} s (${JSON.stringify(seat)})`,
      );
    for (const side of ["left", "right"] as const) {
      const gap: number = mountedHorseScene.palm(bare, side, `${side}Rein`, at);
      if (gap > CONTACT)
        findings.push(
          `bareback: the ${side} palm misses its rein by ${gap.toFixed(3)} m`,
        );
    }
  }

  // 3. No sole support bareback.
  const ball = (
    scene: mountedHorseScene.IScene,
    side: "left" | "right",
    at: number,
  ): IAutoMovieVector3 =>
    HumanFoot.sockets(body, HumanSignature.bones(scene.reader, at), side).find(
      (s: IAutoMovieMotionHumanFoot.ISocket): boolean => s.socket === "ball",
    )!.point;
  if (
    ridden(bare).plan.contacts.some(
      (c: IAutoMovieMotionHumanContactWindow): boolean =>
        c.part === "leftFoot" || c.part === "rightFoot",
    )
  )
    findings.push("bareback: a hanging foot is declared supported");
  for (const at of samples(bare))
    for (const side of ["left", "right"] as const)
      if (ball(bare, side, at).y < 0.3)
        findings.push(
          `bareback: the ${side} foot reaches down to ${ball(bare, side, at).y.toFixed(3)} m`,
        );

  // 4. The bareback seat sits lower by the seats' own height difference.
  const still: number = WAIT - 0.2;
  const seats = (scene: mountedHorseScene.IScene): number =>
    scene.horse.affordances.find((a): boolean => a.id === "seat")!.frame
      .translation.y;
  const shown: number =
    HumanSignature.region(saddled.reader, "seat", still).y -
    HumanSignature.region(bare.reader, "seat", still).y;
  const declared: number = seats(saddled) - seats(bare);
  if (!(declared > 0) || Math.abs(shown - declared) > CONTACT)
    findings.push(
      `the bareback seat sits ${shown.toFixed(3)} m below the saddle's, the seats differ by ${declared.toFixed(3)} m`,
    );

  // 5. The straddle on both; the saddled soles in their stirrups.
  for (const scene of [bare, saddled])
    for (const at of samples(scene)) {
      const root: IAutoMovieTransform = {
        translation: scene.place(at).position,
        rotation: scene.place(at).rotation,
        scale: { x: 1, y: 1, z: 1 },
      };
      const left: number = mountedHorseScene.local(
        root,
        mountedHorseScene.joint(scene, "leftLowerLeg", at),
      ).x;
      const right: number = mountedHorseScene.local(
        root,
        mountedHorseScene.joint(scene, "rightLowerLeg", at),
      ).x;
      if (!(left > 0.1 && right < -0.1))
        findings.push(
          `${scene.horse.name}: the knees do not straddle the horse (${left.toFixed(3)}, ${right.toFixed(3)})`,
        );
    }
  for (const side of ["left", "right"] as const) {
    const rested: IAutoMovieVector3 = mountedHorseScene.local(
      saddled.part(`${side}Stirrup`, samples(saddled)[0]!),
      ball(saddled, side, samples(saddled)[0]!),
    );
    for (const at of samples(saddled)) {
      const foot: IAutoMovieVector3 = mountedHorseScene.local(
        saddled.part(`${side}Stirrup`, at),
        ball(saddled, side, at),
      );
      if (
        Math.abs(foot.y) > CONTACT ||
        Vector3.distance(foot, rested) > CONTACT
      )
        findings.push(
          `saddle: the ${side} sole leaves its stirrup at ${at.toFixed(2)} s`,
        );
    }
  }

  // 6. A stirrup the bareback horse lacks is refused.
  let error: unknown = null;
  try {
    const wrong: mountedHorseScene.IScene = stage(
      createHorse({ ...dims, tack: "bareback" }, 2),
      body,
      true,
    );
    wrong.film.bones("rider", WAIT + 1);
  } catch (failure) {
    error = failure;
  }
  if (!(error instanceof HumanRefusal && error.axis === "feet"))
    findings.push(
      `a bareback stirrup must be refused on feet, got ${String(error)}`,
    );

  assertTakeClean("the bareback take", bare.film);
  assertTakeClean("the saddled straddle take", saddled.film);
  TestValidator.equals(
    "bareback and straddle supports at the trot",
    findings,
    [],
  );
}

/** Sit on the horse's seat and ride it at the trot, the hands on the reins and, with stirrups, the feet in them. */
function stage(
  horse: mountedHorseScene.Horse,
  body: IAutoMovieMotionHumanBody,
  stirrups: boolean,
): mountedHorseScene.IScene {
  return mountedHorseScene.build({
    horse,
    body,
    gait: "trot",
    wait: WAIT,
    from: { x: 0.6, y: 0, z: -0.2 },
    acts: (seated) =>
      seated.registered("ride", {
        on: "horse",
        duration: 12,
        seat: "seat",
        hands: { left: "leftRein", right: "rightRein" },
        ...(stirrups
          ? { feet: { left: "leftStirrup", right: "rightStirrup" } }
          : {}),
      }),
  });
}
