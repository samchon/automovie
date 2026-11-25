import type {
  AutoMovieVector3Tuple,
  IAutoMovieSolidMesh,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieSolidMeshTessellate } from "./AutoMovieSolidMeshTessellate";
import { AutoMovieSolidMeshWrite } from "./AutoMovieSolidMeshWrite";
import { faceAutoMovieSolidMesh } from "./faceAutoMovieSolidMesh";

/** Indexed source surfaces with authoritative shared boundary identities. */
export namespace AutoMovieSolidMesh {
  /** Allocate an empty, detached mutable mesh. */
  export function create(): IAutoMovieSolidMesh.IMesh {
    return {
      positions: [],
      indices: [],
      coordinates: [],
      owners: [],
    };
  }

  /** Register an unchanged surface by its unique name. */
  export function owner(
    mesh: IAutoMovieSolidMesh.IMesh,
    surface: IAutoMovieSolidSurface,
  ): number {
    return AutoMovieSolidMeshWrite.owner(mesh, surface);
  }

  /** Insert one published seam and return its exact indexed rails. */
  export function seam(
    mesh: IAutoMovieSolidMesh.IMesh,
    input: IAutoMovieSolidMesh.ISeam,
  ): IAutoMovieSolidMesh.IJoined {
    return AutoMovieSolidMeshTessellate.seam(mesh, input);
  }

  /**
   * Append an admitted constrained source face and return its native domain
   * boundaries.
   */
  export function face(
    mesh: IAutoMovieSolidMesh.IMesh,
    input: IAutoMovieSolidMesh.IFace,
  ): IAutoMovieSolidMesh.IOpen[] {
    return faceAutoMovieSolidMesh(mesh, input);
  }

  /**
   * Append a caller-authored [edge,next,apex] fan from a returned positive
   * native boundary.
   */
  export function close(
    mesh: IAutoMovieSolidMesh.IMesh,
    triangles: readonly [number, number, number][],
    surface: IAutoMovieSolidSurface,
    inverted: boolean,
  ): void {
    AutoMovieSolidMeshTessellate.close(mesh, triangles, surface, inverted);
  }

  /** Return the existing arclength zipper to an explicit event ring. */
  export function bridge(
    mesh: IAutoMovieSolidMesh.IMesh,
    ring: readonly number[],
    cycle: readonly number[],
    out: Readonly<AutoMovieVector3Tuple>,
  ): [number, number, number][] {
    return AutoMovieSolidMeshTessellate.bridge(mesh, ring, cycle, out);
  }

  /** Replay a vertex using its own stored evaluating owner. */
  export function evaluate(
    mesh: IAutoMovieSolidMesh.IMesh,
    index: number,
  ): AutoMovieVector3Tuple {
    const c: number[] = mesh.coordinates.slice(3 * index, 3 * index + 3);
    return mesh.owners[c[0]!]!.point(c[1]!, c[2]!);
  }

  /** Append one admitted world-mm point and owner-chart triple. */
  export function vertex(
    mesh: IAutoMovieSolidMesh.IMesh,
    point: Readonly<AutoMovieVector3Tuple>,
    id: number,
    u: number,
    v: number,
  ): number {
    return AutoMovieSolidMeshWrite.vertex(mesh, point, id, u, v);
  }
}
