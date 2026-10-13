import {
  equalProductionFrameRates,
  resolveProductionFrameRate,
} from "@automovie/engine";
import type {
  IAutoMovieProductionFrameRate,
  IAutoMovieProductionVideoProbe,
} from "@automovie/interface";
import type { createFile } from "mp4box";

import type { IAutoMovieProductionVideoProfile } from "../delivery/IAutoMovieProductionVideoProfile";
import { assertProductionVideoProfile } from "../delivery/assertProductionVideoProfile";
import { resolveProductionVideoProfile } from "../delivery/resolveProductionVideoProfile";
import type { IProductionRenditionClip } from "./IProductionRenditionClip";
import { appendLosslessVideoClip } from "./appendLosslessVideoClip";
import { openLosslessVideoTrack } from "./openLosslessVideoTrack";
import { parseProductionRenditionClip } from "./parseProductionRenditionClip";
import { probeProductionVideoMp4 } from "./probeProductionVideoMp4";
import { sameSampleDescription } from "./sameSampleDescription";
import { sampleDescription } from "./sampleDescription";

/**
 * Assemble one whole-film video from the per-chunk H.264 encodes of a chunked
 * render without decoding or re-encoding any frame.
 *
 * Every chunk must parse as a complete splice clip (`parseProductionRenditionClip`),
 * match `frameFormat`'s raster and rational clock, share the first chunk's
 * media timescale, sample duration and decoder configuration, and pass the
 * delivery video profile. The samples are copied in play order onto one track,
 * so the assembly decodes to exactly the frames the chunks decode to. A single
 * chunk is returned as the same array, unchanged, when it covers `totalFrames`.
 * A multi-chunk result is re-probed and must cover `totalFrames` at the
 * declared raster and clock.
 *
 * Throws `Render chunk <i> ...` naming the first chunk that breaks the shared
 * presentation, an `unsupported-video-profile.<field>` error from the profile
 * check, a refusal for an empty chunk list or a frame total the chunks do not
 * cover, and `Assembled chunk video duration exceeds the exact MP4 clock
 * range.` when `totalFrames` ticks cannot be written exactly. An exception
 * thrown by the `chunks` iterator propagates unchanged.
 *
 * No production module calls this function at present; only tests reach it
 * since the production film assembly stopped using it.
 *
 * @evidence contracts/common.md#principled-implementation Lossless splicing is valid because every chunk begins at a sync sample and shares one sample entry, verified byte for byte by `sameSampleDescription`, so the concatenated elementary stream is decodable and each frame decodes as it did in its chunk; clock equality is decided on rational frame rates and integer ticks, never on float fps.
 * @evidence contracts/common.md#clear-and-simple-design Parsing and per-clip validation are `parseProductionRenditionClip`, the container is `openLosslessVideoTrack`, and re-timing is `appendLosslessVideoClip`; this function owns only the chunk-sequence rules, the single-chunk shortcut and the final coverage proof. The gap is that no production consumer remains.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A chunk that breaks the shared raster, clock or configuration is refused, never re-encoded or rescaled, and the single-chunk shortcut returns input that already passed every check the multi-chunk path applies to each chunk.
 * @evidence contracts/common.md#meaningful-documentation The doc states what every chunk must share, how the samples are joined, the identity of the single-chunk result, the final verification, every refusal with its message prefix, and that the iterator's own exceptions propagate.
 * @evidence contracts/performance.md#efficient-algorithms For C chunks and S total samples, each chunk is parsed twice (strict probe and sample table, inside the clip parser), every sample is appended once, and a multi-chunk result is parsed once more, so cost is linear in the total bytes; the expected profile is resolved once outside the loop and the final re-parse is the proof that the written container is what was intended.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A call reads its chunk iterator once and shares no result across calls; a caller that assembles the same chunks twice receives byte-identical output but must cache it itself.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The output file holds a copy of every sample and, through views, every chunk's bytes until the function returns, so peak memory is about twice the film's encoded size plus the final output buffer; the first chunk is also held while waiting for a second, and the returned array is the caller's.
 */
