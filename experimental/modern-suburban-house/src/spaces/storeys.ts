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

/** Vertical layer splits of the floor and ceiling assemblies, metres. */
export const LAYERS = {
  /** 10 main-ground-floor-base: finish bundle below the finished floor. */
  groundFinish: 0.025,
  /** 10 main-ground-floor-base: support base below the finish bundle. */
  groundBase: 0.15,
  /** 08 interstorey-floor-boundary: ceiling finish under the interstorey structure. */
  interstoreyCeilingFinish: 0.015,
  /** 08 interstorey-floor-boundary: floor finish bundle on top of the structure. */
  interstoreyFloorFinish: 0.025,
  /** 09 upper-ceiling-closure: finish plus support reservation above a finished ceiling. */
  ceilingReservation: 0.18,
  /** 10 garage-ground-floor-base: garage base below its finished floor. */
  garageBase: 0.15,
} as const;

/** The two storey ids spaces records must reference directly (01 storey-datums). */
export type StoreyId = "ground-storey" | "upper-storey";

/** Finished floor height of a storey. */
export const floorOf = (storey: StoreyId): number => (storey === "ground-storey" ? STOREYS.groundFloor : STOREYS.upperFloor);

/** Finished ceiling height of a storey. */
export const ceilingOf = (storey: StoreyId): number => (storey === "ground-storey" ? STOREYS.groundCeiling : STOREYS.upperCeiling);
