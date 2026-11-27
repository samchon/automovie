import type { AutoMovieEngineSound } from "@automovie/engine";
import type * as Render from "@automovie/render";
import type { AutoMovieCliRenderTypes } from "./AutoMovieCliRenderTypes";
import { AUTOMOVIE_RENDER_OPTIONS } from "./internal/AUTOMOVIE_RENDER_OPTIONS";
import { readAutoMovieRenderOptions } from "./internal/readAutoMovieRenderOptions";
import { renderAutoMovie } from "./internal/renderAutoMovie";
import { renderAutoMovieVideo } from "./internal/renderAutoMovieVideo";
import { runAutoMovieFfmpeg } from "../ffmpeg/internal/runAutoMovieFfmpeg";

/** Public operations for the `automovie render` command. */
export namespace AutoMovieCliRender {
  /** Input for rendering one subject through its opened draw host. */
  export interface IRenderVideoInput {
    /** The opened draw host. */
    host: {
      render: Pick<
        typeof Render,
        | "AutoMovieRenderVideo"
        | "AUTOMOVIE_MP4_SRGB_COLOUR"
        | "AutoMovieRenderDelivery"
      > & {
        /** Creates the delivery loudness meter. Defaults to `AutoMovieEngineSound.createLoudnessMeter`. */
        createAutoMovieLoudnessMeter?: typeof AutoMovieEngineSound.createLoudnessMeter;
      };
      session(props: {
        /** Name of the subject, or null for the page's only subject. */
        subject: string | null;

        /** Data the subject module reads, as JSON, or null. */
        props: unknown;
      }): Promise<
        Pick<
          Render.AutoMovieDrawSession,
          "backend" | "close" | "frame" | "speak" | "subject"
        >
      >;
    };
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
  }

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
  }

  /** Command options admitted by `readOptions`. */
  export const OPTIONS: readonly string[] = AUTOMOVIE_RENDER_OPTIONS;

  /** Separate render-owned options from the remaining capture request. */
  export function readOptions(
    values: ReadonlyMap<string, string>,
  ): AutoMovieCliRenderTypes.Options {
    return readAutoMovieRenderOptions(values);
  }

  /**
  * Renders one subject and publishes an approved film beside its shared report.
  * Every measurable audit runs on the drawn frames or the exact staged encoded
  * bytes. The decoded audio's integrated loudness and true peak, measured by the
  * production render's BS.1770-5 meter, must meet the targets the sound-list mix
  * applied or, for a supplied soundtrack, the declared loudness intent, and a
  * phoneme-driven line whose lip-sync lag, measured against the mouth the
  * subject read on each drawn frame, fails the report's verdict blocks. The
  * encoded file must also carry its declared picture profile and, with a
  * soundtrack, the AAC profile, or no audio track without one
  * (`auditAutoMovieDeliveryProfile`); a mismatch blocks like a blocking audit
  * finding and the report's `profile` records each field with its expected and
  * observed values. A blocked attempt replaces the report and preserves the
  * former film. A failed encode still reports the frames and scene inspection
  * already drawn. If the approved film or its report cannot be installed, the
  * former film is put back, so the film and report on disk always come from the
  * same attempt.
  *
  * With `passes`, every frame is also drawn in those guide passes and written
  * under `<out>/controls/` with `record.json`, whose `filmSha256` is the
  * report's `source.sha256`; the folder is staged and installed in the same
  * publish step as the film, so a blocked or failed attempt keeps the former
  * `controls/` with the former film.
  *
  * With `background` `transparent`, the beauty pass is drawn over a transparent
  * background and its straight-alpha PNG files are wrapped unencoded into
  * `film.mov` in `media/automovie/<film>/transparent` by default, so a layer
  * attempt never replaces the film's report. The layer carries no audio: the
  * film's required soundtrack is not expected, none is passed to the wrap and
  * the report's `layer` says so. The black check, which reads a transparent
  * frame as black, does not block; the profile check is replaced by
  * `auditAutoMovieAlphaSamples`, which requires one sample per drawn frame with
  * the frame file's bytes.
  */
  export function renderVideo(
    props: AutoMovieCliRender.IRenderVideoInput,
    run: typeof runAutoMovieFfmpeg = runAutoMovieFfmpeg,
  ): Promise<AutoMovieCliRender.IRenderVideoResult> {
    return renderAutoMovieVideo(props, run);
  }

  /** Run `automovie render` in a production. */
  export function render(
    props: AutoMovieCliRenderTypes.RenderProps,
  ): Promise<number> {
    return renderAutoMovie(props);
  }
}
