import type { IAutoMovieIntent } from "@automovie/engine";

import type { RefereeShape } from "./RefereeShape";

/**
 * The referee's action vocabulary carried in intent parameters: a signal
 * with its spoken words, held for a stated time. His positioning is not an
 * action; it is his law applied continuously to the fighters.
 *
 * ```ts
 * OfficiatingAction.intent("referee", { kind: "signal", signal: "count", seconds: 1, words: "Three!" });
 * ```
 *
 * @evidence docs/research/officiating/referee.md#signals The signals and commands.
 * @evidence docs/body/settings/cast/referee.md#voice Brief commands and an even count.
 */
export namespace OfficiatingAction {
  /** One signal. */
  export interface IAction {
    /** Discriminator. */
    kind: "signal";

    /** The signal. */
    signal: RefereeShape.Signal;

    /** Seconds the gesture lasts. */
    seconds: number;

    /** Spoken words, if any. */
    words?: string;
  }

  /**
   * The signal an intent carries.
   *
   * @param intent An intent written by the referee.
   * @returns Its action.
   * @throws When it carries none.
   */
  export function read(intent: IAutoMovieIntent): IAction {
    const action: unknown = intent.parameters?.action;
    if (
      typeof action !== "object" ||
      action === null ||
      (action as { kind?: unknown }).kind !== "signal"
    )
      throw new Error(
        `Intent ${intent.subject}.${intent.capability} carries no signal`,
      );
    return action as IAction;
  }

  /**
   * An intent carrying a signal.
   *
   * @param subject The referee's id.
   * @param action The signal.
   * @param anchor Optional anchor id.
   * @returns The frozen intent.
   */
  export function intent(
    subject: string,
    action: IAction,
    anchor?: string,
  ): IAutoMovieIntent {
    return Object.freeze({
      subject,
      capability: "signal",
      ...(anchor === undefined ? {} : { anchor }),
      parameters: Object.freeze({ action: Object.freeze({ ...action }) }),
    });
  }
}
