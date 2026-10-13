import { resolveProductionFrameRate } from "@automovie/engine";
import type { IAutoMovieFilmTimeline } from "@automovie/interface";
import type { Sample } from "mp4box";

import { assertProductionVideoProfile } from "../delivery/assertProductionVideoProfile";
import { resolveProductionVideoProfile } from "../delivery/resolveProductionVideoProfile";
import { productionVisualDeliveryOccurrence } from "../film/productionVisualDeliveryOccurrence";
import type { IProductionRenditionClip } from "./IProductionRenditionClip";
import { appendLosslessVideoClip } from "./appendLosslessVideoClip";
import { openLosslessVideoTrack } from "./openLosslessVideoTrack";
import { parseProductionRenditionClip } from "./parseProductionRenditionClip";
import { probeProductionVideoMp4 } from "./probeProductionVideoMp4";
import { sameSampleDescription } from "./sameSampleDescription";
import { sampleDescription } from "./sampleDescription";

/**
 * Splice a cut-only timeline whose occurrences each come from one of two
 * lanes, a range of the deterministic feature or a full repaint clip, into
 * one video track without decoding.
 *
 * `sources[i]` must belong to timeline segment `i`, joined by
 * `productionVisualDeliveryOccurrence`. Segments must be cuts, non-empty and
 * contiguous from frame 0 to `timeline.totalFrames`. Every deterministic
 * source must be the same bytes, a feature of exactly `totalFrames` frames,
 * and its occurrence copies that feature's samples `startFrame` through
 * `endFrame - 1` in decode order; that range must present exactly the
 * segment's frames, and must start at a sync sample when the previous
 * occurrence is a repaint. A repainted occurrence must be a full-shot clip of
 * exactly the segment's length. Every occurrence must share the first one's
 * raster, media timescale, sample duration and decoder configuration. The
 * written video must pass the delivery profile at the timeline's rational
 * frame rate.
 *
 * Each refusal throws an `Error` naming the occurrence index where one is
 * responsible, or an `unsupported-video-profile.<field>` error from the final
 * profile check.
 *
 * No production module calls this function at present; only tests reach it.
 *
 * @evidence contracts/common.md#principled-implementation A deterministic range is spliced only when its decode-order samples present exactly the segment's frames, which with the parser's whole-frame presentation permutation means every presentation time falls inside the segment, and only when decoding can restart there, a sync sample after a repaint; consecutive deterministic ranges continue one stream, so they need no sync sample; the remaining premise, that a repaint clip's sync first sample is an IDR picture, is the clip parser's.
 * @evidence contracts/common.md#clear-and-simple-design This function owns the lane rules and the timeline join; clip parsing, the container and re-timing are the shared `parseProductionRenditionClip`, `openLosslessVideoTrack` and `appendLosslessVideoClip`. The gap is that no production consumer remains.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Transitions, trims, gaps, a range that would need reordered frames from a neighbor, and mismatched clips are refused instead of being re-encoded or patched, and no occurrence is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The doc states the source join, the timeline shape, every deterministic and repaint lane rule including frame closure and the sync rule, the shared presentation contract, the final profile check, and how refusals name the occurrence.
 * @evidence contracts/performance.md#efficient-algorithms For O occurrences and a feature of F samples, the deterministic feature is parsed once however many occurrences cite it, an occurrence citing the same array skips the byte comparison and another array is compared natively, each range is checked in time linear in its length, coverage is proved before any sample is written, and the output is parsed once; total time is linear in the bytes spliced.
 * @evidence contracts/performance.md#reuse-equivalent-work The parsed deterministic feature is shared by every deterministic occurrence after its bytes are proved identical to the first one's, so equality of content, not of the array reference alone, decides the reuse; nothing is cached across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Until return the output file holds a copy of every written sample and views of the source bytes, and the parsed sources stay referenced, so peak memory is about twice the film's encoded size plus the output buffer; only the returned array outlives the call.
 */
