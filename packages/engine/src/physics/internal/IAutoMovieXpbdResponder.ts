import type { AutoMovieEngineXpbdBody } from "../AutoMovieEngineXpbdBody";
import type { IAutoMovieXpbdPointImpulse } from "./IAutoMovieXpbdPointImpulse";
import type { IAutoMovieXpbdPointResponse } from "./IAutoMovieXpbdPointResponse";

/*
 * A position pass's articulated response (`respondXpbdArticulation`).
 */
export interface IAutoMovieXpbdResponder {
  /*
   * Whether a body moves through a prepared tree: dynamic, attached by a joint,
   * and in a tree a contact of the pass touches.
   * Parameter body: The body.
   * Returns: Whether its corrections go through its tree.
   */
  has(body: AutoMovieEngineXpbdBody): boolean;

  /*
   * The response of the impulses' trees to the impulses acting together; none
   * when an impulse's body is in no prepared tree or a tree is singular.
   * Parameter impulses: Unit impulses on bodies the responder has.
   * Returns: The row's response, or none.
   */
  respond(
    impulses: readonly IAutoMovieXpbdPointImpulse[],
  ): IAutoMovieXpbdPointResponse | null;
}
