import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import { createHumanSourceCrownTopology } from "./createHumanSourceCrownTopology.ts";
import type { IHumanSourceCrownSolid } from "./structures/IHumanSourceCrownSolid.ts";
import type { IHumanSourceCrownTopology } from "./structures/IHumanSourceCrownTopology.ts";

/**
 * Close every registered crown into a solid over the given dental positions.
 *
 * A crown is its registered component of the dental surface plus the
 * collider closure triangles that lie on it, the surface the contact
 * consumers treat as the crown solid. Positions are passed separately from
 * the basis so a caller can ask about a displaced dentition without editing
 * the basis. The signed distance follows Baerentzen and Aanaes 2005 through
 * the engine's signed mesh query. A problem may supply its immutable topology;
 * every signed query is still rebuilt from the actual candidate coordinates.
 */
export function createHumanSourceCrownSolids(
  face: IAutoMovieHumanFaceBasis,
  positions: readonly number[],
  topology: readonly IHumanSourceCrownTopology[] = createHumanSourceCrownTopology(
    face,
  ),
): IHumanSourceCrownSolid[] {
  return topology.map((crown): IHumanSourceCrownSolid => {
    const mesh = {
      positions: [...positions],
      indices: [...crown.indices],
      normals: null,
      uvs: null,
      skin: null,
    };
    const query = createAutoMovieSignedMeshQuery(mesh, { boundary: "closed" });
    return {
      id: crown.id,
      mandibular: crown.mandibular,
      vertices: [...crown.vertices],
      edges: crown.edges,
      mesh,
      query,
      signedDistance: (point) => {
        const hit = query(point);
        if (hit.boundary)
          throw new Error(
            `Closed source crown ${crown.id} unexpectedly has an undefined side.`,
          );
        return hit.signedDistance;
      },
    };
  });
}
