import type { AutoMovieXpbdBody } from "../AutoMovieXpbdBody";
import type { IAutoMovieXpbdPointImpulse } from "./IAutoMovieXpbdPointImpulse";
import type { IAutoMovieXpbdPointResponse } from "./IAutoMovieXpbdPointResponse";

/** A position pass's articulated response (`respondXpbdArticulation`). */
export interface IAutoMovieXpbdResponder {
  /**
   * Whether a body moves through a prepared tree: dynamic, attached by a joint,
   * and in a tree a contact of the pass touches.
   *
   * @param body The body.
   * @returns Whether its corrections go through its tree.
   */
  has(body: AutoMovieXpbdBody): boolean;

  /**
   * The response of the impulses' trees to the impulses acting together; none
   * when an impulse's body is in no prepared tree or a tree is singular.
   *
   * @param impulses Unit impulses on bodies the responder has.
   * @returns The row's response, or none.
   */
  respond(
    impulses: readonly IAutoMovieXpbdPointImpulse[],
  ): IAutoMovieXpbdPointResponse | null;
}
