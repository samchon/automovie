import { RingPoint } from "./RingPoint";


/** Whether a point lies inside a ring, by the even-odd rule. */
export const ringContains = (ring: readonly RingPoint[], p: RingPoint): boolean => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]!, b = ring[j]!;
    if (a[1] > p[1] !== b[1] > p[1] &&
      p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0])
      inside = !inside;
  }
  return inside;
};
