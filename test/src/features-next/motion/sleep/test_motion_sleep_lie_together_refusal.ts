import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanRefusal } from "@automovie/motions";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { lieTogetherScene } from "../../internal/lieTogetherScene";

/**
 * How far apart the refused performer is staged, metres: the original's 1.2 m,
 * twice the near staging.
 */
const FAR: number = 1.2;

/**
 * Lying far from the partner is refused, and lying near is not: the refusal
 * case of `test_motion_sleep_lie_together` with its adjacent valid case,
 * spooning, the average man with the small woman as the original.
 *
 * Scenarios:
 *
 * 1. The performer staged 1.2 m from where it would settle: the lying together is
 *    refused on the `partner` axis, the original's check.
 * 2. Staged 0.6 m away, the original's near staging: it builds without a refusal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original's refusal, the adjacent case and the bodies.
 * @evidence contracts/development/testing.md#behavioral-verification Builds both takes through `HumanPerformance` and reads the refusal's axis or its absence; an admitted far lying, a refusal on another axis or a refused near lying fails.
 * @evidence contracts/development/testing.md#independent-expectations The settling arm reaches a partner 0.6 m away and not 1.2 m away, the original's staging; the axis is the refusal contract's `partner`.
 * @evidence contracts/development/testing.md#distinguishing-cases A far against a near staging, the input that changes being only the distance; the ways' goals are the way units'.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain, entered through `test_motion_sleep_lie_together_refusal`.
 */
export function test_motion_sleep_lie_together_refusal(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const a: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const b: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  const far: Refused = refusal(a, b, FAR);
  checks.check(
    `lying far from the partner is refused on the partner (${describe(far)})`,
    far !== undefined && far.axis === "partner",
  );
  const near: Refused = refusal(a, b, lieTogetherScene.NEARBY);
  checks.check(
    `lying near the partner is not refused (${describe(near)})`,
    near === undefined,
  );
  checks.assert("only lying far from the partner is refused");
}

/** A build's refusal, or undefined when it built. */
type Refused = HumanRefusal | undefined;

/** The refusal a spooning staged `apart` throws, if any. */
function refusal(
  a: IAutoMovieMotionHumanBody,
  b: IAutoMovieMotionHumanBody,
  apart: number,
): Refused {
  try {
    lieTogetherScene.scene(a, b, lieTogetherScene.SPOON, apart).bones("a", 6);
    return undefined;
  } catch (error: unknown) {
    if (error instanceof HumanRefusal) return error;
    throw error;
  }
}

/** A refusal's axis and message, or that the build was admitted. */
function describe(refused: Refused): string {
  return refused === undefined
    ? "admitted"
    : `${refused.axis}: ${refused.message}`;
}
