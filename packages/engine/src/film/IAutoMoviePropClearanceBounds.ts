import { IAutoMoviePropBox } from "@automovie/interface";

/** One transformed keep-out volume, still carrying the id that declared it. */
export interface IAutoMoviePropClearanceBounds extends IAutoMoviePropBox {
  /** The clearance id this world volume came from. */
  id: string;
}
