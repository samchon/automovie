import { createLandingMat, createVaultingPole } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAcrobatics,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * Load a pole at the plant and let it go at the release.
 *
 * The pole lies across a rack in front of the performer, its tip to the
 * left, and is taken up as a vaulter carries it: the right hand at its top
 * grip, the left steadying it at the lower grip toward the tip, the lower
 * hand the fulcrum of the drop (Coaches Insider, "Pole carry and drop"),
 * planted from the top hand overhead (Frontiers in Sports and Active Living
 * 2022, 10.3389/fspor.2022.835659: the upper grip at take-off 121 % of
 * stature in men).
 *
 * Scenarios:
 * 1. Through the swing the pole's `tip` stays planted within 5 mm while the
 *    hand holds the pole within 10 mm of its grip.
 * 2. At `release` the pole leaves the hand without a jump: its origin moves
 *    less than 10 mm over the 2 ms around the release.
 * 3. A quarter second after the release the pole has left the hand: its
 *    origin lies more than 50 mm from its seat in the hand's frame, five
 *    times the grip bound a held pole keeps.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the load, the release and the unload with their bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Composes pick-up, run and vault through the public chain with the real pole and reads the displayed pole frame and hand.
 * @evidence contracts/development/testing.md#independent-expectations The tip and its grip are the pole's own affordances; the 5 mm and 10 mm are the campaign's contact bounds; a released prop no longer rides its hand.
 * @evidence contracts/development/testing.md#distinguishing-cases The held swing before the release and the free pole after it.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory performance on the shared Human fixture, without a render or external process.
 */
export function test_motion_jump_pole_release(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const pole: ReturnType<typeof createVaultingPole> = createVaultingPole({
    series: "305",
  });
  const film: HumanPerformance = new HumanPerformance({
    seed: "pole-release",
    laws: [AutoMovieMotionHumanAcrobatics.HumanGymnastics.vaultOnPole],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      // Across a rack, its top to the right: the pole's +Y turned onto -X.
      HumanObject.prop("pole", pole, {
        position: { x: 2.6, y: 1, z: 0.3 },
        rotation: { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
      }),
      HumanObject.prop("mat", createLandingMat({ kind: "poleVault" }), {
        at: { x: 0, y: 0, z: 20 },
        yaw: 0,
      }),
    ],
    composition: HumanChain.subject("a")
      .stand({ hold: 0.3 })
      .pickUp({ prop: "pole", handle: "topGrip", hand: "right", lift: 0.05 })
      .pickUp({ prop: "pole", handle: "lowerGrip", hand: "left" })
      .stand({ hold: 0.3 })
      .run({ to: { x: 0, y: 0, z: 10 }, pace: "sprint" })
      .until({ event: "leftHeelStrike3" })
      .registered("vaultOnPole", { pole: "pole" }).node,
  });
  assertTakeClean("pole release", film);
  const vault: IAutoMovieMotionHumanSegment = film
    .segments("a")
    .find(
      (s: IAutoMovieMotionHumanSegment): boolean => s.name === "vaultOnPole",
    )!;
  const when: (name: string) => number = (name: string): number =>
    vault.start +
    vault.plan.events.find((e): boolean => e.name === name)!.share *
      vault.plan.duration;
  const takeoff: number = when("takeoff");
  const release: number = when("release");
  const tip: IAutoMovieVector3 = pole.affordance("tip").frame.translation;
  const tipAt: (seconds: number) => IAutoMovieVector3 = (
    seconds: number,
  ): IAutoMovieVector3 => {
    const frame: IAutoMovieRigidTransform = film.prop("pole", seconds);
    return Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, tip),
    );
  };
  const grip: (seconds: number) => IAutoMovieVector3 = (
    seconds: number,
  ): IAutoMovieVector3 =>
    HumanHand.frame(body, film.bones("a", seconds), "right", "grip").point;

  // The pole's origin in the hand's frame, from its grip.
  const seat: (seconds: number) => IAutoMovieVector3 = (
    seconds: number,
  ): IAutoMovieVector3 =>
    Quaternion.rotateVector(
      Quaternion.inverse(
        film.bones("a", seconds).get("rightHand")!.worldRotation,
      ),
      Vector3.subtract(film.prop("pole", seconds).position, grip(seconds)),
    );

  // 1. Loaded through the swing: the tip planted, the hand on the pole.
  const held: IAutoMovieVector3 = seat(takeoff);
  let slid: number = 0;
  let loose: number = 0;
  for (let k: number = 0; k <= 4; k++) {
    const t: number = takeoff + ((release - 1e-3 - takeoff) * k) / 4;
    slid = Math.max(slid, Vector3.distance(tipAt(t), tipAt(takeoff)));
    loose = Math.max(loose, Vector3.distance(seat(t), held));
  }
  TestValidator.predicate(
    `the swing keeps the tip planted (${(slid * 1000).toFixed(1)} mm)`,
    slid <= 0.005,
  );

  // 2. The release is continuous.
  const jump: number = Vector3.distance(
    film.prop("pole", release - 1e-3).position,
    film.prop("pole", release + 1e-3).position,
  );
  TestValidator.predicate(
    `the pole leaves the hand without a jump (${(jump * 1000).toFixed(1)} mm)`,
    jump <= 0.01,
  );

  // 3. Unloaded: the pole no longer rides the hand.
  const later: number = release + 0.25;
  const apart: number = Vector3.distance(seat(later), held);
  TestValidator.predicate(
    `the released pole has left the hand (${apart.toFixed(2)} m)`,
    apart > 0.05,
  );
  TestValidator.predicate(
    `the hand held the pole through the swing (${(loose * 1000).toFixed(1)} mm)`,
    loose <= 0.01,
  );
}
