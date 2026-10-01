/**
 * Clip the shell's inner arc to the sloped flat tile in their metre section.
 * Outside the inner radius the complete foot follows the tile. A positive
 * shell and |x| inside its outer radius are required; malformed shells refuse.
 */
export const ridgeSectionAt = (datum: number, outerRadius: number, shellThickness: number, flatThickness: number, angleDegrees: number, x: number) => {
  const absoluteX = Math.abs(x);
  if (outerRadius <= shellThickness || absoluteX > outerRadius) throw new RangeError("ridge section outside shell");
  const slope = angleDegrees * Math.PI / 180;
  const tile = flatThickness / Math.cos(slope) - absoluteX * Math.tan(slope);
  const innerRadius = outerRadius - shellThickness;
  const lower = absoluteX <= innerRadius
    ? Math.max(datum + Math.sqrt(Math.max(0, innerRadius ** 2 - absoluteX ** 2)), tile)
    : tile;
  const upper = datum + Math.sqrt(Math.max(0, outerRadius ** 2 - absoluteX ** 2));
  return { tile, lower, upper };
};
