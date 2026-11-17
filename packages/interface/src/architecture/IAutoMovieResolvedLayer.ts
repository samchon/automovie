/**
 * One layer placed on the host's own measuring line.
 *
 * Coordinates are signed metres along the assembly axis. `start` is reached first, beginning at its offset. Under negative sense, positive thickness ideally gives `start > end`; rounding can collapse the endpoints. A zero-thickness membrane has equal endpoints. Take minimum and maximum for an interval.
 *
 * @evidence contracts/development/design.md#principled-representation Each layer starts at the previous computed end on the signed axis. Negative sense reverses positive-thickness endpoint order; zero-thickness membranes retain equal endpoints. Finite endpoints are enforced before resolution, while numerical rounding can collapse a sufficiently small positive thickness at a large offset.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Carries the authored layer facts beside its placed coordinates, so downstream queries do not join back to the authored record.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Coordinates are not reordered to hide the sense; consumers take min and max as documented.
 * @evidence contracts/development/common.md#meaningful-documentation States the signed coordinate convention, the reversal under a negative sense, how to take an interval, and the meaning and units of each field.
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
