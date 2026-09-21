/**
 * A simpler authoring view over an exact connected basis's shape channels.
 * Each group translates the mean of its members' normalized coordinates while
 * preserving their differences. Groups are disjoint, so editing one cannot
 * silently change another. This is a coordinate transform, not a biological
 * model, an anatomical measurement, or a replacement for fine shape weights.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Keeps fine facial edits authoritative while exposing simpler numerical controls.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Defines basis-bound groups whose normalized residual detail survives simple edits.
 */
export interface IAutoMovieHumanFaceControlMap {
  /** Exact basis identity; a renamed or extended basis needs an explicit map. */
  basis: string;

  /** Ordered user-facing axes. Unlisted fine channels remain independently editable. */
  groups: {
    /** Stable identity independent of the display label. */
    id: string;
    /** Human-readable authoring name, not a claim of a measured physical unit. */
    label: string;
    /** Interpretation and limitations shown with the simple control. */
    description: string;
    /** Distinct shape channel IDs, each appearing in at most one group. */
    channels: string[];
  }[];
}
