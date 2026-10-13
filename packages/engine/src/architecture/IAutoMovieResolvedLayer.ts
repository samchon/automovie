/**
 * One layer placed on the host's own measuring line.
 *
 * Coordinates are signed metres along the assembly's axis. `start` is the face
 * the stacking reaches first, beginning at the assembly offset, so under a
 * negative sense `start` is greater than `end`; take the minimum and maximum
 * for an interval.
 *
 * @evidence contracts/common.md#principled-implementation Each layer's faces are signed coordinates on the assembly's axis, starting from the previous layer's end, so a negative sense yields `start > end` and an interval is taken as min and max.
 * @evidence contracts/common.md#clear-and-simple-design Carries the authored layer facts beside its placed coordinates, so downstream queries do not join back to the authored record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coordinates are not reordered to hide the sense; consumers take min and max as documented.
 * @evidence contracts/common.md#meaningful-documentation States the signed coordinate convention, the reversal under a negative sense, how to take an interval, and the meaning and units of each field.
 * @evidenceExclude contracts/performance.md#efficient-algorithms No code; each layer is placed in constant time while the resolver accumulates the cursor along the axis.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Resolved once per assembly resolution and shared by every query on that result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Strings and numbers owned by the resolved assembly's layer array.
 * @author Samchon
 */
export interface IAutoMovieResolvedLayer {
  /** The contributing {@link IAutoMovieMaterialLayer.id}. */
  id: string;

  /**
   * The layer's construction role, as authored; the junction matcher compares
   * it by exact string equality.
   */
  role: string;

  /** What occupies the layer. */
  substance: "solid" | "cavity" | "membrane";

  /** Substance id, or `null` for a cavity. */
  material: string | null;

  /** Authored layer thickness in metres. */
  thickness: number;

  /** Signed coordinate of the face the stacking reaches first. */
  start: number;

  /** Signed coordinate of the face the stacking reaches last. */
  end: number;

  /** Signed coordinate of the layer's midplane. */
  center: number;

  /** Whether the layer is a visible finish. */
  finish: boolean;

  /** Whether the layer continues around an opening's reveal. */
  wrapsOpening: boolean;
}
