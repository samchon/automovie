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
 * Changing a datum moves every consumer's geometry on the next build.
 */

/** Finished floor and ceiling heights, world Y metres. */
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
  garageFloor: -0.15,
  /** garage finished ceiling (01 ground-threshold-datums). */
  garageCeiling: 2.55,
  /** porch floor, equal to the entry floor (01 ground-threshold-datums). */
  porchFloor: 0,
  /** front walk datum below the three porch risers (01 ground-threshold-datums). */
  frontWalk: -0.45,
} as const;

/** Ground floor layers (10 main-ground-floor-base, garage-ground-floor-base), metres. */
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
 * owned by each upper room. The structure fills the rest down to the ground
 * ceiling, the 0.015 m ceiling finish zone included.
 */
export const INTERSTOREY_FLOOR_FINISH = 0.025;

/** Finish plus support reservation above a finished ceiling (09 upper- and garage-ceiling-closure), metres. */
export const CEILING_RESERVATION = 0.18;

/** The two storey ids spaces records must reference directly (01 storey-datums). */
export type StoreyId = "ground-storey" | "upper-storey";

/** Finished floor height of a storey. */
export const floorOf = (storey: StoreyId): number => (storey === "ground-storey" ? STOREYS.groundFloor : STOREYS.upperFloor);

/** Finished ceiling height of a storey. */
export const ceilingOf = (storey: StoreyId): number => (storey === "ground-storey" ? STOREYS.groundCeiling : STOREYS.upperCeiling);
