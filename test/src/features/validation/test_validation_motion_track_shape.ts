import {
  channelValueWidth,
  sampleClip,
  validateClipArtifact,
} from "@automovie/engine";
import type {
  IAutoMovieClip,
  IAutoMovieConstraintViolation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/throwsError";
import { withoutArraySlot } from "../internal/withoutArraySlot";

/**
 * The artifact gate and sampler share the track layout contract.
 *
 * Scenarios:
 * 1. Dense scalar, vector, cubic, quaternion and morph tracks sample; unsupported or incomplete track fields fail at their field.
 * 2. Clip duration admission is stricter than sampling a zero-span key; malformed width keys cannot acquire inherited widths.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls both public entry points on one-field mutations and checks the diagnostic location.
 * @evidence contracts/development/testing.md#independent-expectations Vector and quaternion dimensions and cubic tangent triplets determine coefficient counts.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates sparse, nonfinite, shape, timing and discriminator errors.
 * @evidence contracts/development/testing.md#execution-ownership Uses resident records and no playback host.
 * @evidence contracts/development/common.md#meaningful-documentation Explains admissible layouts and the duration distinction.
 */
export function test_validation_motion_track_shape(): void {
  const channel = { kind: "node", node: "n", path: "translation" } as const;
  const base = {
    channel,
    times: [0, 1],
    values: [0, 0, 0, 1, 1, 1],
    interpolation: "linear" as const,
  };
  const clip = (
    patch: Record<string, unknown> = {},
    envelope: Record<string, unknown> = {},
  ) => ({
    id: "clip",
    name: null,
    duration: 1,
    loop: false,
    tracks: [{ ...base, ...patch }],
    ...envelope,
  });
  const issues = (value: unknown) => {
    const errors: IAutoMovieConstraintViolation[] = [];
    validateClipArtifact(value, "$input.clip", errors);
    return errors;
  };
  const sample = (value: unknown) => sampleClip(value as IAutoMovieClip, 0.5);
  const cases: Array<[Record<string, unknown>, string]> = [
    [{ times: [] }, "times"],
    [{ values: [] }, "values"],
    [{ values: [1, 2] }, "values"],
    [{ interpolation: "unknown" }, "interpolation"],
    [{ interpolation: "cubicspline", values: [0, 1, 2, 3] }, "values"],
    [{ values: [0, 0, 0, 1, Infinity, 1] }, "values[4]"],
    [{ times: [0, NaN] }, "times[1]"],
    [{ times: [-1, 1] }, "times[0]"],
    [{ times: [0, 2] }, "times[1]"],
    [{ times: [0, 0] }, "times[1]"],
    [{ times: withoutArraySlot([0, 1], 1) }, "times[1]"],
    [{ values: withoutArraySlot(base.values, 1) }, "values[1]"],
    [{ channel: null }, "channel"],
    [{ channel: 7 }, "channel"],
    [{ channel: { kind: "material", pointer: "/x" } }, "channel.kind"],
    [{ channel: { ...channel, path: "opacity" } }, "channel.path"],
  ];
  for (const [mutation, field] of cases) {
    const value = clip(mutation);
    TestValidator.predicate(
      "gate locates " + field,
      issues(value).some((i) => i.path === "$input.clip.tracks[0]." + field),
    );
    TestValidator.predicate(
      "sampler refuses " + field,
      throwsError(() => sample(value)),
    );
  }
  const sparse = clip({}, { tracks: withoutArraySlot([base], 0) });
  TestValidator.predicate(
    "missing resident track",
    issues(sparse).length > 0 && throwsError(() => sample(sparse)),
  );
  for (const data of [
    clip(),
    clip({ times: [0], values: [1, 2, 3] }),
    clip({
      channel: { ...channel, path: "rotation" },
      values: [0, 0, 0, 1, 0, 0, 0, 1],
    }),
    clip({ interpolation: "cubicspline", values: new Array<number>(18).fill(0) }),
    clip({ channel: { ...channel, path: "weights" }, values: [0, 1, 1, 0] }),
    clip({}, { loop: true }),
  ])
    TestValidator.predicate(
      "valid payload is admitted and sampled",
      issues(data).length === 0 && sample(data).size === 1,
    );
  const zero = clip({ times: [0], values: [0, 0, 0] }, { duration: 0 });
  TestValidator.predicate(
    "zero span is readable before artifact admission",
    issues(zero).some((i) => i.path === "$input.clip.duration") &&
      sample(zero).size === 1,
  );
  for (const key of ["toString", "__proto__", Object.create(null)])
    TestValidator.equals(
      "only declared channel widths",
      channelValueWidth({ kind: "pointer", valueType: key }),
      undefined,
    );
}
