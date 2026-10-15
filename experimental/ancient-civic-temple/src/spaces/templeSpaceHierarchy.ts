import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { templeLevels } from "./templeLevels";

/**
 * Assembles the building → one storey → nine spaces
 * Preserves the caller's actual cell records and refuses missing, duplicate or foreign spaces.
 * Returns the topology's space population, without proving physical elements or access.
 */

export const templeSpaceHierarchy = (
  rooms: readonly IAutoMovieBuiltSpace[]
): IAutoMovieBuiltSpace[] => {
  const expected = new Set([
    "entrance", "courtyard", "colonnade", "sanctuary", "offering",
    "administration", "records", "storage", "service-yard",
  ]);
  for (const room of rooms) {
    if (!expected.delete(room.id) || room.parent !== templeLevels.storey ||
      room.cells.length === 0 || room.shell !== undefined) {
      throw new Error(`temple/containment: ${room.id} differs from the design in ID, storey ownership or cell representation.`);
    }
  }
  if (expected.size > 0) {
    throw new Error(`temple/containment: missing spaces ${[...expected].join(", ")}`);
  }
  return [
    { id: templeLevels.building, kind: "building", parent: null, cells: [] },
    { id: templeLevels.storey, kind: "storey", parent: templeLevels.building, cells: [] },
    ...rooms,
  ];
};
