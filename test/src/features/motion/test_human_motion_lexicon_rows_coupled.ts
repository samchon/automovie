import type {
  IAutoMovieMotionHumanCarried,
  IAutoMovieMotionHumanCoupled,
} from "@automovie/interface";
import { HumanCarried, HumanCoupled } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * Carry roles name each other and give lift and set-down timing to the carried role.
 *
 * Scenarios:
 * 1. Each carry kind and its shared duration reach both roles.
 * 2. Lift and set-down go to the carried performer, who follows the bearer.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies who owns the shared duration and lift intervals.
 * @evidence contracts/development/testing.md#behavioral-verification Resolves each role through the public mutual record.
 * @evidence contracts/development/testing.md#independent-expectations The cast fixes which person bears whom and which role owns height changes.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks both roles for every supported carry kind.
 * @evidence contracts/development/testing.md#execution-ownership Resolves the cast without a body or performance.
 */
export function test_human_motion_lexicon_rows_coupled(): void {
  const SECONDS: number = 2;
  // A record maps roles and timings before it encounters either body.
  const cast: Parameters<typeof HumanCoupled.carry.act>[2] = {
    bearer: "a",
    borne: "b",
  };
  for (const carry of Object.keys(
    HumanCarried.CARRIES,
  ) as IAutoMovieMotionHumanCarried.Carry[]) {
    const shared: IAutoMovieMotionHumanCoupled.ICarry = {
      carry,
      seconds: SECONDS,
    };
    const timing: IAutoMovieMotionHumanCoupled.ICarry = {
      lift: SECONDS / 4,
      setDown: SECONDS / 4,
    };
    const params: IAutoMovieMotionHumanCoupled.ICarry = {
      ...shared,
      ...timing,
    };
    TestValidator.equals(
      carry + " bearer",
      HumanCoupled.carry.act("bearer", params, cast),
      {
        name: "bearing",
        params: { ...shared, of: "b" },
      },
    );
    TestValidator.equals(
      carry + " borne",
      HumanCoupled.carry.act("borne", params, cast),
      {
        name: "borne",
        params: { ...params, by: "a" },
      },
    );
  }
}
