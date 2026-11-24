import { sampleClip, validateClipArtifact } from "@automovie/engine";
import type {
  IAutoMovieClip,
  IAutoMovieConstraintViolation,
  IAutoMovieTrack,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * The artifact gate and sampler share the track layout contract.
 *
 * Scenarios:
 *
 * 1. Dense scalar, vector, cubic, quaternion and morph tracks sample; incomplete
 *    track payloads fail at their field.
 * 2. Clip duration admission is stricter than sampling a zero-span key.
 */
export function test_unit_engine_validation_motion_track_shape(): void {
  const channel: IAutoMovieTrack["channel"] = {
    kind: "node",
    node: "n",
    path: "translation",
  };
  const base: IAutoMovieTrack = {
    channel,
    times: [0, 1],
    values: [0, 0, 0, 1, 1, 1],
    interpolation: "linear",
  };
  const clip = (
    patch: Partial<IAutoMovieTrack> = {},
    envelope: Partial<IAutoMovieClip> = {},
  ): IAutoMovieClip => ({
    id: "clip",
    name: null,
    duration: 1,
    loop: false,
    tracks: [{ ...base, ...patch }],
    ...envelope,
  });
  const issues = (value: IAutoMovieClip): IAutoMovieConstraintViolation[] => {
    const errors: IAutoMovieConstraintViolation[] = [];
    validateClipArtifact(value, "$input.clip", errors);
    return errors;
  };
  const sample = (value: IAutoMovieClip) => sampleClip(value, 0.5);
  const cases: Array<[Partial<IAutoMovieTrack>, string]> = [
    [{ times: [] }, "times"],
    [{ values: [] }, "values"],
    [{ values: [1, 2] }, "values"],
    [{ interpolation: "cubicspline", values: [0, 1, 2, 3] }, "values"],
    [{ times: [-1, 1] }, "times[0]"],
    [{ times: [0, 2] }, "times[1]"],
    [{ times: [0, 0] }, "times[1]"],
  ];
  for (const [mutation, field] of cases) {
    const value: IAutoMovieClip = clip(mutation);
    TestValidator.predicate(
      "gate locates " + field,
      issues(value).some((i) => i.path === "$input.clip.tracks[0]." + field),
    );
    TestValidator.predicate(
      "sampler refuses " + field,
      throwsError(() => sample(value)),
    );
  }
  for (const data of [
    clip(),
    clip({ times: [0], values: [1, 2, 3] }),
    clip({
      channel: { ...channel, path: "rotation" },
      values: [0, 0, 0, 1, 0, 0, 0, 1],
    }),
    clip({ channel: { ...channel, path: "weights" }, values: [0, 1, 1, 0] }),
    clip({}, { loop: true }),
  ])
    TestValidator.predicate(
      "valid payload is admitted and sampled",
      issues(data).length === 0 && sample(data).size === 1,
    );
  const zero: IAutoMovieClip = clip(
    { times: [0], values: [0, 0, 0] },
    { duration: 0 },
  );
  TestValidator.predicate(
    "zero span is readable before artifact admission",
    issues(zero).some((i) => i.path === "$input.clip.duration") &&
      sample(zero).size === 1,
  );
}
