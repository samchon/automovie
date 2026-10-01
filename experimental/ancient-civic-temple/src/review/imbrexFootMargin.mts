/**
 * Both semicircular tube feet must have positive band width in their ribs.
 * Metre intervals are ordered; a nonpositive inner radius cannot have a foot.
 */
export const imbrexFootMargin = (centre: number, outer: number, thickness: number, leftRib: [number, number], rightRib: [number, number]) => {
  const inner = outer - thickness;
  if (inner <= 0) return -Infinity;
  return Math.min(
    centre - outer - leftRib[0],
    leftRib[1] - (centre - inner),
    centre + inner - rightRib[0],
    rightRib[1] - (centre + outer),
  );
};
