import type {
  IAutoMovieCaptionGraphemeRuntime,
  IAutoMovieCaptionGraphemeSegmentationIdentity,
  IAutoMovieCaptionReadabilityBoundary,
  IAutoMovieCaptionReadabilityMeasurement,
  IAutoMovieCaptionReadabilityOutcome,
  IAutoMovieCaptionReadabilityProfile,
  IAutoMovieCaptionReadabilityReport,
  IAutoMovieFilmTimeline,
} from "@automovie/interface";

import { autoMovieCaptionLanguageComparisonKey } from "./autoMovieCaptionLanguageComparisonKey.js";
import { canonicalizeAutoMovieCaptionText } from "./canonicalizeAutoMovieCaptionText.js";

/*
 * Measure caption readability through one injected, identity-bearing runtime
 * and judge each cue against its language's profile.
 *
 * The grapheme runtime is injected because the host owns it: production binds
 * Node's installed `Intl.Segmenter` and reports that exact identity. Each cue
 * is measured on its canonical presentation: graphemes, lines, the longest
 * line, duration, the gap since the previous cue of the same language identity
 * in track order, and graphemes per second at `timeline.fps`. A cue whose
 * language has no profile, or whose profile names a segmentation identity other
 * than the runtime's, keeps its measurement with a `not-run` outcome instead of
 * a verdict. Profiles are matched by ASCII case-insensitive language identity;
 * design validation refuses two profiles for one identity, so none is shadowed.
 * The track must be in start order with positive durations, as film assembly
 * guarantees; a zero-length cue would report an infinite rate.
 */
export const inspectAutoMovieCaptionReadabilityWithRuntime: (
  timeline: IAutoMovieFilmTimeline,
  profiles: readonly IAutoMovieCaptionReadabilityProfile[],
  runtime: IAutoMovieCaptionGraphemeRuntime,
) => IAutoMovieCaptionReadabilityReport = (
  timeline: IAutoMovieFilmTimeline,
  profiles: readonly IAutoMovieCaptionReadabilityProfile[],
  runtime: IAutoMovieCaptionGraphemeRuntime,
): IAutoMovieCaptionReadabilityReport => {
  const profilesByLanguage: Map<string, IAutoMovieCaptionReadabilityProfile> =
    new Map();
  for (const profile of profiles) {
    const languageIdentity: string | null =
      autoMovieCaptionLanguageComparisonKey(profile.language);
    if (languageIdentity !== null)
      profilesByLanguage.set(languageIdentity, profile);
  }
  const precedingEndByLanguage: Map<string, number> = new Map();
  return {
    version: 2,
    cues: timeline.tracks.captions.map(
      (
        cue: IAutoMovieFilmTimeline["tracks"]["captions"][number],
      ): IAutoMovieCaptionReadabilityReport["cues"][number] => {
        const lines: string[] = canonicalizeAutoMovieCaptionText(
          cue.text,
        ).split("\n");
        let graphemes: number = 0;
        let maxLineGraphemes: number = 0;
        for (const line of lines) {
          const count: number = countItems(runtime.segment(line));
          graphemes += count;
          if (count > maxLineGraphemes) maxLineGraphemes = count;
        }
        const durationFrames: number = cue.endFrame - cue.startFrame;
        const languageIdentity: string | null =
          autoMovieCaptionLanguageComparisonKey(cue.language);
        const precedingEnd: number | undefined =
          languageIdentity === null
            ? undefined
            : precedingEndByLanguage.get(languageIdentity);
        if (languageIdentity !== null)
          precedingEndByLanguage.set(languageIdentity, cue.endFrame);
        const measurement: IAutoMovieCaptionReadabilityMeasurement = {
          cue: cue.id,
          language: cue.language,
          segmentation: runtime.identity,
          graphemes,
          lines: lines.length,
          maxLineGraphemes,
          durationFrames,
          gapBeforeFrames:
            precedingEnd === undefined ? null : cue.startFrame - precedingEnd,
          graphemesPerSecond: (graphemes * timeline.fps) / durationFrames,
        };
        return {
          measurement,
          outcome: captionReadabilityOutcome(
            measurement,
            languageIdentity === null
              ? undefined
              : profilesByLanguage.get(languageIdentity),
            runtime.identity,
          ),
        };
      },
    ),
  };
};

