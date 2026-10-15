/**
 * `laundry-mudroom`: the buffer room between the service band and the garage.
 *
 * Finished inner
 * X = [3.22, 5.50], Z = [-4.55, -2.05] m. 07 assigns this owner its partitions
 * to service-access (X = [3.07, 3.22], carrying `service-laundry-door`
 * Z = [-4.40, -3.35], Y = [0, 2.20] m) and to the pantry (Z = [-4.70, -4.55]).
 * The `laundry-garage-door` void in the shared wall is cut by `buildGarageSharedWall`; this
 * owner fills its finish zone X = [5.50, 5.75], Y = [-0.025, 0] as
 * `laundry-garage-threshold`, whose garage face with the main ground base end
 * below it is the one riser from the garage floor Y = -0.15 to Y = 0 (10).
 */
import { GROUND_LAYERS } from "../GROUND_LAYERS";
import { LAUNDRY_FLOOR } from "./LAUNDRY_FLOOR";
/** Laundry owns the passage through the main/garage shared wall. */
export const LAUNDRY_GARAGE_DOOR = {
  id: "laundry-garage-door",
  from: -4.4,
  to: -3.35,
  bottom: LAUNDRY_FLOOR - GROUND_LAYERS.finish - GROUND_LAYERS.base,
  top: LAUNDRY_FLOOR + 2.2,
} as const;

