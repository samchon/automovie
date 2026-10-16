import { IAutoMovieSubdivisionSurface } from "./IAutoMovieSubdivisionSurface";

/**
 * Displace a subdivided surface along its normals by one height per vertex,
 * the relief that is finer than a cage can carry, such as an engraved groove
 * or a tendon's ridge.
 *
 * Each vertex moves by its height, metres, outward when positive, along its
 * limit normal, or the normalized mean of its distinct normals where a crease
 * or boundary gives it several; its limit position and its refined control
 * position move alike. Each normal then turns by the change the displacement
 * makes to the mesh's area-weighted normal there: `n + D / |D| - M / |M|`,
 * normalized, where `M` sums the area vectors of the quads that use the
 * normal before the displacement and `D` after it. This is a discrete form of
 * Blinn's (1978) perturbed normal: it adds the tilt the height's slope makes,
 * keeps the exact limit normal wherever every quad around a normal is
 * undisplaced, and agrees with the displaced shape to the mesh's resolution,
 * so relief narrower than about two faces of the subdivided mesh aliases and
 * belongs at a finer level. The orientation check is local to each normal
 * group's aggregate area; it does not certify every face orientation or
 * global absence of self-intersections. The heights usually come from a field evaluated
 * at each vertex's `locateAutoMovieSurfaceVertices` location, which depends
 * on no pose, so a posed surface takes the same heights.
 *
 * @param props.surface The subdivided surface, only read; the result shares its topology, UV and parameter arrays.
 * @param props.heights One height per vertex, metres, finite, positive outward.
 * @returns The displaced surface: new positions, limit positions and normals over the same topology.
 * @throws Error when the heights do not match the vertices or are not finite, or a displacement turns the quads around a normal over.
 *
 * @evidence contracts/common.md#principled-implementation Normal displacement of the limit surface with a discrete perturbed normal, Blinn (1978): the exact limit normal plus the change the displacement makes to the area-weighted vertex normal.
 * @evidence contracts/common.md#clear-and-simple-design Takes plain heights, so the field, its chart and its sampling stay with the caller; two passes over the quads give the normals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A displacement that turns the quads around a normal over is refused instead of flipped back, and the undisplaced normals keep their exact limit values.
 * @evidence contracts/common.md#meaningful-documentation States the direction at creases and boundaries, the normal rule and its source, the resolution limit and where the heights come from.
 * @evidence contracts/performance.md#efficient-algorithms O(V + F) for V vertices and F quads: one pass for the directions, one for the area vectors before and after.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A single pass; the heights, the reusable part across poses, are the caller's.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the result's new arrays are O(V) and owned by the caller.
 */
export const displaceAutoMovieSurface: (props: {
  surface: IAutoMovieSubdivisionSurface;
  heights: ArrayLike<number>;
}) => IAutoMovieSubdivisionSurface = (props: {
  surface: IAutoMovieSubdivisionSurface;
  heights: ArrayLike<number>;
}): IAutoMovieSubdivisionSurface => {
  const { surface, heights }: typeof props = props;
  const vertices: number = surface.limitPositions.length / 3;
  if (heights.length !== vertices)
    throw new Error(`displacement needs ${vertices} heights, one per vertex`);
  for (let v: number = 0; v < vertices; ++v)
    if (!Number.isFinite(heights[v]!))
      throw new Error(`displacement height ${v} is not finite`);
  const normalCount: number = surface.normals.length / 3;
  // each vertex's direction: the sum of its distinct normals, normalized
  const counted: Int32Array = new Int32Array(normalCount).fill(-1);
  const direction: Float64Array = new Float64Array(3 * vertices);
  for (let c: number = 0; c < surface.faces.length; ++c) {
    const v: number = surface.faces[c]!;
    const n: number = surface.normalFaces[c]!;
    if (counted[n] === v) continue;
    counted[n] = v;
    for (let a: number = 0; a < 3; ++a)
      direction[3 * v + a]! += surface.normals[3 * n + a]!;
  }
  const limitPositions: number[] = surface.limitPositions.slice();
  const positions: number[] = surface.positions.slice();
  for (let v: number = 0; v < vertices; ++v) {
    const h: number = heights[v]!;
    if (h === 0) continue;
    const x: number = direction[3 * v]!;
    const y: number = direction[3 * v + 1]!;
    const z: number = direction[3 * v + 2]!;
    const scale: number = h / Math.hypot(x, y, z);
    for (let a: number = 0; a < 3; ++a) {
      const step: number = direction[3 * v + a]! * scale;
      limitPositions[3 * v + a]! += step;
      positions[3 * v + a]! += step;
    }
  }
  // area vectors of the quads around each normal, before and after
  const before: Float64Array = new Float64Array(3 * normalCount);
  const after: Float64Array = new Float64Array(3 * normalCount);
  function area(
    points: readonly number[],
    f: number,
    out: Float64Array,
    n: number,
  ): void {
    const p0: number = 3 * surface.faces[f]!;
    const p1: number = 3 * surface.faces[f + 1]!;
    const p2: number = 3 * surface.faces[f + 2]!;
    const p3: number = 3 * surface.faces[f + 3]!;
    const ax: number = points[p2]! - points[p0]!;
    const ay: number = points[p2 + 1]! - points[p0 + 1]!;
    const az: number = points[p2 + 2]! - points[p0 + 2]!;
    const bx: number = points[p3]! - points[p1]!;
    const by: number = points[p3 + 1]! - points[p1 + 1]!;
    const bz: number = points[p3 + 2]! - points[p1 + 2]!;
    out[3 * n]! += ay * bz - az * by;
    out[3 * n + 1]! += az * bx - ax * bz;
    out[3 * n + 2]! += ax * by - ay * bx;
  }
  for (let f: number = 0; f < surface.faces.length; f += 4)
    for (let k: number = 0; k < 4; ++k) {
      const n: number = surface.normalFaces[f + k]!;
      area(surface.limitPositions, f, before, n);
      area(limitPositions, f, after, n);
    }
  const normals: number[] = surface.normals.slice();
  for (let n: number = 0; n < normalCount; ++n) {
    const mx: number = before[3 * n]!;
    const my: number = before[3 * n + 1]!;
    const mz: number = before[3 * n + 2]!;
    const dx: number = after[3 * n]!;
    const dy: number = after[3 * n + 1]!;
    const dz: number = after[3 * n + 2]!;
    if (mx === dx && my === dy && mz === dz) continue;
    if (!(mx * dx + my * dy + mz * dz > 0))
      throw new Error(`displacement turns the surface over at normal ${n}`);
    const m: number = Math.hypot(mx, my, mz);
    const d: number = Math.hypot(dx, dy, dz);
    const x: number = surface.normals[3 * n]! + dx / d - mx / m;
    const y: number = surface.normals[3 * n + 1]! + dy / d - my / m;
    const z: number = surface.normals[3 * n + 2]! + dz / d - mz / m;
    const length: number = Math.hypot(x, y, z);
    if (!(length > 0))
      throw new Error(`displacement turns the surface over at normal ${n}`);
    normals[3 * n] = x / length;
    normals[3 * n + 1] = y / length;
    normals[3 * n + 2] = z / length;
  }
  return { ...surface, positions, limitPositions, normals };
};
