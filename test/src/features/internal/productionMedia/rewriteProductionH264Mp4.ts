import { type Box, type BoxKind, type Sample, createFile } from "mp4box";
import { parseProductionMp4 } from "./parseProductionMp4";

/** Reserialize a parsed input through the public MP4Box writer with explicitly authored header or child-box changes. Samples retain their source bytes. */
export const rewriteProductionH264Mp4 = (
  bytes: Uint8Array,
  props: {
    movie?: { timescale: number; duration: number };
    descriptionBoxes?: (boxes: Box[]) => Box[];
    mutate?: (file: ReturnType<typeof createFile>, track: number) => void;
    /** Authored decode and presentation ticks per sample; the source's by default. */
    retime?: (sample: Sample, index: number) => { dts: number; cts: number };
  } = {},
): Uint8Array => {
  const { file, movie } = parseProductionMp4(bytes);
  const track = movie.videoTracks[0]!;
  const samples = file.getTrackSamplesInfo(track.id);
  const description = samples[0]!.description as unknown as {
    type: NonNullable<
      Parameters<ReturnType<typeof createFile>["addTrack"]>[0]
    >["type"];
    boxes: Box[];
  };
  const output = createFile();
  output.init({
    brands: ["isom", "iso2", "mp41"],
    timescale: props.movie?.timescale ?? track.timescale,
    duration: props.movie?.duration ?? track.duration,
  });
  const outputTrack = output.addTrack({
    type: description.type,
    hdlr: "vide",
    name: "AutoMovie rewritten H.264",
    timescale: track.timescale,
    media_duration: track.duration,
    duration: props.movie?.duration ?? track.duration,
    width: track.video!.width,
    height: track.video!.height,
    language: track.language,
    description_boxes: (props.descriptionBoxes ?? ((boxes) => boxes))(
      description.boxes,
    ) as unknown as BoxKind[],
  });
  for (const [index, sample] of samples.entries())
    output.addSample(
      outputTrack,
      Uint8Array.from(
        bytes.subarray(sample.offset, sample.offset + sample.size),
      ),
      {
        duration: sample.duration,
        ...(props.retime?.(sample, index) ?? {
          dts: sample.dts,
          cts: sample.cts,
        }),
        is_sync: sample.is_sync,
      },
    );
  props.mutate?.(output, outputTrack);
  return new Uint8Array(output.getBuffer().buffer);
};
