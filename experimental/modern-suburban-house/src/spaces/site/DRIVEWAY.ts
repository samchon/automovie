/**
 * `driveway`: the concrete drive rising to the garage threshold.
 *
 * X is the garage
 * door's rough opening X = [6.10, 11.10] widened by 0.20 m on each side:
 * [5.90, 11.30]. It runs from the garage front outer face Z = -0.30 to the
 * paving end Z = 6.50 (site/00-access). Its top blends the garage floor
 * −0.15 m to the front walk datum −0.45 m with no cross slope:
 * D(Z) = (1 − u) × (−0.15) + u × (−0.45), u = (Z + 0.30) / 6.80. Base 0.15 m.
 * No vehicle is authored.
 */
import { GARAGE_FRONT_DOOR } from "../envelope/GARAGE_FRONT_DOOR";
import { GARAGE_OUTLINE } from "../GARAGE_OUTLINE";

/** Driveway extent, metres. */
export const DRIVEWAY = {
  x: [GARAGE_FRONT_DOOR.from - 0.2, GARAGE_FRONT_DOOR.to + 0.2] as const,
  z: [GARAGE_OUTLINE.outer.z[1], 6.5] as const,
};

