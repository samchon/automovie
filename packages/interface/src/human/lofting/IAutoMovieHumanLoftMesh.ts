/**
 * Growing millimetre mesh buffers, named index ranges and compact split-mesh
 * results. Runtime construction and admission remain with
 * AutoMovieHumanLoftMesh in Human.
 */
export namespace IAutoMovieHumanLoftMesh {
  /** Growing vertex and index buffers in millimetres. */
  export interface IContext {
    /** Flat `[x, y, z, ...]` vertex positions in mm. */
    positions: number[];

    /** Flat triangle vertex indices. */
    indices: number[];

    /**
     * Named triangle ranges in emission order: each group owns the triangles
     * from its `start` index-buffer offset up to the next group's start. Groups
     * name the curve interval that generated them.
     */
    groups: {
      /** Chain identity used to address this mesh interval. */
      name: string;
      /**
       * Offset into the flat triangle index buffer at group creation, measured
       * in index entries (not vertices or triangle count). split reads from
       * this offset to the next group offset, or indices.length for the last
       * group.
       */
      start: number;
    }[];
  }

  /** One named piece of a split mesh, with its own compact vertex buffers. */
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

  /**
   * Optional pole-fan declarations for the source station grid. Each defined
   * entry identifies its bottom/top end and its world-space apex in
   * millimetres; an undefined entry adds no fan.
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

  /**
   * Borrowed world-space [x, y, z] points in millimetres. The mesh writer
   * appends them in this order and returns corresponding vertex indices without
   * mutating the input tuples.
   */
  export type VerticesPoints = readonly (readonly [number, number, number])[];
}
