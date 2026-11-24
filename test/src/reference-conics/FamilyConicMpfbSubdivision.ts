import {
  admitSubdivisionCage,
  limitSubdivisionLevel,
  refineSubdivisionLevel,
} from "@automovie/engine";
import type {
  IAutoMovieMillimeterMesh,
  IAutoMovieSubdivisionLevel,
} from "@automovie/interface";

/** Catmull–Clark position and normal measurements of the public HM08 cage. */
export namespace FamilyConicMpfbSubdivision {
  /**
   * Wound triangle corners borrowing the corresponding unit limit-normal
   * indices.
   */
  export interface INormalField {
    /** Packed unit limit normals, dimensionless. */
    values: readonly number[];
    /** One index per rendered triangle corner, in skin index order. */
    indices: readonly number[];
  }

  /**
   * A finite triangular sampling of the exact limit vertex positions and
   * normals.
   */
  export interface ISample {
    /** Limit positions in millimetres and wound sample triangles. */
    body: IAutoMovieMillimeterMesh;
    /** Exact limit normals at the corners of those sample triangles. */
    normals: INormalField;
    /** Frequency of each cage vertex valence, prior to any refinement. */
    valence: Record<number, number>;
    /** Number of authored quads in the source cage. */
    authoredQuads: number;
  }

  /**
   * Refinement only determines the sample tessellation. The engine evaluates
   * the actual limit position and tangent masks once at the selected level.
   * This retains the authored poles and boundary sectors for the tangent read.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The public authored quads are admitted as a real cage. Measurement uses the engine's limit vertex and tangent masks.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each requested level and its masks are prepared once for all section and divider reads.
   * @see https://graphics.pixar.com/library/Geri/paper.pdf
   * @see https://doi.org/10.1145/280814.280945
   */
  export function sample(
    body: IAutoMovieMillimeterMesh,
    depth: number,
  ): ISample {
    if (!Number.isSafeInteger(depth) || depth < 0)
      throw new Error("The subdivision depth must be a nonnegative integer");
    const faces = authoredFaces(body.indices);
    let level: IAutoMovieSubdivisionLevel = admitSubdivisionCage({
      positions: Array.from(body.positions, (x): number => x / 1_000),
      faces,
    });
    const offsets: number[] = level.topology.fanEdgeOffsets;
    const valence: Record<number, number> = {};
    for (let i: number = 1; i < offsets.length; ++i) {
      const edges: number = offsets[i]! - offsets[i - 1]!;
      valence[edges] = (valence[edges] ?? 0) + 1;
    }
    for (let i: number = 0; i < depth; ++i)
      level = refineSubdivisionLevel(level);
    const limit = limitSubdivisionLevel(level);
    const vertices: number[] = level.topology.faceVertices;
    const indices: number[] = [],
      normalIndices: number[] = [];
    for (let q: number = 0; q < vertices.length; q += 4)
      for (const k of [0, 1, 2, 0, 2, 3]) {
        indices.push(vertices[q + k]!);
        normalIndices.push(limit.cornerNormals[q + k]!);
      }
    return {
      body: {
        positions: limit.positions.map((x): number => 1_000 * x),
        indices,
      },
      normals: { values: limit.normals, indices: normalIndices },
      valence,
      authoredQuads: faces.length,
    };
  }

  /** Invert the pinned OBJ reader's adjacent, oppositely directed diagonal pair. */
  function authoredFaces(indices: ArrayLike<number>): number[][] {
    if (indices.length === 0 || indices.length % 6 !== 0)
      throw new Error(
        "The HM08 cage must contain authored quad triangle pairs",
      );
    const faces: number[][] = [];
    for (let i: number = 0; i < indices.length; i += 6) {
      const [a, b, c, first, d, second]: number[] = Array.from(
        { length: 6 },
        (_, k): number => indices[i + k]!,
      );
      if (first !== a || second !== b || new Set([a, b, c, d]).size !== 4)
        throw new Error(
          `The HM08 triangle pair at face ${i / 6} does not recover one authored quad`,
        );
      faces.push([a!, d!, b!, c!]);
    }
    return faces;
  }
}
