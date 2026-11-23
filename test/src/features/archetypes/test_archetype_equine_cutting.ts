import {
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeEquineCutting,
  AutoMovieArchetypeRefusal,
  createHorse,
  createQuadruped,
  rideQuadruped,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/** The declared cutting work: 0.3 s reaction, 2 m off the cow, the herd beyond z = 10. */
const CUT: AutoMovieArchetypeEquineCutting.ICut = {
  reaction: 0.3,
  offset: 2,
  herd: 10,
};

/**
 * A cutting horse mirrors a cow along the herd's line after its declared reaction, staying between the cow and the herd, and refuses a cow it cannot answer.
 *
 * Scenarios:
 * 1. A cow swings 3 m either way along the line: each horse mark is the cow's at its second plus the reaction, the offset nearer the herd, and the ride samples every 50 ms.
 * 2. A cow darting 30 m in a second refuses, beyond the fastest gait.
 * 3. A cow reversing twice within the reaction refuses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the cut, the mirror and the refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Plans from the public planner and rides its marks.
 * @evidence contracts/development/testing.md#independent-expectations The lag and offset are the declared ones; the herd side is the line's.
 * @evidence contracts/development/testing.md#distinguishing-cases A cow the horse can follow, an over-fast cow and an over-quick reversal.
 * @evidence contracts/development/testing.md#execution-ownership A memory-only archetype unit.
 */
export function test_archetype_equine_cutting(): void {
  const horse = createHorse({ withersHeight: 1.6, tempo: 0 }, 1);
  const species = createQuadruped.species(horse);
  const issues: string[] = [];
  const cow: AutoMovieArchetypeCourse.ISample[] = Array.from(
    { length: 21 },
    (_: unknown, k: number): AutoMovieArchetypeCourse.ISample => ({
      seconds: k * 0.5,
      x: 3 * Math.sin(0.5 * k * 0.5),
      y: 0,
      z: 0,
    }),
  );
  const marks: AutoMovieArchetypeCourse.ISample[] =
    AutoMovieArchetypeEquineCutting.plan(species, 1.6, cow, CUT);
  marks.forEach((mark: AutoMovieArchetypeCourse.ISample, k: number): void => {
    const source: AutoMovieArchetypeCourse.ISample = cow[k]!;
    if (
      !(
        Math.abs(mark.seconds - source.seconds - CUT.reaction) < 1e-12 &&
        mark.x === source.x &&
        Math.abs(mark.z - (source.z + CUT.offset)) < 1e-12 &&
        mark.z < CUT.herd
      )
    )
      issues.push(`mark ${k} does not mirror the cow`);
  });
  const ride = rideQuadruped(
    horse,
    AutoMovieArchetypeCourse.timed("horse", marks),
  );
  for (let at: number = 0; at <= ride.duration; at += 0.05)
    try {
      ride.at(at);
    } catch (error) {
      issues.push(
        `ride at ${at.toFixed(2)} s: ${error instanceof Error ? error.message : String(error)}`,
      );
      break;
    }
  for (const [label, path] of [
    [
      "over-fast",
      [
        { seconds: 0, x: 0, y: 0, z: 0 },
        { seconds: 1, x: 30, y: 0, z: 0 },
      ],
    ],
    [
      "over-quick reversal",
      [0, 0.1, 0.2, 0.3].map(
        (seconds: number, k: number): AutoMovieArchetypeCourse.ISample => ({
          seconds,
          x: k % 2 === 0 ? 0 : 0.1,
          y: 0,
          z: 0,
        }),
      ),
    ],
  ] as const) {
    let refusal: unknown;
    try {
      AutoMovieArchetypeEquineCutting.plan(species, 1.6, path, CUT);
    } catch (error) {
      refusal = error;
    }
    if (!(refusal instanceof AutoMovieArchetypeRefusal))
      issues.push(`the ${label} cow raises ${String(refusal)}`);
  }
  TestValidator.equals("cutting work", issues, []);
}
