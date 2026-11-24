import type { AutoMovieHumanSide } from "@automovie/interface";
import { walkLocomoteSwings } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `walkLocomoteSwings` lists every swing of a step schedule: for each stance
 * that begins after the start, the swing the foot's schedule reports half way
 * between that stance and the foot's previous one, in toe-off order.
 *
 * Scenarios, the left foot standing 0 to 1 s and 1.5 to 2.5 s, the right 0 to
 * 0.5 s and 1 to 2 s, the schedule reporting a swing only between the stances:
 *
 * 1. The swings are the right foot's 0.5 to 1 s and then the left foot's 1 to 1.5
 *    s, each read at its gap's midpoint.
 * 2. A schedule whose stances all begin at the start has no swing.
 */
export function test_unit_motions_actions_walk_locomote_swings(): void {
  const gaps: Record<AutoMovieHumanSide, readonly [number, number]> = {
    left: [1, 1.5],
    right: [0.5, 1],
  };
  const reads: number[] = [];
  const steps: walkLocomoteSwings.ISteps = {
    stances: [
      { side: "left", from: 0, to: 1 },
      { side: "right", from: 0, to: 0.5 },
      { side: "right", from: 1, to: 2 },
      { side: "left", from: 1.5, to: 2.5 },
    ],
    foot: (
      side: AutoMovieHumanSide,
      seconds: number,
    ): ReturnType<walkLocomoteSwings.ISteps["foot"]> => {
      reads.push(seconds);
      const [off, on]: readonly [number, number] = gaps[side];
      return seconds > off && seconds < on
        ? { swing: { u: (seconds - off) / (on - off), off, on } }
        : {};
    },
  };
  TestValidator.equals(
    "the swings",
    [walkLocomoteSwings(steps), reads],
    [
      [
        { side: "right", off: 0.5, on: 1 },
        { side: "left", off: 1, on: 1.5 },
      ],
      [1.25, 0.75],
    ],
  );
  TestValidator.equals(
    "no swing",
    walkLocomoteSwings({
      stances: [
        { side: "left", from: 0, to: 2 },
        { side: "right", from: 0, to: 2 },
      ],
      foot: steps.foot,
    }),
    [],
  );
}
