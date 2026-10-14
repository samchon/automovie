import { canonicalProductionFrameRate } from "@automovie/engine";
import type { IAutoMovieProductionVideoProbe } from "@automovie/interface";
import type {
  BoxKind,
  BoxParser,
  Entry,
  Sample,
  Track,
  VisualSampleEntry,
  createFile,
} from "mp4box";

import { AUTOMOVIE_MP4_SRGB_COLOUR } from "./AUTOMOVIE_MP4_SRGB_COLOUR";
import { residentMp4Box } from "./residentMp4Box";
import { sampleDescription } from "./sampleDescription";
import { verifySampleStorage } from "./verifySampleStorage";

type ColourBox = InstanceType<typeof BoxParser.box.colr>;
type PixelAspectBox = InstanceType<typeof BoxParser.box.pasp>;

/**
 * Read one parsed H.264 track of `file`, whose bytes are `bytes`, into the video probe record.
 *
 * The record carries codec identity, the track raster mp4box reports and the sample entry's coded raster, the rational frame rate from media timescale over the one sample duration, file-type brands, the track header's 16.16 display size and matrix, pixel aspect, the movie and media clocks with every edit, the first and last decode and composition times, and the container colour description with whether it spells sRGB. `runtimeSeconds` is the media duration over the media timescale. The record states what the file declares; whether those facts meet a delivery profile is `assertProductionVideoProfile`'s question.
 *
 * Throws, in this order, for a codec that is not `avc1` or `avc3`, a missing or non-positive raster, duration, timescale or sample count, the refusals of `verifySampleStorage`, samples without one positive constant duration, no sync sample, other than one file-type box with nonblank brands, a sample entry that is not a visual one, more than one colour or pixel-aspect box, a pixel-aspect term that is not a positive safe integer, and other than one track header for the track.
 *
 * @evidence contracts/common.md#principled-implementation Every value is read from the ISO boxes mp4box parsed, `instanceof` against the resident module's box classes narrows each child box before its fields are read, and the frame rate is the exact rational `timescale / sampleDuration` reduced by `canonicalProductionFrameRate`; the premise that the parser's raster and clock fields are integers holds because it reads them from fixed-width table entries.
 * @evidence contracts/common.md#clear-and-simple-design The rendered-media probe's feature arm and the single-video probe both call this one reading, so the record is assembled field for field in one place and each caller adds only its own track-count rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The sRGB verdict compares the four H.273 code points with `AUTOMOVIE_MP4_SRGB_COLOUR`, an ICC or absent colour box reports `absent`, and no file or caller is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The doc lists the record's facts, the unit of the runtime, that it reports rather than judges, and every refusal in the order it is checked.
 * @evidence contracts/performance.md#efficient-algorithms For S samples, M media boxes and B boxes in the parsed tree, residency costs O(M + S log(M + 1)), duration and sync each require one O(S) pass, and file-type and track-header lookup each sweep the box tree in O(B). Colour and pixel-aspect selection each scan the sample-entry children; the returned brand and edit lists require work proportional to their contents. These input-dependent lists have no cap here.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call reads one parsed file its caller owns and returns a fresh record, and no caller reads the same track twice.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned record holds copies of the brand list, matrix and edit list, not parser objects; the parsed file stays owned by the caller and nothing is opened.
 */
