import type { IAutoMovieFluidDomain } from "./IAutoMovieFluidDomain";
import type { IAutoMovieFluidState } from "./IAutoMovieFluidState";

/** Inputs to the engine's cell-centred fluid surface projection. */
export namespace IAutoMovieFluidSurfaceGeometry {
  /**
   * Borrowed domain and solved state for deriving a fresh drawable free
   * surface.
   *
   * Numerical mesh derivation belongs to the engine; the viewer copies these
   * attributes into Float32 buffers. That projection does not preserve every
   * binary64 bit or establish rendered pixel equality.
   *
   * One vertex per cell lies at its centre and world height origin.y + bed +
   * depth in row-major cell order. A quad is triangulated only when all four
   * corner cells have depth > solver.dryDepth and none is solid. Thus drained
   * or singleton-axis lattices have no triangles; nondegenerate X/Z spacing
   * gives counter-clockwise winding seen from above and a positive Y
   * cross-product component.
   *
   * Normals use `normalize(-dEta/dX, 1, -dEta/dZ)` from central differences,
   * one-sided differences at edges, and zero slope on a singleton axis. They do
   * not infer submerged/solid boundary slopes separately. Equal computed
   * elevations give flat normals when derived arithmetic is representable; a
   * singleton on one axis leaves the other axis's slope intact.
   *
   * IAutoMovieFluidSurface.flow is the per-cell average of its two x faces and
   * of its two z faces. The viewer uploads flow for supplied shaders; its
   * default material does not use it to animate ripples. UVs span [0, 1]
   * independently on each axis, or zero on a singleton. bounds measures only
   * triangle-referenced vertices and is null when no quad is drawn, even though
   * all cell vertices remain in the mesh.
   *
   * Throws for a mismatched state domain id. Matching ids do not validate
   * provenance, array lengths or finite fields; caller admission and a
   * compatible solved state are required. Extreme finite sums, slopes, squared
   * normal lengths and face averages have no finite-result gate.
   *
   * Neither input is mutated or retained. Returned mesh, flow and bounds values
   * belong to the caller.
   */
  export type IProps = {
    /**
     * Admitted grid, metre bed elevations, solidity and dry threshold; read
     * without modification.
     */
    domain: IAutoMovieFluidDomain;

    /**
     * Matching solved depth and staggered face-velocity arrays; state.step
     * labels the new surface.
     */
    state: IAutoMovieFluidState;
  };
}
