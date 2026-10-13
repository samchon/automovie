import { resolveProductionFrameRate } from "@automovie/engine";
import type {
  IAutoMovieFilmTimeline,
  IAutoMovieProductionVideoProbe,
} from "@automovie/interface";

import { assertProductionVideoProfile } from "../delivery/assertProductionVideoProfile";
import { resolveProductionVideoProfile } from "../delivery/resolveProductionVideoProfile";
import { appendLosslessVideoClip } from "./appendLosslessVideoClip";
import { openLosslessVideoTrack } from "./openLosslessVideoTrack";
import { probeProductionVideoMp4 } from "./probeProductionVideoMp4";
import { productionRenditionVideoPlan } from "./productionRenditionVideoPlan";

/**
 * Splice one immutable repaint clip per timeline segment into a single
 * feature video track, in timeline order, without decoding.
 *
 * `clips` maps each segment's `shot` to its clip bytes. The plan
 * (`productionRenditionVideoPlan`) refuses transitions, partial trims, a
 * missing clip, a frame rate other than the timeline's, a gap or overlap
 * between segments, and a raster or decoder configuration that changes
 * between clips; silently falling back to deterministic pixels would
 * misrepresent the selected product. The written video is re-probed, must pass
 * the delivery profile at the timeline's rational frame rate, and must hold
 * exactly `timeline.totalFrames` samples.
 *
 * No production module calls this function at present; only tests reach it.
 *
 * @evidence contracts/common.md#principled-implementation The splice copies coded samples whose sample entries are proved identical and whose clips each start at a sync sample, so the joined stream decodes to the clips' own frames; timing is re-based per clip in whole frames, which handles clips whose media clocks differ by a whole factor.
 * @evidence contracts/common.md#clear-and-simple-design Validation of the segment-to-clip mapping is the shared plan, which the feature proof `assertProductionFeatureUsesRenditionClips` also reads, the container comes from `openLosslessVideoTrack`, and re-timing from `appendLosslessVideoClip`; this function only writes and verifies. The gap is that no production consumer remains.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every unsupported edit or mismatched clip is refused rather than re-encoded, trimmed or replaced with deterministic frames, and the final checks re-read the written bytes rather than trusting the writer.
 * @evidence contracts/common.md#meaningful-documentation The doc states the input mapping, every refusal the plan applies and why fallback is refused, and the verification of the written video.
 * @evidence contracts/performance.md#efficient-algorithms For N segments and S samples, each clip is parsed twice by the plan, every sample is appended once, and the output is parsed once to verify it, so time is linear in the total clip bytes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A call conforms one timeline from caller-held bytes and keeps no cache; equal inputs give byte-identical output, which a caller may store.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Until return the output file holds a copy of every sample and views of the caller's clip bytes, plus the parsed plan, so peak memory is about twice the feature's encoded size plus the output buffer; nothing outlives the call except the returned array.
 */
export const conformProductionRenditionVideoMp4 = (props: {
  /** Current cut-only film timeline the clips must cover exactly. */
  timeline: IAutoMovieFilmTimeline;

  /** Repaint clip bytes keyed by segment `shot`. */
  clips: ReadonlyMap<string, Uint8Array>;
}): Uint8Array => {
  const plan: ReturnType<typeof productionRenditionVideoPlan> =
    productionRenditionVideoPlan(props);
  const output: ReturnType<typeof openLosslessVideoTrack> =
    openLosslessVideoTrack({
      label: "Repainted feature",
      name: "AutoMovie receipt-bound repaint feature",
      timescale: plan.first.track.timescale,
      sampleDuration: plan.sampleDuration,
      frames: props.timeline.totalFrames,
      description: plan.description,
      width: plan.first.probe.width,
      height: plan.first.probe.height,
      language: plan.first.track.language,
    });
  let frame: number = 0;
  for (const clip of plan.parsed)
    frame = appendLosslessVideoClip({
      ...output,
      clip,
      frame,
      sampleDuration: plan.sampleDuration,
    });
  const bytes: Uint8Array = new Uint8Array(output.file.getBuffer().buffer);
  const probe: IAutoMovieProductionVideoProbe = probeProductionVideoMp4(bytes);
  assertProductionVideoProfile({
    expected: resolveProductionVideoProfile({
      width: plan.first.probe.width,
      height: plan.first.probe.height,
      frameRate: resolveProductionFrameRate(props.timeline),
    }),
    actual: probe,
  });
  if (probe.frameCount !== props.timeline.totalFrames)
    throw new Error(
      "Conformed repaint video failed exact parser verification.",
    );
  return bytes;
};
