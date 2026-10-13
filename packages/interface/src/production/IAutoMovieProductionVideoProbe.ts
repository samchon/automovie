import { IAutoMovieProductionFrameRate } from "./IAutoMovieProductionFrameRate";

/** Parser-observed video track, presentation, and picture facts. */
export interface IAutoMovieProductionVideoProbe {
  /** Parsed media class. */
  kind: "video";

  /** Parsed container family. */
  container: "mp4";

  /** Parsed coded-stream family. */
  codec: "h264";

  /** Compatibility width projected from coded facts. */
  width: number;

  /** Compatibility height projected from coded facts. */
  height: number;

  /** Parsed presentation runtime. */
  runtimeSeconds: number;

  /** Parsed resident picture-sample count. */
  frameCount: number;

  /** Compatibility rate projected from the raw sample clock. */
  fps: number;

  /** Canonical reduced rate parsed from the sample clock. */
  frameRate: IAutoMovieProductionFrameRate;

  /** Parsed major and compatible brands. */
  brands: { major: string; compatible: string[] };

  /** Parsed coded sample-entry raster. */
  coded: { width: number; height: number };

  /** Parsed fixed-point track display raster. */
  trackDisplay: { width16_16: number; height16_16: number };

  /** Parsed fixed-point track presentation matrix. */
  trackMatrix: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];

  /** Parsed pixel-aspect declaration. */
  pixelAspect:
    | { kind: "implicit-square" }
    | { kind: "explicit"; hSpacing: number; vSpacing: number };

  /** Raw movie/media clocks and edit list. */
  presentation: {
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

  /** Raw constant-sample clock and boundary facts. */
  samples: {
    count: number;
    duration: number;
    timescale: number;
    firstDts: number;
    lastDts: number;
    firstCts: number;
    lastCts: number;
  };

  /** Container-declared and resolved picture color identity. */
  color: {
    container:
      | {
          kind: "nclx";
          primaries: number;
          transfer: number;
          matrix: number;
          fullRange: boolean;
        }
      | { kind: "absent" };
    resolved: { kind: "srgb"; source: "container" } | { kind: "absent" };
  };
}