export const probeVideoTrack: (
  bytes: Uint8Array,
  file: ReturnType<typeof createFile>,
  track: Track,
) => IAutoMovieProductionVideoProbe = (
  bytes: Uint8Array,
  file: ReturnType<typeof createFile>,
  track: Track,
): IAutoMovieProductionVideoProbe => {
  if (/^(avc1|avc3)(?:\.|$)/i.test(track.codec) === false)
    throw new Error(
      `MP4 video codec "${track.codec}" is not an H.264/AVC sample entry.`,
    );
  if (
    track.video === undefined ||
    track.video.width <= 0 ||
    track.video.height <= 0 ||
    track.timescale <= 0 ||
    track.duration <= 0 ||
    track.nb_samples <= 0
  )
    throw new Error(
      "MP4 video track lacks positive dimensions, duration, timescale, or samples.",
    );
  const samples: Sample[] = verifySampleStorage(bytes, file, track);
  const first: Sample = samples[0]!;
  const last: Sample = samples.at(-1)!;
  const sampleDuration: number = first.duration;
  if (
    sampleDuration <= 0 ||
    samples.some(
      (sample: Sample): boolean => sample.duration !== sampleDuration,
    )
  )
    throw new Error(
      "MP4 video samples do not use one constant deterministic frame duration.",
    );
  if (samples.some((sample: Sample): boolean => sample.is_sync) === false)
    throw new Error(
      "MP4 video track has no independently decodable sync sample.",
    );
  const ftypBoxes: Array<InstanceType<typeof BoxParser.box.ftyp>> =
    file.getBoxes("ftyp", false);
  const ftyp: InstanceType<typeof BoxParser.box.ftyp> | undefined =
    ftypBoxes[0];
  if (
    ftypBoxes.length !== 1 ||
    ftyp === undefined ||
    ftyp.major_brand.trim().length === 0 ||
    ftyp.compatible_brands.some(
      (brand: string): boolean => brand.trim().length === 0,
    )
  )
    throw new Error("MP4 output requires one nonblank file-type brand box.");
  const mp4: ReturnType<typeof residentMp4Box> = residentMp4Box();
  const entry: VisualSampleEntry | undefined =
    first.description instanceof mp4.VisualSampleEntry
      ? first.description
      : undefined;
  if (entry === undefined)
    throw new Error("MP4 video sample entry is not a visual sample entry.");
  const children: BoxKind[] = sampleDescription(first).boxes;
  const colorBoxes: ColourBox[] = children.filter(
    (box: BoxKind): box is ColourBox => box instanceof mp4.BoxParser.box.colr,
  );
  if (colorBoxes.length > 1)
    throw new Error("MP4 video sample entry contains multiple color boxes.");
  const colorBox: ColourBox | undefined = colorBoxes[0];
  const paspBoxes: PixelAspectBox[] = children.filter(
    (box: BoxKind): box is PixelAspectBox =>
      box instanceof mp4.BoxParser.box.pasp,
  );
  if (paspBoxes.length > 1)
    throw new Error(
      "MP4 video sample entry contains multiple pixel-aspect boxes.",
    );
  if (
    paspBoxes.some(
      (box: PixelAspectBox): boolean =>
        Number.isSafeInteger(box.hSpacing) === false ||
        box.hSpacing <= 0 ||
        Number.isSafeInteger(box.vSpacing) === false ||
        box.vSpacing <= 0,
    )
  )
    throw new Error("MP4 pixel-aspect terms must be positive safe integers.");
  const trackHeaders: Array<InstanceType<typeof BoxParser.box.tkhd>> = file
    .getBoxes("tkhd", false)
    .filter(
      (header: InstanceType<typeof BoxParser.box.tkhd>): boolean =>
        header.track_id === track.id,
    );
  if (trackHeaders.length !== 1)
    throw new Error(
      `MP4 video track ${track.id} requires one exact track header.`,
    );
  // The parser reads the header width and height as 32-bit integers and the
  // nine fixed-point matrix terms as one Int32Array of length nine, so the
  // copy below is the nine-term tuple the probe record declares.
  const trackHeader: InstanceType<typeof BoxParser.box.tkhd> = trackHeaders[0]!;
  const nclx: ColourBox | undefined =
    colorBox?.colour_type === "nclx" ? colorBox : undefined;
  return {
    kind: "video",
    container: "mp4",
    codec: "h264",
    width: track.video.width,
    height: track.video.height,
    runtimeSeconds: track.duration / track.timescale,
    frameCount: track.nb_samples,
    fps: track.timescale / sampleDuration,
    frameRate: canonicalProductionFrameRate({
      numerator: track.timescale,
      denominator: sampleDuration,
    }),
    brands: {
      major: ftyp.major_brand,
      compatible: [...ftyp.compatible_brands],
    },
    coded: {
      width: entry.width,
      height: entry.height,
    },
    trackDisplay: {
      width16_16: trackHeader.width,
      height16_16: trackHeader.height,
    },
    trackMatrix: Array.from(
      trackHeader.matrix,
    ) as IAutoMovieProductionVideoProbe["trackMatrix"],
    pixelAspect:
      paspBoxes[0] === undefined
        ? { kind: "implicit-square" }
        : {
            kind: "explicit",
            hSpacing: paspBoxes[0].hSpacing,
            vSpacing: paspBoxes[0].vSpacing,
          },
    presentation: {
      movieTimescale: track.movie_timescale,
      mediaTimescale: track.timescale,
      movieDuration: track.movie_duration,
      mediaDuration: track.duration,
      edits: (track.edits ?? []).map(
        (
          edit: Entry,
        ): IAutoMovieProductionVideoProbe["presentation"]["edits"][number] => ({
          segmentDuration: edit.segment_duration,
          mediaTime: edit.media_time,
          mediaRateInteger: edit.media_rate_integer,
          mediaRateFraction: edit.media_rate_fraction,
        }),
      ),
    },
    samples: {
      count: samples.length,
      duration: sampleDuration,
      timescale: track.timescale,
      firstDts: first.dts,
      lastDts: last.dts,
      firstCts: first.cts,
      lastCts: last.cts,
    },
    color: {
      container:
        nclx === undefined
          ? { kind: "absent" }
          : {
              kind: "nclx",
              primaries: nclx.colour_primaries,
              transfer: nclx.transfer_characteristics,
              matrix: nclx.matrix_coefficients,
              fullRange: nclx.full_range_flag === 1,
            },
      resolved:
        nclx !== undefined &&
        nclx.colour_primaries === AUTOMOVIE_MP4_SRGB_COLOUR.primaries &&
        nclx.transfer_characteristics === AUTOMOVIE_MP4_SRGB_COLOUR.transfer &&
        nclx.matrix_coefficients === AUTOMOVIE_MP4_SRGB_COLOUR.matrix &&
        (nclx.full_range_flag === 1) === AUTOMOVIE_MP4_SRGB_COLOUR.fullRange
          ? { kind: "srgb", source: "container" }
          : { kind: "absent" },
    },
  };
};
