/**
 * `garden-terrace`, `garden-steps` and `garden-lower-landing`: the raised rear
 * terrace, its three exterior risers and the lower waiting area.
 *
 * Design owner: `docs/spaces/site/terrace.md`. The terrace is X = [-1.80, 4.50]
 * from the rear wall's outer face Z = -10.70 to Z = -14.40, top at the garden
 * door's outer waiting Y = 0 (envelope/rear garden-door). The steps take the
 * 1.50 m central band on the garden door axis X = 0: X = [-0.75, 0.75]; the
 * first riser is at the terrace edge and each tread steps −Z by 0.30 m and
 * down by 0.15 m (three risers, two treads). The lower landing is 1.20 m deep
 * at the terrace top minus three risers, −0.45 m. Raised bodies reach the lower
 * waiting base −0.45 − 0.12 m (01-paving-support raised-platform-support).
 */
import { PALETTE } from "../palette";
import { type IHousePart, block, part } from "../solids";
import { STOREYS } from "../storeys";
import { WALK_DEPTH } from "./paving";

const OWNER = "site/terrace.ts";
const TOP = STOREYS.groundFloor;
const LOW = TOP - 3 * 0.15;
const BOTTOM = LOW - WALK_DEPTH;
const EDGE = -14.4;

/** Lower landing extent, metres. */
export const LOWER_LANDING = { x: [-0.75, 0.75] as const, z: [EDGE - 0.6 - 1.2, EDGE - 0.6] as const, top: LOW };

/** Emit the terrace, steps and lower landing. */
export const buildTerrace = (): IHousePart[] => {
  const parts: IHousePart[] = [part("garden-terrace", OWNER, "paving", PALETTE.paving, block([-1.8, BOTTOM, EDGE], [4.5, TOP, -10.7]))];
  for (let k = 1; k <= 2; ++k) {
    const edge = EDGE - 0.3 * (k - 1);
    parts.push(part(`garden-step-${k}`, OWNER, "paving", PALETTE.paving, block([-0.75, BOTTOM, edge - 0.3], [0.75, TOP - 0.15 * k, edge])));
  }
  parts.push(part("garden-lower-landing", OWNER, "paving", PALETTE.paving, block([LOWER_LANDING.x[0], BOTTOM, LOWER_LANDING.z[0]], [LOWER_LANDING.x[1], LOW, LOWER_LANDING.z[1]])));
  return parts;
};
