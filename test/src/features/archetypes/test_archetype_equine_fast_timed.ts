import {
  AutoMovieArchetypeCourse,
  type AutoMovieArchetypeQuadrupedGait,
  createHorse,
  rideQuadruped,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/** One timed sample: film second and the root's world X and Z, metres. */
interface IMark {
  /** Film second. */
  seconds: number;
  /** World X, metres. */
  x: number;
  /** World Z, metres. */
  z: number;
}

/** One steady fast ride: its label, horse height, marks and cued gait. */
interface ICase {
  /** What is ridden. */
  label: string;
  /** Height at the withers, metres. */
  withers: number;
  /** The timed marks. */
  marks: readonly IMark[];
  /** The gait cued over the whole path; the speed chooses when absent. */
  gait?: AutoMovieArchetypeQuadrupedGait.Gait;
}

/** The probe interval, seconds. */
const STEP: number = 0.02;

/**
 * Steady fast gaits on timed paths sample every instant, their last included: a
 * cued canter round a circle, an uncued straight at the trot's top speed and a
 * cued gallop down a straight.
 *
 * Scenarios:
 *
 * 1. A 1.6 m horse canters at 5 m/s round an 11 m circle for 12 s.
 * 2. A 1.62 m horse goes uncued at 7.04 m/s, the trot's top speed at its height,
 *    for 15 s.
 * 3. A 1.62 m horse gallops at 7.5 m/s down a straight for 8 s. Each ride is also
 *    sampled at its last instant, where its next footfall lies past the path's
 *    end.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the three rides and the end instant.
 * @evidence contracts/development/testing.md#behavioral-verification Samples the public ride every 20 ms and at its end.
 * @evidence contracts/development/testing.md#independent-expectations A steady ride within its gait's declared speeds must sample everywhere.
 * @evidence contracts/development/testing.md#distinguishing-cases A bend at canter, a straight chosen by speed and a cued straight at gallop.
 * @evidence contracts/development/testing.md#execution-ownership A memory-only archetype unit.
 */
export function test_archetype_equine_fast_timed(): void {
  const circle: IMark[] = [];
  for (let k: number = 0; k <= 48; k++) {
    const seconds: number = k * 0.25;
    const angle: number = (5 * seconds) / 11;
    circle.push({
      seconds,
      x: 11 - 11 * Math.cos(angle),
      z: 11 * Math.sin(angle),
    });
  }
  const cases: readonly ICase[] = [
    { label: "canter circle", withers: 1.6, marks: circle, gait: "canter" },
    {
      label: "uncued straight at the trot's top speed",
      withers: 1.62,
      marks: [
        { seconds: 0, x: 0, z: 0 },
        { seconds: 15, x: 0, z: 7.04 * 15 },
      ],
    },
    {
      label: "gallop straight",
      withers: 1.62,
      marks: [
        { seconds: 0, x: 0, z: 0 },
        { seconds: 8, x: 0, z: 60 },
      ],
      gait: "gallop",
    },
  ];
  const issues: string[] = [];
  for (const { label, withers, marks, gait } of cases) {
    const plan: AutoMovieArchetypeCourse.IPlan = AutoMovieArchetypeCourse.timed(
      "horse",
      marks,
    );
    const ride = rideQuadruped(
      createHorse({ withersHeight: withers, tempo: 0 }, 1001),
      gait === undefined
        ? plan
        : { kind: "cued", plan, cues: [{ from: 0, to: plan.duration, gait }] },
    );
    const instants: number[] = [
      ...Array.from(
        { length: Math.floor(ride.duration / STEP) + 1 },
        (_: unknown, k: number): number => k * STEP,
      ),
      ride.duration,
    ];
    for (const at of instants)
      try {
        ride.at(at);
      } catch (error) {
        issues.push(
          `${label} at ${at.toFixed(3)} s: ${error instanceof Error ? error.message : String(error)}`,
        );
        break;
      }
  }
  TestValidator.equals("steady fast timed rides", issues, []);
}
