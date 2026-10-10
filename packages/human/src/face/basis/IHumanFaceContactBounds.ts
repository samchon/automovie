/**
 * Compiled collider bounds in basis metres, used only for reach pruning.
 * They do not replace the original signed geometry query.
 *
 * @author Samchon
 */
export interface IHumanFaceContactBounds {
  /** Minimum coordinate on each basis axis. */
  low: number[];
  /** Maximum coordinate on each basis axis. */
  high: number[];
}
