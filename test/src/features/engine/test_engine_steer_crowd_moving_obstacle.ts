import { AutoMovieEngineMotionCrowd } from "@automovie/engine";
import type {
  IAutoMovieCrowdAgent,
  IAutoMovieSteerCrowd,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Walkers yield to a moving obstacle whichever way it comes: it may overtake
 * them from behind, meet them head-on or cross their way. Every walker stays
 * outside its grown footprint, steps aside, and returns to its lane once it has
 * passed.
 *
 * The obstacle is a carriage's 1.8 by 4.4 m box grown by a 0.2 m clearance. It
 * sets off at 0.6 m/s² to a 2.4 m/s cruise, as #4024 reports. Four walkers of
 * Fruin's 0.305 m half-breadth walk 30 m up their lanes at 1 m/s, staggered 2 m
 * apart.
 *
 * Scenarios:
 *
 * 1. The carriage starts 14 m behind them, overtakes them, and brakes to rest at
 *    the end of a 60 m course.
 * 2. The carriage meets them head-on from 40 m ahead.
 * 3. The carriage crosses their street at right angles 12 m up it, as the walkers
 *    reach that line.
 *
 * In each, the walker's disc keeps the clearance from the carriage's box at
 * every 0.1 s sample, and every walker is back within 0.3 m of its lane at 30
 * s. When the carriage comes along the street, every walker also steps more
 * than 0.3 m from its lane at some sample. A crossing walker may yield by
 * slowing instead.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMovieEngineMotionCrowd` with a moving `IObstacle`. It measures each course against the box placed by the same closed-form motion, independently of the pass. A pass that steers walkers only by the push along the predicted contact normal drives them forward, ahead of an obstacle that is faster than they are. That pass fails the overtaking and head-on gaps, which is the reported defect.
 * @evidence contracts/development/testing.md#independent-expectations The clearance, the box, the speeds and the lanes are #4024's acceptance. The gap is the distance to the ungrown box less the walker's radius, computed here from the rectangle. The 0.3 m aside and return bounds are the issue's.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers the three approach directions the issue names: from behind with a faster obstacle, head-on, and across. A still obstacle and a single crossing walker belong to `test_engine_steer_crowd`.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_engine_steer_crowd_moving_obstacle`. It uses only the engine's steering pass and starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the obstacle, the walkers, each approach and the bounds every one must meet.
 */
export function test_engine_steer_crowd_moving_obstacle(): void {
  const PERSON: number = 0.305;
  const CLEARANCE: number = 0.2;
  const HALF_WIDTH: number = 0.9;
  const HALF_LENGTH: number = 2.2;
  const lanes: readonly number[] = [-0.4, 0.3, 0.5, -0.2];
  const findings: string[] = [];
  const acceleration: number = 0.6;
  const cruise: number = 2.4;
  const ramp: number = cruise / acceleration;
  const rampDistance: number = (acceleration * ramp * ramp) / 2;

  // The carriage's footprint grown by the clearance: its own x to the left, z ahead.
  const grown: IAutoMovieVector3[] = [
    { x: -HALF_WIDTH - CLEARANCE, y: 0, z: -HALF_LENGTH - CLEARANCE },
    { x: HALF_WIDTH + CLEARANCE, y: 0, z: -HALF_LENGTH - CLEARANCE },
    { x: HALF_WIDTH + CLEARANCE, y: 0, z: HALF_LENGTH + CLEARANCE },
    { x: -HALF_WIDTH - CLEARANCE, y: 0, z: HALF_LENGTH + CLEARANCE },
  ];

  for (const approach of [
    {
      name: "overtaking from behind",
      start: { x: 0, z: -14 },
      yaw: 0,
      length: 60,
      parts: true,
    },
    {
      name: "head-on",
      start: { x: 0, z: 40 },
      yaw: 180,
      length: null,
      parts: true,
    },
    {
      name: "crossing",
      start: { x: -20, z: 12 },
      yaw: 90,
      length: null,
      parts: false,
    },
  ] as const) {
    const heading: { x: number; z: number } = {
      x: Math.sin((approach.yaw * Math.PI) / 180),
      z: Math.cos((approach.yaw * Math.PI) / 180),
    };
    const terminal: { start: number; length: number } | null =
      approach.length === null
        ? null
        : {
            start: ramp + (approach.length - 2 * rampDistance) / cruise,
            length: approach.length,
          };
    const place = (seconds: number): IAutoMovieVector3 => {
      const s: number = travelled(seconds, terminal);
      return {
        x: approach.start.x + heading.x * s,
        y: 0,
        z: approach.start.z + heading.z * s,
      };
    };
    const result: IAutoMovieSteerCrowd.IResult = AutoMovieEngineMotionCrowd.steer({
      agents: lanes.map(
        (x: number, k: number): IAutoMovieCrowdAgent => ({
          at: { x, y: 0, z: 2 * k },
          goal: { x, y: 0, z: 2 * k + 30 },
          radius: PERSON,
          speed: 1,
          start: 0,
        }),
      ),
      obstacles: [
        {
          footprint: grown,
          motion: (
            seconds: number,
          ): { position: IAutoMovieVector3; yaw: number } => ({
            position: place(seconds),
            yaw: approach.yaw,
          }),
        },
      ],
      from: 0,
      to: 30,
    });

    let least: number = Infinity;
    result.courses.forEach(
      (course: IAutoMovieCrowdAgent.ICourse, k: number): void => {
        let aside: number = 0;
        for (let i: number = 0; i <= 300; ++i) {
          const at: IAutoMovieVector3 = course.at(i * 0.1).position;
          const centre: IAutoMovieVector3 = place(i * 0.1);
          // The walker in the carriage's frame: across and along its heading.
          const dx: number = at.x - centre.x;
          const dz: number = at.z - centre.z;
          const across: number = dx * heading.z - dz * heading.x;
          const along: number = dx * heading.x + dz * heading.z;
          least = Math.min(
            least,
            Math.hypot(
              Math.max(Math.abs(across) - HALF_WIDTH, 0),
              Math.max(Math.abs(along) - HALF_LENGTH, 0),
            ) - PERSON,
          );
          aside = Math.max(aside, Math.abs(at.x - lanes[k]!));
        }
        if (approach.parts && !(aside > 0.3))
          findings.push(
            `${approach.name}: walker ${k} strays at most ${aside.toFixed(3)} m from its lane`,
          );
        const back: number = Math.abs(course.at(30).position.x - lanes[k]!);
        if (!(back <= 0.3))
          findings.push(
            `${approach.name}: walker ${k} ends ${back.toFixed(3)} m from its lane`,
          );
      },
    );
    if (!(least >= CLEARANCE - 1e-6))
      findings.push(
        `${approach.name}: the closest walker came ${least.toFixed(3)} m from the box, ${CLEARANCE} m required`,
      );
  }
  TestValidator.equals("walkers yield to a moving carriage", findings, []);

  /** Read the acceleration, cruise and optional rest-to-rest carriage course. */
  function travelled(
    seconds: number,
    terminal: { start: number; length: number } | null,
  ): number {
    const t: number = Math.max(0, seconds);
    if (t <= ramp) return (acceleration * t * t) / 2;
    if (terminal !== null && t >= terminal.start) {
      const remaining: number = Math.max(0, terminal.start + ramp - t);
      return terminal.length - (acceleration * remaining * remaining) / 2;
    }
    return rampDistance + cruise * (t - ramp);
  }
}
