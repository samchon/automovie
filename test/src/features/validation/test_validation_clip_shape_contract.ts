import {
  IAutoMovieClip,
  IAutoMovieConstraintViolation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMovieSampledChannel } from "../../../../packages/engine/src/resolve/IAutoMovieSampledChannel";
import { sampleClip } from "../../../../packages/engine/src/resolve/sampleClip";
import { channelValueWidth } from "../../../../packages/engine/src/validation/channelValueWidth";
import { validateClipArtifact } from "../../../../packages/engine/src/validation/validateClipArtifact";
import { namedFacts, throwsError } from "../internal/predicates";
import { withoutArraySlot } from "../internal/withoutArraySlot";

const clip: (
  over?: { track?: Record<string, unknown> | undefined } & Record<
    string,
    unknown
  >,
) => unknown = (
  over: { track?: Record<string, unknown> } & Record<string, unknown> = {},
): unknown => {
  const { track: trackOver, ...rest }: typeof over = over;
  return {
    id: "c",
    name: null,
    duration: 1,
    loop: false,
    tracks: [
      {
        channel: { kind: "node", node: "n", path: "translation" },
        times: [0, 1],
        values: [0, 0, 0, 1, 1, 1],
        interpolation: "linear",
        ...trackOver,
      },
    ],
    ...rest,
  };
};

const track: (over: Record<string, unknown>) => unknown = (
  over: Record<string, unknown>,
): unknown => clip({ track: over });

const gate: (value: unknown) => IAutoMovieConstraintViolation[] = (
  value: unknown,
): IAutoMovieConstraintViolation[] => {
  const violations: IAutoMovieConstraintViolation[] = [];
  validateClipArtifact(value, "$input.clip", violations);
  return violations;
};

/** The gate reports this fault at exactly this path, in these words. */
const refusedAt: (value: unknown, path: string, fragment: string) => boolean = (
  value: unknown,
  path: string,
  fragment: string,
): boolean =>
  gate(value).some(
    (v: IAutoMovieConstraintViolation): boolean =>
      v.path === path && v.expected.includes(fragment),
  );

/**
 * The sampler refuses the same clip, by throwing. The fragment is optional
 * because a channel too malformed to carry a discriminator faults inside the
 * key builder, whose wording is not this contract's to state.
 */
const samplerThrows: (value: unknown, fragment?: string) => boolean = (
  value: unknown,
  fragment: string = "",
): boolean =>
  throwsError(
    (): Map<string, IAutoMovieSampledChannel> =>
      sampleClip(value as IAutoMovieClip, 0),
    fragment,
  );

/** One rule, both sides: a located violation here, a throw there. */
const bothRefuse: (
  value: unknown,
  path: string,
  fragment: string,
) => boolean = (value: unknown, path: string, fragment: string): boolean =>
  refusedAt(value, path, fragment) && samplerThrows(value, fragment);

/** The gate accepts it and the sampler reads it: the counter-case per rule. */
const bothAccept: (value: unknown) => boolean = (value: unknown): boolean =>
  gate(value).length === 0 &&
  !throwsError(
    (): Map<string, IAutoMovieSampledChannel> =>
      sampleClip(value as IAutoMovieClip, 0.5),
  );

