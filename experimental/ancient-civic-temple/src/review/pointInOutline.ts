
/** Whether a point lies inside a polygon, by the even-odd rule. */
export const pointInOutline = (polygon: readonly { x: number; y: number; }[], x: number, y: number): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!, b = polygon[j]!;
    if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
};
