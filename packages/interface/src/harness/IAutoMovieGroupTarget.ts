/**
 * A target that is several things at once, such as a two-shot or a crowd.
 *
 * A camera frames a group as the box its members occupy. Each named node that
 * is placed contributes the box its model draws at its staged placement, and
 * each named formation contributes its whole transformed extent at the framed
 * instant. Naming the formation is the only way to address a mass: it is stored
 * as one compact record, and its members have no scene node ids until the
 * builder materializes a slot. The camera follows a group only when one of its
 * formations carries a cue; otherwise the frame holds on the opening extent,
 * even if a member node walks away.
 *
 * Every other verb (`lookAt`, `reach`, `locomote`, a `point` or `strike`
 * gesture, a `launch` aim) needs one point on one body. For those, a group that
 * names any formation is refused, and a node-only group resolves to the
 * centroid of the members that are placed, skipping unplaced ones; a group
 * with no placed member, or no members, is refused. `performShot` also refuses
 * a blank id and a formation the shot did not compile.
 *
 * @evidence contracts/common.md#principled-implementation Framing takes the union of member boxes, which is the region the frame must hold, while a single-point verb takes `resolveTargetPoint`'s centroid of placed members with each formation counted once; both read the same staged placement table.
 * @evidence contracts/common.md#clear-and-simple-design One record names staged nodes and compact formations together, so a captain and his company are one subject without listing slots, and the consuming verb decides whether it needs an extent or a point.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A formation named where one point is needed is refused rather than collapsed to the crowd's centroid, and an unknown formation is refused rather than dropped; unplaced member nodes are skipped as `performShot` specifies.
 * @evidence contracts/common.md#meaningful-documentation States how a camera measures and follows a group, why formations are named rather than listed, how single-point verbs resolve it, which members are skipped and every refusal; members give the ids each list holds and what a formation contributes.
 * @author Samchon
 */
export interface IAutoMovieGroupTarget {
  /** Selects a multi-subject extent as the target representation. */
  kind: "group";

  /** Staged scene node ids, cameras included, taken together. */
  nodes: string[];

  /**
   * Formation design ids framed together with those nodes.
   *
   * Each id must name a formation the shot compiled. It contributes the unit's
   * slot footprint under the cue playing at the framed instant, widened by a
   * member's radius and raised by a member's height. Only a `frame` subject, a
   * `frame` focus or a coverage subject may name one. Omit it for a group of staged nodes.
   */
  formations?: string[];
}
