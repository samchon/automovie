import { WoodFinish } from "./WoodFinish";
import { solid } from "./solid";
import { textured } from "./textured";

export type HouseFinishId = keyof typeof textured |
  keyof typeof solid |
  `wood-end/${WoodFinish}`;
