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
import { buildEntry, COAT_STORAGE, FRONT_DOOR } from "./rooms/entry";
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
import { checkReservations } from "./rooms/reservations";
import {
  type IRoomSpace,
  type IStorageSpace,
} from "./rooms/shared";
import type { IExteriorZone } from "./site/zone";
import type { IHousePart } from "./solid-records";
import { buildStair } from "./stair";

/** The house as the viewer, measurements and delivery consume it. */
/**
 * @evidence spaces/04-observations.md IHouse groups the emitted solids and logical places consumed by environment construction and inspection.
 * @evidenceReview spaces/04-observations.md IHouse groups parts, room spaces, storages and exterior zones; the environment adapter and observation derivation consume this same built result instead of separate house descriptions.
 * @evidence principles/core/source-units.md#source-scope-preservation The record references authored parts, rooms, storage, and site zones without creating furniture or material assets.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation The four fields reference space parts, room and storage records, and site zones; the type creates no furniture or material model.
 * @evidence principles/core/source-units.md#source-substantive-completion Its four required arrays give consumers typed access to geometry and spatial identity in one build result.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion All four arrays are required and buildHouse returns them together, giving environment and observation consumers typed access to one source population.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Engine-render-handoff consumes visible part meshes and room records, site-access-interface names exterior standing zones, and entry-coat-storage/upper-linen-storage assign the two closed storage volumes; these builders supply the four arrays.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work The render handoff requires owner parts and spatial records, the site handoff supplies exterior zones, and the entry and upper-hall owners supply closed storage; IHouse carries these outputs without assigning a new place.
 */
export interface IHouse {
  /** Every emitted solid, in fixed owner order. */
  /**
   * @evidence spaces/04-observations.md `parts` is the ordered set of solids that observation and environment assembly inspect.
   * @evidenceReview spaces/04-observations.md buildHouse collects the builders' parts in a fixed array; environment.ts creates models and elements from that array, and observation derivation reads the same emitted geometry.
   * @evidence principles/core/source-units.md#source-scope-preservation Each entry remains an IHousePart of its source owner, not a replacement mesh authored here.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation The parts array spreads each owner's IHousePart objects and buildHouse only marks provisional map-ground contact; it does not replace their meshes.
   * @evidence principles/core/source-units.md#source-substantive-completion A required array exposes all emitted geometry to viewer and topology assembly.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion The required IHousePart array becomes the environment model list and one model-bearing element per part, so emitted geometry reaches the renderer boundary.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Engine-render-handoff requires model-bearing elements for visible walls, floors, and roofs; parts collects the solids emitted by those surface owners.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work The render handoff needs visible walls, floors and roofs from their surface owners; parts gathers those owners' meshes for the environment adapter without adding another surface.
   */
  parts: IHousePart[];
  /** The fifteen room space records, in fixed owner order. */
  /**
   * @evidence spaces/04-observations.md `spaces` exposes each authored room record for later spatial queries.
   * @evidenceReview spaces/04-observations.md spaces maps the fifteen room builder results to their space records; environment construction and room observation derivation read those records.
   * @evidence principles/core/source-units.md#source-scope-preservation This array carries the room owners' records unchanged; it does not infer adjacency from mesh overlap.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation buildHouse copies each room.space reference into this array and checks reservations and ids; it derives no new adjacency from mesh overlap.
   * @evidence principles/core/source-units.md#source-substantive-completion A required IRoomSpace list supports deterministic room and reservation checks.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion spaces is required and feeds checkReservations; buildHouse also rejects duplicate room ids before returning the list.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Spatial-observation-derivation derives centre, corner, and threshold questions from built rooms; spaces keeps the room owners' records for that census.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work The observation parent derives room questions from built records; spaces keeps each room owner's record available to environment and observation consumers without choosing a new room outline.
   */
  spaces: IRoomSpace[];
  /** Storage volumes with the room that owns each, in fixed owner order. */
  /**
   * @evidence spaces/04-observations.md `storages` retains each closed storage volume with its owning room.
   * @evidenceReview spaces/04-observations.md buildHouse pairs each room's storage record with its room space; the observation design calls for both the entry coat and upper-hall linen storage contacts.
   * @evidence principles/core/source-units.md#source-scope-preservation Its room link preserves closet ownership without turning storage into a circulation node.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation The pair retains the owning room while route checking excludes storage openings from required passage edges, preserving storage as a room attachment.
   * @evidence principles/core/source-units.md#source-substantive-completion The typed pair gives environment construction a stable parent for every storage cell.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion environment.ts uses storage bounds for a cell and its paired room's storey for the parent, making the record sufficient to place a storage space.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Entry-coat-storage puts the shallow coat volume beneath the upper flight and upper-linen-storage puts the linen volume in the hall; storages pairs each with its owning room.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Entry assigns coat storage and upper-hall assigns linen storage; storages retains each builder's volume with its own room rather than making a new route node.
   */
  storages: { room: IRoomSpace; storage: IStorageSpace }[];
  /** Exterior zones of the porch and site, in fixed owner order. */
  /**
   * @evidence spaces/04-observations.md `zones` supplies the named exterior standing places to the spatial record.
   * @evidenceReview spaces/04-observations.md zones combines the porch and site builders' exterior standing records, which the observation plan uses for exterior threshold, corner and centre questions.
   * @evidence principles/core/source-units.md#source-scope-preservation It carries porch and site zones from their owners rather than inventing a parcel or street space.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation buildHouse copies porch and site zones and marks their ground status pending; it creates neither a parcel nor a street space.
   * @evidence principles/core/source-units.md#source-substantive-completion A required IExteriorZone array lets environment assembly create bounded exterior cells.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion environment.ts turns each required zone's patches into bounded exterior cells and standable surfaces, so this array has a concrete spatial consumer.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-access-interface places paving zones under the ground storey and room-route-network places front-porch there; zones carries outputs from both the site and porch owners.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work The site handoff names ground-storey exterior paving zones and the route table names front-porch as a ground-storey exterior destination; zones combines their existing builder records without assigning another exterior place.
   */
  zones: IExteriorZone[];
}

