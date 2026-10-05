/**
 * Split the vertices of a surface that carries both sides of a paired part
 * (brows, lashes) by the sign of x: +X is the anatomical left. A vertex on
 * x = 0 belongs to neither side and refuses by name, as does a side left
 * empty.
 */
export function splitHumanSourceSurfaceSides(surface: string, positions: readonly number[]): Record<"left" | "right", number[]> {
  const out: Record<"left" | "right", number[]> = { left: [], right: [] };
  for (let v = 0; v < positions.length / 3; v++) {
    const x = positions[3 * v];
    if (x === 0) throw new Error(`Periocular: ${surface} vertex ${v} lies on the midline and belongs to neither side.`);
    out[x > 0 ? "left" : "right"].push(v);
  }
  if (out.left.length === 0 || out.right.length === 0) throw new Error(`Periocular: ${surface} has no vertex on one side.`);
  return out;
}
