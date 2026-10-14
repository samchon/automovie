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
import { PALETTE } from "../palette";
import { GARAGE_FRONT_DOOR } from "../envelope/front";
import { GARAGE } from "../building";
import { part } from "../part";
import { rect, slopedSlab } from "../solids";
import { STOREYS } from "../storeys";
import { DRIVE_DEPTH, seamRect } from "./paving";
import type { ISiteBuild } from "./zone";

/** Driveway extent, metres. */
export const DRIVEWAY = {
  x: [GARAGE_FRONT_DOOR.from - 0.2, GARAGE_FRONT_DOOR.to + 0.2] as const,
  z: [GARAGE.outer.z[1], 6.5] as const,
};

/** Driveway top at Z. */
export const driveTop = (z: number): number => {
  const u = (z - DRIVEWAY.z[0]) / (DRIVEWAY.z[1] - DRIVEWAY.z[0]);
  return (1 - u) * STOREYS.garageFloor + u * STOREYS.frontWalk;
};

/** Emit the driveway slab. */
export const buildDriveway = (frontConnectorZ: readonly [number, number], sideConnectorZ: readonly [number, number]): ISiteBuild => ({
  zones: [
    {
      id: "driveway",
      owner: "site/driveway.ts",
      outline: rect(DRIVEWAY.x, DRIVEWAY.z),
      anchor: {
        x: (DRIVEWAY.x[0] + DRIVEWAY.x[1]) / 2,
        y: driveTop(DRIVEWAY.z[0]),
        z: DRIVEWAY.z[0],
      },
      rampTo: {
        x: (DRIVEWAY.x[0] + DRIVEWAY.x[1]) / 2,
        y: driveTop(DRIVEWAY.z[1]),
        z: DRIVEWAY.z[1],
      },
    },
  ],
  parts: [
    part(
      "driveway",
      "site/driveway.ts",
      "paving",
      PALETTE.concrete,
      slopedSlab({
        plan: seamRect(
          DRIVEWAY.x,
          DRIVEWAY.z,
          [frontConnectorZ],
          [sideConnectorZ],
        ),
        top: (_x, z) => driveTop(z),
        thickness: DRIVE_DEPTH,
      }),
    ),
  ],
});
