import { templeWallTrim } from "../templeWallTrim";
import { templeParapetTop } from "./templeParapetTop";

export const coping = {
  kind: "flat", height: templeParapetTop, surface: "surface.facade-south.coping", coping: templeWallTrim.copingThickness,
} as const;
