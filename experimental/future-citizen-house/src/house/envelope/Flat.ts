
/**
 * Builder of one flat axis-aligned roof solid between `x0..x1`, `z0..z1` and heights `y0..y1`;
 * returns its element id.
 */
export type Flat = (
  id: string,
  x0: number,
  x1: number,
  z0: number,
  z1: number,
  y0: number,
  y1: number
) => string;
