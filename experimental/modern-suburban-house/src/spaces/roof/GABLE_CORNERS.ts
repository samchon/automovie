import { MAIN_OUTLINE } from "../MAIN_OUTLINE";
import { GABLE_ENDS } from "./GABLE_ENDS";
import { MAIN_PITCH } from "./MAIN_PITCH";
import { GABLE_PITCH } from "./GABLE_PITCH";
import { OVERHANG } from "./OVERHANG";

const GABLE_TO_MAIN_SLOPE = GABLE_PITCH / MAIN_PITCH;
const MAIN_TO_GABLE_SLOPE = MAIN_PITCH / GABLE_PITCH;
/** Front edge of the gable candidate region, measured from its own overhang. */
const GABLE_EAVE_Z = MAIN_OUTLINE.outer.z[1] + OVERHANG.gable;
/** Valley Z at a gable X: where F(X) equals Mfront(Z). */
const valleyZ = (x: number): number => MAIN_OUTLINE.outer.z[1] - GABLE_TO_MAIN_SLOPE * Math.min(x - GABLE_ENDS.a, GABLE_ENDS.b - x);
/**
 * Corners of the exposed front gable, shared by the gable planes and the main
 * front plane: the valley meets the front eave at `leftFoot` and `rightFoot`,
 * and the two valleys meet the gable ridge at `apex`.
 */
export const GABLE_CORNERS = (() => {
  // valleyZ(x) = GABLE_EAVE_Z  ⇒  min(x - a, b - x) = -(8/9) × (GABLE_EAVE_Z - front wall)
  const reach = MAIN_TO_GABLE_SLOPE * (MAIN_OUTLINE.outer.z[1] - GABLE_EAVE_Z);
  return {
    leftFoot: { x: GABLE_ENDS.a + reach, z: GABLE_EAVE_Z },
    rightFoot: { x: GABLE_ENDS.b - reach, z: GABLE_EAVE_Z },
    apex: { x: GABLE_ENDS.center, z: valleyZ(GABLE_ENDS.center) },
    ridgeFront: { x: GABLE_ENDS.center, z: GABLE_EAVE_Z },
  };
})();