/*
 * Number of items an iterable yields, without materializing them.
 */
const countItems: (items: Iterable<unknown>) => number = (
  items: Iterable<unknown>,
): number => {
  let count: number = 0;
  for (const _ of items) count += 1;
  return count;
};

const captionReadabilityOutcome: (
  measurement: IAutoMovieCaptionReadabilityMeasurement,
  profile: IAutoMovieCaptionReadabilityProfile | undefined,
  actualSegmentation: IAutoMovieCaptionGraphemeSegmentationIdentity,
) => IAutoMovieCaptionReadabilityOutcome = (
  measurement: IAutoMovieCaptionReadabilityMeasurement,
  profile: IAutoMovieCaptionReadabilityProfile | undefined,
  actualSegmentation: IAutoMovieCaptionGraphemeSegmentationIdentity,
): IAutoMovieCaptionReadabilityOutcome => {
  if (profile === undefined)
    return {
      status: "not-run",
      segmentation: null,
      reason: "caption-readability-profile-not-declared",
    };
  if (
    sameCaptionGraphemeSegmentationIdentity(
      profile.segmentation,
      actualSegmentation,
    ) === false
  )
    return {
      status: "not-run",
      segmentation: profile.segmentation,
      reason: "caption-grapheme-segmentation-unsupported",
    };
  const breaches: Extract<
    IAutoMovieCaptionReadabilityOutcome,
    { status: "evaluated" }
  >["breaches"] = [];
  if (
    maximumBoundaryPassed(
      measurement.graphemesPerSecond,
      profile.maxGraphemesPerSecond,
    ) === false
  )
    breaches.push("graphemes-per-second");
  if (
    maximumBoundaryPassed(measurement.lines, profile.maxLinesPerCue) === false
  )
    breaches.push("lines-per-cue");
  if (
    maximumBoundaryPassed(
      measurement.maxLineGraphemes,
      profile.maxGraphemesPerLine,
    ) === false
  )
    breaches.push("graphemes-per-line");
  if (
    minimumBoundaryPassed(
      measurement.durationFrames,
      profile.minDurationFrames,
    ) === false
  )
    breaches.push("duration-frames");
  if (
    measurement.gapBeforeFrames !== null &&
    minimumBoundaryPassed(measurement.gapBeforeFrames, profile.minGapFrames) ===
      false
  )
    breaches.push("gap-frames");
  return {
    status: "evaluated",
    profile: profile.id,
    segmentation: profile.segmentation,
    passed: breaches.length === 0,
    breaches,
  };
};

const sameCaptionGraphemeSegmentationIdentity: (
  left: IAutoMovieCaptionGraphemeSegmentationIdentity,
  right: IAutoMovieCaptionGraphemeSegmentationIdentity,
) => boolean = (
  left: IAutoMovieCaptionGraphemeSegmentationIdentity,
  right: IAutoMovieCaptionGraphemeSegmentationIdentity,
): boolean =>
  left.algorithm === right.algorithm &&
  left.version === right.version &&
  left.granularity === right.granularity &&
  left.locale.kind === right.locale.kind &&
  (left.locale.kind === "locale-neutral" ||
    (right.locale.kind === "requested-resolved" &&
      left.locale.requested === right.locale.requested &&
      left.locale.resolved === right.locale.resolved));

const maximumBoundaryPassed: (
  value: number,
  boundary: IAutoMovieCaptionReadabilityBoundary,
) => boolean = (
  value: number,
  boundary: IAutoMovieCaptionReadabilityBoundary,
): boolean =>
  boundary.inclusive ? value <= boundary.value : value < boundary.value;

const minimumBoundaryPassed: (
  value: number,
  boundary: IAutoMovieCaptionReadabilityBoundary,
) => boolean = (
  value: number,
  boundary: IAutoMovieCaptionReadabilityBoundary,
): boolean =>
  boundary.inclusive ? value >= boundary.value : value > boundary.value;
