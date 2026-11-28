import type { AutoMovieCliCaptureBackend } from "../capture/AutoMovieCliCaptureBackend";

/** Named contracts for the render command's options and invocation. */
export namespace AutoMovieCliRenderTypes {
  /** Parsed render options and the remaining capture request. */
  export interface Options {
    /** Subject module path, relative to the production or absolute. */
    module: string;

    /** Path of the props JSON file, or null for none. */
    props: string | null;

    /** The output folder, or null for the default. */
    out: string | null;

    /** How the browser draws. */
    backend: AutoMovieCliCaptureBackend;

    /**
     * Per-call milliseconds for draw-function readiness, subject
     * description/creation and drawing, not a total build or render deadline.
     */
    timeout: number;

    /** `scene` for the film, `transparent` for a straight-alpha layer. */
    background: "scene" | "transparent";

    /** Directory and source identity for retaining native render frames. */
    checkpoint: ICheckpointRequest | null;

    /** The request's own options, for the request reader. */
    request: Map<string, string>;
  }

  /** The command-line part of a render checkpoint's identity. */
  export interface ICheckpointRequest {
    /** Directory relative to the production root or absolute. */
    directory: string;
    /** SHA-256 of the source inputs, dependencies and assets. */
    identity: string;
  }

  /** Inputs to the `automovie render` command operation. */
  export interface RenderProps {
    /** The tokens after `render`. */
    args: readonly string[];

    /** The production's root folder, the working directory. */
    root: string;

    /** Environment read for `CHROME_PATH` and `FFMPEG_PATH`. */
    env: Readonly<Record<string, string | undefined>>;
  }
}
