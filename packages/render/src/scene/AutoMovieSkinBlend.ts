import * as THREE from "three";

/**
 * The per-vertex arithmetic of {@link AutoMovieSkinnedMesh}'s CPU skin, over a
 * joint table of {@link AutoMovieSkinBlend.STRIDE} numbers per joint: `K_j`
 * (16, column-major), its rotation quaternion (4) and its dual part (4).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the table layout and each formula.
 * @evidence contracts/development/design.md#principled-representation Represents The per-vertex arithmetic of 's CPU skin, over a joint table of numbers per joint: `K_j` (16, column-major), its rotation quaternion (4) and its dual part (4): companion namespace of 7 members (`STRIDE`, `GPU_RELATIVE_ERROR`, `dual`, `linear`, `usedJoints`, `packed`, ...); units and frames named in its text: quaternion. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieSkinBlend` in packages/viewer/src/AutoMovieSkinBlend.ts; its surface is the 7 members listed and the text shows 2 other files naming it, mostly packages/viewer (2), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieSkinBlend {
  /** Numbers per joint in a table: `K_j`, rotation, dual part. */
  export const STRIDE: number = 24;

  /** 64 float32 roundings, 64 * 2^-24, relative to the largest coordinate. */
  export const GPU_RELATIVE_ERROR: number = 2 ** -18;

  /**
   * Dual quaternion blend of one vertex from the table entries at offsets
   * `a..d`: align each influence to the largest-weight one (lowest slot on a
   * tie), sum, normalize by the rotation's length and apply; a direction takes
   * the rotation alone. Writes three numbers into `out` at `at`.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Kavan et al.'s DLB with the shader's pivot rule and the action p' = r p r* + vec(2 d r*).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One flat function the evaluation loop calls per vertex.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fallback to linear blending.
   * @evidence contracts/development/common.md#meaningful-documentation States pivot, alignment, normalization and the direction case.
   * @evidence contracts/development/implementation.md#efficient-algorithms About a hundred flops, no allocation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the shared joint table.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Writes only into `out`.
   */
  export function dual(
    t: Float64Array,
    a: number,
    b: number,
    c: number,
    d: number,
    wa: number,
    wb: number,
    wc: number,
    wd: number,
    px: number,
    py: number,
    pz: number,
    point: boolean,
    out: Float32Array | Float64Array,
    at: number,
  ): void {
    let p: number = a;
    let best: number = wa;
    if (wb > best) {
      best = wb;
      p = b;
    }
    if (wc > best) {
      best = wc;
      p = c;
    }
    if (wd > best) p = d;
    const ka: number = aligned(t, a, p) * wa;
    const kb: number = aligned(t, b, p) * wb;
    const kc: number = aligned(t, c, p) * wc;
    const kd: number = aligned(t, d, p) * wd;
    let rx: number =
      ka * t[a + 16]! + kb * t[b + 16]! + kc * t[c + 16]! + kd * t[d + 16]!;
    let ry: number =
      ka * t[a + 17]! + kb * t[b + 17]! + kc * t[c + 17]! + kd * t[d + 17]!;
    let rz: number =
      ka * t[a + 18]! + kb * t[b + 18]! + kc * t[c + 18]! + kd * t[d + 18]!;
    let rw: number =
      ka * t[a + 19]! + kb * t[b + 19]! + kc * t[c + 19]! + kd * t[d + 19]!;
    let dx: number =
      ka * t[a + 20]! + kb * t[b + 20]! + kc * t[c + 20]! + kd * t[d + 20]!;
    let dy: number =
      ka * t[a + 21]! + kb * t[b + 21]! + kc * t[c + 21]! + kd * t[d + 21]!;
    let dz: number =
      ka * t[a + 22]! + kb * t[b + 22]! + kc * t[c + 22]! + kd * t[d + 22]!;
    let dw: number =
      ka * t[a + 23]! + kb * t[b + 23]! + kc * t[c + 23]! + kd * t[d + 23]!;
    const norm: number = Math.sqrt(rx * rx + ry * ry + rz * rz + rw * rw);
    rx /= norm;
    ry /= norm;
    rz /= norm;
    rw /= norm;
    dx /= norm;
    dy /= norm;
    dz /= norm;
    dw /= norm;

    // v + 2 r x (r x v + w v), then the translation 2 (w d - dw r + r x d)
    const cx: number = ry * pz - rz * py + rw * px;
    const cy: number = rz * px - rx * pz + rw * py;
    const cz: number = rx * py - ry * px + rw * pz;
    let x: number = px + 2 * (ry * cz - rz * cy);
    let y: number = py + 2 * (rz * cx - rx * cz);
    let z: number = pz + 2 * (rx * cy - ry * cx);
    if (point) {
      x += 2 * (rw * dx - dw * rx + (ry * dz - rz * dy));
      y += 2 * (rw * dy - dw * ry + (rz * dx - rx * dz));
      z += 2 * (rw * dz - dw * rz + (rx * dy - ry * dx));
    }
    out[at] = x;
    out[at + 1] = y;
    out[at + 2] = z;
  }

  /**
   * Weighted sum of `K_j p` over the four influences at offsets `a..d`,
   * Three's linear blend over normalized weights. Writes three numbers into
   * `out` at `at`.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The matrix blend Three's SkinnedMesh and its shader compute.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The linear counterpart of dual.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Weights are used as given, never renormalized; a zero weight contributes zero.
   * @evidence contracts/development/common.md#meaningful-documentation States the formula and output.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most four affine products, no allocation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the shared joint table.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Writes only into `out`.
   */
  export function linear(
    t: Float64Array,
    a: number,
    b: number,
    c: number,
    d: number,
    wa: number,
    wb: number,
    wc: number,
    wd: number,
    px: number,
    py: number,
    pz: number,
    out: Float32Array,
    at: number,
  ): void {
    out[at] =
      affine(t, a, 0, px, py, pz) * wa +
      affine(t, b, 0, px, py, pz) * wb +
      affine(t, c, 0, px, py, pz) * wc +
      affine(t, d, 0, px, py, pz) * wd;
    out[at + 1] =
      affine(t, a, 1, px, py, pz) * wa +
      affine(t, b, 1, px, py, pz) * wb +
      affine(t, c, 1, px, py, pz) * wc +
      affine(t, d, 1, px, py, pz) * wd;
    out[at + 2] =
      affine(t, a, 2, px, py, pz) * wa +
      affine(t, b, 2, px, py, pz) * wb +
      affine(t, c, 2, px, py, pz) * wc +
      affine(t, d, 2, px, py, pz) * wd;
  }

  /**
   * Skeleton slots with a nonzero weight on some vertex, ascending.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A slot with zero weight everywhere contributes nothing to either blend, so only these enter keys and bounds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Shared by the cache key and the joint-only sphere.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads the actual attributes, never the joint list's length.
   * @evidence contracts/development/common.md#meaningful-documentation States the order.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(V) once per geometry version.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller keeps the result per geometry version.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a caller-owned array.
   */
  export function usedJoints(
    indices: THREE.BufferAttribute,
    weights: THREE.BufferAttribute,
  ): Int32Array {
    const used: Set<number> = new Set();
    for (let v: number = 0; v < indices.count; ++v) {
      if (weights.getX(v) !== 0) used.add(indices.getX(v));
      if (weights.getY(v) !== 0) used.add(indices.getY(v));
      if (weights.getZ(v) !== 0) used.add(indices.getZ(v));
      if (weights.getW(v) !== 0) used.add(indices.getW(v));
    }
    return Int32Array.from(
      [...used].sort((x: number, y: number): number => x - y),
    );
  }

  /**
   * The backing array of a tightly packed, unnormalized attribute of `size`
   * components, else null so the caller reads through Three's accessors.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Only a plain BufferAttribute's array equals its components.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Lets the evaluation loop index arrays directly when that is exact.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Interleaved or normalized attributes keep Three's decoding.
   * @evidence contracts/development/common.md#meaningful-documentation States when null is returned.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows the attribute's array.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function packed(
    attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
    size: number,
  ): THREE.TypedArray | null {
    return attribute instanceof THREE.BufferAttribute &&
      !attribute.normalized &&
      attribute.itemSize === size
      ? attribute.array
      : null;
  }

  /**
   * An attribute's version; an interleaved one reports its buffer's.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Three bumps these versions on every needsUpdate.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One read for both attribute kinds.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No content hashing stands in for the version.
   * @evidence contracts/development/common.md#meaningful-documentation States the interleaved case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Lets caches key on attribute writes.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function versionOf(
    attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
  ): number {
    return attribute instanceof THREE.InterleavedBufferAttribute
      ? attribute.data.version
      : attribute.version;
  }
}

/** Row `row` of the joint at `o` applied to the point, `(K_j p)[row]`. */
function affine(
  t: Float64Array,
  o: number,
  row: number,
  px: number,
  py: number,
  pz: number,
): number {
  return (
    t[o + row]! * px +
    t[o + 4 + row]! * py +
    t[o + 8 + row]! * pz +
    t[o + 12 + row]!
  );
}

/** -1 when the rotation at `o` lies in the other hemisphere from the pivot's at `p`, else 1. */
function aligned(t: Float64Array, o: number, p: number): number {
  return t[o + 16]! * t[p + 16]! +
    t[o + 17]! * t[p + 17]! +
    t[o + 18]! * t[p + 18]! +
    t[o + 19]! * t[p + 19]! <
    0
    ? -1
    : 1;
}
