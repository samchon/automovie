import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBikeGuidePrint } from "./IHumanBikeGuidePrint";

/** A footprint landing at a second, not yet lifted. */
export function HumanBikeGuidePrint(
  land: number,
  ankle: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
): IHumanBikeGuidePrint {
  return { land, lift: Infinity, ankle, rotation };
}
