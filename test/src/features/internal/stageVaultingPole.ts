import { createVaultingPole, AutoMovieArchetypeLandingMat } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import {
  AutoMovieMotionHumanAcrobatics,
  AutoMovieMotionHumanGait,
  AutoMovieMotionHumanJump,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";

import type { IStagedVault } from "./IStagedVault";

/**
 * Stage a pole vault out of a sprint, the pole taken up in both hands from a
 * rack in front of the performer.
 *
 * A vaulter carries the pole in two hands, the top hand near the hip and the
 * lower hand a fulcrum toward the tip (Coaches Insider, "Pole carry and drop").
 * A pole stands upright only as far as the run's energy swings the body over
 * its planted end, so the top hand grips as far from the tip as the sprint's
 * own speed allows on a pole of this rating: the run law's pace on this body
 * (`run.speed`, √(Fr · g · l)) and the vault's own plant and swing
 * (`poleVault.grip`, a bisection on that monotone condition over Linthorne's
 * flexible-pole model), the pole's rating its archetype's. The lower hand grips
 * a shoulder width toward the tip, the hands about shoulder width apart as
 * vaulters hold them. Both grips are places on the pole's `shaft`, shares along
 * its band.
 *
 * The pole is UCS Spirit's 305 series, a beginner's 10 ft (3.05 m), lying
 * across a rack at hip height, its tip to the left and the top hand's place in
 * front of the right hip; the landing mat is the pole vault's, placed ahead.
 *
 * @param body The vaulter.
 * @param seed The take's seed.
 * @returns The take and the pole.
 * @evidence contracts/development/testing.md#behavioral-verification Composes pick-ups, a run and a vault through the public chain with the real pole and mat.
 * @evidence contracts/development/testing.md#independent-expectations The grips follow from the run law's pace, the pole's rating and the vault's swing, not from a chosen band; the pole and mat are the archetypes'.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory performance on the shared Human fixture.
 * @evidence contracts/development/common.md#meaningful-documentation States the carry, the grip's derivation, the staging and its sources.
 */
export function stageVaultingPole(
  body: IAutoMovieMotionHumanBody,
  seed: string,
): IStagedVault {
  const pole: ReturnType<typeof createVaultingPole> = createVaultingPole({
    series: "305",
  });
  const length: number = createVaultingPole.SERIES["305"].length!;
  const rating: number = pole.dimensions.rating!;
  const top: number = AutoMovieMotionHumanJump.poleVault.grip(
    body,
    "right",
    AutoMovieMotionHumanGait.run.speed(body, "sprint"),
    length,
    rating,
  );
  const lower: number =
    top -
    Vector3.distance(
      body.rest.get("leftUpperArm")!,
      body.rest.get("rightUpperArm")!,
    );
  // A share along the shaft's band, measured along its wrapped axis.
  const shaft: ReturnType<typeof pole.affordance> = pole.affordance("shaft");
  const upward: boolean =
    Quaternion.rotateVector(shaft.frame.rotation, { x: 1, y: 0, z: 0 }).y > 0;
  const along = (fromTip: number): number =>
    upward ? fromTip / length : 1 - fromTip / length;
  // Across the rack, its top to the right (the pole's +Y turned onto -X),
  // the top hand's place 0.2 m right of the middle.
  const film: HumanPerformance = new HumanPerformance({
    seed,
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
      HumanObject.prop("pole", pole, {
        position: { x: top - 0.2, y: 1, z: 0.3 },
        rotation: { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
      }),
      HumanObject.prop("mat", AutoMovieArchetypeLandingMat.create({ kind: "poleVault" }), {
        at: { x: 0, y: 0, z: 20 },
        yaw: 0,
      }),
    ],
    composition: HumanChain.subject("a")
      .stand({ hold: 0.3 })
      .pickUp({
        prop: "pole",
        handle: "shaft",
        hand: "right",
        lift: 0.05,
        along: along(top),
      })
      .pickUp({
        prop: "pole",
        handle: "shaft",
        hand: "left",
        along: along(lower),
      })
      .stand({ hold: 0.3 })
      .run({ to: { x: 0, y: 0, z: 10 }, pace: "sprint" })
      .until({ type: "event", event: "leftHeelStrike3" })
      .registered("vaultOnPole", { pole: "pole", rating }).node,
  });
  return { film, pole };
}