/** Build the whole house; throws on a duplicate part or space id. */
/**
 * @evidence spaces/04-observations.md buildHouse is the deterministic producer of parts, rooms, storage, and exterior zones for inspection.
 * @evidenceReview spaces/04-observations.md buildHouse calls each assigned builder in a fixed order and returns parts, room spaces, storages and exterior zones as the common input for later spatial inspection.
 * @evidence spaces/04-observations.md#spatial-observation-derivation The fixed owner call order makes one stable source population for later topology and observation checks.
 * @evidenceReview spaces/04-observations.md#spatial-observation-derivation The fixed builder order and one returned IHouse let topology and observation code read the same emitted parts and room records from which the design derives questions.
 * @evidence principles/core/source-units.md#source-scope-preservation It calls actual value imports for each builder once, leaving object fills and external ground to other branches.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation buildHouse calls value-imported space owners, marks provisional map-ground contacts, and assembles their outputs without adding furniture, material fills or a terrain height.
 * @evidence principles/core/source-units.md#source-substantive-completion It assembles four arrays, checks reservations, and throws on duplicate part or space ids before return.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion buildHouse gathers all four arrays, runs reservation and door-handoff checks, rejects duplicate part or spatial ids, and returns the checked result.
 * @evidence obligations/design/space-sources.md#space-source-design-ownership Each emitted room, surface and zone comes from a value-imported reviewed owner; this assembler adds no new place, boundary or dimension.
 * @evidenceReview obligations/design/space-sources.md#space-source-design-ownership The room, envelope, floor, roof, porch and site builders supply their own records; this assembler marks pending ground status and checks handoffs but creates no new room, surface or dimension.
 * @evidence obligations/design/space-sources.md#space-source-stable-identities Ordered builder calls and duplicate-id refusal preserve stable part, room, storage, and zone identities.
 * @evidenceReview obligations/design/space-sources.md#space-source-stable-identities A fixed call and spread order preserves repeatable part and space ordering, while duplicate checks refuse conflicting part, room, storage or zone ids.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-access-interface places the main house, garage, porch, and exterior zones in one site, while room-route-network names the room nodes; buildHouse collects those owner outputs without adding a space identity.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work The site and route parents already name the house, garage, porch, exterior zones and room nodes; buildHouse gathers their owners' outputs and checks ids without adding a new spatial identity.
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
  const actualDoors = parts.flatMap((p) => p.wall?.holes ?? []).filter((h) =>
    expectedDoors.some((d) => d.id === h.id),
  );
  for (const expected of expectedDoors) {
    const matches = actualDoors.filter((hole) => hole.id === expected.id);
    if (matches.length !== 1 || ["from", "to", "bottom", "top"].some((key) => Math.abs(Number(matches[0]?.[key as keyof typeof expected]) - Number(expected[key as keyof typeof expected])) > 1e-6))
      throw new Error(`door void ${expected.id} differs from its design owner`);
    if (expected.id === GARAGE_FRONT_DOOR.id) continue;
    const host = parts.find((p) =>
      p.wall?.holes.some((hole) => hole.id === expected.id),
    );
    const strips = parts.filter(
      (p) => p.role === "floor" && p.id.includes(expected.id),
    );
    if (host?.wall === undefined || strips.length === 0) throw new Error(
      `door ${expected.id} has no wall or floor handoff`,
    );
    const ordinate = host.wall.axis === "x" ? 0 : 2;
    for (const strip of strips) {
      const values = strip.mesh.positions.filter((_, i) => i % 3 === ordinate);
      if (Math.abs(Math.min(...values) - expected.from) > 1e-6 || Math.abs(Math.max(...values) - expected.to) > 1e-6)
        throw new Error(
          `door floor ${strip.id} differs from ${expected.id} void`,
        );
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
    [GARAGE.inner.z[1], GARAGE.outer.z[1]].every((z) =>
      hasVertex("garage-floor-base", x, z),
    ),
  ))
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
