import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";

/**
 * A planned attachment of one prop to a named point on another prop, beginning
 * at a share of the action's duration. Performance prop placement resolves the
 * attachment.
 */
export interface IAutoMovieMotionPropMount {
  /** The prop's subject. */
  prop: string;

  /** The prop it is set on. */
  onto: string;

  /** The socket affordance of `onto` it rides. */
  point: string;

  /** Share of this action from which the prop rides the socket. */
  from: number;

  /**
   * The prop's frame in the socket's frame where the action sets it exactly (a
   * put-down onto its seat, its own `via` socket on the receiving one): from
   * `from` the prop rides the socket at this offset, and the hand that sets it
   * brings it there over its grip, so the place shows no step. Absent, the prop
   * keeps the offset it had from the socket where the mount began.
   */
  offset?: IAutoMovieRigidTransform;
}
