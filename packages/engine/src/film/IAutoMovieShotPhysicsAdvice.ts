import { IAutoMovieCollisionResponse } from "../physics/IAutoMovieCollisionResponse";

/** The fields every advice state carries. */
interface IAutoMovieShotPhysicsAdviceBase {
  /** Advice id chosen by the supplier; non-blank and unique within the shot. */
  id: string;

  /**
   * The engine-computed collision response: impact, recoil push and, when a
   * struck chain was given, the ROM-bounded flinch pose.
   */
  proposal: IAutoMovieCollisionResponse;
}

/**
 * One suggested collision response and the author's decision about it,
 * carried as data.
 *
 * A collision response from `suggestCollisionResponse` is advice, not an
 * imposed result: the engine never applies `proposal` by implication. Shot code or a host analysis pass supplies the
 * list through `IAutoMovieShotRuntime.advice`; the author may keep an item
 * pending, accept it, replace it with a modified response, or reject it with a
 * rationale. `compileDefinedShot` refuses an inconsistent item and copies the
 * list onto the compiled result, so the decision stays visible beside the
 * build.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union on `decision`, whose four states fix which of `selected` and `rationale` may be present; `compileDefinedShot` additionally requires a non-blank unique id and a non-blank rationale for every decision, and compares `selected` with `proposal` by key-sorted JSON, so `accepted` must equal the proposal and `modified` must differ from it regardless of key order.
 * @evidence contracts/common.md#clear-and-simple-design The shared id and proposal live once in a base, and each state adds only the two fields whose meaning changes, so no state carries a field it cannot use; the record is a decision log, with applying a selected response left to the author's own motion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The compiler never folds `selected` into motion and never fills a missing rationale, so an accepted proposal still reaches the shot only through what the author wrote, and a pending item stays pending.
 * @evidence contracts/common.md#meaningful-documentation States that the response is advice never applied by the engine, who supplies it and through which field, each decision state and what its `selected` and `rationale` must be, and that the compiler validates and copies the list.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape with no runtime body; validation is one pass with a canonical JSON comparison per item, answered on `compileDefinedShot`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Supplied once per shot compilation and deep-cloned onto its result; the engine computes no advice for this record and caches none.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the input items; the compiled result owns its own `structuredClone` of them, including any recoil pose, so neither aliases the other.
 */
export type IAutoMovieShotPhysicsAdvice =
  | (IAutoMovieShotPhysicsAdviceBase & {
      /** Not adjudicated yet. */
      decision: null;

      /** Always `null` while pending. */
      selected: null;

      /** Always `null` while pending; no rationale is invented. */
      rationale: null;
    })
  | (IAutoMovieShotPhysicsAdviceBase & {
      /** The proposal is selected unchanged. */
      decision: "accepted";

      /** Equal to `proposal` by value, regardless of key order. */
      selected: IAutoMovieCollisionResponse;

      /** Non-blank author reason for accepting the suggestion. */
      rationale: string;
    })
  | (IAutoMovieShotPhysicsAdviceBase & {
      /** An authored replacement is selected. */
      decision: "modified";

      /** The replacement response; must differ from `proposal` by value. */
      selected: IAutoMovieCollisionResponse;

      /** Non-blank author reason for changing the suggestion. */
      rationale: string;
    })
  | (IAutoMovieShotPhysicsAdviceBase & {
      /** The suggestion is deliberately rejected. */
      decision: "rejected";

      /** Always `null`: rejection selects no collision response. */
      selected: null;

      /** Non-blank author reason for rejecting the suggestion. */
      rationale: string;
    });
