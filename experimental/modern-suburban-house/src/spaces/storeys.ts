/**
 * Storey datums of the house: the one owner of every finished floor and
 * ceiling height the other spaces owners consume.
 *
 * Design owner: `docs/spaces/01-storeys.md` (`storey-datums`,
 * `ground-threshold-datums`), with the layer splits of
 * `docs/spaces/08-floor-assembly.md`, `09-ceiling-assembly.md` and
 * `10-ground-floor.md`. Values are world Y in metres; no value here is derived
 * from a reference image.
 *
 * Consumers: floors, rooms, stair, porch, garage, envelope and site owners.
 * A datum change propagates through imports to the matching floor, wall,
 * stair, reservation and site measurements on the next build; independent
 * roof profiles and authored opening heights retain their own datums.
 */

/** Finished floor and ceiling heights, world Y metres. */
/**
 * @evidence spaces/01-storeys.md STOREYS is the single world-Y record for ground, upper, garage, and porch levels.
 * @evidence spaces/01-storeys.md#storey-datums Ground floor 0 and upper floor 3.06 bound the two main storeys and their finished ceilings.
 * @evidence spaces/01-storeys.md#ground-threshold-datums Garage floor -0.15, porch 0, and front walk -0.45 fix their distinct entry datums.
 * @evidence principles/core/source-units.md#source-scope-preservation This record supplies height datums; stair openings, floor buildup, and roof clearance stay with their builders.
 * @evidence principles/core/source-units.md#source-substantive-completion Literal numbers make each floor and ceiling position repeatable for consuming rooms and envelope functions.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The storey and threshold parent units fix these elevations; the record needed no additional level or connector.
 */
export const STOREYS = {
  /** ground-storey finished floor (01 storey-datums). */
  groundFloor: 0,
  /** ground-storey finished ceiling (01 storey-datums). */
  groundCeiling: 2.75,
  /** upper-storey finished floor (01 storey-datums). */
  upperFloor: 3.06,
  /** upper-storey finished ceiling (01 storey-datums). */
  upperCeiling: 5.66,
  /** garage finished floor (01 ground-threshold-datums). */
  get garageFloor() { return this.groundFloor - 0.15; },
  /** garage finished ceiling (01 ground-threshold-datums). */
  garageCeiling: 2.55,
  /** porch floor, equal to the entry floor (01 ground-threshold-datums). */
  get porchFloor() { return this.groundFloor; },
  /** front walk datum below the three porch risers (01 ground-threshold-datums). */
  get frontWalk() { return this.porchFloor - 0.45; },
} as const;

/** Ground floor layers (10 main-ground-floor-base, garage-ground-floor-base), metres. */
/**
 * @evidence spaces/10-ground-floor.md GROUND_LAYERS supplies main and garage floor base depths to their builders.
 * @evidence spaces/10-ground-floor.md#main-ground-floor-base The main floor gets 0.025 m finish over a 0.15 m base below its finished datum.
 * @evidence spaces/10-ground-floor.md#garage-ground-floor-base garageBase reserves 0.15 m below the lower garage finished floor.
 * @evidence principles/core/source-units.md#source-scope-preservation The value fixes floor buildup depths without moving level datums held by STOREYS.
 * @evidence principles/core/source-units.md#source-substantive-completion Three numeric layer depths can be used directly by ground and garage floor solids.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Both ground-floor parent units give their finish and base allocations, so no thickness was invented here.
 */
export const GROUND_LAYERS = {
  /** Finish bundle below the main finished floor. */
  finish: 0.025,
  /** Support base below the main finish bundle. */
  base: 0.15,
  /** Garage base below the garage finished floor. */
  garageBase: 0.15,
} as const;

/**
 * Interstorey floor finish (08 interstorey-floor-boundary), metres: the top
 * layer of the reservation between the ground ceiling and the upper floor,
 * owned by each upper room. The 0.270 m structure fills the band between it
 * and the 0.015 m ground ceiling finish owned by each ground room.
 */
