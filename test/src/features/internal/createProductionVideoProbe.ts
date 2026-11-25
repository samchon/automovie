import type {
  IAutoMovieProductionVideoProbe,
  IAutoMovieProductionVideoProfile,
} from "@automovie/interface";

/**
 * A video probe that satisfies a 24 frames-per-second profile exactly: square
 * pixels, one sample per frame, no edit, sRGB colour in the container.
 *
 * A test changes one field of the returned probe to separate the accepted file
 * from one refusal.
 */
export function createProductionVideoProbe(props: {
  /** The profile the probe must satisfy; its rate must be 24/1. */
  profile: IAutoMovieProductionVideoProfile;
  /** Frames in the file. */
  frameCount: number;
}): IAutoMovieProductionVideoProbe {
  const { profile, frameCount }: typeof props = props;
  const runtimeSeconds: number = frameCount / 24;
  return {
    kind: "video",
    container: "mp4",
    codec: "h264",
    width: profile.width,
    height: profile.height,
    runtimeSeconds,
    frameCount,
    fps: 24,
    frameRate: profile.frameRate,
    brands: { major: "isom", compatible: ["isom", "mp41"] },
    coded: { width: profile.width, height: profile.height },
    trackDisplay: {
      width16_16: profile.width * 65_536,
      height16_16: profile.height * 65_536,
    },
    trackMatrix: [...profile.trackMatrix],
    pixelAspect: { kind: "implicit-square" },
    presentation: {
      movieTimescale: 24,
      mediaTimescale: 24,
      movieDuration: frameCount,
      mediaDuration: frameCount,
      edits: [],
    },
    samples: {
      count: frameCount,
      duration: 1,
      timescale: 24,
      firstDts: 0,
      lastDts: frameCount - 1,
      firstCts: 0,
      lastCts: frameCount - 1,
    },
    color: {
      container: {
        kind: "nclx",
        primaries: profile.color.primaries,
        transfer: profile.color.transfer,
        matrix: profile.color.matrix,
        fullRange: profile.color.fullRange,
      },
      resolved: { kind: "srgb", source: "container" },
    },
  };
}