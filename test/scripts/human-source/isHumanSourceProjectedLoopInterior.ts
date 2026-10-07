/**
 * Odd-even containment in the canonical source's frontal XY projection.
 *
 * The loop is an ordered simple closed source cycle, its seam not repeated.
 * The half-open Y interval assigns a ray through a polygon vertex to one
 * edge, so vertices do not double-count. Boundary vertices are supplied or
 * excluded by identity at the caller; this predicate supplies no tolerance
 * band, fitted frame, anatomical region or clinical qualification.
 */
export function isHumanSourceProjectedLoopInterior(
  positions: ArrayLike<number>,
  loop: readonly number[],
  vertex: number,
): boolean {
  const x = positions[3 * vertex], y = positions[3 * vertex + 1];
  let inside = false;
  for (let at = 0; at < loop.length; at++) {
    const a = loop[at], b = loop[(at + 1) % loop.length];
    const ax = positions[3 * a], ay = positions[3 * a + 1];
    const bx = positions[3 * b], by = positions[3 * b + 1];
    if ((ay > y) !== (by > y) && x < ax + (y - ay) * (bx - ax) / (by - ay))
      inside = !inside;
  }
  return inside;
}
