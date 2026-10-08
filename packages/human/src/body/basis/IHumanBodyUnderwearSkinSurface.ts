/** Native posed skin read by garment closing, with shared vertex indices. */
export interface IHumanBodyUnderwearSkinSurface {
  /** Flat XYZ metres in the posed skin frame. */
  positions: readonly number[];
  /** Oriented triangles over the shared native positions. */
  indices: readonly number[];
}
