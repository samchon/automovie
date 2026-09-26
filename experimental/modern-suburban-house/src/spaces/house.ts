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
import { EXTERIOR_WALL_BOTTOM, GARAGE } from "./building";
import { buildInterstorey, buildUpperCeiling } from "./floors/upper";
import { buildFront, GARAGE_FRONT_DOOR } from "./envelope/front";
import { buildLeft } from "./envelope/left";
import { buildRear, GARDEN_DOOR } from "./envelope/rear";
import { buildRight } from "./envelope/right";
import {
  buildGarageCeiling,
  buildGarageFloorBase,
  buildGarageSharedWall,
} from "./garage";
import { buildPorch } from "./porch";
import { buildFrontGableLeftRoof } from "./roof/front-gable-left";
import { buildFrontGableRightRoof } from "./roof/front-gable-right";
import { buildGarageBackRoof } from "./roof/garage-back";
import { buildGarageFrontRoof } from "./roof/garage-front";
import { buildMainBackRoof } from "./roof/main-back";
import { buildMainFrontRoof } from "./roof/main-front";
import { buildRightBackRoof } from "./roof/right-back";
import { buildRightFrontRoof } from "./roof/right-front";
import {
  buildBedroomThree,
  DOOR_HALL_BEDROOM_THREE_DOOR,
} from "./rooms/bedroom-three";
import {
  buildBedroomTwo,
  DOOR_HALL_BEDROOM_TWO_DOOR,
} from "./rooms/bedroom-two";
import {
  buildCommon,
  DOOR_LIVING_COMMON_OPENING,
  DOOR_SERVICE_COMMON_OPENING,
} from "./rooms/common";
import { buildEntry, FRONT_DOOR } from "./rooms/entry";
import { buildGarageInterior } from "./rooms/garage-interior";
import {
  buildLaundry,
  DOOR_SERVICE_LAUNDRY_DOOR,
  LAUNDRY_GARAGE_DOOR,
} from "./rooms/laundry";
import { buildLiving, DOOR_ENTRY_LIVING_DOOR } from "./rooms/living";
import { buildPantry, DOOR_SERVICE_PANTRY_DOOR } from "./rooms/pantry";
import { buildPowder, DOOR_SERVICE_POWDER_DOOR } from "./rooms/powder";
import { buildPrimary, DOOR_HALL_PRIMARY_DOOR } from "./rooms/primary";
import { buildService } from "./rooms/service";
import { buildShowerBath, DOOR_HALL_SHOWER_DOOR } from "./rooms/shower-bath";
import { buildTubBath, DOOR_HALL_TUB_DOOR } from "./rooms/tub-bath";
import { buildUpperHall } from "./rooms/upper-hall";
import { buildWardrobe, DOOR_PRIMARY_WARDROBE_DOOR } from "./rooms/wardrobe";
import { buildSite } from "./site";
import {
  checkReservations,
  type IRoomSpace,
  type IStorageSpace,
} from "./rooms/shared";
import type { IExteriorZone } from "./site/zone";
import type { IHousePart } from "./solids";
import { buildStair } from "./stair";

/** The house as the viewer, measurements and delivery consume it. */
/**
 * @evidence spaces/04-observations.md IHouse groups the emitted solids and logical places consumed by environment construction and inspection.
 * @evidence principles/core/source-units.md#source-scope-preservation The record references authored parts, rooms, storage, and site zones without creating furniture or material assets.
 * @evidence principles/core/source-units.md#source-substantive-completion Its four required arrays give consumers typed access to geometry and spatial identity in one build result.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The observation handoff needs these four populations; their existing builders supplied each without a new authored place.
 */
export interface IHouse {
  /** Every emitted solid, in fixed owner order. */
  /**
   * @evidence spaces/04-observations.md `parts` is the ordered set of solids that observation and environment assembly inspect.
   * @evidence principles/core/source-units.md#source-scope-preservation Each entry remains an IHousePart of its source owner, not a replacement mesh authored here.
   * @evidence principles/core/source-units.md#source-substantive-completion A required array exposes all emitted geometry to viewer and topology assembly.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The handoff parent calls for assembled solids; it did not require another part role.
   */
  parts: IHousePart[];
  /** The fifteen room space records, in fixed owner order. */
  /**
   * @evidence spaces/04-observations.md `spaces` exposes each authored room record for later spatial queries.
   * @evidence principles/core/source-units.md#source-scope-preservation This array carries the room owners' records unchanged; it does not infer adjacency from mesh overlap.
   * @evidence principles/core/source-units.md#source-substantive-completion A required IRoomSpace list supports deterministic room and reservation checks.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The handoff parent already enumerates room observation inputs, so no new space was inferred.
   */
  spaces: IRoomSpace[];
  /** Storage volumes with the room that owns each, in fixed owner order. */
  /**
   * @evidence spaces/04-observations.md `storages` retains each closed storage volume with its owning room.
   * @evidence principles/core/source-units.md#source-scope-preservation Its room link preserves closet ownership without turning storage into a circulation node.
   * @evidence principles/core/source-units.md#source-substantive-completion The typed pair gives environment construction a stable parent for every storage cell.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The source parents already attach closets to rooms; retaining the pair added no storage location.
   */
  storages: { room: IRoomSpace; storage: IStorageSpace }[];
  /** Exterior zones of the porch and site, in fixed owner order. */
  /**
   * @evidence spaces/04-observations.md `zones` supplies the named exterior standing places to the spatial record.
   * @evidence principles/core/source-units.md#source-scope-preservation It carries porch and site zones from their owners rather than inventing a parcel or street space.
   * @evidence principles/core/source-units.md#source-substantive-completion A required IExteriorZone array lets environment assembly create bounded exterior cells.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The site/porch parents supply all current exterior zones; no off-site node was needed.
   */
  zones: IExteriorZone[];
}

