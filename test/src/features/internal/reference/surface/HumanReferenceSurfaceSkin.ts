import { HumanReferenceSurfaceMesh } from "./HumanReferenceSurfaceMesh";
import { HumanReferenceSurfaceTree } from "./HumanReferenceSurfaceTree";

/**
 * Which vertices of a mesh are its skin: the surface seen from outside, as
 * against cavities and pockets that only the body itself sees.
 */
export namespace HumanReferenceSurfaceSkin {
  /**
   * Which vertices lie on the outer skin of a mesh: some ray from them, along
   * the normal or tilted 35, 65 or 85 degrees from it at eight azimuths,
   * leaves the mesh without meeting it again. A closed mouth's cavity and the
   * sockets behind the eyelids see only the body; a fold, an armpit or the
   * skin between the fingers still sees out along some ray. A vertex no
   * triangle uses has no normal and is no skin.
   *
   * @param tree Hierarchy over the mesh's triangles.
   * @param P Flat vertex positions, mm.
   * @param N Flat outward unit vertex normals.
   * @returns 1 for a skin vertex and 0 for any other, per vertex.
   */
  export function exposed(tree: HumanReferenceSurfaceTree, P: Float64Array, N: Float64Array): Uint8Array {
    const n: number = P.length / 3;
    const out: Uint8Array = new Uint8Array(n);
    const directions: number[][] = [[0, 0]];
    for (const tilt of [35, 65, 85])
      for (let k: number = 0; k < 8; k++) directions.push([(tilt * Math.PI) / 180, (k * Math.PI) / 4]);

    for (let v: number = 0; v < n; v++) {
      const nx: number = N[3 * v]!;
      const ny: number = N[3 * v + 1]!;
      const nz: number = N[3 * v + 2]!;
      if (nx === 0 && ny === 0 && nz === 0) continue;

      // A unit tangent, and its cross with the normal, span the tangent plane the rays tilt through.
      const axis: number[] = Math.abs(nx) < 0.9 ? [1, 0, 0] : [0, 1, 0];
      const ax: number = axis[0]!;
      const ay: number = axis[1]!;
      const az: number = axis[2]!;
      let ux: number = ay * nz - az * ny;
      let uy: number = az * nx - ax * nz;
      let uz: number = ax * ny - ay * nx;
      const l: number = Math.hypot(ux, uy, uz);
      ux /= l;
      uy /= l;
      uz /= l;

      const wx: number = ny * uz - nz * uy;
      const wy: number = nz * ux - nx * uz;
      const wz: number = nx * uy - ny * ux;

      // Start a hair above the surface, so a ray does not hit the triangles it leaves.
      const ox: number = P[3 * v]! + 1e-3 * nx;
      const oy: number = P[3 * v + 1]! + 1e-3 * ny;
      const oz: number = P[3 * v + 2]! + 1e-3 * nz;
      for (const direction of directions) {
        const tilt: number = direction[0]!;
        const turn: number = direction[1]!;
        const c: number = Math.cos(tilt);
        const s: number = Math.sin(tilt);
        const dx: number = c * nx + s * (Math.cos(turn) * ux + Math.sin(turn) * wx);
        const dy: number = c * ny + s * (Math.cos(turn) * uy + Math.sin(turn) * wy);
        const dz: number = c * nz + s * (Math.cos(turn) * uz + Math.sin(turn) * wz);
        if (tree.escapes(ox, oy, oz, dx, dy, dz)) {
          out[v] = 1;
          break;
        }
      }
    }

    return out;
  }

  /**
   * Which vertices of a mesh lie on its outer skin, as `compare` reads both
   * the reference and the generated skin.
   *
   * @param P Flat vertex positions, mm.
   * @param I Flat triangle vertex indices.
   * @returns 1 for a skin vertex and 0 for any other, per vertex.
   */
  export function outer(P: Float64Array, I: Uint32Array): Uint8Array {
    return exposed(new HumanReferenceSurfaceTree(P, I), P, HumanReferenceSurfaceMesh.vertexNormals(P, I));
  }
}
