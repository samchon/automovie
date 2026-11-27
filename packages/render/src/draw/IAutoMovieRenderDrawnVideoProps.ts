import type {
  IAutoMovieDrawnVideoResult,
  IAutoMovieRenderSpec,
} from "@automovie/interface";

import type { AutoMovieRenderDrawSession } from "./AutoMovieRenderDrawSession.js";

/** Inputs for drawing and encoding one subject's video. */
export interface IAutoMovieRenderDrawnVideoProps {
  /** The opened draw session. */
  session: Pick<AutoMovieRenderDrawSession, "subject" | "frame" | "speak">;
  /** Encoding controls; the frame format comes from the subject. */
  spec: Omit<IAutoMovieRenderSpec, "frameFormat">;
  /** Folder for frame files. */
  frameDir: string;
  /** Encoded output path. */
  outputPath: string;
  /** Complete soundtrack, or null for none. */
  audio: string | null;
  /** Store one file whole. */
  write: (path: string, data: Uint8Array) => Promise<void>;
  /** Read one sound-list file whole. */
  read: (path: string) => Promise<Uint8Array>;
  /** Run FFmpeg with the arguments and completed draw record. */
  encode: (
    args: readonly string[],
    drawn: Pick<
      IAutoMovieDrawnVideoResult,
      "frames" | "diagnostics" | "sound" | "cut" | "controls"
    >,
  ) => Promise<void>;
  /** Guide passes to draw beside the film. */
  controls?: { passes: readonly string[]; frameDir: string };
  /** Draw a transparent layer instead of the opaque film. */
  background?: "scene" | "transparent";
}
