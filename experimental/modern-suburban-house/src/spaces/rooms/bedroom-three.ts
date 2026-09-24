/**
 * `bedroom-three`: the upper-storey front-right child bedroom (blue-grey bedding).
 *
 * Design owner: `docs/spaces/rooms/bedroom-three.md#bedroom-three-plan`.
 * Finished inner outline (X, Z): (-0.50, -0.25), (5.50, -0.25), (5.50, -4.56),
 * (3.22, -4.56), (3.22, -2.51), (1.72, -2.51), (1.72, -3.26), (-0.50, -3.26).
 * 07 assigns this owner the door run of its partition to the arrival,
 * X = [3.07, 3.22], Z = [-4.56, -3.41], carrying `hall-bedroom-three-door`
 * Z = [-4.46, -3.51], Y = [3.06, 5.26] m.
 */
import { PALETTE } from "../palette";
import { type IRoomBuild, type IRoomSpace, door, partition, roomFloor } from "./shared";

const BEDROOM_THREE: IRoomSpace = {
  id: "bedroom-three",
  owner: "rooms/bedroom-three.ts",
  storey: "upper-storey",
  outline: [
    { x: -0.5, z: -0.25 },
    { x: 5.5, z: -0.25 },
    { x: 5.5, z: -4.56 },
    { x: 3.22, z: -4.56 },
    { x: 3.22, z: -2.51 },
    { x: 1.72, z: -2.51 },
    { x: 1.72, z: -3.26 },
    { x: -0.5, z: -3.26 },
  ],
  floor: PALETTE.carpet,
};

/** Emit the bedroom floor and its door partition to the arrival. */
export const buildBedroomThree = (): IRoomBuild => ({
  space: BEDROOM_THREE,
  parts: [
    roomFloor(BEDROOM_THREE),
    partition({
      id: "bedroom-three-arrival-partition",
      owner: BEDROOM_THREE.owner,
      storey: "upper-storey",
      axis: "z",
      across: [3.07, 3.22],
      along: [-4.56, -3.41],
      holes: [door("hall-bedroom-three-door", "upper-storey", -4.46, -3.51)],
    }),
  ],
});
