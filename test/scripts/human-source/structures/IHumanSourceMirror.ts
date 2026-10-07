/**
 * The base mesh's own left-right correspondence (MPFB `hm08.mirror`): which
 * body vertices lie on the midsagittal plane and each vertex's mirror twin.
 *
 * @author Samchon
 */
export interface IHumanSourceMirror {
  /** Body vertices the table marks as midline (`m`). */
  midline: number[];

  /** Mirror twin of each body vertex; a midline vertex is its own twin. */
  twin: Int32Array;
}
