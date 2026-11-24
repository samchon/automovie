import type {
  IAutoMovieMotionHumanManoeuvre,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanRefusal, manoeuvreCrossings } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `manoeuvreCrossings` refuses a manoeuvre whose members' ways cross: each
 * member read on its way at its speed from its delay, every 1/24 s, against
 * every other, closer than their summed shoulder half breadths and closer than
 * they stand at either end.
 *
 * Scenarios, two members 0.25 m each in half breadth, walking at 1 m/s:
 *
 * 1. Side by side lanes 1 m apart are admitted.
 * 2. Swapping places along one line meets in the middle and is refused on
 *    `squad.manoeuvre`, naming both.
 * 3. Ways crossing at right angles through one point are refused when both start
 *    together, and admitted when the second waits 3 s for the first to pass.
 */
export function test_unit_motions_ensemble_manoeuvre_crossings(): void {
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
      if (error instanceof HumanRefusal)
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
