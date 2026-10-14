import type {
  IAutoMovieCaptionGraphemeSegmentationIdentity,
  IAutoMovieCaptionReadabilityProfile,
  IAutoMovieFilmTimeline,
} from "@automovie/interface";
import {
  AUTOMOVIE_CAPTION_GRAPHEME_SEGMENTATION,
  inspectAutoMovieCaptionReadability,
} from "@automovie/production";
import { inspectAutoMovieCaptionReadabilityWithRuntime } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

const identity: IAutoMovieCaptionGraphemeSegmentationIdentity = {
  algorithm: "fixture-segmenter",
  version: "1",
  granularity: "grapheme",
  locale: {
    kind: "requested-resolved",
    requested: "en",
    resolved: "en-US",
  },
};

const timeline: (captions: IAutoMovieFilmTimeline["tracks"]["captions"]) => IAutoMovieFilmTimeline = (
  captions: IAutoMovieFilmTimeline["tracks"]["captions"],
): IAutoMovieFilmTimeline => ({
  version: 1,
  builder: "caption-identity-fixture",
  inputFingerprint: "sha256:caption-identity",
  sourceDigest: "sha256:caption-source",
  id: "caption-identity",
  fps: 4,
  totalFrames: 20,
  segments: [],
  omissions: [],
  tracks: { audio: [], effects: [], captions },
});

const profile: (segmentation: IAutoMovieCaptionGraphemeSegmentationIdentity, inclusive: boolean) => IAutoMovieCaptionReadabilityProfile = (
  segmentation: IAutoMovieCaptionGraphemeSegmentationIdentity,
  inclusive: boolean,
): IAutoMovieCaptionReadabilityProfile => ({
  id: "english-readability",
  version: 1,
  language: "en-US",
  segmentation,
  maxGraphemesPerSecond: { value: 5, inclusive },
  maxLinesPerCue: { value: 2, inclusive },
  maxGraphemesPerLine: { value: 4, inclusive },
  minDurationFrames: { value: 4, inclusive },
  minGapFrames: { value: 1, inclusive },
});

const runtime: (segmentation: IAutoMovieCaptionGraphemeSegmentationIdentity) => Parameters<typeof inspectAutoMovieCaptionReadabilityWithRuntime>[2] = (
  segmentation: IAutoMovieCaptionGraphemeSegmentationIdentity,
): Parameters<typeof inspectAutoMovieCaptionReadabilityWithRuntime>[2] => ({
  identity: segmentation,
  segment: (value: string): Iterable<unknown> => Array.from(value),
});

/**
 * A readability verdict identifies the exact grapheme runtime that earned it.
 *
 * Scenarios:
 *
 * 1. The public `Intl.Segmenter` adapter reports requested and resolved locale,
 *    granularity, and revision from the same instance that measures the cue.
 * 2. Profile language and segmenter locale remain separate roles, so a Thai
 *    profile may deliberately select the installed fixed-English identity.
 * 3. Missing profiles retain actual identity and measurements with `not-run`.
 * 4. Case-equivalent cue languages share profile and preceding-gap identity.
 * 5. Inclusive equality passes and exclusive equality reports all five breach
 *    kinds without changing the measurements.
 * 6. Algorithm, revision, granularity, requested locale, resolved locale, and
 *    locale-mode mismatches remain unsupported without runtime fallback.
 * 7. Exact requested-to-resolved and exact locale-neutral identities evaluate,
 *    while the old two-field identity never becomes a version-2 verdict.
 *
 * @evidence contracts/testing.md#behavioral-verification Measures the original canonical caption cues through both the public resident adapter and the real injected-runtime inspector, asserting measured counts/rate, complete identity propagation, language/profile/gap matching, inclusive/exclusive outcomes, all five breach kinds and explicit not-run reasons for missing or incompatible profiles.
 * @evidence contracts/testing.md#independent-expectations The combining sequence and joined astronaut emoji supply two graphemes over four frames at 4 fps; authored ASCII cues independently give five graphemes, two lines, longest line four, duration four and gap one. Profile equality versus strict inequalities predicts the breach list. Public identity is compared with the published constant, not an independent proof of the host revision or every Unicode segmentation rule.
 * @evidence contracts/testing.md#distinguishing-cases Preserves all seven numbered scenarios, Thai thresholds with the installed English segmenter, missing profile, case-equivalent and malformed languages, both boundary senses, each of six complete identity mismatches, locale-neutral success and the incomplete v1 identity refusal. Exclusive evaluation retains the same measured facts.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit owns timeline/profile values and invokes the actual runtime injection seam; its fixture segmenter handles only the existing ASCII cases, while the Unicode case uses the installed public adapter. No foreign method/global replacement, native process, dynamic test or visual/readability user acceptance is claimed.
 */
