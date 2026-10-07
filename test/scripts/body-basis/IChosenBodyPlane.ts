import type { IBodyContactPlane } from "./IBodyContactPlane";

/** Which plane a pair is solved against, and why. */
export interface IChosenBodyPlane {
  plane: IBodyContactPlane;
  kind: "fold" | "contact";
}