/**
 * @evidence spaces/08-floor-assembly.md This constant is the upper room's visible finish share of the interstorey band.
 * @evidence spaces/08-floor-assembly.md#interstorey-floor-boundary The 0.025 m value sits above shared structure between ground ceiling and upper finished floor.
 * @evidence principles/core/source-units.md#source-scope-preservation It describes only upper floor finish and does not thicken the structural band.
 * @evidence principles/core/source-units.md#source-substantive-completion A concrete 0.025 m reservation lets upper-room builders form finish slabs.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The interstorey parent allocates finish, structure, and ceiling depths; this constant exposes no missing layer.
 */
export const INTERSTOREY_FLOOR_FINISH = 0.025;

/**
 * Visible ceiling finish above a finished ceiling, metres: the ground ceiling
 * finish under the interstorey structure (08 interstorey-floor-boundary) and
 * the upper ceiling finish under the upper ceiling base (09
 * upper-ceiling-closure). Each room owner emits its own.
 */
/**
 * @evidence spaces/09-ceiling-assembly.md CEILING_FINISH supplies the visible ceiling skin used by room builders.
 * @evidence spaces/09-ceiling-assembly.md#upper-ceiling-closure The 0.015 m finish closes below upper ceiling support without lifting its finished datum.
 * @evidence principles/core/source-units.md#source-scope-preservation This thickness changes no room footprint, ceiling elevation, or structural reservation.
 * @evidence principles/core/source-units.md#source-substantive-completion Room ceiling builders consume the numeric thickness to emit actual finish planes.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The ceiling parent provides the finish/support split; using 0.015 m introduced no second ceiling edge.
 */
export const CEILING_FINISH = 0.015;

/** Finish plus support reservation above a finished ceiling (09 upper- and garage-ceiling-closure), metres. */
/**
 * @evidence spaces/09-ceiling-assembly.md CEILING_RESERVATION is the roofward band above finished ceilings.
 * @evidence spaces/09-ceiling-assembly.md#upper-ceiling-closure The upper ceiling's 0.18 m finish-plus-base band stays below the roof underside.
 * @evidence spaces/09-ceiling-assembly.md#garage-ceiling-closure The same depth closes the lower garage ceiling above its finished datum.
 * @evidence principles/core/source-units.md#source-scope-preservation The reservation is ceiling buildup, not a change to roof pitch or storey height.
 * @evidence principles/core/source-units.md#source-substantive-completion The concrete 0.18 m value is applied by upper and garage ceiling builders.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The ceiling parent defines both closure locations and depth, so no extra headroom decision was needed.
 */
export const CEILING_RESERVATION = 0.18;

/** The two storey ids spaces records must reference directly (01 storey-datums). */
/**
 * @evidence spaces/01-storeys.md StoreyId limits room records to the two authored main-building levels.
 * @evidence principles/core/source-units.md#source-scope-preservation The union excludes garage and porch as additional storeys while allowing their distinct datums elsewhere.
 * @evidence principles/core/source-units.md#source-substantive-completion The literal union gives consumers a checked identity boundary for floorOf and ceilingOf.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The storey parent declares ground and upper only; the union required no third level.
 */
export type StoreyId = "ground-storey" | "upper-storey";

/** Finished floor height of a storey. */
/**
 * @evidence spaces/01-storeys.md floorOf resolves a declared main storey to its finished floor Y.
 * @evidence principles/core/source-units.md#source-scope-preservation It chooses the two STOREYS main-floor values and never treats garageFloor as another storey.
 * @evidence principles/core/source-units.md#source-substantive-completion Either StoreyId returns a deterministic floor coordinate without a caller-computed offset.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The ground/upper datums in the storey parent suffice for this two-case lookup.
 */
export const floorOf = (storey: StoreyId): number => (storey === "ground-storey"
  ? STOREYS.groundFloor
  : STOREYS.upperFloor);

/** Finished ceiling height of a storey. */
/**
 * @evidence spaces/01-storeys.md ceilingOf resolves each authored main storey to its finished ceiling Y.
 * @evidence principles/core/source-units.md#source-scope-preservation It reads groundCeiling or upperCeiling from STOREYS, leaving garage's lower ceiling separate.
 * @evidence principles/core/source-units.md#source-substantive-completion Both StoreyId inputs yield the declared height directly, giving rooms a stable ceiling coordinate.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The storey parent supplies both finished ceiling levels; no room-specific elevation was added.
 */
export const ceilingOf = (storey: StoreyId): number => (storey === "ground-storey"
  ? STOREYS.groundCeiling
  : STOREYS.upperCeiling);
