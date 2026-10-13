import type { IAutoMovieProductionMediaProbe } from "@automovie/interface";

import { parseProductionMp4Output } from "./parseProductionMp4Output";
import { probeParsedProductionVideoMp4 } from "./probeParsedProductionVideoMp4";

/**
 * Parse `bytes` under the strict MP4 output gate and probe them as a file
 * whose only track is one H.264 video track.
 *
 * Production calls it on every intermediate video it accepts, such as a
 * repaint generator's raw output and a stored rendition clip, and the
 * normalizer calls it on the file it wrote. Throws the gate's refusals, the single-track
 * refusals and the track reading's refusals; the result reports what the file
 * declares, and a delivery profile is judged separately.
 *
 * @evidence contracts/common.md#principled-implementation The bytes pass the same ISO admission and the same track reading as delivered video, so an intermediate is described in the terms its later delivery check uses.
 * @evidence contracts/common.md#clear-and-simple-design The function is the composition of the strict parse and the parsed probe, kept as one entry point because production and the splice parser hold only bytes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No refusal is caught or relaxed between the two steps.
 * @evidence contracts/common.md#meaningful-documentation The doc states the gate and the single-track rule applied, who calls it, what it throws, and that it reports rather than judges a profile.
 * @evidence contracts/performance.md#efficient-algorithms The bytes are parsed once and the parse is handed to the probe, so cost is one parse plus the track reading, linear in the file.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A caller that also needs the parse calls `parseProductionMp4Output` and `probeParsedProductionVideoMp4` itself; this entry point serves callers that hold only bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The parse, including its copy of the bytes, is dropped on return, and the returned record holds no parser object.
 */
export const probeProductionVideoMp4 = (
  bytes: Uint8Array,
): Extract<IAutoMovieProductionMediaProbe, { kind: "video" }> =>
  probeParsedProductionVideoMp4(bytes, parseProductionMp4Output(bytes));
