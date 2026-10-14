import {
  type IAutoMovieMeshCrossing,
  type IAutoMovieSignedMeshQueryHit,
  createAutoMovieSignedMeshQuery,
  measureAutoMovieMeshCrossings,
} from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Admit actual brow shafts against the same live skin used to place them.
 * The height-field generator's tangent-plane lift is not a curved-surface
 * clearance proof. Output-precision signed samples and triangle crossings
 * therefore judge the produced tubes/ribbons before model publication. This
 * admits contact on the skin boundary within the existing source tolerance;
 * no source depth, profile or tolerance is modified to make a shaft fit.
 * Inter-shaft interaction and follicle histology remain distinct acquisitions.
 *
 * @evidence contracts/common.md#principled-implementation Locally Float32-published shaft vertices and noncoplanar triangles are tested against the same open host skin with the existing source tolerance.
 * @evidence contracts/common.md#clear-and-simple-design One signed host query serves the shaft population, followed by one combined-mesh crossing census and shaft-ordinal ownership lookup.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Open-rim queries and excessive inward distance refuse; tolerance/profile/source geometry are never enlarged to manufacture contact acceptance.
 * @evidence contracts/common.md#meaningful-documentation The prose separates actual produced contact from tangent-plane lift and leaves inter-shaft interaction and follicle acquisition unresolved.
 * @evidence contracts/performance.md#efficient-algorithms Each distinct indexed shaft vertex is queried once per shaft; combined triangle census uses the shared crossing instrument, whose spatial candidate work depends on both actual meshes.
 * @evidence contracts/performance.md#reuse-equivalent-work Host query acceleration is built once and all shaft triangles share one host crossing census rather than rebuilding the host for each shaft.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Float32 copies, combined positions/indices and triangle-to-shaft owners grow with supplied geometry and are call-local; success or refusal retains no mesh/query handle.
 */
export function assertHumanFaceBrowContact(
  skin: IAutoMovieMesh,
  shafts: readonly IAutoMovieMesh[],
  toleranceMetres: number,
): void {
  if (!Number.isFinite(toleranceMetres) || toleranceMetres < 0)
    throw new Error("Brow attachment needs its source contact tolerance.");
  if (shafts.length === 0) return;
  const host: IAutoMovieMesh = {
    ...skin,
    positions: skin.positions.map(Math.fround),
  };
  const query: (point: readonly number[]) => IAutoMovieSignedMeshQueryHit =
    createAutoMovieSignedMeshQuery(host, { boundary: "open" });
  const combined: IAutoMovieMesh = {
    positions: [],
    indices: [],
    normals: null,
    uvs: null,
    skin: null,
  };
  const owners: number[] = [];
  for (let shaft: number = 0; shaft < shafts.length; shaft++) {
    const mesh: IAutoMovieMesh = {
      ...shafts[shaft],
      positions: shafts[shaft].positions.map(Math.fround),
    };
    for (const vertex of new Set(mesh.indices ?? [])) {
      const hit: IAutoMovieSignedMeshQueryHit = query(
        mesh.positions.slice(3 * vertex, 3 * vertex + 3),
      );
      if (hit.boundary || hit.signedDistance < -toleranceMetres)
        throw new Error(
          "Brow shaft skin clearance unavailable at shaft " +
            shaft +
            " vertex " +
            vertex,
        );
    }
    const offset: number = combined.positions.length / 3;
    combined.positions.push(...mesh.positions);
    combined.indices!.push(
      ...mesh.indices!.map((vertex: number): number => vertex + offset),
    );
    for (
      let triangle: number = 0;
      triangle < mesh.indices!.length / 3;
      triangle++
    )
      owners.push(shaft);
  }
  // One census indexes the host once for the complete requested population.
  const crossing: IAutoMovieMeshCrossing | undefined =
    measureAutoMovieMeshCrossings(combined, host).find(
      (crossing: IAutoMovieMeshCrossing): boolean => !crossing.coplanar,
    );
  if (crossing !== undefined)
    throw new Error(
      "Brow shaft crosses its actual host skin: " + owners[crossing.triangle],
    );
}
