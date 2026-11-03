import type { HumanAnatomy } from "../../HumanAnatomy";
import type { HumanReference } from "../bodies/HumanReference";
import { HumanReferenceSurfaceMesh } from "./HumanReferenceSurfaceMesh";
import { HumanReferenceSurfaceSkin } from "./HumanReferenceSurfaceSkin";
import { HumanReferenceSurfaceTree } from "./HumanReferenceSurfaceTree";

/**
 * The two sides a comparison pairs, each prepared once: the reference's skin
 * with the normals its vertices read along, and the generated outer skin that
 * those normals are cast onto. Both are the surface seen from outside, so
 * cavities and pieces apart from the body never stand in for skin.
 */
export namespace HumanReferenceSurfacePair {
  /** The reference side of a pairing. */
  export interface IReferenceSide {
    /** Flat vertex positions, mm. */
    P: Float64Array;

    /** Flat triangle vertex indices. */
    I: Uint32Array;

    /** Flat outward unit vertex normals, along which a vertex reads its deviation. */
    normal: Float64Array;

    /** Area per vertex, mm squared. */
    area: Float64Array;

    /** Hierarchy over every reference triangle. */
    tree: HumanReferenceSurfaceTree;

    /**
     * Whether each vertex is skin: seen from outside, and on the body's one
     * continuous surface rather than a piece apart such as an eyeball or a
     * tooth. Only skin vertices are read.
     */
    skin: Uint8Array;
  }

  /** The generated side of a pairing. */
  export interface IGeneratedSide {
    /** Flat vertex positions, mm. */
    P: Float64Array;

    /** Flat triangle vertex indices of the whole skin. */
    I: Uint32Array;

    /** Vertex count. */
    count: number;

    /** Flat outward unit vertex normals. */
    normal: Float64Array;

    /** Area per vertex over the whole skin, mm squared. */
    area: Float64Array;

    /** Whether each vertex is on the outer skin. */
    skin: Uint8Array;

    /**
     * Flat triangle vertex indices of the outer skin: every triangle with a
     * vertex seen from outside. Geometry inside the generated body never
     * stands in for the reference's skin.
     */
    outerIndices: Uint32Array;

    /** Hierarchy over the outer skin's triangles. */
    tree: HumanReferenceSurfaceTree;

    /** The whole skin's open border edges, which mark a hole. */
    border: Set<number>;
  }

  /**
   * Prepares the reference side.
   *
   * @param mesh The welded reference mesh.
   */
  export function ofReference(mesh: HumanReference.IMesh): IReferenceSide {
    const P: Float64Array = mesh.P;
    const I: Uint32Array = mesh.I;
    const n: number = P.length / 3;
    const normal: Float64Array = HumanReferenceSurfaceMesh.vertexNormals(P, I);
    const area: Float64Array = HumanReferenceSurfaceMesh.vertexAreas(P, I);
    const tree: HumanReferenceSurfaceTree = new HumanReferenceSurfaceTree(P, I);

    // The reference's skin is its body's one continuous surface where seen from outside; separate pieces, such as eyeballs and teeth, are not skin.
    const skin: Uint8Array = HumanReferenceSurfaceSkin.exposed(tree, P, normal);
    const piece: Int32Array = HumanReferenceSurfaceMesh.components(I, n);
    const main: number = HumanReferenceSurfaceMesh.largest(piece, area);
    for (let v: number = 0; v < n; v++) if (piece[v] !== main) skin[v] = 0;

    return { P, I, normal, area, tree, skin };
  }

  /**
   * Prepares the generated side.
   *
   * @param generated The generated skin.
   */
  export function ofGenerated(generated: HumanAnatomy.ISkin): IGeneratedSide {
    const P: Float64Array = generated.P;
    const count: number = P.length / 3;
    const normal: Float64Array = HumanReferenceSurfaceMesh.vertexNormals(P, generated.I);
    const area: Float64Array = HumanReferenceSurfaceMesh.vertexAreas(P, generated.I);
    const whole: HumanReferenceSurfaceTree = new HumanReferenceSurfaceTree(P, generated.I);
    const skin: Uint8Array = HumanReferenceSurfaceSkin.exposed(whole, P, normal);

    // The counterpart of a reference vertex is the generated outer skin: a triangle with a vertex seen from outside.
    const outer: number[] = [];
    for (let t: number = 0; t < generated.I.length / 3; t++)
      if (
        skin[generated.I[3 * t]!] === 1 ||
        skin[generated.I[3 * t + 1]!] === 1 ||
        skin[generated.I[3 * t + 2]!] === 1
      )
        outer.push(t);

    const outerIndices: Uint32Array = new Uint32Array(3 * outer.length);
    outer.forEach((t: number, k: number): void => {
      for (let j: number = 0; j < 3; j++) outerIndices[3 * k + j] = generated.I[3 * t + j]!;
    });
    const tree: HumanReferenceSurfaceTree =
      outer.length === generated.I.length / 3 ? whole : new HumanReferenceSurfaceTree(P, outerIndices);
    const border: Set<number> = HumanReferenceSurfaceMesh.borderEdges(generated.I, count);

    return { P, I: generated.I, count, normal, area, skin, outerIndices, tree, border };
  }
}
