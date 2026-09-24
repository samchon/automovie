/**
 * The house producer: every spaces owner's parts in one deterministic list.
 *
 * Responsibility: call each source owner once, in a fixed order, and refuse a
 * duplicate part id instead of silently keeping one. The list is the single
 * producer the viewer server (and later measurements and delivery) consume, so
 * they all see the same geometry. It has no inputs: every coordinate comes from
 * the owners, which read the reviewed `docs/spaces` values.
 *
 * Scope of this pass: mass, envelope with real opening voids, floors,
 * ceilings, the eight roof faces and the porch roof, room outlines and
 * partitions, the stair, the porch and the site paving and fence. Furniture,
 * fixtures, cabinets, lighting, planting, door and window leaves, frames and
 * textures belong to later model, instance, material and system branches and
 * are not emitted.
 */
import { buildGroundFloor } from "./floors/ground";
import { buildInterstorey, buildUpperCeiling } from "./floors/upper";
import { buildFront } from "./envelope/front";
import { buildLeft } from "./envelope/left";
import { buildRear } from "./envelope/rear";
import { buildRight } from "./envelope/right";
import { buildGarageCeiling, buildGarageFloorBase, buildGarageSharedWall } from "./garage";
import { buildPorch } from "./porch";
import { buildFrontGableLeftRoof } from "./roof/front-gable-left";
import { buildFrontGableRightRoof } from "./roof/front-gable-right";
import { buildGarageBackRoof } from "./roof/garage-back";
import { buildGarageFrontRoof } from "./roof/garage-front";
import { buildMainBackRoof } from "./roof/main-back";
import { buildMainFrontRoof } from "./roof/main-front";
import { buildRightBackRoof } from "./roof/right-back";
import { buildRightFrontRoof } from "./roof/right-front";
import { buildBedroomThree } from "./rooms/bedroom-three";
import { buildBedroomTwo } from "./rooms/bedroom-two";
import { buildCommon } from "./rooms/common";
import { buildEntry } from "./rooms/entry";
import { buildGarageInterior } from "./rooms/garage-interior";
import { buildLaundry } from "./rooms/laundry";
import { buildLiving } from "./rooms/living";
import { buildPantry } from "./rooms/pantry";
import { buildPowder } from "./rooms/powder";
import { buildPrimary } from "./rooms/primary";
import { buildService } from "./rooms/service";
import { buildShowerBath } from "./rooms/shower-bath";
import { buildTubBath } from "./rooms/tub-bath";
import { buildUpperHall } from "./rooms/upper-hall";
import { buildWardrobe } from "./rooms/wardrobe";
import { buildSite } from "./site";
import { type IRoomSpace, type IStorageSpace, checkReservations } from "./rooms/shared";
import type { IExteriorZone } from "./site/zone";
import type { IHousePart } from "./solids";
import { buildStair } from "./stair";

/** The house as the viewer, measurements and delivery consume it. */
export interface IHouse {
  /** Every emitted solid, in fixed owner order. */
  parts: IHousePart[];
  /** The fifteen room space records, in fixed owner order. */
  spaces: IRoomSpace[];
  /** Storage volumes with the room that owns each, in fixed owner order. */
  storages: { room: IRoomSpace; storage: IStorageSpace }[];
  /** Exterior zones of the porch and site, in fixed owner order. */
  zones: IExteriorZone[];
}

/** Build the whole house; throws on a duplicate part or space id. */
export const buildHouse = (): IHouse => {
  const rooms = [
    buildEntry(),
    buildLiving(),
    buildCommon(),
    buildService(),
    buildPowder(),
    buildLaundry(),
    buildPantry(),
    buildGarageInterior(),
    buildUpperHall(),
    buildPrimary(),
    buildWardrobe(),
    buildBedroomTwo(),
    buildBedroomThree(),
    buildShowerBath(),
    buildTubBath(),
  ];
  const porch = buildPorch();
  const site = buildSite();
  const parts = [
    ...buildGroundFloor(),
    ...buildInterstorey(),
    ...buildUpperCeiling(),
    ...buildGarageSharedWall(),
    ...buildGarageFloorBase(),
    ...buildGarageCeiling(),
    ...buildFront(),
    ...buildRear(),
    ...buildLeft(),
    ...buildRight(),
    ...buildMainFrontRoof(),
    ...buildMainBackRoof(),
    ...buildFrontGableLeftRoof(),
    ...buildFrontGableRightRoof(),
    ...buildRightFrontRoof(),
    ...buildRightBackRoof(),
    ...buildGarageFrontRoof(),
    ...buildGarageBackRoof(),
    ...rooms.flatMap((room) => room.parts),
    ...buildStair(),
    ...porch.parts,
    ...site.parts,
  ];
  const seen = new Set<string>();
  for (const p of parts) {
    if (seen.has(p.id)) throw new Error(`duplicate house part id "${p.id}" from ${p.owner}`);
    seen.add(p.id);
  }
  const spaces = rooms.map((room) => room.space);
  checkReservations(spaces);
  const spaceIds = new Set<string>();
  for (const s of spaces) {
    if (spaceIds.has(s.id)) throw new Error(`duplicate space id "${s.id}" from ${s.owner}`);
    spaceIds.add(s.id);
  }
  const storages = rooms.flatMap((room) => (room.storages ?? []).map((storage) => ({ room: room.space, storage })));
  for (const s of storages) {
    if (spaceIds.has(s.storage.id)) throw new Error(`duplicate space id "${s.storage.id}" from ${s.room.owner}`);
    spaceIds.add(s.storage.id);
  }
  const zones = [...porch.zones, ...site.zones];
  for (const z of zones) {
    if (spaceIds.has(z.id)) throw new Error(`duplicate space id "${z.id}" from ${z.owner}`);
    spaceIds.add(z.id);
  }
  return { parts, spaces, storages, zones };
};
