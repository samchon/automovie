import type {
  IAutoMovieProductionMediaProbe,
  IAutoMovieProductionVideoProbe,
} from "@automovie/interface";
import type { IsoFileOptions, Movie, Sample, Track, createFile } from "mp4box";

import { exactProductionClockProduct } from "./exactProductionClockProduct";
import { parseMp4 } from "./parseMp4";
import { parseProductionMp4Output } from "./parseProductionMp4Output";
import { probeParsedProductionVideoMp4 } from "./probeParsedProductionVideoMp4";
import { probeProductionRenderedMedia } from "./probeProductionRenderedMedia";
import { residentMp4Box } from "./residentMp4Box";
import { sampleBytes } from "./sampleBytes";
import { sampleDescription } from "./sampleDescription";
import { sampleOptions } from "./sampleOptions";
import { trimProductionAudioPresentation } from "./trimProductionAudioPresentation";

/**
 * Mux one single-track H.264 video MP4 and one Opus audio-mix MP4 of exactly
 * the same runtime into a two-track feature MP4, copying every coded sample
 * unchanged.
 *
 * The video must pass the production video probe and the audio the audio-mix
 * probe, including its Opus delivery profile. Their movie runtimes must be
 * exactly equal, decided by cross-multiplying durations and timescales. The
 * output keeps both tracks' media clocks, uses the video timescale as the
 * movie clock, and gives the audio track one edit that skips the Opus priming
 * samples and presents exactly the audio's runtime. The result is re-probed as
 * a delivered feature before it is returned.
 *
 * Throws the probes' refusals for an invalid input,
 * `MP4 presentation clocks must be positive safe integers.` for a zero or
 * unsafe runtime term, `Feature mux requires byte sources with exactly equal
 * track runtimes.` for unequal runtimes, and the feature probe's refusal if
 * the written file does not verify.
 *
 * No production module calls this function at present; only tests reach it.
 *
 * @evidence contracts/common.md#principled-implementation Samples are copied with their own timing and flags, so neither elementary stream is decoded or re-encoded, and runtime equality is the exact integer identity `videoDuration * audioTimescale = audioDuration * videoTimescale`; the presentation length in 48 kHz samples is an exact BigInt quotient because the Opus profile already proved it whole.
 * @evidence contracts/common.md#clear-and-simple-design Input admission is the existing video and audio-mix probes, the audio edit is `trimProductionAudioPresentation`, and the output check is the feature probe; this function owns only the runtime proof and the two-track copy. The gap is that no production consumer remains.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unequal or unsafe runtimes are refused rather than padded or trimmed to fit, the audio probe's kind is checked rather than cast, and no input is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The doc states what each input must pass, the runtime rule, how the output clocks and the audio edit are formed, the final verification, and every refusal.
 * @evidence contracts/performance.md#efficient-algorithms For V video and A audio samples, the video is parsed once and its parse shared by the probe and the copy, the audio is parsed twice because the audio-mix probe exposes no parsed form, each sample is appended once with mp4box copying its payload, and the output is parsed once to verify it, so time is linear in the input bytes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call muxes one caller-held pair of byte arrays and retains no result; equal inputs give byte-identical output that a caller may store.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Until return the output file holds a copy of every sample plus views of both inputs, and the parsed inputs stay referenced, so peak memory is about twice the inputs plus the output buffer; nothing outlives the call except the returned array.
 */
