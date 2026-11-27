import type { AutoMovieCliCaptureBackend } from "./AutoMovieCliCaptureBackend";
import type { IAutoMovieCliChromium } from "./IAutoMovieCliChromium";

/** Shared named contracts for capture operations and their focused helpers. */
export namespace AutoMovieCliCaptureTypes {
  /** Inputs for running `automovie capture`. */
  export interface Props {
    /** The tokens after `capture`. */
    args: readonly string[];

    /** The production's root folder, the working directory. */
    root: string;

    /** The environment, read for `CHROME_PATH` and `FFMPEG_PATH`. */
    env: Readonly<Record<string, string | undefined>>;

    /** The caller's output sink, default standard output. */
    write?: (text: string) => void;

    /** The absolute record path verification expects this capture to write. */
    expectedRecord?: string;

    /** Receives the absolute path of this attempt's completed capture record. */
    recorded?: (file: string, text: string) => void;
  }

  /** Result of splitting capture host options from request options. */
  export interface HostOptions {
    /** Subject module path, or null for a video file. */
    module: string | null;

    /** Video file path, or null for a drawn subject. */
    file: string | null;

    /** Path of the props JSON file, or null for none. */
    props: string | null;

    /** Root folder, or null for the default. */
    out: string | null;

    /** How the browser draws. */
    backend: AutoMovieCliCaptureBackend;

    /**
     * Per-call milliseconds for draw-function readiness, subject
     * description/creation and drawing, not a total build or render deadline.
     */
    timeout: number;

    /** The request's own options, for the request reader. */
    request: Map<string, string>;
  }

  /** Inputs for launching the production's Chromium instance. */
  export interface LaunchChromiumProps {
    /** Playwright's `chromium`, loaded from the production. */
    chromium: IAutoMovieCliChromium;

    /** How the browser draws. */
    backend: AutoMovieCliCaptureBackend;

    /** The environment, read for `CHROME_PATH`. */
    env: Readonly<Record<string, string | undefined>>;
  }

  /** Browser settings selected for a capture backend. */
  export interface ChromiumLaunchPlan {
    /** Switches passed to Chromium. */
    args: string[];

    /** Executable to launch, or absent for Playwright's own build. */
    executablePath?: string;

    /** The backend's name as the record states it. */
    name: string;
  }

  /** Browser and backend description returned after launch. */
  export interface ChromiumLaunch {
    /** The launched browser. */
    browser: IAutoMovieCliChromium.IBrowser;

    /**
     * The backend and Chromium version, such as `swiftshader; Chromium
     * 131.0.6778.33`.
     */
    backend: string;
  }

  /** Clock and raster facts parsed from FFmpeg's video input log. */
  export interface VideoProbe {
    /** Running time in seconds. */
    durationSeconds: number;

    /** Frames per second. */
    fps: number;

    /** Width in pixels. */
    width: number;

    /** Height in pixels. */
    height: number;
  }
}
