/**
 * `bedroom-two`: the upper-storey front-left child bedroom (olive bedding).
 *
 * Design owner: `docs/spaces/rooms/bedroom-two.md#bedroom-two-plan`. Finished
 * inner X = [-5.50, -1.95], Z = [-4.56, -0.25] m. 07 assigns this owner its
 * partition to the upper hall, Z = [-4.71, -4.56], carrying
 * `hall-bedroom-two-door` X = [-3.10, -2.10], Y = [3.06, 5.26] m; the run is
 * stopped at X = -1.95: the corner X = [-1.95, -1.80] is the stair owner's
 * junction (07 interior-boundary-junctions).
 */
import { PALETTE } from "../palette";
import { type IRoomBuild, type IRoomSpace, box, door, partition, doorFloor, roomCeiling, roomFloor } from "./shared";

const BEDROOM_TWO: IRoomSpace = {
  id: "bedroom-two",
  owner: "rooms/bedroom-two.ts",
  storey: "upper-storey",
  outline: box([-5.5, -1.95], [-4.56, -0.25]),
  floor: PALETTE.carpet,
  // bedroom-two.md#bedroom-two-furniture-use; heights above the upper floor (+3.06).
  reservations: [
    { id: "bedroom-two-bed", kind: "furniture", x: [-5.25, -4.1], z: [-4.5, -2.35], y: [3.06, 4.01] },
    { id: "bedroom-two-nightstand", kind: "furniture", x: [-3.95, -3.5], z: [-4.5, -4.05], y: [3.06, 4.11] },
    // X from the left inner face (-5.50) to -4.90.
    { id: "bedroom-two-desk", kind: "furniture", x: [-5.5, -4.9], z: [-1.6, -0.4], y: [3.06, 3.81] },
    // X from -2.55 to the right inner face (-1.95).
    { id: "bedroom-two-closet", kind: "storage", x: [-2.55, -1.95], z: [-2.95, -1.45], y: [3.06, 5.26] },
    { id: "bedroom-two-desk-chair-use", kind: "use", x: [-4.9, -4.15], z: [-1.45, -0.7] },
    { id: "bedroom-two-closet-use", kind: "use", x: [-3.15, -2.55], z: [-2.95, -1.45] },
  ],
};

/** Emit the bedroom floor and its partition to the hall. */
/**
 * @evidence spaces/rooms/bedroom-two.md This builder owns the olive-bedroom shell and hall-facing door partition.
 * @evidence spaces/rooms/bedroom-two.md#bedroom-two-plan Its room box and door-cut hall run stop before the stair-owned corner.
 * @evidence spaces/rooms/bedroom-two.md#bedroom-two-furniture-use Bed, nightstand, desk, closet, and their use boxes are reserved inside the room.
 * @evidence principles/core/source-units.md#source-scope-preservation It emits finish and wall geometry only; bed, desk, and closet remain later model fills.
 * @evidence principles/core/source-units.md#source-substantive-completion The return provides carpet floor, ceiling, under-door finish, and a partition with the named door void.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The bedroom-two parent fixes hall door and furniture/closet ranges; implementation added no room edge.
 */
export const buildBedroomTwo = (): IRoomBuild => ({
  space: BEDROOM_TWO,
  parts: [
    roomFloor(BEDROOM_TWO),
    roomCeiling(BEDROOM_TWO),
    doorFloor(BEDROOM_TWO, "hall-bedroom-two-door", [-3.1, -2.1], [-4.635, -4.56]),
    partition({
      id: "bedroom-two-hall-partition",
      owner: BEDROOM_TWO.owner,
      storey: "upper-storey",
      axis: "x",
      across: [-4.71, -4.56],
      along: [-3.35, -1.95],
      holes: [door("hall-bedroom-two-door", "upper-storey", -3.1, -2.1)],
    }),
  ],
});
