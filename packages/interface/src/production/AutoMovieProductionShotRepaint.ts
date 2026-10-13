import { IAutoMovieProductionRepaintInput } from "./IAutoMovieProductionRepaintInput";
import { IAutoMovieRepaintRuntimeIdentity } from "./capture/IAutoMovieRepaintRuntimeIdentity";

/** Host-owned optional diffusion adapter. */
export type AutoMovieProductionShotRepaint = (
  input: IAutoMovieProductionRepaintInput,
) => Promise<{
  /** Actual encoded rendition bytes. */
  bytes: Uint8Array;

  /** Required video media type. */
  mediaType: "video/mp4";

  /** Structured provider/model identity. */
  runtimeIdentity: IAutoMovieRepaintRuntimeIdentity;

  /** Non-negative metered cost in the unit declared by the execution policy. */
  costUnits?: number;
}>;
