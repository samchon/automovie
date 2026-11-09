import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * What resolving one annotation target against the current design produced.
 *
 * `resolveAutoMovieDrawingFeature` returns one per target. A resolved target
 * carries a world point in metres and a null `reason`; a stale one carries a
 * null point and direction and the sentence explaining why, so a drawing can
 * keep the note visible as stale instead of dropping it or pinning it to a
 * guessed place.
 *
 * @evidence contracts/development/design.md#principled-representation A two-state result with nullable payload fields records success or the exact cause of failure as data, so a target that no longer resolves is reported rather than approximated or thrown.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One flat record for every feature kind, with `direction` null where a kind has none, so drawing and annotation code reads one shape whatever the target names.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No direction is invented for a directionless feature and no nearest feature substitutes for a missing one; `count` is reported as measured, including zero for unreachable or invalid targets.
 * @evidence contracts/development/common.md#meaningful-documentation The documentation states who produces it, what each status carries, the units, which kinds have a direction and why the rest do not, every case in which `count` is zero, and what `reason` holds.
 */
export interface IAutoMovieDrawingFeatureResolution {
  /** Whether the target still addresses a feature of the design. */
  status: "resolved" | "stale";

  /** World position of the feature in metres, or `null` when stale. */
  point: IAutoMovieVector3 | null;

  /**
   * Unit world direction the feature carries, or `null`.
   *
   * An edge and an axis have one; a vertex, a face centre and a centroid do
   * not, and inventing an arbitrary direction for them would make a leader line
   * point somewhere the design never said. Always `null` when stale.
   */
  direction: IAutoMovieVector3 | null;

  /**
   * How many features of this kind the design currently has.
   *
   * Populated even when the target is stale because the count changed or its
   * index fell outside the features, since that number is exactly what the
   * author has to write to re-pin the note. Zero when the element, part or
   * model could not be reached at all, and also when an axis or centroid
   * target names an invalid index, an axis collapses under its element's
   * scale, or the element has no geometry for a centroid; zero alone therefore
   * does not mean the element was unreachable.
   */
  count: number;

  /** Exactly why the target no longer resolves, or `null` when resolved. */
  reason: string | null;
}
