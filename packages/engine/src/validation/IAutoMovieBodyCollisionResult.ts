import {
  IAutoMovieInteractionEvent,
  IAutoMovieValidation,
} from "@automovie/interface";

import { IAutoMovieCollisionResponse } from "../physics/IAutoMovieCollisionResponse";

/**
 * Return sampled inter-body validation, contact events and an optional suggested response.
 *
 * @evidence contracts/development/design.md#principled-representation Capsule distances below summed radii create sampled penetration events; malformed sampling/topology/proxies return errors, while valid overlaps warn unless physicsIntent suppresses warnings.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One result packages the check's observations and deepest-penetration suggestion without applying that suggestion to either actor.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Events are sampled proxy contacts rather than continuous collision proof, and suppressed warnings do not remove contact events; response can be null when absent or explicitly suppressed.
 * @evidence contracts/development/common.md#meaningful-documentation Documents validation severity, shot-clock event population and optional response ownership rather than claiming a delivered reaction host.
 */
export interface IAutoMovieBodyCollisionResult {
  /** Sampled overlap warnings or admission errors; physicsIntent suppresses warnings. */
  validation: IAutoMovieValidation;

  /** Per-sample proxy contacts on the shot clock, including suppressed warnings. */
  events: IAutoMovieInteractionEvent[];

  /** Suggested response at the deepest contact, or `null` when none applies. */
  response: IAutoMovieCollisionResponse | null;
}
