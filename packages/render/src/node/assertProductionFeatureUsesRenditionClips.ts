import type { IAutoMovieFilmTimeline } from "@automovie/interface";
import type { Sample, Track } from "mp4box";

import { neutralTrackPresentation } from "./neutralTrackPresentation";
import { parseMp4 } from "./parseMp4";
import { productionRenditionVideoPlan } from "./productionRenditionVideoPlan";
import { sameSampleDescription } from "./sameSampleDescription";
import { sameSampleFlags } from "./sameSampleFlags";
import { sampleDescription } from "./sampleDescription";

/**
 * Prove that a feature's first video track is exactly the repaint clips of
 * `timeline` spliced losslessly, without building the expected video.
 *
 * The clips are resolved through `productionRenditionVideoPlan`, the same plan
 * `conformProductionRenditionVideoMp4` writes from, so every refusal of that
 * plan applies here too. The feature track must then use the first clip's
 * timescale for both clocks, the plan's media duration, the first clip's
 * raster, an untransformed presentation starting at 0, and exactly
 * `timeline.totalFrames` samples. Sample `k` of clip `c`, starting at output
 * frame `start`, must have the plan's sample duration, decode time
 * `(start + (dts - decodeStart) / clip duration) * duration`, presentation
 * time `(start + (cts - presentationStart) / clip duration) * duration`, the
 * source's flags, the plan's decoder configuration, and identical payload
 * bytes.
 *
 * A container mismatch throws `Feature video presentation does not match the
 * selected repaint timeline.` A sample mismatch throws `Feature video sample
 * <i> differs from the selected repaint timeline:` followed by a JSON record of
 * the expected and actual timing, flags, configuration match and payload
 * sizes with the first differing byte.
 *
 * @evidence contracts/common.md#principled-implementation The proof compares the feature's own parsed sample table and payload bytes with the clips' at the positions the lossless splice rule puts them, so it holds for any writer that produced the feature, and it restates the timing rule rather than calling the writer so a writer defect cannot prove itself.
 * @evidence contracts/common.md#clear-and-simple-design The clip validation is the shared plan, flag equality is `sameSampleFlags` and configuration equality `sameSampleDescription`; this function owns only the walk over the feature's samples and the failure record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No tolerance is applied to any tick, flag or byte, and the failure record is diagnostic output only; it does not change which features pass.
 * @evidence contracts/common.md#meaningful-documentation The doc states where the clips are resolved, every track-level requirement, the exact per-sample timing formulas and equalities, and both refusal messages with the content of the diagnostic record.
 * @evidence contracts/performance.md#efficient-algorithms The plan parses every segment occurrence, including repeated shots, with each clip's O(M + S log(M+1)) residency proof and description work. The feature is parsed once; sample comparison adds payload-byte comparison, subsample-table serialization and fixed timing checks. Configuration serialization is skipped while the actual description object remains the last checked object. Parsing and compact table populations prevent a strict bound in compared payload bytes alone.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The proof runs once per delivery validation over caller-held bytes and has no result another request could reuse; the plan it reads is built per call because the proof must not trust a writer's earlier plan.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The parsed feature, the parsed clips and their sample tables are held only until return, and the function retains nothing and opens no handle or task.
 */
