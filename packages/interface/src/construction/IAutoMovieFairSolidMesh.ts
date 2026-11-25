/** Seed regions for discrete fairing of a realized solid mesh. */
export namespace IAutoMovieFairSolidMesh {
  /**
   * Regions read synchronously without mutation by fairAutoMovieSolidMesh. An
   * empty list is a no-op. Invalid seed IDs or nonpositive/nonfinite radii
   * throw before positions change. Seeds select the union of vertices reached
   * by mesh-edge paths strictly shorter than their radius; coincident positions
   * move together and overlapping regions are solved together.
   *
   * The discrete umbrella thin-plate solve holds two exterior rings fixed and
   * refuses a region without a supporting rim. Spatial preselection assumes
   * nearby edges are shorter than a region's radius. Finite iterations do not
   * certify exact convergence or G1 continuity. Only positions change: indices
   * and owner/chart addresses still describe the original surface samples.
   */
  export type IRegions = readonly {
    /**
     * Nonempty integer vertex IDs in [0, mesh.positions.length/3); duplicates
     * are accepted.
     */
    vertices: readonly number[];

    /**
     * Positive finite edge-path reach in millimetres; vertices exactly this far
     * from every seed remain fixed.
     */
    radius: number;
  }[];
}
