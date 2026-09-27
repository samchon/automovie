/**
 * `powder-room`: the front room of the service band.
 *
 * Design owner: `docs/spaces/rooms/powder.md#powder-plan`. Finished inner
 * X = [3.22, 5.50], Z = [-1.90, -0.25] m. 07 assigns this owner its partitions
 * to service-access (X = [3.07, 3.22], carrying `service-powder-door`
 * Z = [-1.65, -0.70], Y = [0, 2.20] m, from Z = -1.90; the corner
 * Z = [-2.05, -1.90] is the laundry owner's junction) and to the laundry
 * (Z = [-2.05, -1.90]).
 * Fixtures are models and are not emitted.
 */
import { PALETTE } from "../palette";
import {
  box,
  door,
  doorFloor,
  partition,
  roomCeiling,
  roomFloor,
  type IRoomBuild,
  type IRoomSpace,
} from "./shared";
import { floorOf } from "../storeys";
/** Shared void owned by this room and consumed at its floor and adjacent finish.
 * @evidence spaces/rooms/powder.md The service-powder-door void follows the partition assigned to powder.
 * @evidenceReview spaces/rooms/powder.md The `door` value fixes the west service partition's only powder-room opening at Z = [-1.65, -0.70], the span specified by `powder-plan` and consumed by `buildPowder`.
 * @evidence principles/core/source-units.md#source-scope-preservation The service-powder-door interval remains with powder while its adjacent room receives the span.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation `DOOR_SERVICE_POWDER_DOOR` keeps the powder-plan span with this room; `buildService` imports its `from` and `to` for the adjacent service-side finish strip.
 * @evidence principles/core/source-units.md#source-substantive-completion The service-powder-door span cuts its wall and sets floor finish limits on both sides.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion `buildPowder` uses this exported door as the `powder-service-partition` hole and for its X = [3.145, 3.22] floor strip; `buildService` uses the same span for the adjoining X = [3.07, 3.145] strip.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Powder-plan fixes service-powder-door in the west partition at Z=[-1.65, -0.70], Y=[0, 2.20], clear of the washbasin reservation; this export carries the rough span.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work `powder-plan` locates this single door at Z = [-1.65, -0.70] and Y = [0, 2.20]; `door` supplies that span, which meets but does not overlap the basin body's Z = [-0.70, -0.25].
 */
export const DOOR_SERVICE_POWDER_DOOR = door(
  "service-powder-door",
  "ground-storey",
  -1.65,
  -0.7,
);

const FLOOR = floorOf("ground-storey");

const POWDER: IRoomSpace = {
  id: "powder-room",
  owner: "rooms/powder.ts",
  storey: "ground-storey",
  outline: box([3.22, 5.5], [-1.9, -0.25]),
  floor: PALETTE.tile,
  reservations: [
    // powder-plan fixture boxes; heights from powder-fixture-use (toilet max 0.82, basin top 0.85).
    { id: "powder-toilet", kind: "fixture", x: [4.75, 5.5], z: [-1.65, -0.95], y: [FLOOR, FLOOR + 0.82] },
    { id: "powder-basin", kind: "fixture", x: [3.65, 4.25], z: [-0.7, -0.25], y: [FLOOR, FLOOR + 0.85] },
    // powder-fixture-use floors and the door waiting zone.
    { id: "powder-toilet-use", kind: "use", x: [4.15, 4.75], z: [-1.6, -1.0] },
    { id: "powder-basin-use", kind: "use", x: [3.65, 4.25], z: [-1.15, -0.7] },
    { id: "powder-door-waiting", kind: "use", x: [4.25, 4.85], z: [-0.85, -0.4] },
    // Front wall (inner face Z = -0.25) items: mirror over the basin X range, projection 0.04;
    // towel X = [4.40, 4.90], projection 0.08.
    { id: "powder-mirror", kind: "fixture", x: [3.65, 4.25], z: [-0.29, -0.25], y: [FLOOR + 1.1, FLOOR + 1.9] },
    { id: "powder-towel", kind: "fixture", x: [4.4, 4.9], z: [-0.33, -0.25], y: [FLOOR + 1.2, FLOOR + 1.5] },
  ],
};

/** Emit the powder room floor and its two partitions. */
/**
 * @evidence spaces/rooms/powder.md This builder returns the front service-band powder room and its two partition bodies.
 * @evidenceReview spaces/rooms/powder.md `buildPowder` returns the front service-band `POWDER` record, tile floor and ceiling, service-side door strip, and the service and rear-laundry partitions assigned to this room.
 * @evidence spaces/rooms/powder.md#powder-plan The service-side wall holds service-powder-door while the rear wall closes against laundry.
 * @evidenceReview spaces/rooms/powder.md#powder-plan `powder-service-partition` includes `DOOR_SERVICE_POWDER_DOOR` as its west-side hole; `powder-laundry-partition` spans Z = [-2.05, -1.90] with no hole, preserving the plan's sole service entrance.
 * @evidence spaces/rooms/powder.md#powder-fixture-use Toilet, basin, mirror, towel, and the separate approach/waiting rectangles remain reservations for later fills.
 * @evidenceReview spaces/rooms/powder.md#powder-fixture-use `POWDER.reservations` places separate toilet, basin and door-waiting use rectangles at the specified X/Z bounds, and reserves mirror and towel wall boxes with the stated heights and projections.
 * @evidence principles/core/source-units.md#source-scope-preservation It creates room surfaces and partition voids, not a toilet, basin, mirror, or towel mesh.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation The `parts` array contains room surfaces, a door floor strip and two partitions; toilet, basin, mirror and towel remain `POWDER.reservations` with no fixture mesh in this builder.
 * @evidence principles/core/source-units.md#source-substantive-completion The room record, tile floor, ceiling, under-door strip, and two walls form an executable builder result.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion `buildPowder` returns a usable `POWDER` space with `PALETTE.tile`, floor and ceiling parts, a door finish strip and both partition bodies, all at the declared ground-storey bounds.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Powder-plan fixes the single service door and toilet/basin body boxes; powder-fixture-use adds their heights, facing and separate use/waiting rectangles; buildPowder consumes those decisions without a parent revision.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work `buildPowder` gives `powder-service-partition` one hole, keeps the rear partition closed and records the body boxes from `powder-plan` alongside heights and use/waiting zones from `powder-fixture-use`; no extra opening or fixture body is invented.
 */
export const buildPowder = (): IRoomBuild => ({
  space: POWDER,
  parts: [
    roomFloor(POWDER),
    roomCeiling(POWDER),
    doorFloor(
      POWDER,
      "service-powder-door",
      [3.145, 3.22],
      [DOOR_SERVICE_POWDER_DOOR.from, DOOR_SERVICE_POWDER_DOOR.to],
    ),
    partition({
      id: "powder-service-partition",
      owner: POWDER.owner,
      storey: "ground-storey",
      axis: "z",
      across: [3.07, 3.22],
      along: [-1.9, -0.25],
      holes: [DOOR_SERVICE_POWDER_DOOR],
    }),
    partition({
      id: "powder-laundry-partition",
      owner: POWDER.owner,
      storey: "ground-storey",
      axis: "x",
      across: [-2.05, -1.9],
      along: [3.22, 5.5],
    }),
  ],
});
