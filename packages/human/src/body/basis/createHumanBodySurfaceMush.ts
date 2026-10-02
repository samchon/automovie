import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";

type Surface = IAutoMovieHumanBodyBasis["surfaces"][number];

/**
 * Iterative rest-detail filtering on the shared connected skin in metres.
 *
 * The numerical policy has passed surface admission: sweep and ring counts
 * are safe integers, so incrementing the counters can advance to their limits.
 * Direct callers supply the same bounds. Both arrays have the surface's
 * vertex order and length. Each is smoothed by equal-neighbour half steps;
 * the rest residual is expressed in
 * the smoothed normal/tangent frame and restored in the posed frame. A
 * collapsed frame retains the input posed point. The mask is derived from
 * skin influences and topology, not a tissue measurement or contact law.
 * One distinct positive bone influence and open rims are fixed support;
 * mask diffusion cannot activate them. Mixed weights are normalized by their
 * sum, as skinning is, so common-scale changes preserve the mask apart from
 * floating-point roundoff. Duplicate slots name one influence, not several bones.
 *
 * Preparation owns a topology snapshot and the four numerical policy values.
 * A new rest shape is evaluated each call, with no cached geometry. Inputs
 * are unchanged. Aliased rest/posed arrays and an empty active set return the
 * posed array itself; other calls return owned positions. The output rim is
 * held, while intermediate smoothing still moves rim samples. This is not
 * the smoothing-time border pin of the Autodesk node.
 *
 * Autodesk's deltaMush node documents equal-weight iterative Laplacian
 * filtering, local displacements and smoothed frames:
 * https://help.autodesk.com/cloudhelp/ENU/MayaCRE-Tech-Docs/Nodes/deltaMush.html
 * This is the explicitly specified uniform-Laplacian, local-frame and
 * skin-weight policy. Its tangent follows the first sorted neighbour, so
 * changing vertex identities changes that reference; a changed basis needs
 * recompilation. It does not prove volume, clearance, nonpenetration or
 * anatomical motion.
 *
 * @evidence contracts/common.md#principled-implementation Equal-neighbour smoothing is linear and commutes with a shared rigid transform; normalized area normals and the projected reference edge then rotate the rest residual in the same orthonormal frame. A collapsed frame retains the posed sample. This is a numerical rest-detail transport, not a constitutive tissue model.
 * @evidence contracts/common.md#clear-and-simple-design Preparation owns topology and mask, while one returned function evaluates rest and posed smoothing and frame transport. The actual posed-surface consumer owns corrective and sag order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed support comes from positive distinct bone influences and open edges, not names or coordinate thresholds. Mask normalization preserves the skin binding's common-scale meaning without changing caller weights or the existing admission tolerance.
 * @evidence contracts/common.md#meaningful-documentation States the preconditions, metre frame, numerical method, snapshot and return ownership, frame fallback, output-rim policy and the absence of contact or physiological guarantees.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping This numerical filter defines no anatomical part or group; the existing surface owns its shared vertex identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels The basis policy controls numerical sweeps and mask transport, not a named bodily trait; the human document's shape and pose channels remain unchanged.
 * @evidence contracts/modeling.md#emitted-geometry Returns the same XYZ population in the same order; no vertex, triangle, region or subdivision is emitted by this filter.
 * @evidence contracts/modeling.md#spatial-conventions Rest and posed arrays are metre positions in the same right-handed Y-up, Z-forward body frame; local residual projection and reconstruction introduce no unit conversion.
 * @evidence contracts/modeling.md#shared-boundaries Open-edge endpoints retain the caller's posed positions and mask diffusion cannot activate them. Material seams retain their existing common source vertices; this operation does not stitch independent surfaces or solve contact.
 * @evidenceExclude contracts/anatomy.md#anatomical-source This numerical operator introduces no measured tissue value; the basis owns the licensed source geometry and the deformation is not asserted to reproduce tissue physiology.
 * @evidenceExclude contracts/anatomy.md#permitted-range The surface admission owns numerical policy bounds; this operator admits no new clinical shape or joint range and does not establish admissibility of a deformed body.
 * @evidenceExclude contracts/anatomy.md#parametric-authority These arrays and policy are compiler-stage basis inputs, not additional controls in an authored human document.
 */
