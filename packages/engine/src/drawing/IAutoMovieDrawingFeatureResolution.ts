import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * What resolving one annotation target against the current design produced.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Carries the exact anchor, orientation, feature count, and stale explanation that keeps a drawing annotation traceable to current geometry.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Defines the complete resolved-or-stale result of looking up one authored drawing feature in the built environment.
 */
export interface IAutoMovieDrawingFeatureResolution {
  /**
   * Whether the target still addresses a feature of the design.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Marks whether the annotation target still names a real feature or must be shown as stale.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Distinguishes a successful current-geometry lookup from an invalidated feature reference.
   */
  status: "resolved" | "stale";
  /**
   * World position of the feature, or `null` when stale.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Supplies the current world-space anchor from which the drawing places the resolved note or dimension.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Holds the transformed feature coordinate on success and `null` for a stale reference.
   */
  point: IAutoMovieVector3 | null;
  /**
   * Unit world direction the feature carries, or `null`.
   *
   * An edge and an axis have one; a vertex, a face centre and a centroid do
   * not, and inventing an arbitrary direction for them would make a leader line
   * point somewhere the design never said.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Supplies the normalized world direction used to orient an axis- or edge-based annotation.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Preserves a directional feature's transformed orientation while leaving nondirectional features explicitly directionless.
   */
  direction: IAutoMovieVector3 | null;
  /**
   * How many features of this kind the design currently has.
   *
   * Populated even when the target is stale because the count changed, since
   * that number is exactly what the author has to write to re-pin the note.
   * Zero when the element, part or model could not be reached at all.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Reports the current number of selectable features so a stale indexed annotation can be repaired against the revised model.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Retains the actual feature cardinality even when the authored expected count or index no longer matches.
   */
  count: number;
  /**
   * Exactly why the target no longer resolves, or `null` when resolved.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views States why a pinned annotation no longer resolves instead of silently omitting or relocating it.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Carries the precise lookup, topology, or count failure for a stale target and `null` after successful resolution.
   */
  reason: string | null;
}
