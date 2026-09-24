/**
 * `driveway`: the concrete drive rising to the garage threshold.
 *
 * Design owner: `docs/spaces/site/driveway.md#driveway-plan`. X is the garage
 * door's rough opening X = [6.10, 11.10] widened by 0.20 m on each side:
 * [5.90, 11.30]. It runs from the garage front outer face Z = -0.30 to the
 * paving end Z = 6.50 (site/00-access). Its top blends the garage floor
 * −0.15 m to the front walk datum −0.45 m with no cross slope:
 * D(Z) = (1 − u) × (−0.15) + u × (−0.45), u = (Z + 0.30) / 6.80. Base 0.15 m.
 * No vehicle is authored.
 */
import { PALETTE } from "../palette";
import { type IHousePart, part, rect, slopedSlab } from "../solids";
import { STOREYS } from "../storeys";
import { DRIVE_DEPTH } from "./paving";

/** Driveway extent, metres. */
export const DRIVEWAY = { x: [5.9, 11.3] as const, z: [-0.3, 6.5] as const };

/** Driveway top at Z. */
export const driveTop = (z: number): number => {
  const u = (z - DRIVEWAY.z[0]) / (DRIVEWAY.z[1] - DRIVEWAY.z[0]);
  return (1 - u) * STOREYS.garageFloor + u * STOREYS.frontWalk;
};

/** Emit the driveway slab. */
export const buildDriveway = (): IHousePart[] => [
  part("driveway", "site/driveway.ts", "paving", PALETTE.concrete, slopedSlab({ plan: rect(DRIVEWAY.x, DRIVEWAY.z), top: (_x, z) => driveTop(z), thickness: DRIVE_DEPTH })),
];
