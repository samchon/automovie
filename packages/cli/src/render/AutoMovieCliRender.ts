import type { AutoMovieEngineSound } from "@automovie/engine";
import type * as Render from "@automovie/render";
import type { AutoMovieCliRenderTypes } from "./AutoMovieCliRenderTypes";
import { AUTOMOVIE_RENDER_OPTIONS } from "./internal/AUTOMOVIE_RENDER_OPTIONS";
import { readRenderOptions } from "./internal/readRenderOptions";
import { renderProduction } from "./internal/renderProduction";
import { renderVideoImplementation } from "./internal/renderVideoImplementation";
import { runFfmpeg } from "../ffmpeg/internal/runFfmpeg";
import type { IAutoMovieCliCaptureSessionInput } from "../capture/IAutoMovieCliCaptureSessionInput";

/** Public operations for the `automovie render` command. */
export namespace AutoMovieCliRender {
  /** Input for rendering one subject through its opened draw host. */
  export interface IRenderVideoInput {
    /** The opened draw host. */
    host: IRenderVideoInputHost;
    /** The production's root folder. */
    root: string;
    /** The subject's name, or null for the page's only subject. */
    subject: string | null;
    /** Data the subject module reads, as JSON, or null. */
    props: unknown;
    /** Output folder, relative to the root or absolute. */
    out?: string;
    /** FFmpeg executable. */
    ffmpeg: string;
    /**
     * Guide passes other than `beauty` drawn at every frame into
     * `<out>/controls/`; absent or empty draws the film alone.
     */
    passes?: readonly string[];
    /**
     * `transparent` renders a straight-alpha layer as `film.mov` with no audio,
     * into `media/automovie/<film>/transparent` by default; absent or `scene`
     * renders the film.
     */
    background?: "scene" | "transparent";
    /** Receive host progress as requests and completed operations occur. */
    observe?: (activity: Render.IAutoMovieRenderDrawActivity) => void;
    /** Retain verified native draw data and reuse it on matching attempts. */
    checkpoint?: ICheckpoint;
  }

  /** Identity and location of an opt-in render checkpoint. */
  export interface ICheckpoint {
    /** Directory relative to the production root or absolute. */
    directory: string;
    /** SHA-256 of the exact subject inputs, dependencies and native assets. */
    identity: string;
    /** Identity of the installed render implementation and selected backend. */
    rendererIdentity: string;
  }

  /** The host object of {@link IRenderVideoInput}. */
  export type IRenderVideoInputHost = {
    render: Pick<
      typeof Render,
      | "AutoMovieRenderVideo"
      | "AutoMovieRenderMp4SrgbColour"
      | "AutoMovieRenderDelivery"
    > & {
      /** Creates the delivery loudness meter. Defaults to `AutoMovieEngineSound.createLoudnessMeter`. */
      createAutoMovieLoudnessMeter?: typeof AutoMovieEngineSound.createLoudnessMeter;
    };
    session(props: IAutoMovieCliCaptureSessionInput): Promise<
      Pick<
        Render.AutoMovieRenderDrawSession,
        "backend" | "close" | "frame" | "speak" | "subject"
      >
    >;
  };

  /** Result paths and frame count for one rendered subject. */
  export interface IRenderVideoResult {
    /** The path of the rendered video. */
    video: string;
    /** The path of the render report. */
    report: string;
    /** The number of frames written. */
    frames: number;
    /** The path of the installed controls directory, or null when absent. */
    controls: string | null;
    /** The backend that actually drew the source frames. */
    backend: string;
  }

  /** Command options admitted by `readOptions`. */
  export const OPTIONS: readonly string[] = AUTOMOVIE_RENDER_OPTIONS;

  /** Separate render-owned options from the remaining capture request. */
  export function readOptions(
    values: ReadonlyMap<string, string>,
  ): AutoMovieCliRenderTypes.Options {
    return readRenderOptions(values);
  }

  /**
   * Render one subject and publish its video after the delivery checks pass.
   *
   * An interrupted attempt preserves the last approved video. When its output
   * folder is known, the report includes the latest requested and acknowledged
   * operations, written frame receipts and available scene audit. The render
   * releases its temporary output pictures after reporting what it wrote. A
   * checkpoint retains the verified source frames in its own directory.
   *
   * The default output is `film.mp4`. When requested, guide passes are installed
   * beside it in `controls/`. A transparent render instead publishes a silent
   * straight-alpha `film.mov` in its own layer folder.
   */
  export function renderVideo(
    props: AutoMovieCliRender.IRenderVideoInput,
    run: typeof runFfmpeg = runFfmpeg,
  ): Promise<AutoMovieCliRender.IRenderVideoResult> {
    return renderVideoImplementation(props, run);
  }

  /** Run `automovie render` in a production. */
  export function render(
    props: AutoMovieCliRenderTypes.RenderProps,
  ): Promise<number> {
    return renderProduction(props);
  }
}
