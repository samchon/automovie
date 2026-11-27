import type {
  IAutoMovieIntent,
  IAutoMovieIntentTiming,
  IAutoMovieScheduleContext,
  IAutoMovieScheduleCut,
  IAutoMovieScheduleWalk,
} from "@automovie/interface";
import { normalizeAutoMovieScheduleCut as normalizeImplementation } from "./scheduleCut/internal/normalizeAutoMovieScheduleCut";
import { resolveAutoMovieScheduleCut as resolveImplementation } from "./scheduleCut/internal/resolveAutoMovieScheduleCut";

/** Normalization and placement of intent schedule cuts. */
export namespace AutoMovieEngineScheduleCut {
  /**
   * Normalize an authored cut or one of the exact legacy cut shapes.
   *
   * @param value A canonical tagged cut or a supported legacy cut object.
   * @returns Its canonical tagged form.
   * @throws {TypeError} When the value is malformed, mixed, or ambiguous.
   */
  export function normalize(value: unknown): IAutoMovieIntent.IUntil {
    return normalizeImplementation(value);
  }

  /**
   * Resolve an intent's cut.
   *
   * @param walk The walk.
   * @param intent The intent.
   * @param timing Its timing.
   * @param start Where it starts, film seconds.
   * @param context What the laws see while it is placed.
   * @returns The cut, or undefined when nothing cuts it.
   * @throws {AutoMovieEngineScheduleError} When the law, anchor, event or share is
   *   invalid.
   * @throws {TypeError} When its cut is malformed or ambiguous.
   */
  export function of(
    walk: IAutoMovieScheduleWalk.IWalk,
    intent: IAutoMovieIntent,
    timing: IAutoMovieIntentTiming,
    start: number,
    context: IAutoMovieScheduleContext,
  ): IAutoMovieScheduleCut.ICut | undefined {
    return resolveImplementation(walk, intent, timing, start, context);
  }
}
