/** Exterior mesh of an authored assembly of axis-aligned rectangular solids. */
import { inspectAutoMovieMeshTopology } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";
import { ObjectMesh } from "../geometry/object-mesh";
import { modelFace, modelMesh } from "../geometry/model-source-shapes";

type Point = IAutoMovieVector3;
interface RectilinearSolid {
  min: Point;
  max: Point;
  grain?: Point;
}

const p = (x: number, y: number, z: number): Point => ({ x, y, z });
const distinct = (values: number[]): number[] => [...new Set(values)].sort(
  (a, b) => a - b,
);

/**
 * Omit coincident internal faces and use one grid for every exterior junction.
 * @evidence models/openings.md The stone and wood rectangular assemblies retain their reviewed apertures and surface identities while shared contact faces become one continuous exterior.
 * @evidence principles/core/source-units.md#source-scope-preservation This shared mesh operation constructs only the axis-aligned solids supplied by a model owner, preserving the opening and tile builders' authored extents.
 * @evidence principles/core/source-units.md#source-substantive-completion It emits indexed exterior faces and refuses an empty, flat, or edge-only assembly rather than returning a shape record.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The operation receives all solid bounds from its callers and makes no new opening, column, or tile dimensions.
 */
export class TempleRectilinearUnion {
  /**
   * Merge face-contacting boxes, retaining one face grid at every junction.
   * @evidence models/openings.md Stone and wood openings call this method with their reviewed box bounds, leaving the door and window voids unfilled.
   * @evidence principles/core/source-units.md#source-scope-preservation The operation has no model id, placement, or material input; only its caller's part and rectangular bounds determine the mesh.
   * @evidence principles/core/source-units.md#source-substantive-completion Occupied grid cells contribute only exposed faces and the returned mesh passes the engine topology inspection.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work This grid construction selects no silhouette or surface partition; the opening and tile callers supply those decisions.
   */
  static mesh(part: string, solids: readonly RectilinearSolid[]): IAutoMovieMesh {
    if (solids.length === 0) throw new Error(
      `${part}: at least one solid required`,
    );
    for (const solid of solids) if (!(solid.max.x > solid.min.x &&
    solid.max.y > solid.min.y && solid.max.z > solid.min.z))
    throw new Error(`${part}: positive solid extents required`);
    const xs = distinct(solids.flatMap((s) => [s.min.x, s.max.x]));
    const ys = distinct(solids.flatMap((s) => [s.min.y, s.max.y]));
    const zs = distinct(solids.flatMap((s) => [s.min.z, s.max.z]));
    const nx = xs.length - 1, ny = ys.length - 1, nz = zs.length - 1;
    const cells = new Int32Array(nx * ny * nz).fill(-1);
    const index = (i: number, j: number, k: number): number => (i * ny + j) * nz + k;
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++)
    for (let k = 0; k < nz; k++) {
      const x = (xs[i]! + xs[i+1]!) / 2;
      const y = (ys[j]! + ys[j+1]!) / 2;
      const z = (zs[k]! + zs[k+1]!) / 2;
      cells[index(i,j,k)] = solids.findIndex((s) =>
        x >= s.min.x && x <= s.max.x && y >= s.min.y && y <= s.max.y &&
        z >= s.min.z && z <= s.max.z);
    }
    const filled = (i: number, j: number, k: number): boolean =>
    i >= 0 && j >= 0 && k >= 0 && i < nx && j < ny && k < nz && cells[index(i,j,k)]! >= 0;
    const builder = new ObjectMesh();
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++)
    for (let k = 0; k < nz; k++) {
      const owner = cells[index(i,j,k)]!;
      if (owner < 0) continue;
      const a = xs[i]!, b = xs[i+1]!, c = ys[j]!, d = ys[j+1]!,
        e = zs[k]!, f = zs[k+1]!;
      const solid = solids[owner]!;
      const grain = solid.grain === undefined
        ? undefined
        : {
            origin: solid.min,
            direction: solid.grain,
          };
      if (!filled(i, j-1, k)) modelFace(
        builder,
        part,
        [p(a, c, e), p(b, c, e), p(b, c, f), p(a, c, f)],
        grain,
      );
      if (!filled(i, j+1, k)) modelFace(
        builder,
        part,
        [p(a, d, f), p(b, d, f), p(b, d, e), p(a, d, e)],
        grain,
      );
      if (!filled(i, j, k+1)) modelFace(
        builder,
        part,
        [p(a, c, f), p(b, c, f), p(b, d, f), p(a, d, f)],
        grain,
      );
      if (!filled(i, j, k-1)) modelFace(
        builder,
        part,
        [p(b, c, e), p(a, c, e), p(a, d, e), p(b, d, e)],
        grain,
      );
      if (!filled(i-1, j, k)) modelFace(
        builder,
        part,
        [p(a, c, e), p(a, c, f), p(a, d, f), p(a, d, e)],
        grain,
      );
      if (!filled(i+1, j, k)) modelFace(
        builder,
        part,
        [p(b, c, f), p(b, c, e), p(b, d, e), p(b, d, f)],
        grain,
      );
    }
    const mesh = modelMesh(builder,part);
    const topology = inspectAutoMovieMeshTopology(mesh);
    if (!topology.watertight || topology.degenerate > 0 || !(topology.volume > 0))
    throw new Error(`${part}: rectangular union is not a closed solid`);
    return mesh;
  }
}
