import type { HeightPlane } from "./HeightPlane";

/** A constant-height plane. */

export const levelPlane = (height: number): HeightPlane => ({ x: 0, z: 0, constant: height });