export const assertProductionFeatureUsesRenditionClips: (props: {
  feature: Uint8Array;
  timeline: IAutoMovieFilmTimeline;
  clips: ReadonlyMap<string, Uint8Array>;
}) => void = (props: {
  /** Delivered feature MP4 whose first video track is checked. */
  feature: Uint8Array;

  /** Current cut-only timeline the repaint clips cover. */
  timeline: IAutoMovieFilmTimeline;

  /** Repaint clip bytes keyed by segment `shot`. */
  clips: ReadonlyMap<string, Uint8Array>;
}): void => {
  const plan: ReturnType<typeof productionRenditionVideoPlan> =
    productionRenditionVideoPlan(props);
  const actual: ReturnType<typeof parseMp4> = parseMp4(props.feature);
  const track: Track | undefined = actual.movie.videoTracks[0];
  const samples: Sample[] =
    track === undefined ? [] : actual.file.getTrackSamplesInfo(track.id);
  if (
    track === undefined ||
    track.timescale !== plan.first.track.timescale ||
    track.duration !== plan.mediaDuration ||
    track.movie_timescale !== plan.first.track.timescale ||
    track.movie_duration !== plan.mediaDuration ||
    track.video?.width !== plan.first.probe.width ||
    track.video?.height !== plan.first.probe.height ||
    track.track_width !== plan.first.probe.width ||
    track.track_height !== plan.first.probe.height ||
    samples.length !== props.timeline.totalFrames ||
    neutralTrackPresentation(track, 0) === false
  )
    throw new Error(
      "Feature video presentation does not match the selected repaint timeline.",
    );
  let checkedDescription: unknown = undefined;
  let index: number = 0;
  for (const clip of plan.parsed) {
    const clipStart: number = index;
    for (const source of clip.samples) {
      // The track holds exactly `totalFrames` samples and the plan's clips
      // cover exactly that many, so every index is present.
      const actualSample: Sample = samples[index]!;
      const dts: number =
        (clipStart + (source.dts - clip.decodeStart) / clip.sampleDuration) *
        plan.sampleDuration;
      const cts: number =
        (clipStart +
          (source.cts - clip.presentationStart) / clip.sampleDuration) *
        plan.sampleDuration;
      const sourceBytes: Uint8Array = clip.bytes.subarray(
        source.offset,
        source.offset + source.size,
      );
      const actualBytes: Uint8Array = props.feature.subarray(
        actualSample.offset,
        actualSample.offset + actualSample.size,
      );
      const descriptionMatches: boolean =
        actualSample.description === checkedDescription ||
        sameSampleDescription(
          sampleDescription(actualSample),
          plan.description,
        );
      if (
        actualSample.duration !== plan.sampleDuration ||
        actualSample.dts !== dts ||
        actualSample.cts !== cts ||
        sameSampleFlags(actualSample, source) === false ||
        descriptionMatches === false ||
        Buffer.compare(actualBytes, sourceBytes) !== 0
      )
        throw new Error(
          `Feature video sample ${index} differs from the selected repaint timeline:\n${JSON.stringify(
            sampleMismatchRecord({
              actual: actualSample,
              source,
              expected: { duration: plan.sampleDuration, dts, cts },
              descriptionMatches,
              actualBytes,
              sourceBytes,
            }),
            null,
            2,
          )}`,
        );
      checkedDescription = actualSample.description;
      ++index;
    }
  }
};

/** Bounded diagnostic record of one failed sample comparison. */
const sampleMismatchRecord: (props: {
  actual: Sample;
  source: Sample;
  expected: { duration: number; dts: number; cts: number };
  descriptionMatches: boolean;
  actualBytes: Uint8Array;
  sourceBytes: Uint8Array;
}) => Record<string, unknown> = (props: {
  actual: Sample;
  source: Sample;
  expected: { duration: number; dts: number; cts: number };
  descriptionMatches: boolean;
  actualBytes: Uint8Array;
  sourceBytes: Uint8Array;
}): Record<string, unknown> => ({
  timing: {
    actual: {
      duration: props.actual.duration,
      dts: props.actual.dts,
      cts: props.actual.cts,
    },
    expected: props.expected,
  },
  flags: {
    actual: sampleFlagRecord(props.actual),
    expected: sampleFlagRecord(props.source),
    match: sameSampleFlags(props.actual, props.source),
  },
  sampleDescriptionMatches: props.descriptionMatches,
  payload: {
    actualBytes: props.actualBytes.length,
    expectedBytes: props.sourceBytes.length,
    firstDifferingActualByte: props.actualBytes.findIndex(
      (value: number, byte: number): boolean =>
        value !== props.sourceBytes[byte],
    ),
  },
});

/** Parser-visible dependency and redundancy flags of one sample. */
const sampleFlagRecord: (sample: Sample) => Record<string, unknown> = (
  sample: Sample,
): Record<string, unknown> => ({
  isSync: sample.is_sync,
  isLeading: sample.is_leading,
  dependsOn: sample.depends_on,
  isDependedOn: sample.is_depended_on,
  hasRedundancy: sample.has_redundancy,
  degradationPriority: sample.degradation_priority,
});
