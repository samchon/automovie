import type { IAutoMovieMeasureLipSyncLag } from "../../production/sound/IAutoMovieMeasureLipSyncLag.js";

/**
 * One adopted line's lip-sync entry in the render report.
 *
 * A phoneme-driven line bound to an actor is measured by engine's
 * `measureAutoMovieLipSyncLag` and carries its lag, correlation and verdict; a
 * failed verdict blocks publication. A line without phoneme chunks drives the
 * jaw from its own loudness, so its mouth follows its sound with zero lag by
 * construction and it is listed as `envelope-jaw`. A line whose speaker binds
 * to no single actor moves no mouth and is listed as `speaker-not-bound`.
 * Neither unmeasured kind blocks.
 */
export type IAutoMovieDialogueLipSync =
  | ({
      /** Line id. */
      line: string;

      /** The bound actor whose mouth was measured. */
      actor: string;

      /** The line was measured. */
      status: "measured";
    } & IAutoMovieMeasureLipSyncLag.IResult)
  | {
      /** Line id. */
      line: string;

      /** The bound actor, or null when the speaker binds to none. */
      actor: string | null;

      /** The line was not measured. */
      status: "unmeasured";

      /**
       * Why: the jaw follows the line's own loudness, or no single actor is
       * bound.
       */
      reason: "envelope-jaw" | "speaker-not-bound";
    };
