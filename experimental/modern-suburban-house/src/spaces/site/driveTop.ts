import { STOREYS } from "../STOREYS";
import { DRIVEWAY } from "./DRIVEWAY";

/** Driveway top at Z. */

export const driveTop = (z: number): number => {
  const u = (z - DRIVEWAY.z[0]) / (DRIVEWAY.z[1] - DRIVEWAY.z[0]);
  return (1 - u) * STOREYS.garageFloor + u * STOREYS.frontWalk;
};
