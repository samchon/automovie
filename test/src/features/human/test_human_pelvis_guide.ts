import { TestValidator } from "@nestia/e2e";

import { AutoMovieHumanPelvisGuide as Guide } from "../../../../packages/human/src/generation/AutoMovieHumanPelvisGuide";
import { AutoMovieHumanTrunkTapes as Tapes } from "../../../../packages/human/src/generation/AutoMovieHumanTrunkTapes";
import { nclose } from "../internal/nclose";

/**
 * A shared pelvis coordinate keeps its tape keys and cannot turn into a shelf.
 *
 * Scenarios:
 * 1. Increasing, decreasing and constant guide coordinates retain both jets.
 * 2. The old displacement carrier reveals its interior direction reversal.
 * 3. A circle with an independent 5 mm relief closes at its requested tape.
 * 4. Adjacent tape keys are attained exactly without post-closure smoothing.
 * 5. A monotone middle tape retains its nonzero slope instead of a flat band.
 * 6. A thigh half-loop's midline chord is excluded from a whole torso tape.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises the production C2 guide, taut-hull scale solve and tape interpolation. The guide's sampled coordinates must be monotone and both end jets flat; the former displacement carrier must fail that same monotonicity observation. A nonhomogeneous circle must close to its target, and all profile keys must survive interpolation.
 * @evidence contracts/testing.md#independent-expectations The derivative of quintic smoothstep is 30 t squared times (1 minus t) squared, so it cannot reverse. The known defective d times (1 minus d over 24) cubed carrier turns at 6 mm. A circle has circumference 2 pi r; a 1024-gon misses its perimeter by less than 0.00012 mm at radius 12 mm, covered by 0.001 mm. Key equality uses numerical epsilon 1e-9 and no generated person's dimensions.
 * @evidence contracts/testing.md#distinguishing-cases Tests both signs and a constant guide, samples the complete interval including endpoints, retains first and second jets, uses a translated circle whose radius contains a fixed relief, and exercises descending then ascending unequal tape intervals. Whole-body proportions and pose behavior remain with anatomy and curve audits.
 * @evidence contracts/testing.md#execution-ownership A synchronous CPU test selected by --include human_pelvis_guide; local numeric arrays and production pure functions only, without a person generator, server, process, GPU or retained resource.
 */
export function test_human_pelvis_guide(): void {
  for (const [a, b] of [[100, 130], [130, 100], [100, 100]] as const) {
    const points: number[] = [];
    for (let i: number = 0; i <= 240; i++) points.push(Guide.coordinate(a, b, 0, 24, i / 10).value);
    TestValidator.predicate("no guide reversal", reversals(points) === 0);
    const start: Guide.IJet = Guide.coordinate(a, b, 0, 24, 0);
    const end: Guide.IJet = Guide.coordinate(a, b, 0, 24, 24);
    TestValidator.predicate("start value", nclose(start.value, a, 1e-9));
    TestValidator.predicate("end value", nclose(end.value, b, 1e-9));
    TestValidator.predicate("common end jets", [start.first, start.second, end.first, end.second].every((v: number): boolean => nclose(v, 0, 1e-9)));
  }

  const defect: number[] = Array.from({ length: 241 }, (_: unknown, i: number): number => {
    const d: number = i / 10;
    return 100 + 2 * d * (1 - d / 24) ** 3;
  });
  TestValidator.predicate("known shelf is red under the same observation", reversals(defect) === 1);

  const circle: (scale: number) => [number, number][] = (scale: number): [number, number][] => Array.from({ length: 1024 }, (_: unknown, i: number): [number, number] => {
    const angle: number = 2 * Math.PI * i / 1024;
    const radius: number = 10 * scale + 5;
    return [17 + radius * Math.cos(angle), -23 + radius * Math.sin(angle)];
  });
  const target: number = 24 * Math.PI;
  const scale: number = Tapes.scale(target, circle);
  TestValidator.predicate("relief-aware scale", nclose(scale, 0.7, 0.001));
  TestValidator.predicate("closed final hull", nclose(Tapes.perimeter(circle(scale)), target, 0.001));

  const keys: Tapes.IKey[] = [{ station: 0, girth: 900 }, { station: 130, girth: 600 }, { station: 220, girth: 800 }];
  for (const key of keys)
    TestValidator.predicate("tape key retained", nclose(Tapes.girth(keys, key.station), key.girth, 1e-9));
  TestValidator.predicate("downward interval has no belly", reversals(Array.from({ length: 131 }, (_: unknown, i: number): number => Tapes.girth(keys, i))) === 0);
  TestValidator.predicate("upward interval has no belly", reversals(Array.from({ length: 91 }, (_: unknown, i: number): number => Tapes.girth(keys, 130 + i))) === 0);
  const straight: Tapes.IKey[] = [{ station: 0, girth: 900 }, { station: 150, girth: 750 }, { station: 300, girth: 600 }];
  TestValidator.predicate("middle tape keeps progress", nclose((Tapes.girth(straight, 150.001) - Tapes.girth(straight, 149.999)) / 0.002, -1, 1e-7));

  const halfCircle: (scale: number) => Tapes.Point[] = (scale: number): Tapes.Point[] => Array.from({ length: 1025 }, (_: unknown, i: number): Tapes.Point => [10 * scale * Math.cos(Math.PI * i / 1024), 10 * scale * Math.sin(Math.PI * i / 1024)]);
  TestValidator.predicate("half-loop includes its chord", nclose(Tapes.perimeter(halfCircle(1)), 10 * (Math.PI + 2), 0.001));
  TestValidator.predicate("whole torso wraps both halves", nclose(Tapes.perimeter(Tapes.mirror(halfCircle(1))), 20 * Math.PI, 0.001));
  const wholeScale: number = Tapes.scale(20 * Math.PI, (value: number): Tapes.Point[] => Tapes.mirror(halfCircle(value)));
  TestValidator.predicate("whole torso scale is one", nclose(wholeScale, 1, 0.001));
  const wrongScale: number = Tapes.scale(20 * Math.PI, halfCircle);
  TestValidator.predicate("known half/whole confusion is red", Math.abs(wrongScale - 1) > 0.2);
}

/** Number of strict direction changes in a sampled coordinate. */
function reversals(values: readonly number[]): number {
  let previous: number = 0;
  let count: number = 0;
  for (let i: number = 1; i < values.length; i++) {
    const step: number = values[i]! - values[i - 1]!;
    if (Math.abs(step) < 1e-10) continue;
    const sign: number = Math.sign(step);
    if (previous !== 0 && sign !== previous) count++;
    previous = sign;
  }
  return count;
}
