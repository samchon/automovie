import type { IAutoMovieSubdivisionSurface } from "./IAutoMovieSubdivisionSurface";

/**
 * Per-vertex normal heights applied to an evaluated subdivision surface.
 *
 * Heights are metres in the surface frame, positive outward; crease vertices
 * move along the normalized sum of their distinct limit normals. The producer
 * checks height count and finiteness and local aggregate normal orientation;
 * the caller supplies an admitted surface and verifies individual faces and
 * global intersections.
 */
export namespace IAutoMovieDisplaceSurface {
  /**
   * A subdivided surface and one normal-displacement height per vertex, the
   * relief that is finer than a cage can carry, such as an engraved groove or a
   * tendon's ridge.
   *
   * Each vertex moves by its height, metres, outward when positive, along its
   * limit normal, or the normalized mean of its distinct normals where a crease
   * or boundary gives it several; its limit position and its refined control
   * position move alike. Each normal then turns by the change the displacement
   * makes to the mesh's area-weighted normal there: `n + D / |D| - M / |M|`,
   * normalized, where `M` sums the area vectors of the quads that use the
   * normal before the displacement and `D` after it. This is a discrete form of
   * Blinn's (1978) perturbed normal: it adds the tilt the height's slope makes,
   * keeps the exact limit normal wherever every quad around a normal is
   * undisplaced, and agrees with the displaced shape to the mesh's resolution,
   * so relief narrower than about two faces of the subdivided mesh aliases and
   * belongs at a finer level. The orientation check is local to each normal
   * group's aggregate area; it does not certify every face orientation or
   * global absence of self-intersections. The heights usually come from a field
   * evaluated at each vertex's `locateSurfaceVertices` location, which
   * depends on no pose, so a posed surface takes the same heights.
   */
  export type IProps = {
    /**
     * Admitted evaluated surface borrowed synchronously; the result shares its
     * faces, normalFaces, UVs and parameters, but copies positions,
     * limitPositions and normals.
     */
    surface: IAutoMovieSubdivisionSurface;

    /**
     * One finite signed metre height per physical vertex in limitPositions
     * order; positive moves outward, zero preserves that vertex. Count and
     * finiteness are checked before displacement.
     */
    heights: ArrayLike<number>;
  };
}
