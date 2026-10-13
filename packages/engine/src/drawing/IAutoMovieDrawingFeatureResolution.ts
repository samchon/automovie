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
 * @author Samchon
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
   * point somewhere the design never said.
   */
  direction: IAutoMovieVector3 | null;

  /**
   * How many features of this kind the design currently has.
   *
   * Populated even when the target is stale because the count changed, since
   * that number is exactly what the author has to write to re-pin the note.
   * Zero when the element, part or model could not be reached at all, and also
   * when an axis or centroid target names an invalid index, an axis collapses
   * under its element's scale, or the element has no geometry for a centroid;
   * zero alone therefore does not mean the element was unreachable.
   */
  count: number;

  /** Exactly why the target no longer resolves, or `null` when resolved. */
  reason: string | null;
}
