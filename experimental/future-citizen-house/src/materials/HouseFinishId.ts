import { WoodFinish } from "./WoodFinish";
import { solid } from "./solid";
import { textured } from "./textured";

/**
 * Identity of every native house finish: textured and solid recipes, plus end-grain variants of the
 * oak finishes.
 */
export type HouseFinishId = keyof typeof textured |
  keyof typeof solid |
  `wood-end/${WoodFinish}`;
