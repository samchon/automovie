import type { ITemplePartBound as PartBound } from "./ITemplePartBound.mjs";
/** The parser's explicit mutable measurement state, shared between ordered phases.
 * Only mapped parts may be written; add ignores nonfinite measurements. */
export interface ITemplePartBoundsContext {
  parts: { key: string; noun: string }[];
  result: Record<string, PartBound>;
  explicitSeen: Record<string, Record<"X" | "Y" | "Z", boolean>>;
  partDimensions: Record<string, Record<string, number>>;
  construction: string;
  ground: boolean; backOrigin: boolean;
  width: number; widthW: number; depthD: number; thickT: number;
  add: (part: string, axis: "X" | "Y" | "Z", first: number, second: number) => void;
}
