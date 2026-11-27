import { AutoMovieEngineSequence } from "@automovie/engine";
import type {
  AutoMovieInterpolation,
  IAutoMovieChannel,
  IAutoMovieClip,
  IAutoMovieSampledChannel,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/** Rounding of one interpolation and one normalization. */
const ROUNDING: number = 1e-12;

/** A node translation channel. */
const SLIDE: IAutoMovieChannel = {
  kind: "node",
  node: "door",
  path: "translation",
};

/** A node rotation channel. */
const TURN: IAutoMovieChannel = {
  kind: "node",
  node: "door",
  path: "rotation",
};

/** A one second clip of the given tracks. */
const clip: (
  tracks: IAutoMovieClip["tracks"],
  loop?: boolean,
) => IAutoMovieClip = (
  tracks: IAutoMovieClip["tracks"],
  loop: boolean = false,
): IAutoMovieClip => ({ id: "clip", name: null, duration: 1, loop, tracks });

/** One translation track from 0 to 10 in x over [0, 1] under an interpolation. */
const slide: (
  interpolation: AutoMovieInterpolation,
  values: number[],
) => IAutoMovieClip["tracks"][number] = (
  interpolation: AutoMovieInterpolation,
  values: number[],
): IAutoMovieClip["tracks"][number] => ({
  channel: SLIDE,
  times: [0, 1],
  values,
  interpolation,
});

/** The sampled value of the first channel at a time. */
const value: (source: IAutoMovieClip, seconds: number) => number[] = (
  source: IAutoMovieClip,
  seconds: number,
): number[] => {
  const sampled: Map<string, IAutoMovieSampledChannel> = AutoMovieEngineSequence.sampleClip(
    source,
    seconds,
  );
  return [...sampled.values()][0]!.value;
};

/**
 * `sampleClip` reads every track of a clip at a time: linear, step, cubic
 * spline and spherical interpolation, with the time clamped or looped.
 *
 * Scenarios, on a one second clip:
 *
 * 1. A linear x from 0 to 10 is 2.5 at 0.25 s, and clamps to its ends at -1 s and
 *    5 s.
 * 2. A step track holds its first value until its second key: 1 at 0.5 s, and 2 at
 *    exactly 1 s.
 * 3. A cubic spline with zero tangents (in, value, out) from 0 to 10 is the
 *    smoothstep 10 (3 t^2 - 2 t^3), so 5 at 0.5 s and 1.5625 at 0.25 s.
 * 4. A rotation from the identity to a quarter turn about Z reads the eighth turn
 *    (0, 0, sin 22.5, cos 22.5) degrees at 0.5 s.
 * 5. A looping clip reads 1.25 s as 0.25 s and -0.75 s as 0.25 s.
 * 6. Two tracks on one channel, and a clip of a negative duration, are refused.
 */
export function test_engine_resolve_sample_clip(): void {
  const linear: IAutoMovieClip = clip([slide("linear", [0, 0, 0, 10, 0, 0])]);
  TestValidator.predicate(
    "linear and clamped",
    nclose(value(linear, 0.25)[0]!, 2.5, ROUNDING) &&
      value(linear, -1)[0] === 0 &&
      value(linear, 5)[0] === 10,
  );
  const step: IAutoMovieClip = clip([
    {
      channel: SLIDE,
      times: [0, 1],
      values: [1, 0, 0, 2, 0, 0],
      interpolation: "step",
    },
  ]);
  TestValidator.predicate(
    "a step holds until its key",
    value(step, 0.5)[0] === 1 && value(step, 1)[0] === 2,
  );
  const spline: IAutoMovieClip = clip([
    slide(
      "cubicspline",
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 0, 0, 0, 0, 0],
    ),
  ]);
  TestValidator.predicate(
    "a cubic spline with flat tangents",
    nclose(value(spline, 0.5)[0]!, 5, ROUNDING) &&
      nclose(value(spline, 0.25)[0]!, 1.5625, ROUNDING),
  );
  const half: number = Math.SQRT1_2;
  const turn: IAutoMovieClip = clip([
    {
      channel: TURN,
      times: [0, 1],
      values: [0, 0, 0, 1, 0, 0, half, half],
      interpolation: "linear",
    },
  ]);
  const eighth: number[] = value(turn, 0.5);
  TestValidator.predicate(
    "a half-way slerp",
    nclose(eighth[0]!, 0, ROUNDING) &&
      nclose(eighth[1]!, 0, ROUNDING) &&
      nclose(eighth[2]!, Math.sin(Math.PI / 8), ROUNDING) &&
      nclose(eighth[3]!, Math.cos(Math.PI / 8), ROUNDING),
  );
  const loop: IAutoMovieClip = clip(
    [slide("linear", [0, 0, 0, 10, 0, 0])],
    true,
  );
  TestValidator.predicate(
    "a loop wraps",
    nclose(value(loop, 1.25)[0]!, 2.5, ROUNDING) &&
      nclose(value(loop, -0.75)[0]!, 2.5, ROUNDING),
  );
  TestValidator.predicate(
    "a repeated channel and a negative duration",
    throwsError(
      (): unknown =>
        AutoMovieEngineSequence.sampleClip(
          clip([
            slide("linear", [0, 0, 0, 10, 0, 0]),
            slide("linear", [0, 0, 0, 10, 0, 0]),
          ]),
          0,
        ),
      "duplicate track channel",
    ) &&
      throwsError(
        (): unknown => AutoMovieEngineSequence.sampleClip({ ...linear, duration: -1 }, 0),
        "non-negative",
      ),
  );
}
