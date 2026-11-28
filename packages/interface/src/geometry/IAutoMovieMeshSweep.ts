import type { IAutoMovieSweep } from "./IAutoMovieSweep";

/** Ring sampling and wall shading inputs for direct sweep triangulation. */
export namespace IAutoMovieMeshSweep {
  /**
   * Sweep geometry, ring sampling policy and wall shading for a directly
   * triangulated mesh.
   *
   * The sweep joins sampled outer and hole rings with consistent winding
   * between rows. A polygon under parameter correspondence preserves its
   * authored corner count. The wall texture axes measure distance around the
   * ring and polygonal spine station distance; end caps use planar section
   * coordinates. Author a spine and sections whose swept walls stay separate.
   */
  export type IProps = {
    /**
     * Borrowed authored sweep in model metres. CompileSweep admits its authored
     * geometry before the mesher samples it.
     */
    sweep: IAutoMovieSweep;

    /**
     * At least two finite strictly increasing normalized spine coordinates,
     * exactly 0 first and 1 last. Omission uses the spine points' chord-length
     * shares.
     */
    rows?: readonly number[];

    /**
     * Samples per loop unless parameter correspondence supplies a polygon's
     * corners. Supply a safe integer of at least three; the default is 32.
     */
    columns?: number;

    /**
     * Whether to close both ends by triangulating end regions and retaining
     * their holes. Omission enables caps and false gives open walls.
     */
    caps?: boolean;

    /**
     * Wall normal policy. Flat shading duplicates triangle corners. Smooth
     * shading shares ring vertices and pools normals across duplicated UV seam
     * corners. Omission uses flat shading.
     *
     * The capped end normals remain planar for either wall setting.
     */
    shading?: "flat" | "smooth";
  };
}
