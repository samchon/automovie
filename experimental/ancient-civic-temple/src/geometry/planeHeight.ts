import { HeightPlane } from "./HeightPlane";
import { PlanPoint } from "./PlanPoint";

/** Evaluates one point of a finite height field. Does not change the input plane. */

export const planeHeight = (p: HeightPlane, at: PlanPoint): number => p.x * at.x + p.z * at.z + p.constant;
