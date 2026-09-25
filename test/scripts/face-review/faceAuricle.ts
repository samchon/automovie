/**
 * The auricle of a head surface and its length.
 *
 * The auricle is a flap of cartilage and skin standing off the side of the
 * head, a centimetre thick at most where the head is fifteen, so a vertex is
 * on it when the surface, entered along the vertex's inward normal, is left
 * again within `thickness` (`faceAuricleVertices`). The search runs over a
 * `region`, the vertices a source's own auricle-shape targets move, so a
 * thin eyelid or ala elsewhere never counts. Normals are the area-weighted
 * normals of counter-clockwise (outward) triangles.
 *
 * The ear's length is the physiognomic ear length (sa-sba: superaurale, the
 * helix's highest point, to subaurale, the lobule's lowest), the auricle's
 * longest extent, read as the greatest distance between two of its vertices
 * (`faceAuricleLength`). Pure.
 */

/** The region's vertices on a flap thinner than `thickness`. */
export function faceAuricleVertices(props: {
  positions: readonly number[];
  indices: readonly number[];
  region: Iterable<number>;
  thickness: number;
}): number[] {
  const { positions: P, indices: I } = props;
  const region = [...new Set(props.region)];
  if (region.length === 0) return [];
  const normals = new Float64Array(P.length);
  for (let t = 0; t < I.length; t += 3) {
    const [a, b, c] = [I[t]!, I[t + 1]!, I[t + 2]!];
    const u = [0, 1, 2].map((k) => P[3 * b + k]! - P[3 * a + k]!);
    const w = [0, 1, 2].map((k) => P[3 * c + k]! - P[3 * a + k]!);
    const n = [
      u[1]! * w[2]! - u[2]! * w[1]!,
      u[2]! * w[0]! - u[0]! * w[2]!,
      u[0]! * w[1]! - u[1]! * w[0]!,
    ];
    for (const v of [a, b, c])
      for (let k = 0; k < 3; ++k) normals[3 * v + k]! += n[k]!;
  }
  // Only triangles within the region's box, grown by the thickness, can be
  // the flap's far side.
  const lo = [0, 1, 2].map(
    (k) => Math.min(...region.map((v) => P[3 * v + k]!)) - props.thickness,
  );
  const hi = [0, 1, 2].map(
    (k) => Math.max(...region.map((v) => P[3 * v + k]!)) + props.thickness,
  );
  const triangles: number[] = [];
  for (let t = 0; t < I.length; t += 3)
    if (
      [0, 1, 2].some((e) =>
        [0, 1, 2].every(
          (k) =>
            P[3 * I[t + e]! + k]! >= lo[k]! && P[3 * I[t + e]! + k]! <= hi[k]!,
        ),
      )
    )
      triangles.push(t);
  return region.filter((v) => {
    const length = Math.hypot(
      normals[3 * v]!,
      normals[3 * v + 1]!,
      normals[3 * v + 2]!,
    );
    if (length === 0) return false;
    const o = [P[3 * v]!, P[3 * v + 1]!, P[3 * v + 2]!];
    const d = [0, 1, 2].map((k) => -normals[3 * v + k]! / length);
    // Moller-Trumbore against every candidate triangle not touching v.
    for (const t of triangles) {
      const [a, b, c] = [I[t]!, I[t + 1]!, I[t + 2]!];
      if (a === v || b === v || c === v) continue;
      const e1 = [0, 1, 2].map((k) => P[3 * b + k]! - P[3 * a + k]!);
      const e2 = [0, 1, 2].map((k) => P[3 * c + k]! - P[3 * a + k]!);
      const p = [
        d[1]! * e2[2]! - d[2]! * e2[1]!,
        d[2]! * e2[0]! - d[0]! * e2[2]!,
        d[0]! * e2[1]! - d[1]! * e2[0]!,
      ];
      const det = e1[0]! * p[0]! + e1[1]! * p[1]! + e1[2]! * p[2]!;
      if (Math.abs(det) < 1e-18) continue;
      const s = [0, 1, 2].map((k) => o[k]! - P[3 * a + k]!);
      const u = (s[0]! * p[0]! + s[1]! * p[1]! + s[2]! * p[2]!) / det;
      if (u < 0 || u > 1) continue;
      const q = [
        s[1]! * e1[2]! - s[2]! * e1[1]!,
        s[2]! * e1[0]! - s[0]! * e1[2]!,
        s[0]! * e1[1]! - s[1]! * e1[0]!,
      ];
      const w = (d[0]! * q[0]! + d[1]! * q[1]! + d[2]! * q[2]!) / det;
      if (w < 0 || u + w > 1) continue;
      const distance = (e2[0]! * q[0]! + e2[1]! * q[1]! + e2[2]! * q[2]!) / det;
      if (distance > 0 && distance < props.thickness) return true;
    }
    return false;
  });
}

/** The greatest distance between two of the auricle's vertices, or null. */
export function faceAuricleLength(
  positions: readonly number[],
  vertices: readonly number[],
): number | null {
  if (vertices.length < 2) return null;
  let longest = 0;
  for (let i = 0; i < vertices.length; ++i)
    for (let j = i + 1; j < vertices.length; ++j) {
      const [a, b] = [vertices[i]!, vertices[j]!];
      longest = Math.max(
        longest,
        Math.hypot(
          positions[3 * a]! - positions[3 * b]!,
          positions[3 * a + 1]! - positions[3 * b + 1]!,
          positions[3 * a + 2]! - positions[3 * b + 2]!,
        ),
      );
    }
  return longest;
}
