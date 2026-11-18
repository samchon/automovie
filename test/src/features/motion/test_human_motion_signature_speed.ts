import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSignature,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import { HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The peak speed reading takes its central differences on its own 240 Hz
 * series, so it reads each instant once and gives the peak the differences
 * a 240th either side of every instant give.
 *
 * A hand moves along x on a 2 s film read over its first second. The 240 Hz
 * series runs from 1/240 s to 1 s, 240 instants, so the differences read
 * the 242 instants from 0 to 241/240 s.
 *
 * Scenarios:
 * 1. Along x = 0.1 sin(2 pi t) the central difference at an instant t is
 *    0.1 cos(2 pi t) sin(2 pi / 240) 240, largest at t = 1 s, where it is
 *    0.1 sin(2 pi / 240) 240 m/s, within 1e-9: the reading, and the
 *    differences a 240th either side of each instant read as the
 *    definition states, agree with it, and the reading resolves 242
 *    instants, each once.
 * 2. A hand that steps 0.1 m at 0.5 s and is still otherwise reads the step
 *    over two 240ths, 12 m/s, within 1e-9, as the definition does.
 * 3. A hand that stays still reads 0.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public reading on a hand-placed film and counts the instants it asks for; a peak off the definition's, or an instant read twice, fails.
 * @evidence contracts/development/testing.md#independent-expectations The peaks are the central difference of a sine and of a step, worked by hand, and the definition's differences are the test's own walk a 240th either side of each instant; the instant count is the series' length plus its two ends.
 * @evidence contracts/development/testing.md#distinguishing-cases A smooth path, a step and stillness.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on plain points; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the film, the series, the three scenarios and their numbers.
 */
export function test_human_motion_signature_speed(): void {
  const h: number = 1 / 240;
  const run = (
    x: (seconds: number) => number,
  ): { peak: number; asked: number[]; definition: number } => {
    const asked: number[] = [];
    const motion: IAutoMovieMotionHumanSignature.IMotion = {
      duration: 2,
      bones: (
        _subject: string,
        seconds: number,
      ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
        asked.push(seconds);
        const rest: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
        return new Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>([
          [
            "rightHand",
            {
              bone: "rightHand",
              localRotation: rest,
              worldRotation: rest,
              worldPosition: { x: x(seconds), y: 1, z: 0 },
            },
          ],
        ]);
      },
    };
    const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
      motion,
      "a",
      // The speed reading reads no body.
      {} as IAutoMovieMotionHumanBody,
      0,
    );
    const peak: number = HumanSignature.speed(reader, "rightHand", 0, 1);

    // The definition: a 240th either side of every instant of the series.
    let definition: number = 0;
    for (let k: number = 0; k < 240; k++) {
      const t: number = h + k / 240;
      definition = Math.max(
        definition,
        Math.abs(x(t + h) - x(t - h)) / (2 * h),
      );
    }
    return { peak, asked, definition };
  };
  const close = (a: number, b: number): boolean =>
    Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));

  // 1. A sine, peaking at 1 s.
  const sine = run((t: number): number => 0.1 * Math.sin(2 * Math.PI * t));
  const worked: number = 0.1 * Math.sin((2 * Math.PI) / 240) * 240;
  TestValidator.predicate(
    `a sine reads ${sine.peak} m/s, the definition ${sine.definition}, worked ${worked}, from ${sine.asked.length} instants (${new Set(sine.asked).size} distinct)`,
    close(sine.peak, worked) &&
      close(sine.definition, worked) &&
      sine.asked.length === 242 &&
      new Set(sine.asked).size === 242,
  );

  // 2. A step.
  const step = run((t: number): number => (t < 0.5 ? 0 : 0.1));
  TestValidator.predicate(
    `a 0.1 m step reads ${step.peak} m/s, the definition ${step.definition}, 12 worked`,
    close(step.peak, 12) && close(step.definition, 12),
  );

  // 3. Stillness.
  TestValidator.equals(
    "a still hand reads no speed",
    run((): number => 0.3).peak,
    0,
  );
}
