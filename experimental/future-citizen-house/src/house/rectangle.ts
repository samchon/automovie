/**
 * Plan rectangle from `a` to `b` on x and `y0` to `y1` on the plan's second axis, as four corners
 * in order.
 */
export const rectangle = (a: number, b: number, y0: number, y1: number) => [
  { x: a, y: y0 }, { x: b, y: y0 }, { x: b, y: y1 }, { x: a, y: y1 },
];
