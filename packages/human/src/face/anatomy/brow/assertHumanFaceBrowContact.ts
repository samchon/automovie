import {
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
 */
export function assertHumanFaceBrowContact(
  skin: IAutoMovieMesh,
  shafts: readonly IAutoMovieMesh[],
  toleranceMetres: number,
): void {
  if (!Number.isFinite(toleranceMetres) || toleranceMetres < 0)
    throw new Error("Brow attachment needs its source contact tolerance.");
  if (shafts.length === 0) return;
  const host = { ...skin, positions: skin.positions.map(Math.fround) };
  const query = createAutoMovieSignedMeshQuery(host, { boundary: "open" });
  const combined: IAutoMovieMesh = {
    positions: [],
    indices: [],
    normals: null,
    uvs: null,
    skin: null,
  };
  const owners: number[] = [];
  for (let shaft = 0; shaft < shafts.length; shaft++) {
    const mesh = {
      ...shafts[shaft],
      positions: shafts[shaft].positions.map(Math.fround),
    };
    for (const vertex of new Set(mesh.indices ?? [])) {
      const hit = query(mesh.positions.slice(3 * vertex, 3 * vertex + 3));
      if (hit.boundary || hit.signedDistance < -toleranceMetres)
        throw new Error(
          "Brow shaft skin clearance unavailable at shaft " +
            shaft +
            " vertex " +
            vertex,
        );
    }
    const offset = combined.positions.length / 3;
    combined.positions.push(...mesh.positions);
    combined.indices!.push(...mesh.indices!.map((vertex) => vertex + offset));
    for (let triangle = 0; triangle < mesh.indices!.length / 3; triangle++)
      owners.push(shaft);
  }
  // One census indexes the host once for the complete requested population.
  const crossing = measureAutoMovieMeshCrossings(combined, host).find(
    (crossing) => !crossing.coplanar,
  );
  if (crossing !== undefined)
    throw new Error(
      "Brow shaft crosses its actual host skin: " + owners[crossing.triangle],
    );
}
