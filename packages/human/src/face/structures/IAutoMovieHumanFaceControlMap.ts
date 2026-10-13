/**
 * A simpler authoring view over an exact connected basis's shape channels.
 * Each group translates the mean of its members' normalized coordinates while
 * preserving their differences. Groups are disjoint, so editing one cannot
 * silently change another. This is a coordinate transform, not a biological
 * model, an anatomical measurement, or a replacement for fine shape weights.
 *
 * @evidence contracts/common.md#principled-implementation Exact basis revision and disjoint resident shape groups define reversible normalized-mean authoring coordinates, with origin-relative residual preservation and member-envelope intersection owned by the compiler.
 * @evidence contracts/common.md#clear-and-simple-design Group identity/label/meaning and fine-member IDs define presentation without replacing flat saved weights or inventing anatomical measurement units.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Groups cannot overlap or name expression/nonresident channels, unsupported means refuse before decoding, and coordinate normalization establishes no biological model.
 * @evidence contracts/common.md#meaningful-documentation The comment states normalized mean/residual, disjointness and numerical-versus-anatomical scope; fields identify basis and unlisted-channel ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This map schema performs no normalization or residual decode.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The map defines group identity; actual copied compilation/projection origin reuse belongs to createHumanFaceControlMap.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns group arrays and the type retains no projected shape or active task.
 *
 * @author Samchon
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
