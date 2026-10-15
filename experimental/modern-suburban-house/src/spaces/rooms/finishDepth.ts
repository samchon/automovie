import { GROUND_LAYERS } from "../GROUND_LAYERS";
import { INTERSTOREY_FLOOR_FINISH } from "../INTERSTOREY_FLOOR_FINISH";
import type { StoreyId } from "../StoreyId";

/** Depth of the floor finish bundle below a storey's finished floor. */

export const finishDepth = (storey: StoreyId): number => (storey === "ground-storey"
  ? GROUND_LAYERS.finish
  : INTERSTOREY_FLOOR_FINISH);
