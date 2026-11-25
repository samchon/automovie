import type {
  AutoMovieVector3Tuple,
  IAutoMovieSolidMesh,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieSolidVector } from "./AutoMovieSolidVector";

/** Existing vector arithmetic, with its original evaluation order. */
const { cross, dot, norm, sub }: typeof AutoMovieSolidVector =
  AutoMovieSolidVector;

/**
 * Final mesh buffer writes and analytic orientation readings.
 */
export namespace AutoMovieSolidMeshWrite {
  /**
   * Register the first surface with this unique name, retaining its evaluator.
   */
  export function owner(
    mesh: IAutoMovieSolidMesh.IMesh,
    surface: IAutoMovieSolidSurface,
  ): number {
    const known: number = mesh.owners.findIndex(
      (o: IAutoMovieSolidMesh.IOwner): boolean => o.name === surface.name,
    );
    if (known >= 0) return known;
    mesh.owners.push({
      name: surface.name,
      point: (a: number, b: number): AutoMovieVector3Tuple => {
        const read: IAutoMovieSolidSurface["point"] = surface.point;
        return read === undefined
          ? surface.jet(a, b).p
          : read.call(surface, a, b);
      },
    });
    return mesh.owners.length - 1;
  }

  /**
   * Append one already evaluated point and its declared owner coordinates.
   */
  export function vertex(
    mesh: IAutoMovieSolidMesh.IMesh,
    p: Readonly<AutoMovieVector3Tuple>,
    owner: number,
    a: number,
    b: number,
    normal?: Readonly<AutoMovieVector3Tuple>,
  ): number {
    mesh.positions.push(p[0], p[1], p[2]);
    mesh.coordinates.push(owner, a, b);
    mesh.normals?.push(normal?.[0] ?? NaN, normal?.[1] ?? NaN, normal?.[2] ?? NaN);
    return mesh.positions.length / 3 - 1;
  }

  /**
   * Append a consistently oriented population with one declared turning decision.
   */
  export function emit(
    mesh: IAutoMovieSolidMesh.IMesh,
    triangles: readonly [number, number, number][],
    sign: number | ((t: number) => AutoMovieVector3Tuple),
    known: boolean = false,
  ): void {
    let flip: boolean;
    if (known || typeof sign === "number") flip = (sign as number) < 0;
    else {
      let best: number = -1;
      let size: number = 0;
      triangles.forEach(
        (triangle: readonly [number, number, number], index: number): void => {
          const n: number = norm(normal(mesh, triangle));
          if (n > size) {
            size = n;
            best = index;
          }
        },
      );
      flip = best >= 0 && dot(normal(mesh, triangles[best]!), sign(best)) < 0;
    }
    for (const triangle of triangles) {
      const [a, b, c]: [number, number, number] = triangle;
      mesh.indices.push(...(flip ? [a, c, b] : [a, b, c]));
    }
  }

  /**
   * Read one unnormalised chord-triangle normal from positions only.
   */
  export function normal(
    mesh: Pick<IAutoMovieSolidMesh.IMesh, "positions">,
    triangle: readonly [number, number, number],
  ): AutoMovieVector3Tuple {
    const point: (index: number) => AutoMovieVector3Tuple = (
      index: number,
    ): AutoMovieVector3Tuple => [
      mesh.positions[3 * index]!,
      mesh.positions[3 * index + 1]!,
      mesh.positions[3 * index + 2]!,
    ];
    return cross(
      sub(point(triangle[1]), point(triangle[0])),
      sub(point(triangle[2]), point(triangle[0])),
    );
  }

  /**
   * Sum unit outward normals at corners already expressed on this same face.
   */
  export function facing(
    mesh: IAutoMovieSolidMesh.IMesh,
    surface: IAutoMovieSolidSurface,
    triangle: readonly [number, number, number],
  ): AutoMovieVector3Tuple {
    const result: AutoMovieVector3Tuple = [0, 0, 0];
    for (const vertex of triangle) {
      const out: AutoMovieVector3Tuple = outward(
        surface,
        mesh.coordinates[3 * vertex + 1]!,
        mesh.coordinates[3 * vertex + 2]!,
      );
      const length: number = norm(out);
      if (length > 0)
        for (let k: number = 0; k < 3; k++)
          result[k] = result[k]! + out[k]! / length;
    }
    return result;
  }

  /**
   * Read the surface's declared outward analytic normal at its own chart point.
   */
  export function outward(
    surface: IAutoMovieSolidSurface,
    u: number,
    v: number,
  ): AutoMovieVector3Tuple {
    const jet: IAutoMovieSolidSurface.IJet = surface.jet(u, v);
    const value: AutoMovieVector3Tuple = cross(jet.u, jet.v);
    return [
      value[0] * surface.orientation,
      value[1] * surface.orientation,
      value[2] * surface.orientation,
    ];
  }
}
