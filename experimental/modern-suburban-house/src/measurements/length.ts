import { IPoint } from "./IPoint";

/** Length of a vector. */
export const length = (p: IPoint): number => Math.hypot(p.x, p.y, p.z);
