import type { IAutoMovieCollisionResponse } from "../physics/IAutoMovieCollisionResponse";
import type { IAutoMovieShotPhysicsAdviceBase } from "./IAutoMovieShotPhysicsAdviceBase";

/**
 * One suggested collision response and the author's decision about it, carried
 * as data.
 *
 * A collision response from `suggestCollisionResponse` is advice, not an
 * imposed result: the engine never applies `proposal` by implication. Shot code
 * or a host analysis pass supplies the list through
 * `IAutoMovieEngineShotRuntime.advice`; the author may keep an item pending,
 * accept it, replace it with a modified response, or reject it with a
 * rationale. `compileDefinedShot` refuses an inconsistent item and copies the
 * list onto the compiled result, so the decision stays visible beside the
 * build.
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
