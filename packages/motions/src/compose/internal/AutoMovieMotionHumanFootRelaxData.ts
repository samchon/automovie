import { DEFAULT_HUMANOID_ROM } from "@automovie/engine";

/*
 * The ankle's least roll, degrees: the foot's abduction range's low end
 * (`DEFAULT_HUMANOID_ROM`).
 */
export const ROLL_LEAST: number = DEFAULT_HUMANOID_ROM.leftFoot!.abduction!.min;

/*
 * The ankle's greatest roll, degrees: the foot's abduction range's high end
 * (`DEFAULT_HUMANOID_ROM`).
 */
export const ROLL_MOST: number = DEFAULT_HUMANOID_ROM.leftFoot!.abduction!.max;
