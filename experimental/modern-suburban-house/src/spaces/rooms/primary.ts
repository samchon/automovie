/**
 * `primary-bedroom`: the upper-storey rear-left bedroom.
 *
 * Design owner: `docs/spaces/rooms/primary.md#primary-plan`. Finished inner
 * area is the back body X = [-5.50, 0.75], Z = [-10.45, -6.06] m joined with the
 * left part X = [-5.50, -3.35], Z = [-6.06, -4.71] m. 07 assigns this owner its
 * partitions to bedroom-two (Z = [-4.71, -4.56]) and to the upper hall
 * (X = [-3.35, -3.20] and Z = [-6.06, -5.91], the latter carrying
 * `hall-primary-door` X = [-2.70, -1.70], Y = [3.06, 5.26] m).
 */
import { PALETTE } from "../palette";
import { type IRoomBuild, type IRoomSpace, door, partition, doorFloor, roomCeiling, roomFloor } from "./shared";

const PRIMARY: IRoomSpace = {
  id: "primary-bedroom",
  owner: "rooms/primary.ts",
  storey: "upper-storey",
  outline: [
    { x: -5.5, z: -4.71 },
    { x: -3.35, z: -4.71 },
    { x: -3.35, z: -6.06 },
    { x: 0.75, z: -6.06 },
    { x: 0.75, z: -10.45 },
    { x: -5.5, z: -10.45 },
  ],
  floor: PALETTE.carpet,
  // primary.md#primary-furniture-use; heights are above the upper floor (+3.06).
  reservations: [
    { id: "primary-bedroom-bed", kind: "furniture", x: [-1.5, 0.65], z: [-8.65, -7.05], y: [3.06, 4.06] },
    { id: "primary-bedroom-rear-nightstand", kind: "furniture", x: [0.15, 0.65], z: [-9.15, -8.65], y: [3.06, 4.16] },
    { id: "primary-bedroom-front-nightstand", kind: "furniture", x: [0.15, 0.65], z: [-7.05, -6.55], y: [3.06, 4.16] },
    // X from the left inner face (-5.50) to -5.00.
    { id: "primary-bedroom-dresser", kind: "furniture", x: [-5.5, -5.0], z: [-6.5, -5.1], y: [3.06, 3.86] },
    // Drawers pull +X at most 0.40 from the dresser front -5.00.
    { id: "primary-bedroom-dresser-drawers", kind: "swing", x: [-5.0, -4.6], z: [-6.5, -5.1] },
    { id: "primary-bedroom-dresser-use", kind: "use", x: [-4.6, -4.0], z: [-6.5, -5.1] },
    { id: "primary-bedroom-wardrobe-door-swing", kind: "swing", x: [-0.25, 0.75], z: [-10.2, -9.2] },
    { id: "primary-bedroom-wardrobe-door-wait", kind: "use", x: [-0.55, 0.75], z: [-10.2, -9.2] },
  ],
};

/** Emit the primary bedroom floor and its three partition runs. */
export const buildPrimary = (): IRoomBuild => ({
  space: PRIMARY,
  parts: [
    roomFloor(PRIMARY),
    roomCeiling(PRIMARY),
    doorFloor(PRIMARY, "hall-primary-door", [-2.7, -1.7], [-6.06, -5.985]),
    doorFloor(PRIMARY, "primary-wardrobe-door", [0.75, 0.825], [-10.2, -9.2]),
    partition({ id: "primary-bedroom-two-partition", owner: PRIMARY.owner, storey: "upper-storey", axis: "x", across: [-4.71, -4.56], along: [-5.5, -3.35] }),
    partition({ id: "primary-hall-side-partition", owner: PRIMARY.owner, storey: "upper-storey", axis: "z", across: [-3.35, -3.2], along: [-5.91, -4.71] }),
    partition({
      id: "primary-hall-partition",
      owner: PRIMARY.owner,
      storey: "upper-storey",
      axis: "x",
      across: [-6.06, -5.91],
      along: [-3.35, 0.9],
      holes: [door("hall-primary-door", "upper-storey", -2.7, -1.7)],
    }),
  ],
});
