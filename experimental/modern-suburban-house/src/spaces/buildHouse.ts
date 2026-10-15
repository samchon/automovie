import { buildGarageCeiling } from "./buildGarageCeiling";
import { buildGarageFloorBase } from "./buildGarageFloorBase";
import { buildGarageSharedWall } from "./buildGarageSharedWall";
import { GARAGE_OUTLINE } from "./GARAGE_OUTLINE";
import { buildFront } from "./envelope/buildFront";
import { GARAGE_FRONT_DOOR } from "./envelope/GARAGE_FRONT_DOOR";
import { GARDEN_DOOR } from "./envelope/GARDEN_DOOR";
import { buildLeft } from "./envelope/buildLeft";
import { buildRear } from "./envelope/buildRear";
import { buildRight } from "./envelope/buildRight";
import { EXTERIOR_WALL_BOTTOM } from "./EXTERIOR_WALL_BOTTOM";
import { buildUpperCeiling } from "./floors/buildUpperCeiling";
import { buildGroundFloor } from "./floors/buildGroundFloor";
import { buildInterstorey } from "./floors/buildInterstorey";
import { IHouse } from "./IHouse";
import { buildPorch } from "./buildPorch";
import { buildFrontGableLeftRoof } from "./roof/buildFrontGableLeftRoof";
import { buildFrontGableRightRoof } from "./roof/buildFrontGableRightRoof";
import { buildGarageBackRoof } from "./roof/buildGarageBackRoof";
import { buildGarageFrontRoof } from "./roof/buildGarageFrontRoof";
import { buildMainBackRoof } from "./roof/buildMainBackRoof";
import { buildMainFrontRoof } from "./roof/buildMainFrontRoof";
import { buildRightBackRoof } from "./roof/buildRightBackRoof";
import { buildRightFrontRoof } from "./roof/buildRightFrontRoof";
import { buildBedroomThree } from "./rooms/buildBedroomThree";
import { DOOR_HALL_BEDROOM_THREE_DOOR } from "./rooms/DOOR_HALL_BEDROOM_THREE_DOOR";
import { buildBedroomTwo } from "./rooms/buildBedroomTwo";
import { DOOR_HALL_BEDROOM_TWO_DOOR } from "./rooms/DOOR_HALL_BEDROOM_TWO_DOOR";
import { buildCommon } from "./rooms/buildCommon";
import { DOOR_LIVING_COMMON_OPENING } from "./rooms/DOOR_LIVING_COMMON_OPENING";
import { DOOR_SERVICE_COMMON_OPENING } from "./rooms/DOOR_SERVICE_COMMON_OPENING";
import { buildEntry } from "./rooms/buildEntry";
import { COAT_STORAGE } from "./rooms/COAT_STORAGE";
import { FRONT_DOOR } from "./rooms/FRONT_DOOR";
import { buildGarageInterior } from "./rooms/buildGarageInterior";
import { LAUNDRY_GARAGE_DOOR } from "./rooms/LAUNDRY_GARAGE_DOOR";
import { buildLaundry } from "./rooms/buildLaundry";
import { DOOR_SERVICE_LAUNDRY_DOOR } from "./rooms/DOOR_SERVICE_LAUNDRY_DOOR";
import { buildLiving } from "./rooms/buildLiving";
import { DOOR_ENTRY_LIVING_DOOR } from "./rooms/DOOR_ENTRY_LIVING_DOOR";
import { buildPantry } from "./rooms/buildPantry";
import { DOOR_SERVICE_PANTRY_DOOR } from "./rooms/DOOR_SERVICE_PANTRY_DOOR";
import { buildPowder } from "./rooms/buildPowder";
import { DOOR_SERVICE_POWDER_DOOR } from "./rooms/DOOR_SERVICE_POWDER_DOOR";
import { buildPrimary } from "./rooms/buildPrimary";
import { DOOR_HALL_PRIMARY_DOOR } from "./rooms/DOOR_HALL_PRIMARY_DOOR";
import { checkReservations } from "./rooms/checkReservations";
import { buildService } from "./rooms/buildService";
import { buildShowerBath } from "./rooms/buildShowerBath";
import { DOOR_HALL_SHOWER_DOOR } from "./rooms/DOOR_HALL_SHOWER_DOOR";
import { buildTubBath } from "./rooms/buildTubBath";
import { DOOR_HALL_TUB_DOOR } from "./rooms/DOOR_HALL_TUB_DOOR";
import { buildUpperHall } from "./rooms/buildUpperHall";
import { buildWardrobe } from "./rooms/buildWardrobe";
import { DOOR_PRIMARY_WARDROBE_DOOR } from "./rooms/DOOR_PRIMARY_WARDROBE_DOOR";
import { buildSite } from "./buildSite";
import { buildStair } from "./buildStair";

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
    ...buildStair(COAT_STORAGE),
    ...porch.parts,
    ...site.parts,
  ];
  const seen = new Set<string>();
  for (const p of parts) {
    if (seen.has(p.id)) throw new Error(`duplicate house part id "${p.id}" from ${p.owner}`);
    seen.add(p.id);
    if ((p.owner.startsWith("envelope/") || p.owner === "garage.ts") && p.role === "wall" && p.wall?.outline.some((q) => Math.abs(q.y - EXTERIOR_WALL_BOTTOM) < 1e-6))
      p.pendingMapGround = "map-ground-pending";
    if (p.role === "fence" || p.id === "chimney-body")
      p.pendingMapGround = "map-ground-pending";
  }
  const expectedDoors = [
    DOOR_SERVICE_COMMON_OPENING,
    DOOR_LIVING_COMMON_OPENING,
    DOOR_HALL_BEDROOM_THREE_DOOR,
    DOOR_HALL_BEDROOM_TWO_DOOR,
    FRONT_DOOR,
    DOOR_SERVICE_LAUNDRY_DOOR,
    LAUNDRY_GARAGE_DOOR,
    DOOR_ENTRY_LIVING_DOOR,
    DOOR_SERVICE_PANTRY_DOOR,
    DOOR_SERVICE_POWDER_DOOR,
    DOOR_HALL_PRIMARY_DOOR,
    DOOR_HALL_SHOWER_DOOR,
    DOOR_HALL_TUB_DOOR,
    DOOR_PRIMARY_WARDROBE_DOOR,
    GARAGE_FRONT_DOOR,
    GARDEN_DOOR,
  ];
  const actualDoors = parts.flatMap((p) => p.wall?.holes ?? []).filter((h) => expectedDoors.some((d) => d.id === h.id)
  );
  for (const expected of expectedDoors) {
    const matches = actualDoors.filter((hole) => hole.id === expected.id);
    if (matches.length !== 1 || ["from", "to", "bottom", "top"].some((key) => Math.abs(Number(matches[0]?.[key as keyof typeof expected]) - Number(expected[key as keyof typeof expected])) > 1e-6))
      throw new Error(`door void ${expected.id} differs from its design owner`);
    if (expected.id === GARAGE_FRONT_DOOR.id) continue;
    const host = parts.find((p) => p.wall?.holes.some((hole) => hole.id === expected.id)
    );
    const strips = parts.filter(
      (p) => p.role === "floor" && p.id.includes(expected.id)
    );
    if (host?.wall === undefined || strips.length === 0) throw new Error(
      `door ${expected.id} has no wall or floor handoff`
    );
    const ordinate = host.wall.axis === "x" ? 0 : 2;
    for (const strip of strips) {
      const values = strip.mesh.positions.filter((_, i) => i % 3 === ordinate);
      if (Math.abs(Math.min(...values) - expected.from) > 1e-6 || Math.abs(Math.max(...values) - expected.to) > 1e-6)
        throw new Error(
          `door floor ${strip.id} differs from ${expected.id} void`
        );
    }
  }
  const hasVertex = (id: string, x: number, z: number): boolean => {
    const mesh = parts.find((part) => part.id === id)?.mesh;
    if (mesh === undefined) throw new Error(
      `shared opening part ${id} is absent`
    );
    for (let i = 0; i < mesh.positions.length; i += 3)
      if (Math.abs(mesh.positions[i]! - x) < 1e-6 && Math.abs(mesh.positions[i + 2]! - z) < 1e-6) return true;
    return false;
  };
  if (![GARAGE_FRONT_DOOR.from, GARAGE_FRONT_DOOR.to].every((x) => [GARAGE_OUTLINE.inner.z[1], GARAGE_OUTLINE.outer.z[1]].every((z) => hasVertex("garage-floor-base", x, z)
  )
  ))
    throw new Error("garage front floor does not follow its door void");
  const spaces = rooms.map((room) => room.space);
  checkReservations(spaces);
  const spaceIds = new Set<string>();
  for (const s of spaces) {
    if (spaceIds.has(s.id)) throw new Error(`duplicate space id "${s.id}" from ${s.owner}`);
    spaceIds.add(s.id);
  }
  const storages = rooms.flatMap((room) => (room.storages ?? []).map((storage) => ({ room: room.space, storage }))
  );
  for (const s of storages) {
    if (spaceIds.has(s.storage.id)) throw new Error(
      `duplicate space id "${s.storage.id}" from ${s.room.owner}`
    );
    spaceIds.add(s.storage.id);
  }
  const zones = [...porch.zones, ...site.zones].map((zone) => ({
    ...zone,
    pendingMapGround: "map-ground-pending" as const,
  }));
  for (const z of zones) {
    if (spaceIds.has(z.id)) throw new Error(`duplicate space id "${z.id}" from ${z.owner}`);
    spaceIds.add(z.id);
  }
  return { parts, spaces, storages, zones };
};
