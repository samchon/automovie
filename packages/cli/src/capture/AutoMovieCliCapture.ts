import type { AutoMovieCaptureBackend } from "./AutoMovieCaptureBackend";
import type { AutoMovieCliCaptureTypes } from "./AutoMovieCliCaptureTypes";
import { captureAutoMovie } from "./internal/captureAutoMovie";
import { launchAutoMovieChromium } from "./internal/launchAutoMovieChromium";
import { planAutoMovieChromiumLaunch } from "./internal/planAutoMovieChromiumLaunch";
import { readAutoMovieCaptureHostOptions } from "./internal/readAutoMovieCaptureHostOptions";
import { readAutoMovieVideoProbe } from "./internal/readAutoMovieVideoProbe";

/**
 * Public command and helper operations for deterministic AutoMovie capture. The
 * capture host class is separately exposed as `AutoMovieCaptureHost` and shared
 * with rendering.
 */
export namespace AutoMovieCliCapture {
  /** Capture a production subject or the frames of an encoded video file. */
  export function capture(
    props: AutoMovieCliCaptureTypes.Props,
  ): Promise<number> {
    return captureAutoMovie(props);
  }

  /** Launch headless Chromium for the requested capture backend. */
  export function launchChromium(
    props: AutoMovieCliCaptureTypes.LaunchChromiumProps,
  ): Promise<AutoMovieCliCaptureTypes.ChromiumLaunch> {
    return launchAutoMovieChromium(props);
  }

  /** Plan Chromium switches and executable for a capture backend. */
  export function planChromiumLaunch(
    backend: AutoMovieCaptureBackend,
    env: Readonly<Record<string, string | undefined>>,
  ): AutoMovieCliCaptureTypes.ChromiumLaunchPlan {
    return planAutoMovieChromiumLaunch(backend, env);
  }

  /** Separate capture host options from the capture request options. */
  export function readHostOptions(
    values: ReadonlyMap<string, string>,
  ): AutoMovieCliCaptureTypes.HostOptions {
    return readAutoMovieCaptureHostOptions(values);
  }

  /** Read a video file's clock and raster from FFmpeg's input log. */
  export function readVideoProbe(
    log: string,
  ): AutoMovieCliCaptureTypes.VideoProbe {
    return readAutoMovieVideoProbe(log);
  }
}
