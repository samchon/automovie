import { IAutoMovieProductionOpusDescription } from "./IAutoMovieProductionOpusDescription";

/** Parser-observed audio track and presentation facts. */
export interface IAutoMovieProductionAudioProbe {
  /** Parsed media class. */
  kind: "audio";

  /** Parsed container family. */
  container: "mp4";

  /** Parsed codec string. */
  codec: string;

  /** Parsed presentation runtime. */
  runtimeSeconds: number;

  /** Parsed channel count. */
  channels: number;

  /** Parsed media sample rate. */
  sampleRate: number;

  /** Parsed packet count. */
  sampleCount: number;

  /** Parsed decoder priming in samples. */
  primingSamples: number;

  /** Raw movie and media integer clocks. */
  timebase: {
    movieTimescale: number;
    mediaTimescale: number;
    movieDuration: number;
    mediaDuration: number;
    edits: Array<{
      segmentDuration: number;
      mediaTime: number;
      mediaRateInteger: number;
      mediaRateFraction: number;
    }>;
  };

  /** Complete parsed codec sample entry. */
  sampleEntry: IAutoMovieProductionOpusDescription;
}
