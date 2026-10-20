/**
 * A conservative cell-and-portal culling hint over a building's logical space graph.
 *
 * A space is hidden only when it is proved unreachable from the camera through every opening, connector and exterior route the design declares. Everything else stays drawn. An exterior or ambiguous camera position and an unstated space extent therefore hide nothing.
 *
 * The exterior is a node of the portal graph, not the absence of one. A room with a window is reachable from outside, so from a sealed interior room the other windowed rooms are still hidden, while from a windowed room they are kept: light and geometry can travel out one opening and in another, and the graph says so instead of the culler guessing.
 *
 * @evidence contracts/common.md#principled-implementation Cell-and-portal reachability starts from one containing leaf space and includes declared openings, every connector stop and exterior routes; reachable spaces and their ancestors remain drawn. Valid ids, references and an acyclic parent graph are caller premises, and numerical containment inherits the shared cell/shell predicate's tolerances and finite-intermediate limitations.
 * @evidence contracts/common.md#clear-and-simple-design Camera classification, visible/hidden partition and explicit inconclusive reason separate geometric placement from proof of exclusion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exterior, ambiguous or unknown leaf extents hide nothing, and an opening remains a possible portal even with a movable door leaf; no unproved closed-door state drives aggressive culling.
 * @evidence contracts/common.md#meaningful-documentation Defines leaf-camera ownership, placement classification, sorted complementary populations and incomplete-proof reason.
 */
export interface IAutoMovieRoomVisibility {
  /** Hint format. */
  version: 1;

  /**
   * Unique containing leaf-space id, or null when no known leaf contains the camera or several do; parent containers do not create ambiguity.
   */
  camera: string | null;

  /**
   * Interior means exactly one known leaf contains the camera; exterior means none does and every leaf states a volume. Ambiguous means overlapping containing leaves or no containing leaf with an unknown leaf extent elsewhere.
   */
  cameraPlacement: "interior" | "exterior" | "ambiguous";

  /**
   * Space ids proved unreachable from the camera, ascending.
   *
   * Empty whenever the proof is incomplete: the camera must resolve to one leaf and every leaf must state cells or a shell. This checks presence of a volume spelling, not its closure or positive volume.
   */
  hidden: string[];

  /**
   * Space ids that must be drawn, ascending. Always the complement of `hidden`.
   */
  visible: string[];

  /**
   * Why nothing could be hidden, or `null` when the proof was complete.
   *
   * A hint that hides nothing and says nothing is indistinguishable from a hint that proved everything visible, and those are different facts.
   */
  inconclusive: string | null;
}
