import type {
  IAutoMovieMotionHumanManoeuvre,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  manoeuvreCrossings
} from "../../../../../packages/motions/src/ensemble/internal/manoeuvreCrossings";
import { TestValidator } from "@nestia/e2e";

/**
 * Check whether two timed manoeuvre paths cross within shoulder clearance.
 *
 * Scenarios:
 *
 * 1. Admit parallel lanes one metre apart for two members with 0.25 m half
 *    breadth. Refuse two members swapping places on one line and name them.
 * 2. Refuse simultaneous perpendicular crossings. Admit the same paths with a
 *    three-second delay on the second member.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases specify breadth, speed, path topology, delay and refusal axis.
 * @evidence contracts/development/testing.md#behavioral-verification The crossing owner receives both member paths and the equality check records the refusal fields.
 * @evidence contracts/development/testing.md#independent-expectations The fixture positions make the unsafe encounters coincide in space and time. The time delay separates the otherwise identical crossing.
 */
export function test_motions_ensemble_manoeuvre_crossings(): void {
  const ensemble: manoeuvreCrossings.IEnsemble = {
    input: { id: "squad" },
    members: ["a", "b"].map(
      (subject: string): manoeuvreCrossings.IMember => ({
        subject,
        body: { measure: { shoulderHalfWidth: 0.2, upperArmRadius: 0.05 } },
      }),
    ),
  };
  const part: (
    member: number,
    via: IAutoMovieVector3[],
    delay: number,
  ) => IAutoMovieMotionHumanManoeuvre.IPart = (
    member: number,
    via: IAutoMovieVector3[],
    delay: number,
  ): IAutoMovieMotionHumanManoeuvre.IPart => ({
    member,
    slot: member,
    delay,
    via,
    face: 0,
    arrive: "stand",
  });
  const point: (x: number, z: number) => IAutoMovieVector3 = (
    x: number,
    z: number,
  ): IAutoMovieVector3 => ({ x, y: 0, z });
  const refused: (parts: IAutoMovieMotionHumanManoeuvre.IPart[]) => string = (
    parts: IAutoMovieMotionHumanManoeuvre.IPart[],
  ): string => {
    try {
      manoeuvreCrossings(ensemble, parts, [1, 1], 0);
    } catch (error: unknown) {
      if (error instanceof AutoMovieMotionHumanRefusal)
        return `${error.axis}:${error.performer}:${String(error.value)}`;
    }
    return "admitted";
  };
  TestValidator.equals(
    "the ways",
    [
      refused([
        part(0, [point(0, 0), point(0, 4)], 0),
        part(1, [point(1, 0), point(1, 4)], 0),
      ]),
      refused([
        part(0, [point(0, 0), point(2, 0)], 0),
        part(1, [point(2, 0), point(0, 0)], 0),
      ]),
      refused([
        part(0, [point(-2, 0), point(2, 0)], 0),
        part(1, [point(0, -2), point(0, 2)], 0),
      ]),
      refused([
        part(0, [point(-2, 0), point(2, 0)], 0),
        part(1, [point(0, -2), point(0, 2)], 3),
      ]),
    ],
    ["admitted", "squad.manoeuvre:a:b", "squad.manoeuvre:a:b", "admitted"],
  );
}
