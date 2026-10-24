import { AutoMovieHumanSkinVector as V } from "./AutoMovieHumanSkinVector";

/** Physical walls and underside of a nail plate, attached to its generated skin bed. */
export namespace AutoMovieHumanNailClosure {
  /**
   * Close a top grid against the exact ray intersections that located it.
   * The top keeps its thickness. Side walls span to the skin rather than
   * hiding a clearance with alpha; the reversed bed closes the volume.
   */
  export function append(
    mesh: {
      positions: number[];
      normals: number[];
      uvs: number[];
      indices: number[];
    },
    bed: readonly number[],
    along: number,
    around: number,
  ): void {
    const count: number = along * around;
    const base: number = mesh.positions.length / 3;
    mesh.positions.push(...bed);
    for (let i: number = 0; i < count; i++) {
      mesh.normals.push(
        -mesh.normals[3 * i]!,
        -mesh.normals[3 * i + 1]!,
        -mesh.normals[3 * i + 2]!,
      );
      mesh.uvs.push(mesh.uvs[2 * i]!, mesh.uvs[2 * i + 1]!);
    }
    const top: number[] = [...mesh.indices];
    for (let t: number = 0; t < top.length; t += 3)
      mesh.indices.push(base + top[t]!, base + top[t + 2]!, base + top[t + 1]!);

    // Counter-clockwise boundary of the top grid follows the material
    // cuticle arc, lateral folds and free edge, including all four corners.
    const boundary: number[] = [];
    for (let j: number = 0; j < around; j++) boundary.push(j);
    for (let i: number = 1; i < along; i++)
      boundary.push(i * around + around - 1);
    for (let j: number = around - 2; j >= 0; j--)
      boundary.push((along - 1) * around + j);
    for (let i: number = along - 2; i > 0; i--) boundary.push(i * around);
    for (let i: number = 0; i < boundary.length; i++) {
      const a: number = boundary[i]!,
        b: number = boundary[(i + 1) % boundary.length]!;
      const upper: V.Vec3 = V.at(mesh.positions, a),
        next: V.Vec3 = V.at(mesh.positions, b);
      const lower: V.Vec3 = V.at(mesh.positions, base + a);
      const lowerNext: V.Vec3 = V.at(mesh.positions, base + b);
      // Seated proximal/lateral edges already coincide with their bed.
      // A zero-area side quad would add no volume and corrupt its normals.
      const first: boolean = V.norm(V.sub(lower, upper)) >= 1e-10;
      const second: boolean = V.norm(V.sub(lowerNext, next)) >= 1e-10;
      if (!first && !second) continue;
      const normal: V.Vec3 = V.normalize(
        V.cross(
          first ? V.sub(lower, upper) : V.sub(lowerNext, next),
          V.sub(next, upper),
        ),
      );
      const start: number = mesh.positions.length / 3;
      for (const v of [a, base + a, b, base + b]) {
        mesh.positions.push(...V.at(mesh.positions, v));
        mesh.normals.push(...normal);
        mesh.uvs.push(mesh.uvs[2 * v]!, mesh.uvs[2 * v + 1]!);
      }
      if (first) mesh.indices.push(start, start + 1, start + 2);
      if (second) mesh.indices.push(start + 2, start + 1, start + 3);
    }
  }
}
