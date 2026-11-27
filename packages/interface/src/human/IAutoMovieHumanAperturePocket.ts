/**
 * The named triangle sink used while closing an aperture trim loop. Runtime
 * construction and admission remain with AutoMovieHumanAperturePocket in
 * Human.
 */
export namespace IAutoMovieHumanAperturePocket {
  /**
   * Emit consecutive triangle corner indices under their owning chain name;
   * each group of three corners is one triangle in the mesh buffers being
   * extended by the aperture-pocket caller. The sink owns the index/group side
   * effects; it does not receive point coordinates.
   */
  export type LoopEmit = (name: string, ...corners: number[]) => void;
}
