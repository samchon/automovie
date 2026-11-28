import type { IAutoMovieDeliveryContentAudit } from "@automovie/interface";
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
    /** Absolute index of the first video stream in FFmpeg input zero. */
    streamIndex: number;

    /** Running time in seconds. */
    durationSeconds: number;

    /** Frames per second. */
    fps: number;

    /** Width in pixels. */
    width: number;

    /** Height in pixels. */
    height: number;
  }

  /** Bounded exact lookup of existing pictures in a completed capture. */
  export interface IReadRetainedFramesProps {
    /** Production directory used to resolve the record and installed Render package. */
    readonly root: string;

    /** Path to the complete capture record, relative to root or absolute. */
    readonly record: string;

    /** SHA-256 of the expected record bytes, lowercase hexadecimal. */
    readonly recordSha256: string;

    /** Recorded subject identity. */
    readonly subject: string;

    /** Exact capture view, such as `film` or `file`. */
    readonly view: string;

    /** Captured pass, such as `beauty`. */
    readonly pass: string;

    /** First native frame, inclusive. */
    readonly fromFrame: number;

    /** End of the requested native range, exclusive. */
    readonly endFrame: number;

    /** Maximum returned rows, 1–256 and 32 by default. */
    readonly limit?: number;

    /** Exact source evidence the caller expects to reopen. */
    readonly source: RetainedSource;
  }

  /** Evidence identity required for a drawn or decoded capture. */
  export type RetainedSource = IDrawnSource | IVideoSource;

  /** Exact projection expected from a drawn capture. */
  export interface IDrawnSource {
    /** Selects a drawn subject. */
    readonly type: "drawn";
    /** Canonical key returned by Render's `projectionKey` for the desired camera. */
    readonly projectionKey: string;
  }

  /** Immutable bytes and stream expected from an encoded file. */
  export interface IVideoSource {
    /** Selects a decoded video capture. */
    readonly type: "video";
    /** SHA-256 of the expected encoded video, lowercase hexadecimal. */
    readonly fileSha256: string;
    /** Absolute selected stream index in the input video. */
    readonly streamIndex: number;
  }

  /** Verified evidence or the reason a requested frame could not be opened. */
  export type RetainedFrame = IRetainedPicture | IUnavailableFrame;

  /** Original retained PNG and its checked file identity. */
  export interface IRetainedPicture {
    /** The retained PNG was located and its bytes verified. */
    readonly type: "retained";
    /** Native frame index within its source. */
    readonly frame: number;
    /** Absolute path of the stored PNG. */
    readonly file: string;
    /** SHA-256 of the bytes returned. */
    readonly fileSha256: string;
    /** PNG bytes from the record, including any stamped labels. */
    readonly bytes: Uint8Array;
    /** Exact decoder timestamp when reopening an encoded source. */
    readonly presentation?: IAutoMovieDeliveryContentAudit.ITimestamp;
  }

  /** Missing, ambiguous, or unverifiable picture at a requested address. */
  export interface IUnavailableFrame {
    /** No verified PNG could be returned for this frame. */
    readonly type: "unavailable";
    /** Native frame requested. */
    readonly frame: number;
    /** The reason the picture is unavailable. */
    readonly reason: string;
  }

  /** The admitted record and bounded native frame lookup results. */
  export interface IRetainedFrames {
    /** Number of native indices requested before the limit. */
    readonly requested: number;
    /** Whether the response limit omitted later indices. */
    readonly truncated: boolean;
    /** Every considered native index in ascending order. */
    readonly frames: readonly RetainedFrame[];
  }
}
