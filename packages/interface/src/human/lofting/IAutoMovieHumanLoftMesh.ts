/** Type contracts exchanged by AutoMovieHumanLoftMesh; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanLoftMesh {
  /** Growing vertex and index buffers in millimetres.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Growing vertex and index buffers in millimetres.
   * @evidence contracts/development/design.md#principled-representation `positions`: Flat `[x, y, z, ...]` vertex positions in mm. `indices`: Flat triangle vertex indices. `groups`: Named triangle ranges in emission order: each group owns the triangles from its `start` index-buffer offset up to the next group's start.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLoftMesh.create, AutoMovieHumanLoftMesh.sampled. Read by AutoMovieHumanApertureConstruction.generate, AutoMovieHumanAperturePocket.loop, AutoMovieHumanBodyRoots.join. Also types AutoMovieHumanBodySurfaceContact.WEBS, AutoMovieHumanBodySurfaceContact.PINNED.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `positions`, `indices`, `groups`; callers supply the complete record.
   */
  export interface IContext {
    /** Flat `[x, y, z, ...]` vertex positions in mm. */
    positions: number[];

    /** Flat triangle vertex indices. */
    indices: number[];

    /**
     * Named triangle ranges in emission order: each group owns the
     * triangles from its `start` index-buffer offset up to the next
     * group's start. Groups name the curve interval that generated them.
     */
    groups: {
      /** Chain identity used to address this mesh interval. */
      name: string;
      /** Offset into the flat triangle index buffer at group creation, measured in index entries (not vertices or triangle count). split reads from this offset to the next group offset, or indices.length for the last group. */
      start: number;
    }[];
  }

  /** One named piece of a split mesh, with its own compact vertex buffers.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One named piece of a split mesh, with its own compact vertex buffers.
   * @evidence contracts/development/design.md#principled-representation `name`: Group name. `positions`: Flat vertex positions in mm. `normals`: Flat unit vertex normals, copied from the whole mesh.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLoftMesh.split. Also types AutoMovieHumanLoftMesh.pieces, AutoMovieHumanLoftMesh.entry.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `name`, `positions`, `normals`, `indices`, `coordinates`; callers supply the complete record.
   */
  export interface IPiece {
    /** Group name. */
    name: string;

    /** Flat vertex positions in mm. */
    positions: number[];

    /** Flat unit vertex normals, copied from the whole mesh. */
    normals: number[];

    /** Flat triangle indices into this piece's vertices. */
    indices: number[];

    /**
     * Flat loft coordinates `[chain, station, phase]` of each vertex, copied
     * from the whole mesh's (`AutoMovieHumanBodySurface.IOutput.coordinates`);
     * NaN where the vertex's owner publishes none.
     */
    coordinates: number[];
  }

  /** The caps argument of AutoMovieHumanLoftMesh.fans. Append the original station-grid pole fans to the supplied mesh buffers.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Append the original station-grid pole fans to the supplied mesh buffers.
   * @evidence contracts/development/design.md#principled-representation Append the original station-grid pole fans to the supplied mesh buffers. The outer tuple/array is readonly; nested element types determine whether their contents can change.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLoftMesh.FansCaps is the canonical exchange used by AutoMovieHumanLoftMesh.fans.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLoftMesh.fans for append the original station-grid pole fans to the supplied mesh buffers.
   */
  export type FansCaps = readonly (
    | {
        /** Which end of the chain receives this fan cap. */
        end: "bottom" | "top";
        /** Cap apex in the source's registered frame, millimetres. */
        point: [number, number, number];
      }
    | undefined
  )[];

  /** The points argument of AutoMovieHumanLoftMesh.vertices. Append points and return their vertex indices in order.
  @param context Buffers to grow.
  @param points World points `[x, y, z]` in mm.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Append points and return their vertex indices in order.
 * @evidence contracts/development/design.md#principled-representation Append points and return their vertex indices in order. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLoftMesh.VerticesPoints is the canonical exchange used by AutoMovieHumanLoftMesh.vertices.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLoftMesh.vertices for append points and return their vertex indices in order.
 */
  export type VerticesPoints = readonly (readonly [number, number, number])[];
}
