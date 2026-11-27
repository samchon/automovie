import type { AutoMovieCliCaptureBackend } from "./AutoMovieCliCaptureBackend";
import type { AutoMovieCliCaptureTypes } from "./AutoMovieCliCaptureTypes";
import { captureProduction } from "./internal/captureProduction";
import { launchChromiumImplementation } from "./internal/launchChromiumImplementation";
import { planChromiumLaunchImplementation } from "./internal/planChromiumLaunchImplementation";
import { readCaptureHostOptions } from "./internal/readCaptureHostOptions";
import { readVideoProbeImplementation } from "./internal/readVideoProbeImplementation";

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

  /** Read a video file's clock and raster from FFmpeg's input log. */
  export function readVideoProbe(
    log: string,
  ): AutoMovieCliCaptureTypes.VideoProbe {
    return readVideoProbeImplementation(log);
  }
}
