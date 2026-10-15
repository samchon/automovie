import { PALETTE } from "../PALETTE";
import {
  type IRoomBuild,
} from "./IRoomBuild";
import { box } from "./box";
import { partition } from "./partition";
import { roomCeiling } from "./roomCeiling";
import { doorFloor } from "./doorFloor";
import { roomFloor } from "./roomFloor";
import { type IRoomSpace } from "./IRoomSpace";
import { ceilingOf } from "../ceilingOf";
import { floorOf } from "../floorOf";
import { STAIR_OPENING } from "../STAIR_OPENING";
import { DOOR_HALL_TUB_DOOR } from "./DOOR_HALL_TUB_DOOR";
const FLOOR = floorOf("upper-storey");

const TUB_BATH: IRoomSpace = {
  id: "tub-bathroom",
  owner: "rooms/tub-bath.ts",
  storey: "upper-storey",
  outline: box([3.22, 5.5], [-8.8, STAIR_OPENING.guardBack]),
  floor: PALETTE.tile,
  // ; right ends are the inner face X = 5.50, heights above the upper floor (+3.06).
  reservations: [
    { id: "tub-bathroom-vanity", kind: "fixture", x: [4.95, 5.5], z: [-5.75, -4.9], y: [FLOOR, FLOOR + 0.85] },
    { id: "tub-bathroom-vanity-use", kind: "use", x: [4.3, 4.95], z: [-5.7, -4.95] },
    { id: "tub-bathroom-toilet", kind: "fixture", x: [4.75, 5.5], z: [-6.65, -5.95], y: [FLOOR, FLOOR + 0.82] },
    { id: "tub-bathroom-toilet-use", kind: "use", x: [4.25, 4.75], z: [-6.6, -6.0] },
    { id: "tub-bathroom-tub", kind: "fixture", x: [4.7, 5.5], z: [-8.7, -6.9], y: [FLOOR, FLOOR + 0.55] },
    { id: "tub-bathroom-curtain-rail", kind: "fixture", x: [4.7, 4.8], z: [-8.7, -6.9], y: [FLOOR + 0.6, ceilingOf("upper-storey")] },
    { id: "tub-bathroom-tub-use", kind: "use", x: [3.65, 4.7], z: [-8.55, -7.0] },
    { id: "tub-bathroom-main-route", kind: "route", x: [3.32, 4.22], z: [-8.7, -5.0] },
    // Left wall (X = 3.22), projection at most 0.08, height 1.10-1.50.
    { id: "tub-bathroom-towel", kind: "fixture", x: [3.22, 3.3], z: [-6.85, -6.1], y: [FLOOR + 1.1, FLOOR + 1.5] },
    // Right wall (X = 5.50) over the vanity's Z width, projection at most 0.04, height 1.10-1.90.
    { id: "tub-bathroom-mirror", kind: "fixture", x: [5.46, 5.5], z: [-5.75, -4.9], y: [FLOOR + 1.1, FLOOR + 1.9] },
  ],
};
/**
 * `tub-bathroom`: the second upper bathroom at the end of the hall.
 *
 * Finished inner
 * X = [3.22, 5.50], Z = [-8.80, -4.71] m. 07 assigns this owner its partitions
 * to the hall and shower bathroom (X = [3.07, 3.22], carrying `hall-tub-door`
 * Z = [-5.86, -4.86], Y = [3.06, 5.26] m) and to bedroom-three
 * (Z = [-4.71, -4.56], from X = 3.22). Under 07 interior-boundary-junctions the
 * X = [3.07, 3.22] run is split: this owner takes the wardrobe corner
 * Z = [-8.95, -8.80], while the shower-bath corner Z = [-6.06, -5.91] and the
 * bedroom-three corner Z = [-4.71, -4.56] belong to those owners. Fixtures are
 * later models.
 */
export const buildTubBath = (): IRoomBuild => ({
  space: TUB_BATH,
  parts: [
    roomFloor(TUB_BATH),
    roomCeiling(TUB_BATH),
    doorFloor(
      TUB_BATH,
      "hall-tub-door",
      [3.145, 3.22],
      [DOOR_HALL_TUB_DOOR.from, DOOR_HALL_TUB_DOOR.to],
    ),
    partition({
      id: "tub-hall-partition",
      owner: TUB_BATH.owner,
      storey: "upper-storey",
      axis: "z",
      across: [3.07, 3.22],
      along: [-5.91, STAIR_OPENING.guardBack],
      holes: [DOOR_HALL_TUB_DOOR],
    }),
    partition({
      id: "tub-shower-partition",
      owner: TUB_BATH.owner,
      storey: "upper-storey",
      axis: "z",
      across: [3.07, 3.22],
      along: [-8.95, -6.06],
    }),
    partition({
      id: "tub-bedroom-three-partition",
      owner: TUB_BATH.owner,
      storey: "upper-storey",
      axis: "x",
      across: [STAIR_OPENING.guardBack, STAIR_OPENING.back],
      along: [3.22, 5.5],
    }),
  ],
});
