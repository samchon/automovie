import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanResolve,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A spec read on a body: a place and an elbow preset in metres, a distance
 * in metres as shares, an amount in degrees, and the table of every name.
 *
 * The body is a stub 1.7 m tall with an upper arm of 0.3 m, a forearm of 0.25
 * m and a half shoulder width of 0.2 m. Metres are in the performer's floor
 * frame: x to the left, y up, z forward.
 *
 * Scenarios:
 * 1. The `ahead` place (0.72 statures high, 0.8 arms away) is at
 *    (0, 1.224, 0.44) m, the `desk` place (0.42, 0.6) at (0, 0.714, 0.33) m
 *    and the `floor` place (0, 0.6) at (0, 0, 0.33) m.
 * 2. A displacement of (0.1, 0.17, 0.055) m is 0.5 half shoulder widths
 *    left, 0.1 statures up and 0.1 arms forward, and a nudge of
 *    (0.1 / 0.55, 0.17 / 0.55, 0.1) arm lengths.
 * 3. The `hang` elbow preset (0.4 out, 1 down, 0.5 back, in upper arms) is
 *    (0.12, -0.3, -0.15) m; 0.2 more out is 0.18 m out.
 * 4. A light neck flexion, a quarter of the neck's 45°, is a share of 0.25
 *    and 11.25°.
 * 5. The table of one body starts with the header row naming the body and
 *    has the `ahead` row with the point of scenario 1 to three decimals.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public functions and reads the metres, the shares and the table's text; a share multiplied by the wrong measure, an inverse that does not undo `place`, or a table without its header fails.
 * @evidence contracts/development/testing.md#independent-expectations Every number is a product or a quotient of the stated shares and the stub's measures worked out by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers three places with different heights, the inverse on three axes with different measures, a preset with and without extra out, an amount, and the table's two row kinds.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on a stub of the measures read. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the stub and the frame and lists the 5 scenarios with their numbers.
 */
export function test_motion_compose_resolve(): void {
  const body: Pick<IHumanBody, "measure"> = {
    measure: {
      stature: 1.7,
      upperArm: 0.3,
      forearm: 0.25,
      shoulderHalfWidth: 0.2,
      shoulderHeight: 1.4,
      eyeHeight: 1.6,
      hipHeight: 0.9,
      thigh: 0.4,
      waistHeight: 1.05,
      chestHeight: 1.25,
      neckHeight: 1.48,
    },
  } as unknown as Pick<IHumanBody, "measure">;
  const near = (got: number, expected: number): boolean =>
    Math.abs(got - expected) <= 1e-9;
  const at = (got: IAutoMovieVector3, x: number, y: number, z: number): boolean =>
    near(got.x, x) && near(got.y, y) && near(got.z, z);

  TestValidator.predicate(
    "the named places in metres",
    at(
      AutoMovieMotionHumanResolve.place(body, "left", "ahead").metres,
      0,
      1.224,
      0.44,
    ) &&
      at(
        AutoMovieMotionHumanResolve.place(body, "left", "desk").metres,
        0,
        0.714,
        0.33,
      ) &&
      at(
        AutoMovieMotionHumanResolve.place(body, "left", "floor").metres,
        0,
        0,
        0.33,
      ),
  );

  const shift = AutoMovieMotionHumanResolve.shares(body, {
    x: 0.1,
    y: 0.17,
    z: 0.055,
  });
  TestValidator.predicate(
    "metres as shares",
    near(shift.left, 0.5) &&
      near(shift.up, 0.1) &&
      near(shift.forward, 0.1) &&
      near(shift.nudge.out, 0.1 / 0.55) &&
      near(shift.nudge.up, 0.17 / 0.55) &&
      near(shift.nudge.forward, 0.1),
  );

  TestValidator.predicate(
    "an elbow preset in metres",
    at(
      AutoMovieMotionHumanResolve.bend(body, "hang").metres,
      0.12,
      -0.3,
      -0.15,
    ) && near(AutoMovieMotionHumanResolve.bend(body, "hang", 0.2).metres.x, 0.18),
  );

  const amount = AutoMovieMotionHumanResolve.amount("neck", "flexion", "light");
  TestValidator.predicate(
    "an amount as a share and in degrees",
    near(amount.share, 0.25) && near(amount.degrees, 11.25),
  );

  const lines: string[] = AutoMovieMotionHumanResolve.table([
    { name: "stub", body },
  ]).split("\n");
  TestValidator.predicate(
    "the table's header and a place row",
    lines[0] === "name\tstub" &&
      lines.includes("place ahead (x,y,z m)\t0.000,1.224,0.440") &&
      lines.some((line: string): boolean => line.startsWith("neck flexion\t")),
  );
}
