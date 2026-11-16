/** Measurements of a proposed common space map, with explicit point correspondence supplied by the caller. */
export namespace FamilyConicDeformationAudit {
  /** A world point or direction; point coordinates are millimetres. */
  export type V3 = [number, number, number];

  /** A point discrepancy resolved across and within a declared section plane, in millimetres. */
  export interface IPoint {
    /** Euclidean distance between the mapped reference point and the candidate. */
    distanceMm: number;

    /** Magnitude of the discrepancy normal to the plane spanned by u and v. */
    normalMm: number;

    /** Magnitude of the remaining discrepancy within that plane. */
    inPlaneMm: number;
  }

  /** An explicitly paired finite column compared with the image of its two actual endpoints. */
  export interface IColumn {
    /** Angle in degrees; null if either complete column has zero length. */
    degrees: number | null;

    /** Discrepancy of the candidate's start and end from their mapped reference points, in millimetres. */
    endpointMm: [number, number];
  }

  /**
   * Compare one explicitly paired point with its image under map. Two independent, possibly nonunit directions specify the section plane.
   * Nonfinite coordinates, arithmetic overflow and a plane with no normal throw; unavailable geometry never becomes a zero discrepancy.
   * The map receives a copied reference point, and its result is consumed during this call.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States correspondence ownership, millimetre units, plane meaning, callback ownership and refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Resolves candidate minus map(reference) along the normalized cross product and its orthogonal plane; normalizing the basis first removes irrelevant basis scales.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One map reading and a fixed-size vector decomposition share the validated vector operations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No nearest-point matching or anatomical pass tolerance is inferred; nonfinite intermediates are refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic after the caller's map evaluation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Pure measurements coordinate no requests or caches.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only fresh fixed-size records and vectors are returned.
   */
  export function point(map: (p: V3) => V3, reference: V3, candidate: V3, u: V3, v: V3): IPoint {
    finite(reference, candidate, u, v);
    const expected: V3 = map([...reference]);
    finite(expected);
    const first: V3 | null = unit(u);
    const second: V3 | null = unit(v);
    const normal: V3 | null = first === null || second === null ? null : unit(cross(first, second));
    if (normal === null) throw new Error("The section plane has no finite normal");
    const error: V3 = minus(candidate, expected);
    const across: number = dot(error, normal);
    return {
      distanceMm: length(error),
      normalMm: Math.abs(across),
      inPlaneMm: length([error[0] - across * normal[0], error[1] - across * normal[1], error[2] - across * normal[2]]),
    };
  }

  /**
   * Compare a finite column with map(end) minus map(start), never with a tangent at its start.
   * Callers declare the corresponding endpoints; equal angles alone do not prove equal endpoint images. Each map result is copied before
   * the next call, so a callback may return a borrowed work vector. Nonfinite coordinates and arithmetic overflow throw.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives correspondence ownership, finite-column meaning, degree/millimetre units, callback ownership and zero-length behavior.
   * @evidence contracts/development/implementation.md#principled-implementation A nonlinear map's secant follows its two images; atan2 of normalized cross/dot products resolves parallel and reversed directions without acos's loss of small angles.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two copied map readings supply the direction and independent endpoint errors through shared vector operations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Zero columns remain unavailable and nonfinite arithmetic throws; no tolerance, clamp or fallback direction changes a measurement.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic after two caller-owned map evaluations.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Pure measurements coordinate no requests or caches.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no source arrays or callbacks beyond the call; inputs/results are copied into fixed-size vectors.
   */
  export function column(map: (p: V3) => V3, reference: [V3, V3], candidate: [V3, V3]): IColumn {
    finite(...reference, ...candidate);
    const start: V3 = [...map([...reference[0]])];
    finite(start);
    const end: V3 = [...map([...reference[1]])];
    finite(end);
    const a: V3 | null = unit(minus(end, start));
    const b: V3 | null = unit(minus(candidate[1], candidate[0]));
    return {
      degrees: a === null || b === null ? null : (180 / Math.PI) * Math.atan2(length(cross(a, b)), dot(a, b)),
      endpointMm: [length(minus(candidate[0], start)), length(minus(candidate[1], end))],
    };
  }

  /** Refuse nonfinite coordinates before any norm or angle can hide them. */
  function finite(...vectors: V3[]): void {
    if (!vectors.every((vector: V3): boolean => vector.every(Number.isFinite))) throw new Error("A deformation audit needs finite coordinates");
  }

  /** Difference of two world vectors, with overflow retained as a refusal. */
  function minus(a: V3, b: V3): V3 {
    const result: V3 = [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    finite(result);
    return result;
  }

  /** Finite Euclidean norm; an unrepresentable measurement is unavailable. */
  function length(vector: V3): number {
    finite(vector);
    const result: number = Math.hypot(...vector);
    if (!Number.isFinite(result)) throw new Error("A deformation measurement overflowed");
    return result;
  }

  /** Unit direction, absent only for an exactly zero vector. */
  function unit(vector: V3): V3 | null {
    const size: number = length(vector);
    return size === 0 ? null : [vector[0] / size, vector[1] / size, vector[2] / size];
  }

  /** Euclidean cross product of normalized directions. */
  function cross(a: V3, b: V3): V3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  /** Euclidean inner product with bounded operands at each call. */
  function dot(a: V3, b: V3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
}