export const assembleProductionChunkVideoMp4 = (props: {
  /** Encoded chunk MP4s in play order, read once. */
  chunks: Iterable<Uint8Array>;

  /** Exact raster and rational frame clock every chunk must already carry. */
  frameFormat: {
    /** Frames per second, used when `frameRate` is absent and in messages. */
    fps: number;

    /** Exact rational frame rate; takes precedence over `fps`. */
    frameRate?: IAutoMovieProductionFrameRate;

    /** Raster height in pixels. */
    height: number;

    /** Raster width in pixels. */
    width: number;
  };

  /** Exact total output frames the assembled chunks must cover. */
  totalFrames: number;
}): Uint8Array => {
  const frameRate: IAutoMovieProductionFrameRate = resolveProductionFrameRate(
    props.frameFormat,
  );
  const profile: IAutoMovieProductionVideoProfile =
    resolveProductionVideoProfile({
      width: props.frameFormat.width,
      height: props.frameFormat.height,
      frameRate,
    });
  let reference: IProductionRenditionClip | undefined;
  let referenceDescription: ReturnType<typeof sampleDescription> | undefined;
  let opening: IProductionRenditionClip | undefined;
  let assembly: { file: ReturnType<typeof createFile>; track: number } | undefined;
  let frame: number = 0;
  let index: number = 0;
  for (const bytes of props.chunks) {
    const clip: IProductionRenditionClip = parseProductionRenditionClip(
      bytes,
      `Render chunk ${index}`,
    );
    const description: ReturnType<typeof sampleDescription> =
      sampleDescription(clip.samples[0]!);
    reference ??= clip;
    referenceDescription ??= description;
    if (
      clip.probe.width !== props.frameFormat.width ||
      clip.probe.height !== props.frameFormat.height ||
      equalProductionFrameRates(clip.probe.frameRate, frameRate) === false ||
      clip.track.timescale !== reference.track.timescale ||
      clip.sampleDuration !== reference.sampleDuration ||
      sameSampleDescription(referenceDescription, description) === false
    )
      throw new Error(
        `Render chunk ${index} does not share the assembled raster, rational frame clock, and H.264 decoder configuration.`,
      );
    // The chunk is attributed by index above; only then does the generic
    // delivery profile judge its container facts.
    assertProductionVideoProfile({ expected: profile, actual: clip.probe });
    ++index;
    if (opening === undefined) {
      opening = clip;
      continue;
    }
    if (assembly === undefined) {
      assembly = openLosslessVideoTrack({
        label: "Assembled chunk video",
        name: "AutoMovie chunk-assembled feature",
        timescale: reference.track.timescale,
        sampleDuration: reference.sampleDuration,
        frames: props.totalFrames,
        description: referenceDescription,
        width: reference.probe.width,
        height: reference.probe.height,
        language: reference.track.language,
      });
      frame = appendLosslessVideoClip({
        ...assembly,
        clip: opening,
        frame,
        sampleDuration: reference.sampleDuration,
      });
    }
    frame = appendLosslessVideoClip({
      ...assembly,
      clip,
      frame,
      sampleDuration: reference.sampleDuration,
    });
  }
  if (opening === undefined)
    throw new Error(
      "Chunked video assembly requires at least one encoded render chunk.",
    );
  if (assembly === undefined) {
    if (opening.probe.frameCount !== props.totalFrames)
      throw new Error(
        `Chunked video assembly covers ${opening.probe.frameCount} frames; expected ${props.totalFrames}.`,
      );
    return opening.bytes;
  }
  const bytes: Uint8Array = new Uint8Array(assembly.file.getBuffer().buffer);
  const probe: IAutoMovieProductionVideoProbe = probeProductionVideoMp4(bytes);
  if (
    probe.frameCount !== props.totalFrames ||
    probe.width !== props.frameFormat.width ||
    probe.height !== props.frameFormat.height ||
    equalProductionFrameRates(probe.frameRate, frameRate) === false
  )
    throw new Error(
      `Assembled chunk video parses as ${probe.frameCount} frames of ${probe.width}x${probe.height} at ${probe.fps} fps; expected ${props.totalFrames} frames of ${props.frameFormat.width}x${props.frameFormat.height} at ${props.frameFormat.fps} fps.`,
    );
  return bytes;
};
