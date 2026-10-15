/**
 * XZ convex region computation shared by the roof height field and space cells.
 * It decides no building dimension or surface ownership. Input is a finite CCW convex polygon,
 * and output is a new polygon that leaves the input unchanged. Height is y=ax+bz+c (m).
 * Only numeric error is handled, at 1e-9; it is not a design tolerance or a gap filler.
 */
export interface PlanPoint { x: number; z: number; }
