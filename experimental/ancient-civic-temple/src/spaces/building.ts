/**
 * Shared plan inputs for the temple. All values are in m; +X is east and +Z is front.
 * Implements the sole dimension basis in docs/spaces/building.md#plan-datums.
 * Rooms, walls and roofs consume these values; this owner generates no surfaces or members.
 * A datum change requires every dependent space and junction to be checked again.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { templeLevels } from "./storey";

/**
 * @evidence spaces/building.md One value object holds the envelope and datum X/Z coordinates in m, so rooms, walls, roofs and observations consume the same dimension basis.
 * @evidence spaces/building.md#plan-datums Transfers every datum from west/east-outer ±10.5 to south-outer 10.25 with the table's names and values.
 * @evidence spaces/building.md#footprint The four outer values define the 21×20.5m envelope; interior dimensions come only from differences between inner, room, ring and court datums.
 * @evidence principles/core/source-units.md#source-scope-preservation Holds only datum values, makes no surfaces, members or spaces, and adds no datum absent from the design.
 * @evidence principles/core/source-units.md#source-substantive-completion An as const value object gives all consumers the same numbers at compile time and includes the 0.001m tolerance.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Transfers the building.md datum table and 21×20.5m envelope unchanged; the actual wall, roof and collision scan produced 0 overlaps from these values.
 */
export const templePlan = {
  westOuter: -10.5, eastOuter: 10.5,
  westInner: -9.9, eastInner: 9.9,
  westRoom: -5.9, eastRoom: 5.9,
  westRing: -5.6, eastRing: 5.6,
  westCourt: -3.5, eastCourt: 3.5,
  westPorch: -1.8, eastPorch: 1.8,
  westPorchInner: -1.65, eastPorchInner: 1.65,
  westPorchOuter: -1.95, eastPorchOuter: 1.95,
  northOuter: -10.25, northInner: -9.65,
  sanctuaryFront: -4.15, northRing: -3.85,
  yardFront: -2.45, storageBack: -2.15,
  courtBack: -1.75, storageFront: 1.55,
  recordsBack: 1.85, recordsFront: 5.6,
  officeBack: 5.9, courtFront: 6.1,
  entranceBack: 8.05, entranceFront: 8.35,
  southInner: 9.65, southOuter: 10.25,
  tolerance: 0.001,
} as const;

/**
 * Assembles the building → one storey → nine spaces of docs/spaces/building.md#containment.
 * Preserves the caller's actual cell records and refuses missing, duplicate or foreign spaces.
 * Returns the topology's space population, without proving physical elements or access.
 * @evidence spaces/building.md Assembles the building → ground storey → nine spaces population.
 * @evidence spaces/building.md#containment Requires each of the nine space IDs exactly once, parented to the ground storey and represented only by cells; refuses missing, duplicate and foreign spaces.
 * @evidence principles/core/source-units.md#source-scope-preservation Preserves the caller's cell records and prepends only the building and storey records.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns the admitted space array; errors identify the space for wrong storey ownership, mixed shell representation, empty cells or omissions.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implements the one building, one storey and nine-room list of building.md#containment unchanged; no parent space count or storey arrangement needed revision.
 */
export const templeSpaceHierarchy = (
  rooms: readonly IAutoMovieBuiltSpace[],
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
