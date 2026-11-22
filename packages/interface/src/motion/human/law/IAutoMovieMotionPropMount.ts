import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";

/**
 * A planned attachment of one prop to a named point on another prop, beginning at a share of the action's duration. Performance prop placement resolves the attachment.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A planned attachment of one prop to a named point on another prop, beginning at a share of the action's duration. Performance prop placement resolves the attachment.
 * @evidence contracts/development/design.md#principled-representation from: Share of this action from which the prop rides the socket.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Action plans publish prop-to-prop socket attachment events; performance prop placement resolves the named parent and socket and maintains the mounted trajectory.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The start remains a normalized duration share and the socket is an existing point identifier. Performance placement owns lookup and subsequent grip takeover.
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
   * The prop's frame in the socket's frame where the action sets it exactly
   * (a put-down onto its seat, its own `via` socket on the receiving one):
   * from `from` the prop rides the socket at this offset, and the hand that
   * sets it brings it there over its grip, so the place shows no step.
   * Absent, the prop keeps the offset it had from the socket where the
   * mount began.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the seated frame, the hand's approach and the default.
   * @evidence contracts/development/design.md#principled-representation A rigid offset on the planned attachment, the child's frame in its parent socket's, as a parented node in a scene graph.
   * @evidence contracts/development/design.md#minimal-and-owned-surface putDown sets it; HumanPerformanceGrips carries it and HumanPerformanceHold seats the prop by it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The socket stays the other prop's own affordance; no tolerance is widened.
   */
  offset?: IAutoMovieRigidTransform;
}
