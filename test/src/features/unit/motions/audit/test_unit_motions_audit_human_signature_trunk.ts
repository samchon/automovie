import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSignature,
} from "@automovie/interface";
import { HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";
import { resolvedBones } from "../../../internal/resolvedBones";

/** Rounding of an arctangent, degrees. */
const ROUNDING: number = 1e-9;

/**
 * `HumanSignature.trunk` reads the trunk's inclination in the sagittal plane:
 * the line from the hip joints' midpoint to the shoulder joints' midpoint
 * against the vertical, positive with the shoulders ahead along the reader's
 * heading (Kendall et al. 2005's landmarks).
 *
 * Scenarios, hips 0.2 m apart at 1 m height and shoulders 0.5 m above them:
 *
 * 1. Shoulders over the hips: 0.
 * 2. Shoulders `0.5 tan 30` ahead along +X, read facing 90 degrees (+X): 30.
 * 3. The same read facing 270 degrees: -30; facing 0, the lean is sideways and
 *    reads 0.
 *
 * The body is built whole (`humanFixtureBody`) only for the reader's record.
 */
export async function test_unit_motions_audit_human_signature_trunk(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const reader = (
    ahead: number,
    yaw: number,
  ): IAutoMovieMotionHumanSignature.IReader =>
    HumanSignature(
      {
        duration: 1,
        bones: () =>
          resolvedBones([
            ["leftUpperLeg", { x: 0, y: 1, z: 0.1 }],
            ["rightUpperLeg", { x: 0, y: 1, z: -0.1 }],
            ["leftUpperArm", { x: ahead, y: 1.5, z: 0.15 }],
            ["rightUpperArm", { x: ahead, y: 1.5, z: -0.15 }],
          ]),
      },
      "a",
      body,
      yaw,
    );
  const ahead: number = 0.5 * Math.tan(Math.PI / 6);
  TestValidator.predicate(
    "the inclinations",
    nclose(HumanSignature.trunk(reader(0, 90), 0), 0, ROUNDING) &&
      nclose(HumanSignature.trunk(reader(ahead, 90), 0), 30, ROUNDING) &&
      nclose(HumanSignature.trunk(reader(ahead, 270), 0), -30, ROUNDING) &&
      nclose(HumanSignature.trunk(reader(ahead, 0), 0), 0, ROUNDING),
  );
}