export const muxProductionFeatureMp4 = (props: {
  /** Single-track H.264 video MP4. */
  video: Uint8Array;

  /** Single-track Opus audio-mix MP4 of the same runtime. */
  audio: Uint8Array;
}): Uint8Array => {
  const video: { file: ReturnType<typeof createFile>; movie: Movie } =
    parseProductionMp4Output(props.video);
  const videoProbe: IAutoMovieProductionVideoProbe =
    probeParsedProductionVideoMp4(props.video, video);
  const audioProbe: IAutoMovieProductionMediaProbe =
    probeProductionRenderedMedia({
      kind: "audio-mix",
      mediaType: "audio/mp4",
      bytes: props.audio,
    });
  if (audioProbe.kind !== "audio")
    throw new Error("Feature mux requires an audio-mix MP4 audio track.");
  const audio: { file: ReturnType<typeof createFile>; movie: Movie } =
    parseMp4(props.audio);
  const videoTrack: Track = video.movie.videoTracks[0]!;
  const audioTrack: Track = audio.movie.audioTracks[0]!;
  if (
    exactProductionClockProduct(
      videoProbe.presentation.movieDuration,
      audioProbe.timebase.movieTimescale,
    ) !==
    exactProductionClockProduct(
      audioProbe.timebase.movieDuration,
      videoProbe.presentation.movieTimescale,
    )
  )
    throw new Error(
      "Feature mux requires byte sources with exactly equal track runtimes.",
    );
  // The audio-mix probe's Opus profile proved the presentation a whole number
  // of samples on its 48 kHz clock, and the runtime comparison proved the
  // movie timescale a positive safe integer, so this quotient is exact.
  const presentationSamples: number = Number(
    exactProductionClockProduct(
      audioProbe.timebase.movieDuration,
      audioProbe.sampleRate,
    ) / BigInt(audioProbe.timebase.movieTimescale),
  );
  const output: ReturnType<typeof createFile> = residentMp4Box().createFile();
  output.init({
    brands: ["isom", "iso2", "mp41", "Opus"],
    timescale: videoTrack.timescale,
    duration: videoTrack.duration,
  });
  copyTrack({
    output,
    source: video.file,
    bytes: props.video,
    track: videoTrack,
    name: "AutoMovie H.264 feature",
  });
  const outputAudioTrack: number = copyTrack({
    output,
    source: audio.file,
    bytes: props.audio,
    track: audioTrack,
    name: "AutoMovie deterministic mix",
  });
  trimProductionAudioPresentation({
    file: output,
    track: outputAudioTrack,
    mediaTimescale: audioTrack.timescale,
    movieTimescale: videoTrack.timescale,
    primingSamples: audioProbe.primingSamples,
    presentationSamples,
  });
  const bytes: Uint8Array = new Uint8Array(output.getBuffer().buffer);
  probeProductionRenderedMedia({
    kind: "feature",
    mediaType: "video/mp4",
    bytes,
  });
  return bytes;
};

/** Add one track mirroring `track` to `output` and copy every sample into it. */
const copyTrack = (props: {
  output: ReturnType<typeof createFile>;
  source: ReturnType<typeof createFile>;
  bytes: Uint8Array;
  track: Track;
  name: string;
}): number => {
  const samples: Sample[] = props.source.getTrackSamplesInfo(props.track.id);
  const description: ReturnType<typeof sampleDescription> = sampleDescription(
    samples[0]!,
  );
  const options: IsoFileOptions = {
    type: description.type,
    hdlr: props.track.type === "audio" ? "soun" : "vide",
    name: props.name,
    timescale: props.track.timescale,
    media_duration: props.track.duration,
    duration: props.track.duration,
    language: props.track.language,
    description_boxes: description.boxes,
  };
  if (props.track.video !== undefined) {
    options.width = props.track.video.width;
    options.height = props.track.video.height;
  }
  if (props.track.audio !== undefined) {
    options.samplerate = props.track.audio.sample_rate;
    options.channel_count = props.track.audio.channel_count;
    options.samplesize = props.track.audio.sample_size;
  }
  const id: number = props.output.addTrack(options);
  // mp4box's addSample copies the payload into the output's media box, so a
  // view of the source bytes is passed instead of a second copy.
  for (const sample of samples)
    props.output.addSample(
      id,
      sampleBytes(props.bytes, sample),
      sampleOptions(sample),
    );
  return id;
};
