import type { IAutoMovieRecoveryArrayFragment } from "..";

/** Ordered fragment bindings for one persisted generating channel. */

export interface IAutoMovieRecoveryFrontierChannel {
  /** Explicit generating channel name. */
  name: string;

  /** Total committed item population. */
  items: number;

  /** Ordered immutable fragments for this channel. */
  files: IAutoMovieRecoveryArrayFragment[];
}