export const conformProductionVisualDeliveryVideoMp4 = (props: {
  /** Current cut-only film timeline the sources must cover exactly. */
  timeline: IAutoMovieFilmTimeline;

  /** One source per timeline segment, in segment order. */
  sources: ReadonlyArray<{
    /** Occurrence key from `productionVisualDeliveryOccurrence`. */
    occurrence: string;

    /** Whether the bytes are the deterministic feature or a repaint clip. */
    lane: "deterministic" | "repainted";

    /** The deterministic feature MP4 or the repaint clip MP4. */
    bytes: Uint8Array;
  }>;
}): Uint8Array => {
  if (
    props.sources.length !== props.timeline.segments.length ||
    props.sources.some(
      (source: (typeof props.sources)[number], index: number): boolean =>
        source.occurrence !==
        productionVisualDeliveryOccurrence(
          props.timeline.segments[index]!,
          index,
        ),
    )
  )
    throw new Error(
      "Visual delivery sources must exactly join the current timeline occurrences.",
    );
  let deterministic: IProductionRenditionClip | undefined;
  let nextFrame: number = 0;
  const parsed: IProductionRenditionClip[] = props.timeline.segments.map(
    (
      segment: IAutoMovieFilmTimeline["segments"][number],
      index: number,
    ): IProductionRenditionClip => {
      if (
        segment.transitionIn.kind !== "cut" ||
        segment.transitionOut.kind !== "cut"
      )
        throw new Error(
          `Mixed visual delivery currently requires cut-only editing at occurrence ${index}.`,
        );
      if (
        segment.startFrame !== nextFrame ||
        segment.endFrame <= segment.startFrame
      )
        throw new Error(
          `Visual delivery occurrence ${index} does not occupy the next continuous film frames.`,
        );
      nextFrame = segment.endFrame;
      const source: (typeof props.sources)[number] = props.sources[index]!;
      if (source.lane === "repainted") {
        const clip: IProductionRenditionClip = parseProductionRenditionClip(
          source.bytes,
          `Repaint occurrence ${index}`,
        );
        if (
          segment.sourceInFrame !== 0 ||
          segment.sourceOutFrame !== clip.probe.frameCount ||
          segment.endFrame - segment.startFrame !== clip.probe.frameCount
        )
          throw new Error(
            `Repaint occurrence ${index} must supply the exact full-shot clip.`,
          );
        return clip;
      }
      deterministic ??= parseProductionRenditionClip(
        source.bytes,
        "Deterministic feature source",
      );
      if (
        deterministic.probe.frameCount !== props.timeline.totalFrames ||
        (source.bytes !== deterministic.bytes &&
          Buffer.compare(source.bytes, deterministic.bytes) !== 0)
      )
        throw new Error(
          "Every deterministic lane must cite the same exact current feature source.",
        );
      const samples: Sample[] = deterministic.samples.slice(
        segment.startFrame,
        segment.endFrame,
      );
      if (
        samples.length !== segment.endFrame - segment.startFrame ||
        (index > 0 &&
          props.sources[index - 1]!.lane !== "deterministic" &&
          samples[0]!.is_sync !== true)
      )
        throw new Error(
          `Deterministic occurrence ${index} cannot begin losslessly at its declared lane crossing.`,
        );
      // The parser proved presentation times a whole-frame permutation from
      // the feature's origin, so a range of n samples whose times all fall in
      // the segment's n frame slots presents exactly those frames.
      const presentationStart: number =
        deterministic.presentationStart +
        segment.startFrame * deterministic.sampleDuration;
      const presentationEnd: number =
        deterministic.presentationStart +
        segment.endFrame * deterministic.sampleDuration;
      if (
        samples.some(
          (sample: Sample): boolean =>
            sample.cts < presentationStart || sample.cts >= presentationEnd,
        )
      )
        throw new Error(
          `Deterministic occurrence ${index} does not present exactly its own frames in decode order.`,
        );
      return {
        ...deterministic,
        samples,
        decodeStart: samples[0]!.dts,
        presentationStart,
      };
    },
  );
  const first: IProductionRenditionClip | undefined = parsed[0];
  if (first === undefined)
    throw new Error("Mixed visual delivery requires a non-empty timeline.");
  if (nextFrame !== props.timeline.totalFrames)
    throw new Error("Visual delivery sources do not cover the current film.");
  const description: ReturnType<typeof sampleDescription> = sampleDescription(
    first.samples[0]!,
  );
  for (const [index, clip] of parsed.entries())
    if (
      clip.probe.width !== first.probe.width ||
      clip.probe.height !== first.probe.height ||
      clip.track.timescale !== first.track.timescale ||
      clip.sampleDuration !== first.sampleDuration ||
      sameSampleDescription(
        description,
        sampleDescription(clip.samples[0]!),
      ) === false
    )
      throw new Error(
        `Visual delivery occurrence ${index} changes the exact video presentation contract.`,
      );
  const output: ReturnType<typeof openLosslessVideoTrack> =
    openLosslessVideoTrack({
      label: "Visual delivery feature",
      name: "AutoMovie explicit visual-lane feature",
      timescale: first.track.timescale,
      sampleDuration: first.sampleDuration,
      frames: props.timeline.totalFrames,
      description,
      width: first.probe.width,
      height: first.probe.height,
      language: first.track.language,
    });
  let frame: number = 0;
  for (const clip of parsed)
    frame = appendLosslessVideoClip({
      ...output,
      clip,
      frame,
      sampleDuration: first.sampleDuration,
    });
  const bytes: Uint8Array = new Uint8Array(output.file.getBuffer().buffer);
  // Coverage was proved before writing, and the profile assertion proves the
  // exact rational clock of every written sample.
  assertProductionVideoProfile({
    expected: resolveProductionVideoProfile({
      width: first.probe.width,
      height: first.probe.height,
      frameRate: resolveProductionFrameRate(props.timeline),
    }),
    actual: probeProductionVideoMp4(bytes),
  });
  return bytes;
};
