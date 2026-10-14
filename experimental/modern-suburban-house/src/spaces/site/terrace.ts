/**
 * `garden-terrace`, `garden-steps` and `garden-lower-landing`: the raised rear
 * terrace, its three exterior risers and the lower waiting area.
 *
 * The terrace is X = [-1.80, 4.50]
 * from the rear wall's outer face Z = -10.70 to Z = -14.40, top at the garden
 * door's outer waiting Y = 0 (envelope/rear garden-door). The steps take the
 * 1.50 m central band on the garden door axis X = 0: X = [-0.75, 0.75]; the
 * first riser is at the terrace edge and each tread steps −Z by 0.30 m and
 * down by 0.15 m (three risers, two treads). The lower landing is 1.20 m deep
 * at the terrace top minus three risers, −0.45 m. Raised bodies reach the lower
 * waiting base −0.45 − 0.12 m (01-paving-support raised-platform-support).
 */
import { PALETTE } from "../palette";
import { MAIN } from "../building";
import { GARDEN_DOOR } from "../envelope/rear";
import { block, rect } from "../solids";
import { part } from "../part";
import type { IHousePart } from "../../types/IHousePart";
import { STOREYS } from "../storeys";
import type { IExteriorZone, ISiteBuild } from "./zone";
import { WALK_DEPTH } from "./paving";

const OWNER = "site/terrace.ts";
const TOP = STOREYS.groundFloor;
const RISERS = 3;
const RISE = 0.15;
const TREAD = 0.3;
const LOW = TOP - RISERS * RISE;
const BOTTOM = LOW - WALK_DEPTH;
/** Rear edge of the raised terrace, shared with the step connector. */
export const TERRACE_EDGE_Z = -14.4;
const STEP_CENTRE_X = (GARDEN_DOOR.from + GARDEN_DOOR.to) / 2;
const STEP_X = [STEP_CENTRE_X - 0.75, STEP_CENTRE_X + 0.75] as const;

/** Lower landing extent, metres. */
export const LOWER_LANDING = {
  x: STEP_X,
  z: [TERRACE_EDGE_Z - (RISERS - 1) * TREAD - 1.2, TERRACE_EDGE_Z - (RISERS - 1) * TREAD] as const,
  top: LOW,
};

/** Emit the terrace, steps and lower landing. */
export const buildTerrace = (): ISiteBuild => {
  const parts: IHousePart[] = [
    part(
      "garden-terrace",
      OWNER,
      "paving",
      PALETTE.paving,
      block([-1.8, BOTTOM, TERRACE_EDGE_Z], [4.5, TOP, MAIN.outer.z[0]]),
    ),
  ];
  for (let k = 1; k < RISERS; ++k) {
    const edge = TERRACE_EDGE_Z - TREAD * (k - 1);
    parts.push(
      part(
        `garden-step-${k}`,
        OWNER,
        "paving",
        PALETTE.paving,
        block(
          [STEP_X[0], BOTTOM, edge - TREAD],
          [STEP_X[1], TOP - RISE * k, edge],
        ),
      ),
    );
  }
  parts.push(
    part(
      "garden-lower-landing",
      OWNER,
      "paving",
      PALETTE.paving,
      block(
        [LOWER_LANDING.x[0], BOTTOM, LOWER_LANDING.z[0]],
        [LOWER_LANDING.x[1], LOW, LOWER_LANDING.z[1]],
      ),
    ),
  );
  const zones: IExteriorZone[] = [
    {
      id: "garden-terrace",
      owner: OWNER,
      outline: rect([-1.8, 4.5], [TERRACE_EDGE_Z, MAIN.outer.z[0]]),
      anchor: {
        x: STEP_CENTRE_X,
        y: TOP,
        z: (TERRACE_EDGE_Z + MAIN.outer.z[0]) / 2,
      },
      rampTo: null,
    },
    {
      id: "garden-lower-landing",
      owner: OWNER,
      outline: rect(LOWER_LANDING.x, LOWER_LANDING.z),
      anchor: {
        x: STEP_CENTRE_X,
        y: LOW,
        z: (LOWER_LANDING.z[0] + LOWER_LANDING.z[1]) / 2,
      },
      rampTo: null,
    },
  ];
  return { zones, parts };
};