/**
 * The clip track has ONE shape contract, and the artifact gate and the sampler
 * are two voices of it (#1353).
 *
 * `validateClipArtifact` exists so a malformed clip is refused with a located
 * violation instead of throwing out of `sampleClip` at playback. It had learned
 * exactly one of the sampler's rules (strictly increasing times, #1331), so an
 * uneven value stride, an empty keyframe list, a wrong value width, an
 * unsupported interpolation, a non-triplet `cubicspline` stride, a non-boolean
 * `loop`, and an unknown node channel path each committed clean and threw
 * later. Both sides now derive from one rule set, so this scenario asserts the
 * two verdicts together, rule by rule, rather than each side's checks apart: a
 * rule reintroduced on one side alone is what this would catch.
 *
 * Scenarios:
 *
 * 1. Every keyframe-payload rule refuses on BOTH sides at once, each at its own
 *    field: an uneven stride, a wrong value width, an empty keyframe list,
 *    empty values, an unsupported interpolation, a non-triplet `cubicspline`
 *    stride, a non-finite value, a non-finite time, a negative time, a time
 *    past the clip duration, and non-increasing times.
 * 2. A non-boolean `loop` refuses on both sides: it decides wrap versus clamp,
 *    which JavaScript truthiness would otherwise answer for a string.
 * 3. An unknown node channel `path` refuses on both sides. The two messages differ
 *    by design (the gate names the legal set, `channelKey` reports that it can
 *    build no key), so the equivalence is asserted on the refusal, not on the
 *    words.
 * 4. Supported controls: a single keyframe
 *    (which needs no ordering between keys), a width-4 rotation track, a
 *    width-3 `cubicspline` track at stride 9, a variable-width `weights` track,
 *    and `loop: true` all validate clean and sample.
 * 5. The one deliberate asymmetry: the gate is STRICTER about the clip's own
 *    duration (a committed clip must last longer than zero seconds) while the
 *    sampler tolerates a zero-length clip by normalizing every query to its
 *    start. A gate stricter than its consumer refuses more, never less.
 * 6. A malformed channel (a number, `null`, an unknown discriminator) yields a
 *    located violation from the gate rather than a crash inside the width
 *    lookup, and still refuses on the sampler's side.
 * 7. Fixed widths come only from own table keys; weights, prototype spellings
 *    and nonstring keys yield undefined without key coercion.
 * 8. Sparse resident track/time/value arrays produce a located gate finding and a sampler throw, while the ordinary dense translation twin still samples.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual artifact findings and sampler outcomes compare the shared track/loop contract while direct width outputs catch inherited lookup values or key-coercion throws; supported adjacent tracks remain readable.
 * @evidence contracts/testing.md#independent-expectations Node TRS dimensions, quaternion width four, glTF cubic triplets, finite strictly increasing time and boolean looping define the expected payload laws. Variable morph-target weights have no fixed width, and prototype/object keys declare no channel dimension.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the stated shape refusals and selected supported single-keyframe, quaternion, cubic and variable-weight controls, plus zero-duration asymmetry, malformed channels, prototype/object-key lookup and sparse slots beside dense translation. Each invalid field has a located refusal check; the supported controls do not independently pair every malformed input or assert sampled numerical values.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit discovered as test_validation_clip_shape_contract; the exported function owns all gate/sampler/width assertions with authored records, without installing a clip player, native artifact or browser/GPU host.
 */
