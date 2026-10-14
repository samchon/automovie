import type { IAutoMovieProductionVideoProbe } from "@automovie/interface";
import type { BoxKind, Movie, Sample, Track, createFile } from "mp4box";

import { assertProductionVideoProfile } from "../delivery/assertProductionVideoProfile";
import { resolveProductionVideoProfile } from "../delivery/resolveProductionVideoProfile";
import { AUTOMOVIE_MP4_SRGB_COLOUR } from "./AUTOMOVIE_MP4_SRGB_COLOUR";
import { addProductionMp4Sample } from "./addProductionMp4Sample";
import { openLosslessVideoTrack } from "./openLosslessVideoTrack";
import { parseMp4 } from "./parseMp4";
import { probeProductionVideoMp4 } from "./probeProductionVideoMp4";
import { residentMp4Box } from "./residentMp4Box";
import { sampleBytes } from "./sampleBytes";
import { sampleDescription } from "./sampleDescription";
import { sampleOptions } from "./sampleOptions";

/**
 * Rewrite a single-track H.264 MP4 so its sample entry declares sRGB through an `nclx` colour box, copying every coded sample unchanged.
 *
 * The output has one track on the source's media timescale, a duration of `samples * firstSampleDuration` ticks, the source's raster and language, no edit list, and the source's sample entry with every `colr` box, `nclx` or ICC, replaced by one `nclx` box spelling `AUTOMOVIE_MP4_SRGB_COLOUR`. The written file is re-probed and must pass the delivery profile resolved from its own raster and frame rate before it is returned.
 *
 * The rewrite relabels; it never converts pixels and does not read the colour description in the stream's own parameter sets. It is correct only for a stream whose samples were encoded from full-range sRGB with BT.709 coefficients, and a stream encoded otherwise is mislabelled, not refused.
 *
 * Throws `H.264 normalization requires exactly one video track.`, `H.264 normalization requires a video raster.`, `H.264 normalization requires resident video samples.`, the parser's and the container helpers' refusals, and the probe's or the delivery profile's refusal of the written file. No production module calls it at present; the test fixtures that author H.264 inputs reach it.
 *
 * @evidence contracts/common.md#principled-implementation Samples are copied byte for byte with their own timing and flags, so the elementary stream is untouched, and the `nclx` payload is the H.273 code points in the ISO layout written through the colour box's inherited raw-payload writer; dropping a source edit list and declaring `samples * firstSampleDuration` cannot change an admitted output, because the profile then requires one constant duration, a media duration of exactly that product, and no edit other than one full-length edit at media time zero. The unresolved limitation is the relabelling premise stated in the doc.
 * @evidence contracts/common.md#clear-and-simple-design The output container comes from `openLosslessVideoTrack`, sample payloads from `sampleBytes` and their options from `sampleOptions`, the same helpers the lossless splice writers use, so this function owns only the colour-box replacement and the final profile proof. The gap is that no production consumer remains.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The colour box is built with mp4box's own `colr` class and its public `data` payload rather than by replacing a writer method, the profile is resolved from the written file rather than assumed, and no input is special-cased; the relabelling of a differently encoded stream remains the violation the doc names.
 * @evidence contracts/common.md#meaningful-documentation The doc states the output's clock, raster, edit list and sample entry, the final verification, the relabelling limitation, every refusal, and that only test fixtures call it.
 * @evidence contracts/performance.md#efficient-algorithms The input is parsed once, each of S samples is appended once from a byte view that mp4box copies into a media box, and the serialized output is parsed once. Byte copying and serialization scale with the encoded bytes; the output probe additionally performs O(M + S log(M + 1)) residency work for M output media boxes and inspects the parsed boxes and returned lists, so the full rewrite is not strictly linear in the encoded bytes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call rewrites the bytes it is handed and keeps no result; equal inputs give byte-identical output that a caller may store.
 * @evidence contracts/performance.md#bound-retention-and-release-resources During verification the input parse and its copied buffer, source sample views, output sample payloads and boxes, serialized output, and output probe's copied buffer and tables can coexist. Their sizes depend on the uncapped input bytes, sample count and box structure; an exact peak ratio is not established. These objects become collectable when their calls finish, and this function retains only the returned array through its caller, with no handle or background task.
 */
export const normalizeProductionH264Mp4: (bytes: Uint8Array) => Uint8Array = (
  bytes: Uint8Array,
): Uint8Array => {
  const source: { file: ReturnType<typeof createFile>; movie: Movie } =
    parseMp4(bytes);
  const track: Track | undefined = source.movie.videoTracks[0];
  if (track === undefined || source.movie.tracks.length !== 1)
    throw new Error("H.264 normalization requires exactly one video track.");
  if (track.video === undefined)
    throw new Error("H.264 normalization requires a video raster.");
  const samples: Sample[] = source.file.getTrackSamplesInfo(track.id) ?? [];
  const first: Sample | undefined = samples[0];
  if (first === undefined)
    throw new Error("H.264 normalization requires resident video samples.");
  const description: ReturnType<typeof sampleDescription> =
    sampleDescription(first);
  const output: { file: ReturnType<typeof createFile>; track: number } =
    openLosslessVideoTrack({
      label: "Normalized H.264 video",
      name: "AutoMovie explicit sRGB H.264",
      timescale: track.timescale,
      sampleDuration: first.duration,
      frames: samples.length,
      description: {
        type: description.type,
        boxes: [
          ...description.boxes.filter(
            (box: BoxKind): boolean => box.type !== "colr",
          ),
          productionSrgbColorBox(),
        ],
      },
      width: track.video.width,
      height: track.video.height,
      language: track.language,
    });
  for (const sample of samples)
    addProductionMp4Sample(
      output.file,
      output.track,
      sampleBytes(bytes, sample),
      sampleOptions(sample),
    );
  const normalized: Uint8Array = new Uint8Array(output.file.getBuffer().buffer);
  const probe: IAutoMovieProductionVideoProbe =
    probeProductionVideoMp4(normalized);
  assertProductionVideoProfile({
    expected: resolveProductionVideoProfile({
      width: probe.width,
      height: probe.height,
      frameRate: probe.frameRate,
    }),
    actual: probe,
  });
  return normalized;
};

/**
 * An `nclx` colour box spelling `AUTOMOVIE_MP4_SRGB_COLOUR`.
 *
 * The eleven-byte payload is the ISO `colr` layout: the four-character colour type, the three 16-bit H.273 code points, and a final byte whose high bit is the full-range flag. mp4box's `colr` class has no field writer and writes its `data` payload with its own size and header accounting, so the payload is supplied through that public field.
 */
const productionSrgbColorBox: () => BoxKind = (): BoxKind => {
  const box: InstanceType<
    ReturnType<typeof residentMp4Box>["BoxParser"]["box"]["colr"]
  > = new (residentMp4Box().BoxParser.box.colr)();
  const payload: Uint8Array = new Uint8Array(11);
  payload.set([0x6e, 0x63, 0x6c, 0x78]);
  const fields: DataView = new DataView(payload.buffer);
  fields.setUint16(4, AUTOMOVIE_MP4_SRGB_COLOUR.primaries);
  fields.setUint16(6, AUTOMOVIE_MP4_SRGB_COLOUR.transfer);
  fields.setUint16(8, AUTOMOVIE_MP4_SRGB_COLOUR.matrix);
  payload[10] = Number(AUTOMOVIE_MP4_SRGB_COLOUR.fullRange) << 7;
  box.data = payload;
  return box;
};
