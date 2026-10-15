import { StoreyId } from "./StoreyId";
import { STOREYS } from "./STOREYS";

/** Finished ceiling height of a storey. */

export const ceilingOf = (storey: StoreyId): number => (storey === "ground-storey"
  ? STOREYS.groundCeiling
  : STOREYS.upperCeiling);
