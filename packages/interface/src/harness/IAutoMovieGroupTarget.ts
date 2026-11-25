/**
 * A target that is several things at once, such as a two-shot or a crowd.
 *
 * A camera frames the union of members' measured portable rest/proxy boxes at
 * staged placements and sampled formation footprints, with rig/stand-in
 * fallbacks for missing model extents. This does not measure deformed rendered
 * pixels. A compact formation is addressed by its design id rather than by
 * expanded scene nodes. The camera follows a group only when a formation has a
 * cue, and then updates the base while keeping opening height/radius; member
 * nodes remain at staged positions in this group measurement.
 *
 * Every other verb (`lookAt`, `reach`, `locomote`, a `point` or `strike`
 * gesture, a `launch` aim) needs one point on one body. For those, a group that
 * names any formation is refused, and a node-only group resolves to the
 * centroid of every named member. A missing member makes the target unresolved
 * rather than changing the group by omission. An empty group, a blank id or a
 * formation the shot did not compile is refused. A launch with onHit needs one
 * struck actor, so a group aim is allowed only without onHit.
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
   * `frame` focus or a coverage subject may name one. Omit it for a group of
   * staged nodes.
   */
  formations?: string[];
}