/** Build the whole house; throws on a duplicate part or space id. */
/**
 * @evidence spaces/04-observations.md buildHouse is the deterministic producer of parts, rooms, storage, and exterior zones for inspection.
 * @evidence spaces/04-observations.md#spatial-observation-derivation The fixed owner call order makes one stable source population for later topology and observation checks.
 * @evidence principles/core/source-units.md#source-scope-preservation It calls actual value imports for each builder once, leaving object fills and external ground to other branches.
 * @evidence principles/core/source-units.md#source-substantive-completion It assembles four arrays, checks reservations, and throws on duplicate part or space ids before return.
 * @evidence obligations/design/space-sources.md#space-source-design-ownership Each emitted room, surface and zone comes from a value-imported reviewed owner; this assembler adds no new place, boundary or dimension.
 * @evidence obligations/design/space-sources.md#space-source-stable-identities Ordered builder calls and duplicate-id refusal preserve stable part, room, storage, and zone identities.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The reviewed owner and room units supplied their outputs; assembly exposed no missing house-space identity.
 */
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
  const actualDoors = parts.flatMap((p) => p.wall?.holes ?? []).filter((h) =>
    expectedDoors.some((d) => d.id === h.id),
  );
  for (const expected of expectedDoors) {
    const matches = actualDoors.filter((hole) => hole.id === expected.id);
    if (matches.length !== 1 || ["from", "to", "bottom", "top"].some((key) => Math.abs(Number(matches[0]?.[key as keyof typeof expected]) - Number(expected[key as keyof typeof expected])) > 1e-6))
      throw new Error(`door void ${expected.id} differs from its design owner`);
    if (expected.id === GARAGE_FRONT_DOOR.id) continue;
    const host = parts.find((p) => p.wall?.holes.some((hole) => hole.id === expected.id));
    const strips = parts.filter((p) => p.role === "floor" && p.id.includes(expected.id));
    if (host?.wall === undefined || strips.length === 0) throw new Error(`door ${expected.id} has no wall or floor handoff`);
    const ordinate = host.wall.axis === "x" ? 0 : 2;
    for (const strip of strips) {
      const values = strip.mesh.positions.filter((_, i) => i % 3 === ordinate);
      if (Math.abs(Math.min(...values) - expected.from) > 1e-6 || Math.abs(Math.max(...values) - expected.to) > 1e-6)
        throw new Error(`door floor ${strip.id} differs from ${expected.id} void`);
    }
  }
  const hasVertex = (id: string, x: number, z: number): boolean => {
    const mesh = parts.find((part) => part.id === id)?.mesh;
    if (mesh === undefined) throw new Error(
      `shared opening part ${id} is absent`,
    );
    for (let i = 0; i < mesh.positions.length; i += 3)
      if (Math.abs(mesh.positions[i]! - x) < 1e-6 && Math.abs(mesh.positions[i + 2]! - z) < 1e-6) return true;
    return false;
  };
  if (![GARAGE_FRONT_DOOR.from, GARAGE_FRONT_DOOR.to].every((x) =>
    [GARAGE.inner.z[1], GARAGE.outer.z[1]].every((z) => hasVertex("garage-floor-base", x, z))))
    throw new Error("garage front floor does not follow its door void");
  const spaces = rooms.map((room) => room.space);
  checkReservations(spaces);
  const spaceIds = new Set<string>();
  for (const s of spaces) {
    if (spaceIds.has(s.id)) throw new Error(`duplicate space id "${s.id}" from ${s.owner}`);
    spaceIds.add(s.id);
  }
  const storages = rooms.flatMap((room) =>
    (room.storages ?? []).map((storage) => ({ room: room.space, storage })),
  );
  for (const s of storages) {
    if (spaceIds.has(s.storage.id)) throw new Error(
      `duplicate space id "${s.storage.id}" from ${s.room.owner}`,
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
