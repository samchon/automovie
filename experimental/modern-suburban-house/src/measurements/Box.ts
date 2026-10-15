import { Range } from "./Range";

/** Measured world box of a part. */
export type Box = {
  /** World x range. */
  x: Range;
  /** World height range, when measured. */
  y?: Range;
  /** World z range. */
  z: Range;
};
