import type { IAutoMovieMeasureLipSyncLag } from "../production/IAutoMovieMeasureLipSyncLag.js";

/**
 * One adopted line's lip-sync entry in the render report.
 *
 * A phoneme-driven line whose bound actor the drawn subject moved with visemes
 * is measured by engine's `measureAutoMovieLipSyncLag` against the mouth the
 * subject read on each drawn frame, and carries its lag, correlation and
 * verdict; a failed verdict blocks publication. Three kinds are listed as
 * unmeasured and do not block: `envelope-jaw`, a line without phoneme chunks or
 * an actor the subject moved only by the jaw, whose mouth follows the line's
 * own loudness with zero lag by construction; `speaker-not-bound`, a line whose
 * speaker binds to no single actor, so no mouth moves; and `mouth-not-drawn`, a
 * bound line whose actor's mouth the subject never read during the line.
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
       * or the subject never read the actor's mouth.
       */
      reason: "envelope-jaw" | "speaker-not-bound" | "mouth-not-drawn";
    };