export function createHumanBodySurfaceMush(
  surface: Surface,
  mush: NonNullable<Surface["mush"]>,
): (rest: number[], posed: number[]) => number[] {
  const count = surface.positions.length / 3;
  const indices = surface.indices.slice();
  const { iterations, blendWidth, spreadRings, spreadDecay } = mush;
  const sets = Array.from({ length: count }, () => new Set<number>());
  const edges = new Map<string, number>();
  for (let t = 0; t < indices.length; t += 3)
    for (let k = 0; k < 3; k++) {
      const a = indices[t + k];
      const b = indices[t + ((k + 1) % 3)];
      sets[a].add(b);
      sets[b].add(a);
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  const neighbours = sets.map((set) => [...set].sort((a, b) => a - b));
  let mask = new Float64Array(count);
  const held = new Uint8Array(count);
  for (let v = 0; v < count; v++) {
    const sums = new Map<number, number>();
    for (let q = 0; q < 4; q++) {
      const bone = surface.skin.boneIndices[v * 4 + q];
      const weight = surface.skin.weights[v * 4 + q];
      if (weight !== 0) sums.set(bone, (sums.get(bone) ?? 0) + weight);
    }
    if (sums.size <= 1) {
      held[v] = 1;
      continue;
    }
    const total = [...sums.values()].reduce((sum, weight) => sum + weight, 0);
    const largest = Math.max(...sums.values());
    mask[v] = Math.min(1, Math.max(0, (1 - largest / total) / blendWidth));
  }
  for (const [key, triangles] of edges)
    if (triangles === 1)
      for (const vertex of key.split(",")) {
        held[Number(vertex)] = 1;
        mask[Number(vertex)] = 0;
      }
  for (let ring = 0; ring < spreadRings; ring++) {
    const previous = mask;
    mask = previous.map((value, v) =>
      held[v] === 1
        ? 0
        : neighbours[v].reduce(
            (most, u) => Math.max(most, spreadDecay * previous[u]),
            value,
          ),
    );
  }
  const active: number[] = [];
  for (let v = 0; v < count; v++) if (mask[v] > 0) active.push(v);

  const smooth = (positions: number[]): Float64Array => {
    let current = Float64Array.from(positions);
    for (let sweep = 0; sweep < iterations; sweep++) {
      const next = new Float64Array(current.length);
      for (let v = 0; v < count; v++) {
        const around = neighbours[v];
        for (let axis = 0; axis < 3; axis++) {
          if (around.length === 0) {
            next[v * 3 + axis] = current[v * 3 + axis];
            continue;
          }
          let sum = 0;
          for (const u of around) sum += current[u * 3 + axis];
          next[v * 3 + axis] =
            0.5 * current[v * 3 + axis] + (0.5 * sum) / around.length;
        }
      }
      current = next;
    }
    return current;
  };
  const normalsOf = (positions: Float64Array): Float64Array => {
    const normals = new Float64Array(positions.length);
    for (let t = 0; t < indices.length; t += 3) {
      const [a, b, c] = [0, 1, 2].map((k) => indices[t + k]);
      const e1 = [0, 1, 2].map(
        (k) => positions[b * 3 + k] - positions[a * 3 + k],
      );
      const e2 = [0, 1, 2].map(
        (k) => positions[c * 3 + k] - positions[a * 3 + k],
      );
      const n = [
        e1[1] * e2[2] - e1[2] * e2[1],
        e1[2] * e2[0] - e1[0] * e2[2],
        e1[0] * e2[1] - e1[1] * e2[0],
      ];
      for (const v of [a, b, c])
        for (let k = 0; k < 3; k++) normals[v * 3 + k] += n[k];
    }
    return normals;
  };
  /** The smoothed surface's frame at a vertex: tangent, bitangent, normal. */
  const frameOf = (
    positions: Float64Array,
    normals: Float64Array,
    v: number,
  ): number[][] | null => {
    const raw = [0, 1, 2].map((k) => normals[v * 3 + k]);
    const size = Math.hypot(raw[0], raw[1], raw[2]);
    const n = raw.map((value) => value / size);
    // toward the first neighbour, the same one on every surface, so the rest
    // and posed frames name the same directions
    const u = neighbours[v][0] ?? v;
    const d = [0, 1, 2].map((k) => positions[u * 3 + k] - positions[v * 3 + k]);
    const along = d[0] * n[0] + d[1] * n[1] + d[2] * n[2];
    const projected = d.map((value, k) => value - along * n[k]);
    const length = Math.hypot(projected[0], projected[1], projected[2]);
    const t = projected.map((value) => value / length);
    const b = [
      n[1] * t[2] - n[2] * t[1],
      n[2] * t[0] - n[0] * t[2],
      n[0] * t[1] - n[1] * t[0],
    ];
    const frame = [t, b, n];
    // a collapsed neighbourhood (no normal, or no direction off it) has no
    // frame, and its vertex keeps the skinned position
    return frame.every((axis) => axis.every(Number.isFinite)) ? frame : null;
  };

  return (rest, posed) => {
    if (rest === posed || active.length === 0) return posed;
    const restSmooth = smooth(rest);
    const restNormals = normalsOf(restSmooth);
    const posedSmooth = smooth(posed);
    const posedNormals = normalsOf(posedSmooth);
    const out = posed.slice();
    for (const v of active) {
      const from = frameOf(restSmooth, restNormals, v);
      const to = frameOf(posedSmooth, posedNormals, v);
      if (from === null || to === null) continue;
      const d = [0, 1, 2].map((k) => rest[v * 3 + k] - restSmooth[v * 3 + k]);
      const local = from.map(
        (axis) => axis[0] * d[0] + axis[1] * d[1] + axis[2] * d[2],
      );
      for (let k = 0; k < 3; k++) {
        const mushed =
          posedSmooth[v * 3 + k] +
          local[0] * to[0][k] +
          local[1] * to[1][k] +
          local[2] * to[2][k];
        out[v * 3 + k] =
          posed[v * 3 + k] + mask[v] * (mushed - posed[v * 3 + k]);
      }
    }
    return out;
  };
}
