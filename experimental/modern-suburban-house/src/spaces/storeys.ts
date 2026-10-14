

const GROUND_FLOOR = 0;

/** Finished floor and ceiling heights, world Y metres. */
export const STOREYS = {
  /** ground-storey finished floor (01 storey-datums). */
  groundFloor: GROUND_FLOOR,
  /** ground-storey finished ceiling (01 storey-datums). */
  groundCeiling: 2.75,
  /** upper-storey finished floor (01 storey-datums). */
  upperFloor: 3.06,
  /** upper-storey finished ceiling (01 storey-datums). */
  upperCeiling: 5.66,
  /** garage finished floor (01 ground-threshold-datums). */
  garageFloor: GROUND_FLOOR - 0.15,
  /** garage finished ceiling (01 ground-threshold-datums). */
  garageCeiling: 2.55,
  /** porch floor, equal to the entry floor (01 ground-threshold-datums). */
  porchFloor: GROUND_FLOOR,
  /** front walk datum below the three porch risers (01 ground-threshold-datums). */
  frontWalk: GROUND_FLOOR - 0.45,
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
 * owned by each upper room. The 0.270 m structure fills the band between it
 * and the 0.015 m ground ceiling finish owned by each ground room.
 */
export const INTERSTOREY_FLOOR_FINISH = 0.025;

/**
 * Visible ceiling finish above a finished ceiling, metres: the ground ceiling
 * finish under the interstorey structure (08 interstorey-floor-boundary) and
 * the upper ceiling finish under the upper ceiling base (09
 * upper-ceiling-closure). Each room owner emits its own.
 */
export const CEILING_FINISH = 0.015;

/** Finish plus support reservation above a finished ceiling (09 upper- and garage-ceiling-closure), metres. */
export const CEILING_RESERVATION = 0.18;

/** The two storey ids spaces records must reference directly (01 storey-datums). */
export type StoreyId = "ground-storey" | "upper-storey";

/** Finished floor height of a storey. */
export const floorOf = (storey: StoreyId): number => (storey === "ground-storey"
  ? STOREYS.groundFloor
  : STOREYS.upperFloor);

/** Finished ceiling height of a storey. */
export const ceilingOf = (storey: StoreyId): number => (storey === "ground-storey"
  ? STOREYS.groundCeiling
  : STOREYS.upperCeiling);
