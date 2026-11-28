import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanMountRider,
  IAutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  readPropGrip
} from "../../../../../packages/motions/src/carrier/internal/readPropGrip";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/** Rounding of one quarter turn, unit vector components. */
const ROUNDING: number = 1e-12;

/**
 * Check how a named prop point supplies the displayed hand grip.
 *
 * Scenarios:
 *
 * 1. At film second 2, read the grip's aimed point and normal. The 0.04 m
 *    aperture gives a 0.02 m radius, and two quarter turns carry its +X axis
 *    to -X.
 * 2. The declared tip has a point and normal with zero radius and no wrapped
 *    axis. An undeclared knob refuses on `bar` .
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios distinguish the timed handle axis and radius from a plain point and a missing point.
 * @evidence contracts/development/testing.md#behavioral-verification The test separates material handle geometry from a plain aim point and a missing point.
 * @evidence contracts/development/testing.md#independent-expectations Halving the declared aperture and composing the two given quarter turns supply the expected radius and axis.
 */
export function test_motions_carrier_read_prop_grip(): void {
  const quarter = AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90);
  const asked: { target: IAutoMovieMotionTarget; seconds: number }[] = [];
  const context: readPropGrip.IContext = {
    prop: (): readPropGrip.IReader => ({
      prop: {
        points: {
          grip: { point: { x: 0, y: 1, z: 0 }, normal: { x: 0, y: 1, z: 0 } },
          tip: { point: { x: 1, y: 1, z: 0 }, normal: { x: 1, y: 0, z: 0 } },
        },
        affordances: [
          {
            id: "grip",
            kind: "handle",
            frame: {
              translation: { x: 0, y: 1, z: 0 },
              rotation: quarter,
              scale: { x: 1, y: 1, z: 1 },
            },
            extent: null,
            aperture: 0.04,
          },
        ],
      },
      frame: () => ({ rotation: quarter }),
    }),
    aim: (target: IAutoMovieMotionTarget, seconds: number) => {
      asked.push({ target, seconds });
      return {
        point: { x: seconds, y: 1, z: 0 },
        normal: { x: 0, y: 1, z: 0 },
      };
    },
  };
  const grip: IAutoMovieMotionHumanMountRider.IHoldGrip = readPropGrip(
    context,
    "bar",
    "grip",
    2,
    "bar",
  );
  TestValidator.predicate(
    "a handle",
    vclose(grip.point, { x: 2, y: 1, z: 0 }, ROUNDING) &&
      grip.radius === 0.02 &&
      vclose(grip.axis!, { x: -1, y: 0, z: 0 }, ROUNDING) &&
      asked[0]!.seconds === 2,
  );
  TestValidator.equals("the aim", asked[0]!.target, {
    kind: "prop",
    subject: "bar",
    point: "grip",
  });
  const tip: IAutoMovieMotionHumanMountRider.IHoldGrip = readPropGrip(
    context,
    "bar",
    "tip",
    0,
    "bar",
  );
  const normal: IAutoMovieVector3 = tip.normal;
  TestValidator.predicate(
    "no affordance",
    tip.radius === 0 && tip.axis === undefined && normal.y === 1,
  );
  let axis: string | undefined;
  try {
    readPropGrip(context, "bar", "knob", 0, "bar");
  } catch (error: unknown) {
    if (error instanceof AutoMovieMotionHumanRefusal) axis = error.axis;
  }
  TestValidator.equals("an undeclared point", axis, "bar");
}
