import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Measure the enclosed volume of one actual oriented source boundary in m³.
 * Directed edge incidence must form a closed two-manifold and every resident
 * triangle must have finite nonzero area. Signed tetrahedra use the first
 * vertex as a common origin, retaining translation covariance while reducing
 * cancellation from large world offsets. Compensated summation accumulates
 * the divergence-theorem volume; orientation is required to face outward.
 *
 * This is geometric boundary volume, not a CT/MRI segmentation certificate,
 * a bbox estimate, density, muscle strength or physiological validation.
 * Source owners separately qualify embeddedness, compartment identity and
 * relationships between multiple members. Open source surfaces refuse rather
 * than being capped by this instrument.
 * @evidence contracts/common.md#principled-implementation Closed opposite-directed edge incidence and oriented tetrahedral integration establish actual polyhedral boundary volume; recentering and compensated summation address floating-point cancellation.
 * @evidence contracts/common.md#clear-and-simple-design One actual source mesh instrument, without inferred tissue or shape controls.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Open boundaries and invalid triangles refuse; header values, bbox products and arbitrary caps never supply volume.
 * @evidence contracts/common.md#meaningful-documentation Separates geometric volume, source compartment authority and clinical acquisition.
 * @evidence contracts/modeling.md#spatial-conventions Input metre coordinates yield cubic metres and dimensionless incidence ordinals.
 * @evidence contracts/anatomy.md#anatomical-source Mathematical boundary integration establishes no clinical tissue segmentation or population range.
 * @author Samchon
 */
export function readHumanBodySourceBoundaryVolume(mesh: IAutoMovieMesh): number {
  const positions = mesh.positions, indices = mesh.indices;
  if (positions.length < 12 || positions.length % 3 !== 0 || !positions.every(Number.isFinite) ||
    indices === null || indices.length < 12 || indices.length % 3 !== 0 ||
    indices.some(vertex => !Number.isSafeInteger(vertex) || vertex < 0 || 3 * vertex >= positions.length))
    throw new Error("Source boundary volume needs finite indexed triangles in metre coordinates.");
  const edges = new Map<string, number[]>();
  const origin = positions.slice(3 * indices[0], 3 * indices[0] + 3);
  let total = 0, correction = 0;
  for (let at = 0; at < indices.length; at += 3) {
    const vertices = indices.slice(at, at + 3);
    if (new Set(vertices).size !== 3) throw new Error("Source boundary volume has a repeated triangle corner.");
    for (let k = 0; k < 3; k++) {
      const a = vertices[k], b = vertices[(k + 1) % 3];
      const key = Math.min(a, b) + ":" + Math.max(a, b);
      edges.set(key, [...edges.get(key) ?? [], a < b ? 1 : -1]);
    }
    const [a, b, c] = vertices.map(vertex => [0, 1, 2].map(axis => positions[3 * vertex + axis] - origin[axis]));
    const ab = b.map((value, axis) => value - a[axis]), ac = c.map((value, axis) => value - a[axis]);
    const normal = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]];
    if (!(Math.hypot(...normal) > 0) || !normal.every(Number.isFinite))
      throw new Error("Source boundary volume has a nonfinite or degenerate triangle.");
    const term = (a[0] * (b[1] * c[2] - b[2] * c[1]) + a[1] * (b[2] * c[0] - b[0] * c[2]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6;
    if (!Number.isFinite(term)) throw new Error("Source boundary tetrahedral volume is not finite.");
    const adjusted = term - correction, next = total + adjusted;
    correction = (next - total) - adjusted; total = next;
  }
  if ([...edges.values()].some(incidence => incidence.length !== 2 || incidence[0] + incidence[1] !== 0))
    throw new Error("Source boundary volume needs a closed consistently oriented two-manifold; no repair cap is inferred.");
  if (!(total > 0) || !Number.isFinite(total))
    throw new Error("Source boundary volume needs positive finite outward-oriented enclosed volume.");
  return total;
}
