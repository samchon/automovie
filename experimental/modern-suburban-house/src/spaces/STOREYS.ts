

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

