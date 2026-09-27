/**
 * `upper-hall`: the one L-shaped upper-storey corridor and its linen closet.
 *
 * Design owner: `docs/spaces/rooms/upper-hall.md` (`upper-hall-plan`,
 * `upper-linen-storage`). The arrival part X = [1.87, 3.07], Z = [-4.71, -3.41]
 * joins the cross part X = [-3.20, 3.07], Z = [-5.91, -4.71] m. The linen
 * closet keeps a hollow interior X = [1.87, 3.07], Z = [-3.26, -2.66], 2.20 m
 * high from the upper floor, inside 0.15 m side and back partitions
 * (reservation X = [1.72, 3.22], Z = [-3.26, -2.51]). The hall-side boundary
 * Z = [-3.41, -3.26] is cut by `upper-linen-opening` X = [1.97, 2.97] from the
 * floor to 2.20 m; the closet is closed above its 2.20 m interior. Its floor
 * inset and the opening strip close the finish layer missing from the L-shaped
 * circulation outline. Shelves, sliding leaves and rails are later fit-out.
 */
import { DOOR_HALL_TUB_DOOR } from "./tub-bath";
import { DOOR_HALL_BEDROOM_THREE_DOOR } from "./bedroom-three";
import { DOOR_HALL_BEDROOM_TWO_DOOR } from "./bedroom-two";
import { DOOR_HALL_PRIMARY_DOOR } from "./primary";
import { DOOR_HALL_SHOWER_DOOR } from "./shower-bath";
import { PALETTE } from "../palette";
import { MAIN } from "../building";
import { block } from "../solids";
import { part } from "../solid-records";
import { STOREYS } from "../storeys";
import { STAIR_OPENING } from "../stair";
import {
  door,
  doorFloor,
  box,
  partition,
  partitionSpan,
  roomCeiling,
  roomFloor,
  type IRoomBuild,
  type IRoomSpace,
} from "./shared";

const UPPER_HALL: IRoomSpace = {
  id: "upper-hall",
  owner: "rooms/upper-hall.ts",
  storey: "upper-storey",
  outline: [
    { x: STAIR_OPENING.east, z: STAIR_OPENING.turnZ },
    { x: 3.07, z: STAIR_OPENING.turnZ },
    { x: 3.07, z: -5.91 },
    { x: -3.2, z: -5.91 },
    { x: -3.2, z: STAIR_OPENING.guardBack },
    { x: STAIR_OPENING.east, z: STAIR_OPENING.guardBack },
  ],
  floor: PALETTE.carpet,
};

/** Linen closet interior height above the upper floor. */
const LINEN_HEIGHT = 2.2;

/** Emit the hall finishes, its shares under the five room doors and the linen closet boundaries around its hollow interior. */
/**
 * @evidence spaces/rooms/upper-hall.md This builder forms one L-shaped upper corridor and its hollow linen storage.
 * @evidenceReview spaces/rooms/upper-hall.md # UPPER_HALL traces the joined arrival and cross bands; buildUpperHall adds a separate linen-floor finish, opening strip, storage volume and enclosing parts under the same owner rather than another corridor.
 * @evidence spaces/rooms/upper-hall.md#upper-hall-plan The joined arrival and cross bands retain floor shares below five direct room doors.
 * @evidenceReview spaces/rooms/upper-hall.md#upper-hall-plan # UPPER_HALL's six-point outline joins the two authored bands; buildUpperHall takes five door spans from the respective bedroom and bath owners and supplies floor-finish shares beneath those direct room doors.
 * @evidence spaces/rooms/upper-hall.md#upper-linen-storage Four closet walls, a door opening, and an upper head enclose the 2.20 m storage volume.
 * @evidenceReview spaces/rooms/upper-hall.md#upper-linen-storage # The storage floor covers its X/Z interior at the upper finish datum and the opening strip meets the hall floor; the front opening, side and rear partitions, and head enclose the volume up to upperFloor plus LINEN_HEIGHT.
 * @evidence principles/core/source-units.md#source-scope-preservation The hall does not create bedroom or bathroom partition bodies, and leaves linen shelves/leaves to models.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # buildUpperHall emits the hall and storage floors, their connecting opening strip, the hall ceiling and room-door shares, plus its linen enclosure partitions; it creates no bedroom or bathroom wall, shelf or leaf.
 * @evidence principles/core/source-units.md#source-substantive-completion The room, storage record, separate storage floor, connecting strip, five room-door strips and closed closet shell are built in a fixed order.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # The return contains UPPER_HALL, its bounded linen storage, two floor zones and a connecting strip, ceiling finish, five room-door strips, four closet partitions and the head block.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Upper-hall-plan joins its two corridor bands to five room doors, while upper-linen-storage sets the hall closet top; buildUpperHall keeps those contacts in one hall space.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # Upper-hall-plan fixes one L corridor with five direct room doors and upper-linen-storage fixes the closet height and opening; the hall outline, door shares and LINEN_HEIGHT follow those decisions without inventing another room or route.
 */
