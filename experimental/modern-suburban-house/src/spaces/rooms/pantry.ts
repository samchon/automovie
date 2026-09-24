/**
 * `pantry`: the store room at the back of the service band.
 *
 * Design owner: `docs/spaces/rooms/pantry.md#pantry-plan`. Finished inner
 * X = [3.22, 5.50], Z = [-6.05, -4.70] m. 07 assigns this owner its partition
 * to service-access (X = [3.07, 3.22]) carrying `service-pantry-door`
 * Z = [-5.75, -4.80], Y = [0, 2.20] m. Shelves are later models.
 */
import { PALETTE } from "../palette";
import { type IRoomBuild, type IRoomSpace, box, door, partition, doorFloor, roomCeiling, roomFloor } from "./shared";

const PANTRY: IRoomSpace = {
  id: "pantry",
  owner: "rooms/pantry.ts",
  storey: "ground-storey",
  outline: box([3.22, 5.5], [-6.05, -4.7]),
  floor: PALETTE.woodFloor,
  reservations: [
    // pantry-plan L-shelf: back band 0.25 m deep from Z = -6.05, right band 0.30 m deep from X = 5.50.
    // pantry-storage-use: one L-shaped shelf; the right band starts at the back band's front
    // so the corner is owned once. Five tops from 0.20 m at 0.40 m (top 1.80) plus the
    // 0.30 m item limit give the body height 2.10 m.
    { id: "pantry-back-shelf", kind: "storage", x: [3.22, 5.5], z: [-6.05, -5.8], y: [0, 2.1] },
    { id: "pantry-right-shelf", kind: "storage", x: [5.2, 5.5], z: [-5.8, -4.7], y: [0, 2.1] },
    // pantry-use-route: entrance X = 3.22 to the right shelf front, back shelf front to the
    // door/handle limit 0.08 m behind the +Z jamb plane Z = -4.80.
    { id: "pantry-use-route", kind: "route", x: [3.22, 5.2], z: [-5.8, -4.88] },
    // 0.90 m turning square centred 0.50 m -X of the right shelf front (X = 4.70) and on the
    // use band's Z centre (-5.34).
    { id: "pantry-turning", kind: "use", x: [4.25, 5.15], z: [-5.79, -4.89] },
  ],
};

/** Emit the pantry floor and its partition to the service band. */
export const buildPantry = (): IRoomBuild => ({
  space: PANTRY,
  parts: [
    roomFloor(PANTRY),
    roomCeiling(PANTRY),
    doorFloor(PANTRY, "service-pantry-door", [3.145, 3.22], [-5.75, -4.8]),
    partition({
      id: "pantry-service-partition",
      owner: PANTRY.owner,
      storey: "ground-storey",
      axis: "z",
      across: [3.07, 3.22],
      along: [-6.05, -4.7],
      holes: [door("service-pantry-door", "ground-storey", -5.75, -4.8)],
    }),
  ],
});
