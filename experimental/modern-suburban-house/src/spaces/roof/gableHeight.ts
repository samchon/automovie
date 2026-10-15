import { MAIN_OUTLINE } from "../MAIN_OUTLINE";
import { GABLE_ENDS } from "./GABLE_ENDS";
import { GABLE_PITCH } from "./GABLE_PITCH";
import { mFront } from "./mFront";

/** Front gable faces: F(X) = 6.30 + (9/12) × min(X - a, b - X). */

export const gableHeight = (x: number): number => mFront(MAIN_OUTLINE.outer.z[1]) + GABLE_PITCH * Math.min(x - GABLE_ENDS.a, GABLE_ENDS.b - x);