export const buildUpperHall = (): IRoomBuild => {
  const owner = UPPER_HALL.owner;
  const storey = UPPER_HALL.storey;
  const [, top] = partitionSpan(storey);
  const linenStorage = {
    id: "upper-linen-storage",
    x: [STAIR_OPENING.east, 3.07] as const,
    y: [STOREYS.upperFloor, STOREYS.upperFloor + LINEN_HEIGHT] as const,
    z: [-3.26, -2.66] as const,
  };
  return {
    space: UPPER_HALL,
    storages: [linenStorage],
    parts: [
      roomFloor(UPPER_HALL),
      roomFloor(UPPER_HALL, { id: linenStorage.id, outline: box(linenStorage.x, linenStorage.z) }),
      doorFloor(UPPER_HALL, "upper-linen-opening", [1.97, 2.97], [STAIR_OPENING.turnZ, linenStorage.z[0]]),
      roomCeiling(UPPER_HALL),
      doorFloor(
        UPPER_HALL,
        "hall-bedroom-two-door",
        [DOOR_HALL_BEDROOM_TWO_DOOR.from, DOOR_HALL_BEDROOM_TWO_DOOR.to],
        [STAIR_OPENING.guardBack, -4.635],
      ),
      doorFloor(
        UPPER_HALL,
        "hall-bedroom-three-door",
        [3.07, 3.145],
        [DOOR_HALL_BEDROOM_THREE_DOOR.from, DOOR_HALL_BEDROOM_THREE_DOOR.to],
      ),
      doorFloor(
        UPPER_HALL,
        "hall-primary-door",
        [DOOR_HALL_PRIMARY_DOOR.from, DOOR_HALL_PRIMARY_DOOR.to],
        [-5.985, -5.91],
      ),
      doorFloor(
        UPPER_HALL,
        "hall-shower-door",
        [DOOR_HALL_SHOWER_DOOR.from, DOOR_HALL_SHOWER_DOOR.to],
        [-5.985, -5.91],
      ),
      doorFloor(
        UPPER_HALL,
        "hall-tub-door",
        [3.07, 3.145],
        [DOOR_HALL_TUB_DOOR.from, DOOR_HALL_TUB_DOOR.to],
      ),
      partition({
        id: "upper-linen-front",
        owner,
        storey,
        axis: "x",
        across: [STAIR_OPENING.turnZ, -3.26],
        along: [STAIR_OPENING.east - MAIN.partition, 3.22],
        holes: [door("upper-linen-opening", storey, 1.97, 2.97, LINEN_HEIGHT)],
      }),
      partition({
        id: "upper-linen-side-west",
        owner,
        storey,
        axis: "z",
        across: [STAIR_OPENING.east - MAIN.partition, STAIR_OPENING.east],
        along: [-3.26, -2.51],
      }),
      partition({
        id: "upper-linen-side-east",
        owner,
        storey,
        axis: "z",
        across: [3.07, 3.22],
        along: [-3.26, -2.51],
      }),
      partition({
        id: "upper-linen-back",
        owner,
        storey,
        axis: "x",
        across: [-2.66, -2.51],
        along: [STAIR_OPENING.east, 3.07],
      }),
      part(
        "upper-linen-head",
        owner,
        "partition",
        PALETTE.interiorWall,
        block(
          [STAIR_OPENING.east, STOREYS.upperFloor + LINEN_HEIGHT, -3.26],
          [3.07, top, -2.66],
        ),
      ),
    ],
  };
};
