import { IAutoMovieProductionFrameRate } from "./IAutoMovieProductionFrameRate";

/**
 * Parser-observed constant-duration H.264 MP4 track, clock and picture facts; delivery-profile acceptance is separate.
 *
 * @evidence contracts/common.md#principled-implementation probeVideoTrack verifies resident samples and reads coded raster, track display and matrix, aspect, edit lists, sample boundaries and color boxes; media timescale divided by constant sample duration yields the reduced rational frame rate.
 * @evidence contracts/common.md#clear-and-simple-design Convenient compatibility scalars accompany raw parsed clock and picture groups so final delivery can compare exact sample and presentation facts without reparsing the track.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Container facts are observed rather than taken from manifest claims; absent or non-sRGB color remains unresolved, and unsupported delivery transforms or clocks are rejected by the separate profile gate rather than silently normalized.
 * @evidence contracts/common.md#meaningful-documentation Defines parsed track facts, pixel and fixed-point units, rational rate, movie/media clock domains, decode/composition timestamps and observed versus resolved color identity.
 */
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

  /** Encoded media duration divided by media timescale, in seconds; raw presentation edits remain below. */
  runtimeSeconds: number;

  /** Parsed resident picture-sample count. */
  frameCount: number;

  /** Compatibility rate projected from the raw sample clock. */
  fps: number;

  /** Canonical reduced rate parsed from the sample clock. */
  frameRate: IAutoMovieProductionFrameRate;

  /** Parsed major and compatible brands. */
  brands: {
    /** Parsed primary file-type brand. */
    major: string;

    /** Parsed compatible brands in resident order. */
    compatible: string[];
  };

  /** Parsed coded sample-entry raster. */
  coded: {
    /** Coded sample-entry width in pixels. */
    width: number;

    /** Coded sample-entry height in pixels. */
    height: number;
  };

  /** Parsed fixed-point track display raster. */
  trackDisplay: {
    /** Raw 16.16 fixed-point presentation width. */
    width16_16: number;

    /** Raw 16.16 fixed-point presentation height. */
    height16_16: number;
  };

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
    | {
        /** No explicit pasp box; square pixels are implied. */
        kind: "implicit-square";
      }
    | {
        /** Parsed pasp declaration. */
        kind: "explicit";

        /** Positive horizontal pixel-aspect term. */
        hSpacing: number;

        /** Positive vertical pixel-aspect term. */
        vSpacing: number;
      };

  /** Raw movie/media clocks and edit list. */
  presentation: {
    /** Movie presentation ticks per second. */
    movieTimescale: number;

    /** Encoded media ticks per second. */
    mediaTimescale: number;

    /** Track presentation duration in movie ticks. */
    movieDuration: number;

    /** Encoded duration in media ticks. */
    mediaDuration: number;

    /** Parsed edits in resident order. */
    edits: Array<{
      /** Presentation segment length in movie ticks. */
      segmentDuration: number;

      /** Source start in media ticks; minus one denotes an empty edit. */
      mediaTime: number;

      /** Integer part of the signed fixed-point media rate. */
      mediaRateInteger: number;

      /** Fractional part of the fixed-point media rate. */
      mediaRateFraction: number;
    }>;
  };

  /** Raw constant-sample clock and boundary facts. */
  samples: {
    /** Number of resident encoded picture samples. */
    count: number;

    /** Common sample duration in media ticks. */
    duration: number;

    /** Media ticks per second. */
    timescale: number;

    /** First decode timestamp in media ticks. */
    firstDts: number;

    /** Last decode timestamp in media ticks. */
    lastDts: number;

    /** First composition timestamp in media ticks. */
    firstCts: number;

    /** Last composition timestamp in media ticks. */
    lastCts: number;
  };

  /** Container-declared and resolved picture color identity. */
  color: {
    /** Observed nclx code points, or absence of a supported declaration. */
    container:
      | {
          /** Parsed nclx color-description family. */
          kind: "nclx";

          /** H.273 color-primary code point. */
          primaries: number;

          /** H.273 transfer-characteristic code point. */
          transfer: number;

          /** H.273 matrix-coefficient code point. */
          matrix: number;

          /** Whether the container declares full-range samples. */
          fullRange: boolean;
        }
      | {
          /** No nclx declaration read by the probe. */
          kind: "absent";
        };

    /** Exact supported sRGB container identity, or unresolved color meaning. */
    resolved:
      | {
          /** All required sRGB code points match. */
          kind: "srgb";

          /** The matching identity came from container metadata. */
          source: "container";
        }
      | {
          /** Absent or non-matching supported sRGB identity. */
          kind: "absent";
        };
  };
}
