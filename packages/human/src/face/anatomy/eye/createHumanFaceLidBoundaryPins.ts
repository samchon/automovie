import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceLidBoundaryPinsInput } from "./structures/IHumanFaceLidBoundaryPinsInput";

/**
 * Fill one source-owned closed boundary's displacement constraints by native
 * edge arc length. Between adjacent pinned samples, displacement is affine in
 * the accumulated three-dimensional native-edge length. The final span wraps
 * through the closing edge. A single pin defines a constant displacement.
 *
 * This is an authored interpolation convention, not a tissue material law or
 * a measurement of anatomical motion. The publisher supplies actual native
 * incidence and ordering; this helper neither rediscovers a path nor projects
 * the boundary onto a plane. It checks a simple canonical-sample cycle and
 * finite positive edge lengths. Exact source identities unify seam aliases;
 * contradictory alias pins refuse rather than selecting one by order.
 *
 * All quantities remain in the existing head-local metre frame. Pin values
 * retain their exact components without unit conversion or interpolation.
 * Caller positions, pin vectors and maps are never changed, including on
 * failure. The returned map addresses only the supplied boundary vertices;
 * the annulus displacement owner expands their source aliases. Changes
 * invalidate that displacement field and its seated geometry derivatives.
 *
 * @evidence contracts/common.md#principled-implementation Accumulated native-edge arc length linearly interpolates displacement between canonical-source pins around the closed cycle.
 * @evidence contracts/common.md#clear-and-simple-design The publisher owns actual ordered incidence while this helper validates the simple sample cycle and returns only boundary constraints.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contradictory seam-alias pins or invalid lengths refuse; interpolation is an authored convention rather than a tissue constitutive law.
 * @evidence contracts/common.md#meaningful-documentation The prose states head-local metres, unchanged exact pins, caller immutability and downstream source-alias expansion.
 * @evidence contracts/performance.md#efficient-algorithms Complete position/sample admission scans V native vertices before N cycle vertices and P pins are processed. Edge lengths and disjoint interpolation spans add O(N+P) time and storage; returned displacement storage is O(N), with no copy of the full host geometry.
 * @evidence contracts/performance.md#reuse-equivalent-work Each native-edge length is computed once and reused by adjacent interpolation weights; canonical-source pins share one fixed map.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned displacement map; fixed/length/anchor tables expire and no geometry or task remains retained.
 */
export function createHumanFaceLidBoundaryPins(
  input: IHumanFaceLidBoundaryPinsInput,
): Map<number, IAutoMovieVector3> {
  const {
    positions,
    samples,
    boundaryVertices,
    pins,
  }: IHumanFaceLidBoundaryPinsInput = input;
  if (
    positions.length !== 3 * samples.length ||
    !positions.every(Number.isFinite) ||
    !samples.every(
      (sample: number): boolean => Number.isSafeInteger(sample) && sample >= 0,
    ) ||
    boundaryVertices.length < 3
  )
    throw new Error(
      "Lid boundary pins need finite native positions and a cycle.",
    );
  const sampleAt: (vertex: number) => number = (vertex: number): number => {
    if (!Number.isSafeInteger(vertex) || vertex < 0 || vertex >= samples.length)
      throw new Error("Lid boundary pins reference an absent source vertex.");
    return samples[vertex];
  };
  const cycleSamples: number[] = boundaryVertices.map(sampleAt);
  if (new Set(cycleSamples).size !== boundaryVertices.length)
    throw new Error("Lid boundary pins need a simple canonical-source cycle.");
  const fixed: Map<number, IAutoMovieVector3> = new Map<
    number,
    IAutoMovieVector3
  >();
  for (const [vertex, delta] of pins) {
    const sample: number = sampleAt(vertex);
    if (![delta.x, delta.y, delta.z].every(Number.isFinite))
      throw new Error("Lid boundary pins need finite displacement components.");
    const previous: IAutoMovieVector3 | undefined = fixed.get(sample);
    if (
      previous !== undefined &&
      (previous.x !== delta.x ||
        previous.y !== delta.y ||
        previous.z !== delta.z)
    )
      throw new Error(
        "Lid boundary pins have contradictory source-alias values.",
      );
    fixed.set(sample, { x: delta.x, y: delta.y, z: delta.z });
  }
  const lengths: number[] = boundaryVertices.map(
    (vertex: number, at: number): number => {
      const next: number = boundaryVertices[(at + 1) % boundaryVertices.length];
      const length: number = Math.hypot(
        positions[3 * next] - positions[3 * vertex],
        positions[3 * next + 1] - positions[3 * vertex + 1],
        positions[3 * next + 2] - positions[3 * vertex + 2],
      );
      if (!(length > 0 && Number.isFinite(length)))
        throw new Error(
          "Lid boundary pins need finite positive native-edge lengths.",
        );
      return length;
    },
  );
  const anchors: number[] = cycleSamples.flatMap(
    (sample: number, at: number): number[] => (fixed.has(sample) ? [at] : []),
  );
  if (anchors.length === 0)
    throw new Error("Lid boundary pins need at least one pinned cycle sample.");
  const result: Map<number, IAutoMovieVector3> = new Map<
    number,
    IAutoMovieVector3
  >();
  if (anchors.length === 1) {
    const delta: IAutoMovieVector3 = fixed.get(cycleSamples[anchors[0]])!;
    for (const vertex of boundaryVertices)
      result.set(vertex, { x: delta.x, y: delta.y, z: delta.z });
    return result;
  }
  for (let span: number = 0; span < anchors.length; span++) {
    const start: number = anchors[span];
    const end: number = anchors[(span + 1) % anchors.length];
    const count: number =
      (end - start + boundaryVertices.length) % boundaryVertices.length ||
      boundaryVertices.length;
    const left: IAutoMovieVector3 = fixed.get(cycleSamples[start])!;
    const right: IAutoMovieVector3 = fixed.get(cycleSamples[end])!;
    let total: number = 0;
    for (let step: number = 0; step < count; step++)
      total += lengths[(start + step) % boundaryVertices.length];
    if (!(total > 0 && Number.isFinite(total)))
      throw new Error("Lid boundary pins exceed finite native span length.");
    let travelled: number = 0;
    for (let step: number = 0; step < count; step++) {
      const at: number = (start + step) % boundaryVertices.length;
      const t: number = travelled / total;
      const delta: { x: number; y: number; z: number } =
        step === 0
          ? { x: left.x, y: left.y, z: left.z }
          : {
              x: (1 - t) * left.x + t * right.x,
              y: (1 - t) * left.y + t * right.y,
              z: (1 - t) * left.z + t * right.z,
            };
      if (![delta.x, delta.y, delta.z].every(Number.isFinite))
        throw new Error(
          "Lid boundary interpolation exceeds finite displacement.",
        );
      result.set(boundaryVertices[at], delta);
      travelled += lengths[at];
    }
  }
  return result;
}
