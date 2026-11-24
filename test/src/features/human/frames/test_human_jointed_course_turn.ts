import { AutoMovieViewJointedCourse } from "@automovie/engine";
import { AutoMovieHumanConicLoft } from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieViewAxis,
  IAutoMovieViewAxisJet,
  IAutoMovieViewJointedCourse,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * The Human course joins a turn to its two straight runs with a continuous
 * tangent and curvature.
 *
 * Scenarios:
 *
 * 1. Two perpendicular runs turn a quarter circle's angle in either direction. The
 *    endpoints have the straight runs' tangents and zero curvature. The middle
 *    is at half the turn's angle and the quintic's peak rate.
 * 2. A zero-width straight joint keeps its unit tangent and zero curvature. The
 *    same zero width is refused on a perpendicular change of direction.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads axis jets through the Human conic source entry. A wrong end tangent, curvature step, unsigned turn or abrupt zero-width corner fails.
 * @evidence contracts/development/testing.md#independent-expectations The perpendicular input vectors give the signed angles. The derivative of the quintic smoothstep is 30t²(1−t)², with maximum 15/8 at t=1/2. The engine's prepared turn supplies the start station only.
 * @evidence contracts/development/testing.md#distinguishing-cases Opposite bend directions distinguish the sign, the endpoints distinguish straight-run continuity from the peak, and a straight joint permits zero width.
 * @evidence contracts/development/testing.md#execution-ownership Synchronous unit on made courses. No sampled body, fitted dimensions or loft realization.
 * @evidence contracts/development/common.md#meaningful-documentation Names each course's tangent, curvature and refusal expectations.
 */
export function test_human_jointed_course_turn(): void {
  const findings: string[] = [];
  const half: number = 15;
  const up: AutoMovieVector3Tuple = [0, 0, 1];
  const peak: number = ((15 / 8) * (Math.PI / 2)) / (2 * half);
  const check = (
    label: string,
    actual: AutoMovieVector3Tuple,
    expected: AutoMovieVector3Tuple,
  ): void => {
    if (
      !actual.every((value, i): boolean => nclose(value, expected[i]!, 1e-12))
    )
      findings.push(`${label}: [${actual}] expected [${expected}]`);
  };

  for (const side of [1, -1]) {
    const centres: AutoMovieVector3Tuple[] = [
      [-100, 0, 0],
      [0, 0, 0],
      [0, side * 80, 0],
    ];
    const prepared: IAutoMovieViewJointedCourse.ICourse | string =
      AutoMovieViewJointedCourse.prepare(centres, [half]);
    if (typeof prepared === "string")
      throw new Error("The perpendicular course was refused: " + prepared);
    const start: number = prepared.turns[0]!.start;
    const axis: IAutoMovieViewAxis.IAxis = AutoMovieHumanConicLoft.axis({
      centres,
      halves: [half],
      up,
    });
    const entry: IAutoMovieViewAxisJet.IJet = readJet(axis, start);
    const middle: IAutoMovieViewAxisJet.IJet = readJet(axis, start + half);
    const exit: IAutoMovieViewAxisJet.IJet = readJet(axis, start + 2 * half);
    check(`side ${side} entry tangent`, entry.first.origin, [1, 0, 0]);
    check(`side ${side} exit tangent`, exit.first.origin, [0, side, 0]);
    check(`side ${side} entry curvature`, entry.second.origin, [0, 0, 0]);
    check(`side ${side} exit curvature`, exit.second.origin, [0, 0, 0]);
    check(`side ${side} middle tangent`, middle.first.origin, [
      Math.SQRT1_2,
      side * Math.SQRT1_2,
      0,
    ]);
    check(`side ${side} peak curvature`, middle.second.origin, [
      -peak * Math.SQRT1_2,
      side * peak * Math.SQRT1_2,
      0,
    ]);
  }

  const straight: IAutoMovieViewAxis.IAxis = AutoMovieHumanConicLoft.axis({
    centres: [
      [-100, 0, 0],
      [0, 0, 0],
      [80, 0, 0],
    ],
    halves: [0],
    up,
  });
  for (const station of [99, 100, 101]) {
    const jet: IAutoMovieViewAxisJet.IJet = readJet(straight, station);
    check(`straight tangent at ${station}`, jet.first.origin, [1, 0, 0]);
    check(`straight curvature at ${station}`, jet.second.origin, [0, 0, 0]);
  }

  try {
    AutoMovieHumanConicLoft.axis({
      centres: [
        [-100, 0, 0],
        [0, 0, 0],
        [0, 80, 0],
      ],
      halves: [0],
      up,
    });
    findings.push("The perpendicular course admitted a zero-width turn");
  } catch (error: unknown) {
    if (!(error instanceof Error && error.message.includes("half length")))
      throw error;
  }
  TestValidator.predicate(findings.join("\n"), findings.length === 0);
}

/** Read the declared physical-station axis jet at a known course station. */
function readJet(
  axis: IAutoMovieViewAxis.IAxis,
  station: number,
): IAutoMovieViewAxisJet.IJet {
  const jet: IAutoMovieViewAxisJet.IJet | null | undefined =
    axis.jet?.(station);
  if (jet === null || jet === undefined)
    throw new Error(`No axis jet at station ${station}`);
  return jet;
}
