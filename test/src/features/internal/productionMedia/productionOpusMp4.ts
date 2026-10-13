import { trimProductionAudioPresentation } from "@automovie/render/node";
import { BoxParser, createFile } from "mp4box";

/** Write small supported Opus silence packets with authored sample clocks and priming. Presentation sample counts are inputs, so expected durations are calculated independently. */
export const productionOpusMp4 = (
  sampleFrames: number,
  channels: 1 | 2 = 2,
  options: {
    /**
     * Explicit movie clock and track-header duration. When given, the file
     * carries no presentation edit, so the movie header alone states the
     * runtime the way a foreign muxer might.
     */
    movie?: { timescale: number; duration: number };
  } = {},
): Uint8Array => {
  const primingSamples = 312;
  const codedSampleFrames =
    Math.ceil((sampleFrames + primingSamples) / 960) * 960;
  const description = new BoxParser.box.dOps();
  description.Version = 0;
  description.OutputChannelCount = channels;
  description.PreSkip = primingSamples;
  description.InputSampleRate = 48_000;
  description.OutputGain = 0;
  description.ChannelMappingFamily = 0;
  description.StreamCount = 1;
  description.CoupledCount = channels - 1;
  description.ChannelMapping = [];
  const movie = options.movie ?? {
    timescale: 48_000,
    duration: codedSampleFrames,
  };
  const file = createFile();
  file.init({
    brands: ["isom", "iso2", "mp41", "Opus"],
    timescale: movie.timescale,
    duration: movie.duration,
  });
  const track = file.addTrack({
    type: "Opus",
    hdlr: "soun",
    timescale: 48_000,
    media_duration: codedSampleFrames,
    duration: movie.duration,
    samplerate: 48_000,
    channel_count: channels,
    samplesize: 16,
    description_boxes: [description],
  });
  for (let dts = 0; dts < codedSampleFrames; dts += 960)
    file.addSample(track, Uint8Array.from([0xf8, 0xff, 0xfe]), {
      duration: 960,
      dts,
      cts: dts,
      is_sync: true,
    });
  if (options.movie === undefined)
    trimProductionAudioPresentation({
      file,
      track,
      mediaTimescale: 48_000,
      movieTimescale: 48_000,
      primingSamples,
      presentationSamples: sampleFrames,
    });
  return new Uint8Array(file.getBuffer().buffer);
};
