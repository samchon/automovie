/**
 * Seed regions for discrete fairing of a realized solid mesh.
 *
 * @evidence contracts/development/design.md#principled-representation Vertex IDs and edge-path radii identify regions in the mesh's millimetre frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface fairAutoMovieSolidMesh consumes these regions after construction draws and closes the skin.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Fairing moves positions while retaining original owner/chart addresses; a region is not a new analytic surface.
 * @evidence contracts/development/common.md#meaningful-documentation States selection units and the source-ownership consequence of movement.
 */
export namespace IAutoMovieFairSolidMesh {
  /**
   * Regions read synchronously without mutation by fairAutoMovieSolidMesh.
   * An empty list is a no-op. Invalid seed IDs or nonpositive/nonfinite radii
   * throw before positions change. Seeds select the union of vertices reached
   * by mesh-edge paths strictly shorter than their radius; coincident positions
   * move together and overlapping regions are solved together.
   *
   * The discrete umbrella thin-plate solve holds two exterior rings fixed and
   * refuses a region without a supporting rim. Spatial preselection assumes
   * nearby edges are shorter than a region's radius. Finite iterations do not
   * certify exact convergence or G1 continuity. Only positions change: indices
   * and owner/chart addresses still describe the original surface samples.
   *
   * @evidence contracts/development/design.md#principled-representation Seeds and positive millimetre radii specify path neighborhoods rather than world-space balls or chart distances.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Construction resolves surface/datum seeds to vertex IDs before invoking this common mesh operation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Runtime checks admit descriptors and the fixed rim; the result does not become an analytic surface with certified continuity.
   * @evidence contracts/development/common.md#meaningful-documentation Documents empty behavior, validation, overlap, position mutation and retained source addresses.
   */
  export type IRegions = readonly {
    /** Nonempty integer vertex IDs in [0, mesh.positions.length/3); duplicates are accepted. */
    vertices: readonly number[];

    /** Positive finite edge-path reach in millimetres; vertices exactly this far from every seed remain fixed. */
    radius: number;
  }[];
}
