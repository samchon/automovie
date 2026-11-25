import type { IAutoMovieChannel } from "../core/IAutoMovieChannel";
import type { IAutoMovieConstraintViolation } from "./IAutoMovieConstraintViolation";

/**
 * Supply a field-specific channel admission callback to clip artifact
 * validation.
 */
export type IAutoMovieClipChannelGate = (
  channel: IAutoMovieChannel,
  path: string,
  violations: IAutoMovieConstraintViolation[],
) => void;
