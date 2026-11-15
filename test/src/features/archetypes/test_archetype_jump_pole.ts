import { createLandingMat, createVaultingPole } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanGymnastics,
  HumanObject,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A vaulting pole serves the pole vault (#3529): a performer takes the pole up by its shaft, runs, plants its `tip` and swings on it, and the vault reads the pole's own plant end and length, not a stand-in.
 *
 * The pole is the shortest commercial one, 3.05 m (a beginner's 10 ft pole), standing on its tip beside the performer, so the shaft's middle is in reach of a standing hand; the landing mat is the pole vault's, placed ahead.
 *
 * Scenarios, on the average man and the small woman:
 * 1. Taking the pole up by `shaft`, running and vaulting with `vaultOnPole` (its `tip` the planted end by default) plans.
 * 2. At the take-off the pole's `tip` is on the floor, within 15 mm.
 * 3. Through the swing, from the take-off to just before the release, the planted `tip` moves 5 mm at most (provisional: the campaign's planted-contact bound).
 * 4. The body's centre of mass at the release stands higher than at the take-off: the swing lifts it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the vault through the public chain with the real pole and reads the displayed pole frame and the centre of mass; a pole whose tip is not planted or slides, or a swing that does not lift, fails with the measure.
 * @evidence contracts/development/testing.md#independent-expectations The tip's place is the pole's own affordance, carried by the prop's frame; the 15 mm and 5 mm are the campaign's contact bounds; nothing is read from the law but its declared events.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies of opposite build on the same pole.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and two films; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the stage and the 4 scenarios with their bounds.
 */
export function test_archetype_jump_pole(): void {
  const pole: ReturnType<typeof createVaultingPole> = createVaultingPole({
    length: 3.05,
  });
  const mat: ReturnType<typeof createLandingMat> = createLandingMat({
    kind: "poleVault",
  });
  const tip: IAutoMovieVector3 = pole.affordance("tip").frame.translation;
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);

    // 1. It plans.
    let film: HumanPerformance;
    try {
      film = new HumanPerformance({
        seed: "pole",
        laws: [HumanGymnastics.vaultOnPole],
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
            position: { x: -0.25, y: 0, z: 0.3 },
            rotation: Quaternion.identity(),
          }),
          HumanObject.prop("mat", mat, { at: { x: 0, y: 0, z: 20 }, yaw: 0 }),
        ],
        composition: HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .pickUp({ prop: "pole", handle: "shaft", hand: "right", lift: 0.05 })
          .stand({ seconds: 0.3 })
          .run({ to: { x: 0, y: 0, z: 10 }, pace: "sprint" })
          .until({ event: "leftHeelStrike3" })
          .registered("vaultOnPole", { pole: "pole" }).node,
      });
    } catch (error) {
      complaints.push(
        `${name}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const segment: HumanSegment.ISegment = film
      .segments("a")
      .find((s: HumanSegment.ISegment): boolean => s.name === "vaultOnPole")!;
    const at = (event: string): number =>
      segment.start +
      (segment.plan.events.find((e): boolean => e.name === event)?.share ??
        Number.NaN) *
        segment.plan.duration;
    const end = (seconds: number): IAutoMovieVector3 => {
      const frame: IHumanProp.IFrame = film.prop("pole", seconds);
      return Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, tip),
      );
    };

    // 2. Planted at the take-off.
    const off: number = at("takeoff");
    const release: number = at("release");
    const planted: IAutoMovieVector3 = end(off);
    if (!(Math.abs(planted.y) <= 0.015))
      complaints.push(
        `${name}: at the take-off the pole's tip is ${planted.y.toFixed(3)} m from the floor, within 15 mm expected`,
      );

    // 3. It stays where it was planted through the swing.
    for (let k: number = 1; k <= 4; k++) {
      const seconds: number = off + ((release - 1e-3 - off) * k) / 4;
      const slid: number =
        Vector3.length(Vector3.subtract(end(seconds), planted)) * 1000;
      if (!(slid <= 5))
        complaints.push(
          `${name}: the planted tip moves ${slid.toFixed(1)} mm by ${(seconds - off).toFixed(2)} s of the swing, 5 mm at most expected`,
        );
    }

    // 4. The swing lifts the body.
    const reader: HumanSignature.IReader = HumanSignature.of(
      film,
      "a",
      body,
      0,
    );
    const lifted: number =
      HumanSignature.centre(reader, release).y -
      HumanSignature.centre(reader, off).y;
    if (!(lifted > 0))
      complaints.push(
        `${name}: the swing changes the centre's height by ${lifted.toFixed(3)} m, a rise expected`,
      );
  }
  TestValidator.equals(
    "a vaulting pole is taken up, planted by its tip and swung on",
    complaints,
    [],
  );
}
