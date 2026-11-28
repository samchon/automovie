import type { AutoMovieCliCaptureBackend } from "./AutoMovieCliCaptureBackend";
import type { AutoMovieCliCaptureTypes } from "./AutoMovieCliCaptureTypes";
import { captureProduction } from "./internal/captureProduction";
import { launchChromiumImplementation } from "./internal/launchChromiumImplementation";
import { planChromiumLaunchImplementation } from "./internal/planChromiumLaunchImplementation";
import { readCaptureHostOptions } from "./internal/readCaptureHostOptions";
import { readVideoProbeImplementation } from "./internal/readVideoProbeImplementation";
import { readRetainedFrames as readRetainedFramesImplementation } from "./internal/readRetainedFrames";

/**
 * Public command and helper operations for deterministic AutoMovie capture. The
 * capture host class is separately exposed as `AutoMovieCliCaptureHost` and
 * shared with rendering.
 */
export namespace AutoMovieCliCapture {
  /** Capture a production subject or the frames of an encoded video file. */
  export function capture(
    props: AutoMovieCliCaptureTypes.Props,
  ): Promise<number> {
    return captureProduction(props);
  }

  /**
   * Read verified native PNGs from a complete capture without drawing or decoding.
   * The expected record digest pins the source capture. Each picture must also
   * match the requested view, pass and native source identity and retain its own
   * byte digest. A missing or ambiguous frame returns its cause in the bounded
   * result. An invalid request or record identity rejects the lookup.
   */
  export function readRetainedFrames(
    props: AutoMovieCliCaptureTypes.IReadRetainedFramesProps,
  ): Promise<AutoMovieCliCaptureTypes.IRetainedFrames> {
    return readRetainedFramesImplementation(props);
  }

  /** Launch headless Chromium for the requested capture backend. */
  export function launchChromium(
    props: AutoMovieCliCaptureTypes.LaunchChromiumProps,
  ): Promise<AutoMovieCliCaptureTypes.ChromiumLaunch> {
    return launchChromiumImplementation(props);
  }

  /** Plan Chromium switches and executable for a capture backend. */
  export function planChromiumLaunch(
    backend: AutoMovieCliCaptureBackend,
    env: Readonly<Record<string, string | undefined>>,
  ): AutoMovieCliCaptureTypes.ChromiumLaunchPlan {
    return planChromiumLaunchImplementation(backend, env);
  }

  /** Separate capture host options from the capture request options. */
  export function readHostOptions(
    values: ReadonlyMap<string, string>,
  ): AutoMovieCliCaptureTypes.HostOptions {
    return readCaptureHostOptions(values);
  }

  /**
   * Read the first video stream's absolute index, raster and nominal clock from
   * FFmpeg's first-input log. The filter's rational rate wins when available.
   * Actual picture PTS requires the later selected extraction.
   */
  export function readVideoProbe(
    log: string,
  ): AutoMovieCliCaptureTypes.VideoProbe {
    return readVideoProbeImplementation(log);
  }
}