export function test_production_caption_readability_identity(): void {
  const publicTimeline: IAutoMovieFilmTimeline = timeline([
    {
      id: "unicode",
      text: "e\u0301\ud83d\udc69\u200d\ud83d\ude80\r\n",
      language: "th",
      startFrame: 0,
      endFrame: 4,
    },
  ]);
  const measured: ReturnType<typeof inspectAutoMovieCaptionReadability> = inspectAutoMovieCaptionReadability(publicTimeline, []);
  const { graphemesPerSecond, ...measurement }: typeof measured.cues[number]["measurement"] = measured.cues[0]!.measurement;
  TestValidator.predicate("two graphemes in one authored second retain the exact rate", nclose(graphemesPerSecond, 2, 0));
  TestValidator.equals(
    "the public wrapper reports its complete actual runtime identity",
    {
      version: measured.version,
      measurement,
      outcome: measured.cues[0]!.outcome,
      requested: AUTOMOVIE_CAPTION_GRAPHEME_SEGMENTATION.locale.requested,
      resolvedNonBlank:
        AUTOMOVIE_CAPTION_GRAPHEME_SEGMENTATION.locale.resolved.length > 0,
    },
    {
      version: 2,
      measurement: {
        cue: "unicode",
        language: "th",
        segmentation: AUTOMOVIE_CAPTION_GRAPHEME_SEGMENTATION,
        graphemes: 2,
        lines: 2,
        maxLineGraphemes: 2,
        durationFrames: 4,
        gapBeforeFrames: null,
      },
      outcome: {
        status: "not-run",
        segmentation: null,
        reason: "caption-readability-profile-not-declared",
      },
      requested: "en",
      resolvedNonBlank: true,
    },
  );

  const thaiProfile: IAutoMovieCaptionReadabilityProfile = profile(AUTOMOVIE_CAPTION_GRAPHEME_SEGMENTATION, true);
  thaiProfile.id = "thai-readability";
  thaiProfile.language = "th";
  TestValidator.equals(
    "threshold language does not replace the selected segmentation locale",
    inspectAutoMovieCaptionReadability(publicTimeline, [thaiProfile]).cues[0]!
      .outcome.status,
    "evaluated",
  );

  const cues: IAutoMovieFilmTimeline["tracks"]["captions"] = [
    {
      id: "first",
      text: "abcd\r\nx",
      language: "EN-us",
      startFrame: 0,
      endFrame: 4,
    },
    {
      id: "second",
      text: "abcd\nx",
      language: "en-US",
      startFrame: 5,
      endFrame: 9,
    },
  ];
  const inclusive: ReturnType<typeof inspectAutoMovieCaptionReadabilityWithRuntime> = inspectAutoMovieCaptionReadabilityWithRuntime(
    timeline(cues),
    [profile(identity, true)],
    runtime(identity),
  );
  TestValidator.equals(
    "case-equivalent languages share profiles and same-language gap state",
    inclusive.cues.map((cue: typeof inclusive.cues[number]): { gap: number | null; status: typeof cue.outcome.status; passed: boolean | null } => ({
      gap: cue.measurement.gapBeforeFrames,
      status: cue.outcome.status,
      passed: cue.outcome.status === "evaluated" ? cue.outcome.passed : null,
    })),
    [
      { gap: null, status: "evaluated", passed: true },
      { gap: 1, status: "evaluated", passed: true },
    ],
  );

  const malformedLanguage: ReturnType<typeof inspectAutoMovieCaptionReadabilityWithRuntime> = inspectAutoMovieCaptionReadabilityWithRuntime(
    timeline(
      cues.map((cue: typeof cues[number], index: number): typeof cues[number] => ({
        ...cue,
        id: `malformed-${index}`,
        language: "en-12",
      })),
    ),
    [{ ...profile(identity, true), language: "en-12" }],
    runtime(identity),
  );
  TestValidator.equals(
    "malformed languages never become a profile or gap identity",
    malformedLanguage.cues.map((cue: typeof malformedLanguage.cues[number]): { gap: number | null; outcome: typeof cue.outcome } => ({
      gap: cue.measurement.gapBeforeFrames,
      outcome: cue.outcome,
    })),
    [
      {
        gap: null,
        outcome: {
          status: "not-run",
          segmentation: null,
          reason: "caption-readability-profile-not-declared",
        },
      },
      {
        gap: null,
        outcome: {
          status: "not-run",
          segmentation: null,
          reason: "caption-readability-profile-not-declared",
        },
      },
    ],
  );

  const exclusive: ReturnType<typeof inspectAutoMovieCaptionReadabilityWithRuntime> = inspectAutoMovieCaptionReadabilityWithRuntime(
    timeline(cues),
    [profile(identity, false)],
    runtime(identity),
  );
  TestValidator.predicate(
    "changing threshold sense preserves every measured count, identity and rate",
    exclusive.cues.every((cue: typeof exclusive.cues[number], index: number): boolean => {
      const { graphemesPerSecond: actualRate, ...actual }: typeof cue.measurement = cue.measurement;
      const { graphemesPerSecond: expectedRate, ...expected }: typeof cue.measurement = inclusive.cues[index]!.measurement;
      TestValidator.equals("inclusive and exclusive measurement facts", actual, expected);
      return nclose(actualRate, expectedRate, 0);
    }),
  );
  TestValidator.equals(
    "exclusive equality reports every applicable boundary breach",
    exclusive.cues[1]!.outcome,
    {
      status: "evaluated",
      profile: "english-readability",
      segmentation: identity,
      passed: false,
      breaches: [
        "graphemes-per-second",
        "lines-per-cue",
        "graphemes-per-line",
        "duration-frames",
        "gap-frames",
      ],
    },
  );

  const mismatches: IAutoMovieCaptionGraphemeSegmentationIdentity[] = [
    { ...identity, algorithm: "other" },
    { ...identity, version: "2" },
    { ...identity, granularity: "word" as "grapheme" },
    {
      ...identity,
      locale: {
        kind: "requested-resolved",
        requested: "fr",
        resolved: "en-US",
      },
    },
    {
      ...identity,
      locale: {
        kind: "requested-resolved",
        requested: "en",
        resolved: "en-GB",
      },
    },
    { ...identity, locale: { kind: "locale-neutral" } },
  ];
  TestValidator.equals(
    "every complete identity mismatch is unsupported without fallback",
    mismatches.map(
      (requested: IAutoMovieCaptionGraphemeSegmentationIdentity): typeof inclusive.cues[number]["outcome"] =>
        inspectAutoMovieCaptionReadabilityWithRuntime(
          timeline(cues.slice(0, 1)),
          [profile(requested, true)],
          runtime(identity),
        ).cues[0]!.outcome,
    ),
    mismatches.map((requested: IAutoMovieCaptionGraphemeSegmentationIdentity): typeof inclusive.cues[number]["outcome"] => ({
      status: "not-run" as const,
      segmentation: requested,
      reason: "caption-grapheme-segmentation-unsupported" as const,
    })),
  );

  const neutralIdentity: IAutoMovieCaptionGraphemeSegmentationIdentity = {
    algorithm: "neutral-fixture",
    version: "1",
    granularity: "grapheme",
    locale: { kind: "locale-neutral" },
  };
  const neutralOutcome: typeof inclusive.cues[number]["outcome"] = inspectAutoMovieCaptionReadabilityWithRuntime(
    timeline(cues.slice(0, 1)),
    [profile(neutralIdentity, true)],
    runtime(neutralIdentity),
  ).cues[0]!.outcome;
  TestValidator.equals(
    "an exact locale-neutral runtime evaluates as its own identity",
    neutralOutcome.status,
    "evaluated",
  );

  const oldProfile: IAutoMovieCaptionReadabilityProfile = {
    ...profile(identity, true),
    segmentation: { algorithm: identity.algorithm, version: identity.version },
  } as unknown as IAutoMovieCaptionReadabilityProfile;
  TestValidator.equals(
    "a version-1 two-field identity is not reinterpreted as complete",
    inspectAutoMovieCaptionReadabilityWithRuntime(
      timeline(cues.slice(0, 1)),
      [oldProfile],
      runtime(identity),
    ).cues[0]!.outcome,
    {
      status: "not-run",
      segmentation: oldProfile.segmentation,
      reason: "caption-grapheme-segmentation-unsupported",
    },
  );
}
