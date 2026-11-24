import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { auditStanceMotion } from "../../../internal/auditStanceMotion";
import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";

/**
 * `HumanSignature.bears` says a foot bears on the floor when its lowest sole
 * socket lies within `CONTACT` (20 mm) of the floor and moves over it slower
 * than `SLIDE` (0.2 m/s), since a swinging foot passes as low as 13 mm over the
 * floor (Winter 1992) and only a bearing foot is still.
 *
 * Scenarios, the average man's quiet stance over 1 s, each foot read at 0.5 s:
 *
 * 1. Still on the floor, both bear.
 * 2. Raised 0.05 m, neither bears; on a 0.05 m floor, both bear again.
 * 3. Sliding along +X at 1 m/s on the floor, neither bears; read on the 120 Hz
 *    series from 0 (`origin`), the same.
 *
 * The body is built whole (`humanFixtureBody`): bearing reads the body's sole
 * sockets on the displayed foot bones.
 */
export async function test_unit_motions_audit_human_signature_bears(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const reads = (
    shift: (t: number) => IAutoMovieVector3,
    floor: number = 0,
    origin?: number,
  ): boolean[] =>
    (["left", "right"] as const).map((side: "left" | "right"): boolean =>
      HumanSignature.bears(
        HumanSignature(auditStanceMotion(body, { shift }), "a", body, 0),
        0.5,
        side,
        floor,
        origin,
      ),
    );
  TestValidator.equals(
    "still",
    reads(() => ({ x: 0, y: 0, z: 0 })),
    [true, true],
  );
  TestValidator.equals(
    "raised",
    [
      ...reads(() => ({ x: 0, y: 0.05, z: 0 })),
      ...reads(() => ({ x: 0, y: 0.05, z: 0 }), 0.05),
    ],
    [false, false, true, true],
  );
  const slide = (t: number): IAutoMovieVector3 => ({ x: t, y: 0, z: 0 });
  TestValidator.equals(
    "sliding",
    [...reads(slide), ...reads(slide, 0, 0)],
    [false, false, false, false],
  );
}
