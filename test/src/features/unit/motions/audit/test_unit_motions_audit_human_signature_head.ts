import { Quaternion } from "@automovie/engine";
import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";
import { resolvedBones } from "../../../internal/resolvedBones";
import { throwsError } from "../../../internal/throwsError";

/** Rounding of an arcsine, degrees. */
const ROUNDING: number = 1e-9;

/**
 * `HumanSignature.head` reads the head's pitch: how far its forward axis (+Z of
 * its frame) points below the horizon, `asin(-f.y)`, positive face down.
 *
 * Scenarios:
 *
 * 1. A head turned 20 degrees about +X, which lowers +Z, pitches 20.
 * 2. One turned -15 degrees pitches -15; one turned 90 degrees about the
 *    vertical pitches 0.
 * 3. A motion without a head is refused.
 *
 * The body is built whole (`humanFixtureBody`) only for the reader's record.
 */
export async function test_unit_motions_audit_human_signature_head(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const pitch = (axis: "x" | "y", degrees: number): number =>
    HumanSignature.head(
      HumanSignature(
        {
          duration: 1,
          bones: () =>
            resolvedBones(
              [["head", { x: 0, y: 1.6, z: 0 }]],
              Quaternion.fromAxisAngle(
                { x: axis === "x" ? 1 : 0, y: axis === "y" ? 1 : 0, z: 0 },
                degrees,
              ),
            ),
        },
        "a",
        body,
        0,
      ),
      0,
    );
  TestValidator.predicate(
    "the pitches",
    nclose(pitch("x", 20), 20, ROUNDING) &&
      nclose(pitch("x", -15), -15, ROUNDING) &&
      nclose(pitch("y", 90), 0, ROUNDING),
  );
  TestValidator.predicate(
    "no head",
    throwsError(() =>
      HumanSignature.head(
        HumanSignature(
          { duration: 1, bones: () => resolvedBones([]) },
          "a",
          body,
          0,
        ),
        0,
      ),
    ),
  );
}