export function test_validation_clip_shape_contract(): void {
  const sparseTimes: number[] = withoutArraySlot([0, 1], 1);
  const sparseValues: number[] = withoutArraySlot([0, 0, 0, 1, 1, 1], 4);
  TestValidator.predicate(
    "a missing resident clock slot refuses on both sides",
    bothRefuse(
      track({ times: sparseTimes }),
      "$input.clip.tracks[0].times[1]",
      "must be finite",
    ),
  );
  TestValidator.predicate(
    "a missing resident value slot refuses on both sides",
    bothRefuse(
      track({ values: sparseValues }),
      "$input.clip.tracks[0].values[4]",
      "must be finite",
    ),
  );
  TestValidator.predicate(
    "the dense translation twin remains readable",
    bothAccept(track({})),
  );
  const sparseTracks: unknown[] = new Array<unknown>(1);
  TestValidator.predicate(
    "a missing resident track reports its exact path without escaping",
    refusedAt(
      clip({ tracks: sparseTracks }),
      "$input.clip.tracks[0]",
      "JSON object",
    ),
  );
  TestValidator.predicate(
    "the sampler refuses the same missing track",
    samplerThrows(clip({ tracks: sparseTracks })),
  );
  // 1. the keyframe payload, rule by rule
  TestValidator.predicate(
    "an uneven value stride refuses on both sides",
    bothRefuse(
      track({ values: [0, 0, 0, 1, 1] }),
      "$input.clip.tracks[0].values",
      "divide evenly",
    ),
  );
  TestValidator.predicate(
    "a value width the channel does not carry refuses on both sides",
    bothRefuse(
      track({ values: [0, 0, 1, 1] }),
      "$input.clip.tracks[0].values",
      "value width must be 3, but was 2",
    ),
  );
  TestValidator.equals(
    "an empty keyframe list refuses on both sides",
    namedFacts([
      [
        "bothRefuseTrackTimes",
        (): boolean =>
          bothRefuse(
            track({ times: [], values: [] }),
            "$input.clip.tracks[0].times",
            "must have keyframes to sample",
          ),
      ],
      [
        "refusedAtTrackTimes",
        (): boolean =>
          refusedAt(
            track({ times: [], values: [] }),
            "$input.clip.tracks[0].values",
            "values must not be empty",
          ),
      ],
    ]),
    { bothRefuseTrackTimes: true, refusedAtTrackTimes: true },
  );
  TestValidator.predicate(
    "an empty value payload refuses on both sides",
    bothRefuse(
      track({ times: [0], values: [] }),
      "$input.clip.tracks[0].values",
      "values must not be empty",
    ),
  );
  TestValidator.predicate(
    "an unsupported interpolation refuses on both sides",
    bothRefuse(
      track({ interpolation: "bezier" }),
      "$input.clip.tracks[0].interpolation",
      "is not supported",
    ),
  );
  TestValidator.predicate(
    "a non-triplet cubicspline stride refuses on both sides",
    bothRefuse(
      track({ interpolation: "cubicspline", values: [0, 0, 1, 1] }),
      "$input.clip.tracks[0].values",
      "divisible by 3",
    ),
  );
  TestValidator.predicate(
    "a non-finite value refuses on both sides at its index",
    bothRefuse(
      track({ values: [0, 0, 0, 1, Number.POSITIVE_INFINITY, 1] }),
      "$input.clip.tracks[0].values[4]",
      "values[4] must be finite",
    ),
  );
  TestValidator.predicate(
    "a non-finite time refuses on both sides at its index",
    bothRefuse(
      track({ times: [0, Number.NaN] }),
      "$input.clip.tracks[0].times[1]",
      "keyframe times must be finite",
    ),
  );
  TestValidator.predicate(
    "a negative time refuses on both sides",
    bothRefuse(
      track({ times: [-0.5, 1] }),
      "$input.clip.tracks[0].times[0]",
      "non-negative",
    ),
  );
  TestValidator.predicate(
    "a time past the clip duration refuses on both sides",
    bothRefuse(
      track({ times: [0, 2] }),
      "$input.clip.tracks[0].times[1]",
      "within clip duration 1",
    ),
  );
  TestValidator.predicate(
    "non-increasing times refuse on both sides at the offending index",
    bothRefuse(
      track({ times: [0.5, 0.5] }),
      "$input.clip.tracks[0].times[1]",
      "strictly increasing",
    ),
  );

  // 2. the clip's own loop flag
  TestValidator.predicate(
    "a non-boolean loop refuses on both sides",
    bothRefuse(clip({ loop: "false" }), "$input.clip.loop", "must be boolean"),
  );

  // 3. the node channel's address
  const opacity: unknown = track({
    channel: { kind: "node", node: "n", path: "opacity" },
  });
  TestValidator.equals(
    "an unknown node channel path refuses on both sides",
    namedFacts([
      [
        "refusedAtOpacity$input",
        (): boolean =>
          refusedAt(
            opacity,
            "$input.clip.tracks[0].channel.path",
            "must be one of translation, rotation, scale, weights",
          ),
      ],
      [
        "samplerThrowsOpacityUnknown",
        (): boolean => samplerThrows(opacity, 'unknown channel path "opacity"'),
      ],
    ]),
    { refusedAtOpacity$input: true, samplerThrowsOpacityUnknown: true },
  );

  // 4. Supported controls for the shared shape contract.
  TestValidator.predicate(
    "a single keyframe orders nothing and still reads",
    bothAccept(track({ times: [0], values: [0, 0, 0] })),
  );
  TestValidator.predicate(
    "a rotation track carries its own width 4",
    bothAccept(
      track({
        channel: { kind: "node", node: "n", path: "rotation" },
        values: [0, 0, 0, 1, 0, 0, 0, 1],
      }),
    ),
  );
  TestValidator.predicate(
    "a cubicspline translation track reads at stride 9",
    bothAccept(
      track({
        interpolation: "cubicspline",
        values: Array.from({ length: 18 }, (): number => 0),
      }),
    ),
  );
  TestValidator.predicate(
    "a weights track stays variable width",
    bothAccept(
      track({
        channel: { kind: "node", node: "n", path: "weights" },
        values: [0, 0, 1, 1],
      }),
    ),
  );
  TestValidator.predicate(
    "a looping clip reads",
    bothAccept(clip({ loop: true })),
  );

  // 5. the deliberate asymmetry: the gate is stricter about duration
  const zero: unknown = clip({
    duration: 0,
    track: { times: [0], values: [0, 0, 0] },
  });
  TestValidator.equals(
    "a zero-length clip is refused by the gate and tolerated by the sampler",
    namedFacts([
      [
        "refusedAtZero$input",
        (): boolean => refusedAt(zero, "$input.clip.duration", "clip duration"),
      ],
      [
        "throwsErrorSampleClipZero",
        (): boolean =>
          !throwsError(
            (): Map<string, IAutoMovieSampledChannel> =>
              sampleClip(zero as IAutoMovieClip, 5),
          ),
      ],
    ]),
    { refusedAtZero$input: true, throwsErrorSampleClipZero: true },
  );

  // 6. a malformed channel reaches no width lookup crash
  TestValidator.equals(
    "a numeric channel refuses on both sides",
    namedFacts([
      [
        "refusedAtTrackChannel",
        (): boolean =>
          refusedAt(
            track({ channel: 7 }),
            "$input.clip.tracks[0].channel",
            "JSON object",
          ),
      ],
      [
        "samplerThrowsTrackChannel",
        (): boolean =>
          samplerThrows(track({ channel: 7 }), "unknown channel kind"),
      ],
    ]),
    { refusedAtTrackChannel: true, samplerThrowsTrackChannel: true },
  );
  TestValidator.equals(
    "a null channel refuses on both sides",
    namedFacts([
      [
        "refusedAtTrackChannel",
        (): boolean =>
          refusedAt(
            track({ channel: null }),
            "$input.clip.tracks[0].channel",
            "JSON object",
          ),
      ],
      [
        "samplerThrowsTrackChannel",
        (): boolean => samplerThrows(track({ channel: null })),
      ],
    ]),
    { refusedAtTrackChannel: true, samplerThrowsTrackChannel: true },
  );
  TestValidator.equals(
    "an unknown channel discriminator refuses on both sides",
    namedFacts([
      [
        "refusedAtTrackChannel",
        (): boolean =>
          refusedAt(
            track({ channel: { kind: "material", pointer: "/x" } }),
            "$input.clip.tracks[0].channel.kind",
            'must be "node"',
          ),
      ],
      [
        "samplerThrowsTrackChannel",
        (): boolean =>
          samplerThrows(
            track({ channel: { kind: "material", pointer: "/x" } }),
            "unknown channel kind",
          ),
      ],
    ]),
    { refusedAtTrackChannel: true, samplerThrowsTrackChannel: true },
  );
  TestValidator.equals(
    "only own fixed-width keys supply a numeric width",
    [
      channelValueWidth({ kind: "node", path: "translation" }),
      channelValueWidth({ kind: "node", path: "weights" }),
      channelValueWidth({ kind: "node", path: "constructor" }),
      channelValueWidth({ kind: "node", path: "__proto__" }),
      channelValueWidth({ kind: "pointer", valueType: "quaternion" }),
      channelValueWidth({ kind: "pointer", valueType: "constructor" }),
    ],
    [3, undefined, undefined, undefined, 4, undefined],
  );
  TestValidator.equals(
    "a nonstring width key is rejected without coercion",
    channelValueWidth({ kind: "pointer", valueType: Object.create(null) }),
    undefined,
  );
}
