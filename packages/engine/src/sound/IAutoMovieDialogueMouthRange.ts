import { IAutoMovieProductionViseme } from "@automovie/interface";

/**
 * One half-open mouth interval on the film-global emission clock.
 *
 * @evidence contracts/development/design.md#principled-representation joinAutoMovieDialogueVisemes validates positive safe-integer receipt intervals in supplied order and inserts rest gaps; these ranges cover the joined line without overlap.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A start, exclusive end and closed viseme are sufficient for seekable sampling; actor and line identities belong to the containing timeline.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Rest is explicit silence rather than an inferred spoken vowel, and ranges are not delayed to acoustic arrival or synthesized from external audio here.
 * @evidence contracts/development/common.md#meaningful-documentation Documents inclusive/exclusive film-frame endpoints and the rest target; manually constructed ranges require the same ordering and admission premises as the join.
 */
export interface IAutoMovieDialogueMouthRange {
  /** Inclusive film-global emission frame. */
  startFrame: number;

  /** Exclusive film-global emission frame. */
  endFrame: number;

  /** Derived mouth preset or explicit rest. */
  viseme: IAutoMovieProductionViseme["viseme"];
}
