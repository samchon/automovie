/**
 * One layer placed on the host's own measuring line.
 *
 * Coordinates are signed metres along the assembly's axis. `start` is the face
 * the stacking reaches first, beginning at the assembly offset, so under a
 * negative sense `start` is greater than `end`; take the minimum and maximum
 * for an interval.
 *
 * @author Samchon
 */
export interface IAutoMovieResolvedLayer {
  /** The contributing {@link IAutoMovieMaterialLayer.id}. */
  id: string;

  /** The layer's construction role. */
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
