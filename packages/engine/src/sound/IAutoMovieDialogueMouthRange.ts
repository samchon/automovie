import { IAutoMovieProductionViseme } from "@automovie/interface";

/**
 * One half-open mouth interval on the film-global emission clock.
 *
 * @evidence contracts/common.md#principled-implementation joinAutoMovieDialogueVisemes validates positive safe-integer receipt intervals in supplied order and inserts rest gaps; these ranges cover the joined line without overlap.
 * @evidence contracts/common.md#clear-and-simple-design A start, exclusive end and closed viseme are sufficient for seekable sampling; actor and line identities belong to the containing timeline.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rest is explicit silence rather than an inferred spoken vowel, and ranges are not delayed to acoustic arrival or synthesized from external audio here.
 * @evidence contracts/common.md#meaningful-documentation Documents inclusive/exclusive film-frame endpoints and the rest target; manually constructed ranges require the same ordering and admission premises as the join.
 * @evidence contracts/performance.md#efficient-algorithms Each interval has constant size; joining V receipt intervals creates at most 2V+1 fresh ranges and sampling scans the retained ranges linearly.
 * @evidence contracts/performance.md#reuse-equivalent-work Joined emission intervals are reused for arbitrary frame queries until receipt or line timing changes; there is no per-range cached pose.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The containing timeline owns these scalar records, whose count follows the receipt; discarding it releases the range collection without host resources.
 * @author Samchon
 */
export interface IAutoMovieDialogueMouthRange {
  /** Inclusive film-global emission frame. */
  startFrame: number;

  /** Exclusive film-global emission frame. */
  endFrame: number;

  /** Derived mouth preset or explicit rest. */
  viseme: IAutoMovieProductionViseme["viseme"];
}
