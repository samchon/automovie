import {
  AutoMovieSolidVector as Vec,
  measureAutoMovieMeshClearance,
} from "@automovie/engine";
import type {
  IAutoMovieConstructionRealization,
  IAutoMovieMesh,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";

/** Indexed nail and skin incidence, boundary and signed-depth checks. */
export namespace FamilyConicMpfbNailMesh {
  /**
   * Every cut edge must occur exactly once in each material with opposite
   * winding.
   */
  export function seamIncidence(
    indices: readonly number[],
    seam: readonly number[],
    plateFrom: number,
  ) {
    const key = (a: number, b: number): string =>
      a < b ? `${a}:${b}` : `${b}:${a}`;
    const edges = new Map(
      seam.map((a, i) => [
        key(a, seam[(i + 1) % seam.length]!),
        { skin: 0, nail: 0, winding: 0 },
      ]),
    );
    for (let i: number = 0; i < indices.length; i += 3)
      for (let k: number = 0; k < 3; ++k) {
        const a: number = indices[i + k]!,
          b: number = indices[i + ((k + 1) % 3)]!;
        const edge = edges.get(key(a, b));
        if (edge === undefined) continue;
        if (i < plateFrom) edge.skin++;
        else edge.nail++;
        edge.winding += a < b ? 1 : -1;
      }
    return {
      edges: edges.size,
      invalid: [...edges.values()].filter(
        ({ skin, nail, winding }): boolean =>
          skin !== 1 || nail !== 1 || winding !== 0,
      ).length,
    };
  }

  /** Every remaining single-use edge must belong to the unjoined root ring. */
  export function boundary(
    mesh: IAutoMovieConstructionRealization.IMesh,
    owner: number,
    station: number,
  ): number {
    const edges: Map<string, { a: number; b: number; count: number }> =
      new Map();
    for (let i: number = 0; i < mesh.indices.length; i += 3)
      for (let j: number = 0; j < 3; ++j) {
        const a: number = mesh.indices[i + j]!,
          b: number = mesh.indices[i + ((j + 1) % 3)]!;
        const key: string = a < b ? `${a}:${b}` : `${b}:${a}`;
        const prior = edges.get(key);
        if (prior === undefined) edges.set(key, { a, b, count: 1 });
        else prior.count++;
      }
    const atRoot = (i: number): boolean =>
      mesh.coordinates[3 * i] === owner &&
      mesh.coordinates[3 * i + 1] === station;
    return [...edges.values()].filter(
      ({ a, b, count }): boolean => count === 1 && !(atRoot(a) && atRoot(b)),
    ).length;
  }

  /** The indexed exterior only, projected in the nail's actual dorsal chart. */
  export function clipping(
    mesh: IAutoMovieConstructionRealization.IMesh,
    nail: number,
    skin: number,
    dorsal: P3,
  ): { maximumMm: number; measuredTriangles: number } {
    const across: P3 = Vec.unit(
      Vec.cross(
        dorsal,
        Math.abs(dorsal[0]) < Math.abs(dorsal[1]) ? [1, 0, 0] : [0, 1, 0],
      ),
    )!;
    const along: P3 = Vec.cross(dorsal, across);
    const point = (i: number): P3 => [
      mesh.positions[3 * i]!,
      mesh.positions[3 * i + 1]!,
      mesh.positions[3 * i + 2]!,
    ];
    const positions: number[] = [];
    for (let i: number = 0; i < mesh.positions.length / 3; ++i) {
      const p: P3 = point(i);
      positions.push(Vec.dot(across, p), Vec.dot(along, p), Vec.dot(dorsal, p));
    }
    const plate: number[] = [],
      digit: number[] = [];
    for (let i: number = 0; i < mesh.indices.length; i += 3) {
      const indices: number[] = mesh.indices.slice(i, i + 3);
      const [a, b, c] = indices.map(point);
      if (!(Vec.dot(dorsal, Vec.cross(Vec.sub(b!, a!), Vec.sub(c!, a!))) > 0))
        continue;
      const owners: number[] = indices.map(
        (k): number => mesh.coordinates[3 * k]!,
      );
      // Shared seam corners retain either one of the two incident owners.
      if (owners.includes(nail) && !owners.includes(skin))
        plate.push(...indices);
      if (owners.includes(skin) && !owners.includes(nail))
        digit.push(...indices);
    }
    const gaps = measureAutoMovieMeshClearance(
      topologyInput({ indices: plate, positions }),
      topologyInput({ indices: digit, positions }),
      "z",
    );
    return {
      maximumMm: gaps.reduce(
        (max, p): number => Math.max(max, -1000 * p.minimum),
        0,
      ),
      measuredTriangles: gaps.length,
    };
  }

  /** Borrow the realized coordinates and indices for engine topology checks. */
  export function topologyInput({
    positions,
    indices,
  }: Pick<
    IAutoMovieConstructionRealization.IMesh,
    "positions" | "indices"
  >): IAutoMovieMesh {
    return { positions, indices, normals: null, uvs: null, skin: null };
  }
}
