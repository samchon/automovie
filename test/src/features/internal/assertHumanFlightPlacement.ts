import { Quaternion, solveAirborneTakeoff } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanFrame } from "./motionHumanFrame";
import { nclose } from "./nclose";
import { qclose } from "./qclose";
import { qunit } from "./qunit";

/**
 * A turned actual Human flight is equivariant under a ground-preserving
 * world placement. Root-space shape FK must discard only the rigid root,
 * retaining the already resolved joints, contacts and internal shape motion.
 * Explicit physical mode preserves this adaptive-shooting regression after
 * authored staged rotation became the film-hint default.
 *
 * Scenarios:
 * 1. The unchanged core_flight layout input (average polygon man, seed
 *    flight, trained, stand 0.3 s, apex 0.5 m, travel 1 m, one somersault)
 *    is performed at the origin and after a 90-degree world yaw plus
 *    translation (3,0,-2). The world-space landing target moves with it.
 * 2. Both actual films must wind once in their own takeoff frames; equal
 *    unturned jumps or equal identity endpoints cannot satisfy the test.
 * 3. Every displayed bone follows (x,y,z)->(z+3,y,-x-2), with matching local
 *    rotation and the corresponding world rotation at 60 Hz in flight at
 *    equal phase, and at each film's takeoff and touchdown and on either
 *    side of them. Positions retain the existing
 *    placement test's Euclidean 1 mm bound; quaternion dot error is 1e-9.
 *    Takeoff, touchdown and total duration retain their 1e-6-second bound.
 *
 * The spatial relation is a symmetry of gravity over the same level ground.
 * Its quarter-turn point and quaternion formulas are written explicitly;
 * neither performance supplies a stored expected trajectory. Each film has
 * an independent body identity so performance memoization cannot omit it.
 * The core flight spec supplies its existing origin performance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the unchanged actual fixture, transformed target, ground-preserving symmetry, winding observation and original positional/time bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Builds two actual public turned performances, compares all displayed bone positions/rotations and checks each actual takeoff-relative winding; a world-root contribution to shape dynamics, lost articulation or ignored turn fails.
 * @evidence contracts/development/testing.md#independent-expectations Gravity is invariant under horizontal translation and yaw. The explicit quarter-turn gives expected points and left-multiplied quaternions, while one requested cycle gives 2 pi winding independently of shooting residuals.
 * @evidence contracts/development/testing.md#distinguishing-cases A nonzero yaw and translation, transformed world target, real adaptive shooting and resolved polygon-body joints, exact boundaries and both adjacent phases distinguish root-space equivalence from the default unturned placement case. Event timing is checked separately from the phase comparison.
 * @evidence contracts/development/testing.md#execution-ownership The core flight spec shares its canonical layout and constructs one separately placed performance with a fresh body identity; no fake body, test-only law, foreign method replacement, renderer or process is introduced.
 */
