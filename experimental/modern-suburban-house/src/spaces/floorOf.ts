import { StoreyId } from "./StoreyId";
import { STOREYS } from "./STOREYS";

/** Finished floor height of a storey. */

export const floorOf = (storey: StoreyId): number => (storey === "ground-storey"
  ? STOREYS.groundFloor
  : STOREYS.upperFloor);
