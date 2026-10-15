import type { IHousePart } from "../types/IHousePart";
import { partitionPlaneFace } from "./partitionPlaneFace";
import { garageFloorMesh } from "./garageFloorMesh";
import { GARAGE_OWNER } from "./GARAGE_OWNER";
import { PALETTE } from "./PALETTE";
import { part } from "./part";
import { STOREYS } from "./STOREYS";

/** Emit the garage floor support beneath its room-owned top face. */

export const buildGarageFloorBase = (): IHousePart[] => [
  part(
    "garage-floor-base",
    GARAGE_OWNER,
    "floor",
    PALETTE.concrete,
    partitionPlaneFace(garageFloorMesh(), "y", STOREYS.garageFloor).body
  ),
];