export function assertHumanFlightPlacement(
  here: IAutoMovieMotionHumanPerformance,
  canonical: IAutoMovieMotionHumanBody,
  findings: string[],
): void {
  const there: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "flight",
    flight: "physical",
    performers: [
      {
        subject: "a",
        body: { ...canonical },
        at: { x: 3, y: 0, z: -2 },
        yaw: 90,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a")
      .stand({ hold: 0.3 })
      .jump(
        {
          to: { x: 4, y: 0, z: -2 },
          apex: 0.5,
          rotation: { somersault: 1 },
        },
        "leap",
      ).node,
  });
  const span: (
    film: IAutoMovieMotionHumanPerformance,
  ) => readonly [number, number] = (
    film: IAutoMovieMotionHumanPerformance,
  ): readonly [number, number] => {
    const segment: IAutoMovieMotionHumanSegment = film.segments("a")[1]!;
    const at: (name: string) => number = (name: string): number => {
      const event: IAutoMovieMotionEvent | undefined = segment.plan.events.find(
        (value: IAutoMovieMotionEvent): boolean => value.name === name,
      );
      if (event === undefined)
        throw new Error(`turned placement lacks ${name}`);
      return segment.start + event.share * segment.plan.duration;
    };
    return [at("takeoff"), at("touchdown")];
  };
  const origin: readonly [number, number] = span(here);
  const placed: readonly [number, number] = span(there);
  if (
    !(
      nclose(here.duration, there.duration, 1e-6) &&
      nclose(origin[0], placed[0], 1e-6) &&
      nclose(origin[1], placed[1], 1e-6)
    )
  )
    findings.push(
      "world placement changed the flight's event times or duration",
    );
  const from: number = origin[0];
  const to: number = origin[1];
  TestValidator.predicate(
    "placed turn has finite positive observed flight",
    Number.isFinite(from) && Number.isFinite(to) && to - from > 2e-6,
  );
  const root: (
    film: IAutoMovieMotionHumanPerformance,
    t: number,
  ) => IAutoMovieQuaternion = (
    film: IAutoMovieMotionHumanPerformance,
    t: number,
  ): IAutoMovieQuaternion => film.pose("a", t).root!.rotation;
  const takeoffs: readonly IAutoMovieQuaternion[] = [
    root(here, from),
    root(there, placed[0]),
  ];
  TestValidator.predicate(
    "both displayed takeoff roots are finite and unit",
    takeoffs.every((q: IAutoMovieQuaternion): boolean => qunit(q)),
  );
  const frames: readonly IAutoMovieQuaternion[] = takeoffs.map(
    (q: IAutoMovieQuaternion): IAutoMovieQuaternion => Quaternion.inverse(q),
  );
  const compare = (seconds: number, movedSeconds: number = seconds): void => {
    const one: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = here.bones(
      "a",
      seconds,
    );
    const two: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = there.bones(
      "a",
      movedSeconds,
    );
    motionHumanFrame(one, `origin flight ${seconds}`);
    motionHumanFrame(two, `placed flight ${movedSeconds}`);
    if (one.size !== two.size)
      findings.push(`placement changed bone count at ${seconds}`);
    for (const [bone, value] of one) {
      const moved: IAutoMovieResolvedBone | undefined = two.get(bone);
      if (moved === undefined) {
        findings.push(`placed flight lacks ${bone} at ${seconds}`);
        continue;
      }
      const p: IAutoMovieVector3 = value.worldPosition;
      const distance: number = Math.hypot(
        p.z + 3 - moved.worldPosition.x,
        p.y - moved.worldPosition.y,
        -p.x - 2 - moved.worldPosition.z,
      );
      const q: IAutoMovieQuaternion = value.worldRotation;
      const half: number = Math.SQRT1_2;
      const expected: IAutoMovieQuaternion = {
        x: half * (q.x + q.z),
        y: half * (q.y + q.w),
        z: half * (q.z - q.x),
        w: half * (q.w - q.y),
      };
      if (
        !(
          distance <= 0.001 &&
          qclose(moved.worldRotation, expected, 1e-9) &&
          qclose(moved.localRotation, value.localRotation, 1e-9)
        )
      )
        findings.push(
          `${bone} at ${seconds}/${movedSeconds}: placed point misses ${distance} m or its rotation differs`,
        );
    }
  };
  compare(0);
  compare(Math.max(0, from - 1e-3), Math.max(0, placed[0] - 1e-3));
  // Use the same exact event-relative phase in both films. Their independently
  // validated event times can differ by roundoff at a piecewise boundary.
  const boundary: number = 1e-6;
  const samples: number = Math.max(1, Math.ceil((to - from - boundary) * 60));
  const winding: number[] = [0, 0];
  const previous: number[] = [0, 0];
  const spans: readonly (readonly [number, number])[] = [origin, placed];
  const films: readonly IAutoMovieMotionHumanPerformance[] = [here, there];
  for (let k: number = 0; k <= samples; k++) {
    const times: number[] = spans.map(
      ([open, close]: readonly [number, number]): number =>
        k === samples
          ? close - boundary
          : open + ((close - open - boundary) * k) / samples,
    );
    compare(times[0]!, times[1]!);
    for (const [index, film] of films.entries()) {
      const seconds: number = times[index]!;
      const q: IAutoMovieQuaternion = root(film, seconds);
      if (!qunit(q)) {
        findings.push(`flight ${index} has invalid root at ${seconds}`);
        continue;
      }
      const relative: IAutoMovieQuaternion = Quaternion.multiply(
        frames[index]!,
        q,
      );
      const up: IAutoMovieVector3 = Quaternion.rotateVector(relative, {
        x: 0,
        y: 1,
        z: 0,
      });
      const radius: number = Math.hypot(up.y, up.z);
      if (!(Number.isFinite(radius) && radius > Math.sqrt(Number.EPSILON))) {
        findings.push(`flight ${index} winding is unobservable at ${seconds}`);
        continue;
      }
      const angle: number = Math.atan2(up.z, up.y);
      if (k > 0)
        winding[index]! += Math.atan2(
          Math.sin(angle - previous[index]!),
          Math.cos(angle - previous[index]!),
        );
      previous[index] = angle;
    }
  }
  for (const [index, film] of films.entries()) {
    const touchdown: number = spans[index]![1];
    const lastTurn: number = Quaternion.angle(
      root(film, touchdown - 2 * boundary),
      root(film, touchdown - boundary),
    );
    if (
      !(
        Number.isFinite(lastTurn) &&
        Math.abs(winding[index]! - 2 * Math.PI) <=
          solveAirborneTakeoff.TOLERANCE + lastTurn
      )
    )
      findings.push(
        `flight ${index} actually winds ${winding[index]! / (2 * Math.PI)} revolutions`,
      );
  }
  compare(to, placed[1]);
  compare(
    Math.min(here.duration, to + boundary),
    Math.min(there.duration, placed[1] + boundary),
  );
  compare(here.duration, there.duration);
}
