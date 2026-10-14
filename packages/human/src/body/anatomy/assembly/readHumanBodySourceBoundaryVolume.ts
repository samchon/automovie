import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Measure the enclosed volume of one actual oriented source boundary in cubic metres. Directed edge incidences must be paired with opposite orientation and every resident triangle must have finite nonzero area. Signed tetrahedra use the first vertex as a common origin, retaining translation covariance while reducing cancellation from large world offsets. Compensated summation accumulates the divergence-theorem volume; orientation is required to face outward.
 *
 * This is geometric boundary volume, not a CT/MRI segmentation certificate, a bbox estimate, density, muscle strength or physiological validation. Source owners separately qualify vertex-link manifoldness, embeddedness, compartment identity and relationships between multiple members. Open source surfaces refuse rather than being capped by this instrument.
 *
 * @evidence contracts/common.md#principled-implementation Shared-origin signed determinants and compensated summation integrate cubic-metre volume; finite triangles/opposite edge pairs are checked, while embeddedness and vertex-link manifoldness remain separate premises.
 * @evidence contracts/common.md#clear-and-simple-design One geometric instrument serves rest, quantized and posed quantities without substituting bounding boxes or clinical segmentation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Open/inconsistent edges refuse without repair caps; positive algebraic volume certifies neither imaging segmentation nor tissue identity.
 * @evidence contracts/common.md#meaningful-documentation The comment states volume units, outward orientation, translation cancellation and separate anatomical validity.
 * @evidence contracts/performance.md#efficient-algorithms Position/triangle scans cost O(V+T); O(E) constant-sized count/orientation records avoid growing-copy costs for repeated edge incidence.
 * @evidence contracts/performance.md#reuse-equivalent-work Quantity stages share this integration method and one origin per mesh; changed geometry/precision requires a distinct actual read.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Edge records, triangle vectors and compensation are call-local; only a scalar escapes after success and failures retain nothing.
 * @author Samchon
 */
export function readHumanBodySourceBoundaryVolume(
  mesh: IAutoMovieMesh,
): number {
  const positions: number[] = mesh.positions;
  const indices: number[] | null = mesh.indices;
  if (
    positions.length < 12 ||
    positions.length % 3 !== 0 ||
    !positions.every(Number.isFinite) ||
    indices === null ||
    indices.length < 12 ||
    indices.length % 3 !== 0 ||
    indices.some(
      (vertex: number): boolean =>
        !Number.isSafeInteger(vertex) ||
        vertex < 0 ||
        3 * vertex >= positions.length,
    )
  )
    throw new Error(
      "Source boundary volume needs finite indexed triangles in metre coordinates.",
    );
  const edges: Map<string, { count: number; orientation: number }> = new Map();
  const origin: number[] = positions.slice(3 * indices[0], 3 * indices[0] + 3);
  let total: number = 0;
  let correction: number = 0;
  for (let at: number = 0; at < indices.length; at += 3) {
    const vertices: number[] = indices.slice(at, at + 3);
    if (new Set(vertices).size !== 3)
      throw new Error("Source boundary volume has a repeated triangle corner.");
    for (let k: number = 0; k < 3; k++) {
      const a: number = vertices[k];
      const b: number = vertices[(k + 1) % 3];
      const key: string = Math.min(a, b) + ":" + Math.max(a, b);
      const incidence: { count: number; orientation: number } = edges.get(
        key,
      ) ?? { count: 0, orientation: 0 };
      incidence.count++;
      incidence.orientation += a < b ? 1 : -1;
      edges.set(key, incidence);
    }
    const [a, b, c]: number[][] = vertices.map((vertex: number): number[] =>
      [0, 1, 2].map(
        (axis: number): number => positions[3 * vertex + axis] - origin[axis],
      ),
    );
    const ab: number[] = b.map(
      (value: number, axis: number): number => value - a[axis],
    );
    const ac: number[] = c.map(
      (value: number, axis: number): number => value - a[axis],
    );
    const normal: number[] = [
      ab[1] * ac[2] - ab[2] * ac[1],
      ab[2] * ac[0] - ab[0] * ac[2],
      ab[0] * ac[1] - ab[1] * ac[0],
    ];
    if (!(Math.hypot(...normal) > 0) || !normal.every(Number.isFinite))
      throw new Error(
        "Source boundary volume has a nonfinite or degenerate triangle.",
      );
    const term: number =
      (a[0] * (b[1] * c[2] - b[2] * c[1]) +
        a[1] * (b[2] * c[0] - b[0] * c[2]) +
        a[2] * (b[0] * c[1] - b[1] * c[0])) /
      6;
    if (!Number.isFinite(term))
      throw new Error("Source boundary tetrahedral volume is not finite.");
    const adjusted: number = term - correction;
    const next: number = total + adjusted;
    correction = next - total - adjusted;
    total = next;
  }
  if (
    [...edges.values()].some(
      (incidence: { count: number; orientation: number }): boolean =>
        incidence.count !== 2 || incidence.orientation !== 0,
    )
  )
    throw new Error(
      "Source boundary volume needs a closed consistently oriented two-manifold; no repair cap is inferred.",
    );
  if (!(total > 0) || !Number.isFinite(total))
    throw new Error(
      "Source boundary volume needs positive finite outward-oriented enclosed volume.",
    );
  return total;
}
