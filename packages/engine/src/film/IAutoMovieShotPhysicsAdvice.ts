import { IAutoMovieCollisionResponse } from "../physics/IAutoMovieCollisionResponse";

/**
 * One D010 physical suggestion carried as data.
 *
 * The engine never applies {@link IAutoMovieShotPhysicsAdvice.proposal} by
 * implication. The coding agent may keep it pending, accept it, replace it with
 * a modified response, or reject it with rationale; the decision remains
 * visible beside the build.
 */
interface IAutoMovieShotPhysicsAdviceBase {
  /** Stable advice identity chosen by the shot code. */
  id: string;
  /** Engine-computed impact, push and optional ROM-bounded recoil. */
  proposal: IAutoMovieCollisionResponse;
}

/**
 * One explicit author disposition over an engine D010 proposal.
 *
 * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-authored-simulated-trajectory Records whether the author left a D010 proposal pending, accepted it, replaced it, or rejected it, together with the selected response and required rationale.
 * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#rigid-trajectory-tier-contract Keeps the engine-computed proposal distinct from the author's explicit selected collision response so simulation advice never becomes implicit authority.
 */
export type IAutoMovieShotPhysicsAdvice =
  | (IAutoMovieShotPhysicsAdviceBase & {
      /** The proposal has not been adjudicated yet. */
      decision: null;
      /** No response is selected while the decision is pending. */
      selected: null;
      /** Pending advice carries no invented rationale. */
      rationale: null;
    })
  | (IAutoMovieShotPhysicsAdviceBase & {
      /** The engine proposal is selected unchanged. */
      decision: "accepted";
      /** Exact selected response; validation requires it to equal proposal. */
      selected: IAutoMovieCollisionResponse;
      /** Non-blank author reason for accepting the suggestion. */
      rationale: string;
    })
  | (IAutoMovieShotPhysicsAdviceBase & {
      /** A source-authored replacement is selected. */
      decision: "modified";
      /** Replacement response, observably distinct from proposal. */
      selected: IAutoMovieCollisionResponse;
      /** Non-blank author reason for changing the suggestion. */
      rationale: string;
    })
  | (IAutoMovieShotPhysicsAdviceBase & {
      /** The suggestion is deliberately rejected. */
      decision: "rejected";
      /** Rejection applies no collision response. */
      selected: null;
      /** Non-blank author reason for rejecting the suggestion. */
      rationale: string;
    });
