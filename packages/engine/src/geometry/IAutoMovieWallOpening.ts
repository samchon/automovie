/** One axis-aligned rectangular void in a wall's local XY face. */
export interface IAutoMovieWallOpening {
  /** Stable opening identity used in diagnostics. */
  id: string;
  /** Left edge measured from the wall's left edge. */
  x: number;
  /** Bottom edge measured from the wall's bottom edge. */
  y: number;
  /** Positive opening width. */
  width: number;
  /** Positive opening height. */
  height: number;
}
