import type { IAutoMovieConstraintViolation } from "./IAutoMovieConstraintViolation";

/**
 * Supply a field-specific channel admission callback to clip artifact validation.
 */
export type IAutoMovieClipChannelGate = (
  channel: Record<string, unknown>,
  path: string,
  violations: IAutoMovieConstraintViolation[],
) => void;
