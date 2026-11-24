import type { IAutoMovieMeasureLipSyncLag } from "../../production/sound/IAutoMovieMeasureLipSyncLag.js";

/**
 * One adopted line's lip-sync entry in the render report.
 *
 * A phoneme-driven line whose bound actor's figure showed visemes is measured
 * by engine's `measureAutoMovieLipSyncLag` against the mouth the actor's
 * figures showed on each drawn frame, and carries its lag, correlation and
 * verdict; a failed verdict blocks publication. Three kinds are listed as
 * unmeasured and do not block: `envelope-jaw`, a line without phoneme chunks or
 * an actor whose figures showed only the jaw, whose mouth follows the line's
 * own loudness with zero lag by construction; `speaker-not-bound`, a line whose
 * speaker binds to no single actor, so no mouth moves; and `mouth-not-drawn`, a
 * bound line whose actor no bound figure showed during the line.
 */
export type IAutoMovieDialogueLipSync =
  | ({
      /** Line id. */
      line: string;

      /** The bound actor whose drawn mouth was measured. */
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
       * Why: the jaw follows the line's own loudness, no single actor is bound,
       * or no figure of the actor showed its mouth.
       */
      reason: "envelope-jaw" | "speaker-not-bound" | "mouth-not-drawn";
    };
