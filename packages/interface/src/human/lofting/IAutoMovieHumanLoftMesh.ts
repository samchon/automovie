/**
 * Growing millimetre mesh buffers, named index ranges and compact split-mesh results. Runtime construction and admission remain with AutoMovieHumanLoftMesh in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes growing millimetre mesh buffers, named index ranges and compact split-mesh results; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Growing millimetre mesh buffers, named index ranges and compact split-mesh results. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanLoftMesh; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing LoftMesh contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
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

  /**
   * Optional pole-fan declarations for the source station grid. Each defined entry identifies its bottom/top end and its world-space apex in millimetres; an undefined entry adds no fan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Optional pole-fan declarations for the source station grid. Each defined entry identifies its bottom/top end and its world-space apex in millimetres; an undefined entry adds no fan.
   * @evidence contracts/development/design.md#principled-representation Optional pole-fan declarations for the source station grid. Each defined entry identifies its bottom/top end and its world-space apex in millimetres; an undefined entry adds no fan.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLoftMesh.FansCaps is the canonical exchange used by AutoMovieHumanLoftMesh.fans.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The alias retains the existing AutoMovieHumanLoftMesh input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
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
   * Borrowed world-space [x, y, z] points in millimetres. The mesh writer appends them in this order and returns corresponding vertex indices without mutating the input tuples.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Borrowed world-space [x, y, z] points in millimetres. The mesh writer appends them in this order and returns corresponding vertex indices without mutating the input tuples.
   * @evidence contracts/development/design.md#principled-representation Borrowed world-space [x, y, z] points in millimetres. The mesh writer appends them in this order and returns corresponding vertex indices without mutating the input tuples.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLoftMesh.VerticesPoints is the canonical exchange used by AutoMovieHumanLoftMesh.vertices.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The alias retains the existing AutoMovieHumanLoftMesh input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
   */
  export type VerticesPoints = readonly (readonly [number, number, number])[];
}
