import type { IAutoMovieMesh } from "@automovie/interface";

import { areaWeightedNormals } from "../../../common/mesh/areaWeightedNormals";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisSurface } from "../../structures/IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieHumanFaceOcularSurfaceShape } from "../../structures/IAutoMovieHumanFaceOcularSurfaceShape";
import type { IAutoMovieHumanFacePeriocularCage } from "../../structures/IAutoMovieHumanFacePeriocularCage";
import type { IAutoMovieHumanFacePeriocularMedialBed } from "../../structures/IAutoMovieHumanFacePeriocularMedialBed";
import type { IAutoMovieHumanFacePeriocularStation } from "../../structures/IAutoMovieHumanFacePeriocularStation";
import { createHumanFaceSkinHost } from "../skin/createHumanFaceSkinHost";
import { evaluateHumanFaceMaterialPatch } from "./evaluateHumanFaceMaterialPatch";
import type { IHumanFaceMaterialPatchGeometry } from "./structures/IHumanFaceMaterialPatchGeometry";

/**
 * Raise medial relief on the source-registered pocket and plica edge path.
 *
 * The pocket contributes its actual resident skin triangles. Relief vanishes
 * on their boundary, preserving the native join. Caruncle relief follows the
 * normalized distance to that boundary; plica relief follows distance to the
 * registered path, with width cornerLength/12. Both envelopes are authored
 * coarse conventions, not measured tissue anatomy. Source skin and its normals
 * transport the patch under shape and pose; no ocular or head-axis sheet
 * replaces the pocket. Absence is handled by the caller's legacy convention.
 *
 * @evidence contracts/common.md#principled-implementation The registered native medial disk or source material patch is refined and clipped on its actual source incidence before authored relief follows the host normal.
 * @evidence contracts/common.md#clear-and-simple-design Native path/seat lookup owns source attachment while this operation owns two midpoint refinements, clipping and final resident normals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Extent overflow, absent resident boundary or invalid host geometry refuse; Gaussian relief remains an authored convention, not recovered anatomy.
 * @evidence contracts/common.md#meaningful-documentation The prose states metric source frame, millimetre relief, exact attachment origin and source-normal transport.
 * @evidence contracts/performance.md#efficient-algorithms Source or material-patch preparation/copying includes its actual host mesh size. Two subdivision rounds create up to sixteen child triangles per pocket triangle; refined vertex distance scans include all boundary and plica segments.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared edge midpoint/intersection maps reuse each incidence cut and retained source geometry supplies every relief sample.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned mesh arrays own the constructed patch; refinement/path/edge temporaries expire without retaining a task or global cache.
 */
export function buildHumanFaceMedialBedSurface(
  basis: IAutoMovieHumanFaceBasis,
  cage: IAutoMovieHumanFacePeriocularCage,
  positions: readonly number[],
  profile: IAutoMovieHumanFaceOcularSurfaceShape,
): IAutoMovieMesh {
  const bed: IAutoMovieHumanFacePeriocularMedialBed | undefined =
    cage.medialBed;
  const source: IAutoMovieHumanFaceBasisSurface | undefined =
    basis.surfaces.find(
      (surface: IAutoMovieHumanFaceBasisSurface): boolean =>
        surface.id === cage.surface,
    );
  if (bed === undefined || source === undefined)
    throw new Error(
      "Medial relief needs its registered skin pocket and plica path.",
    );
  const material: IHumanFaceMaterialPatchGeometry | undefined =
    bed.materialPatch === undefined
      ? undefined
      : evaluateHumanFaceMaterialPatch(bed.materialPatch, source, positions);
  const plicaVertices: number[] = bed.materialPatch?.plica ?? bed.plicaVertices;
  const initialPositions: number[] = material?.positions ?? [...positions];
  const vertices: Set<number> = new Set(
    material === undefined
      ? bed.pocketVertices
      : Array.from(
          { length: material.positions.length / 3 },
          (_value: unknown, at: number): number => at,
        ),
  );
  if (
    plicaVertices.length < 2 ||
    [...vertices, ...plicaVertices].some(
      (vertex: number): boolean =>
        !Number.isSafeInteger(vertex) ||
        vertex < 0 ||
        3 * vertex + 2 >= initialPositions.length,
    )
  )
    throw new Error(
      "Medial relief registration has a nonresident skin vertex.",
    );
  let triangles: number[] = [];
  const edges: Map<string, number[]> = new Map<string, number[]>();
  const hostIndices: number[] = material?.indices ?? source.indices;
  for (let at: number = 0; at < hostIndices.length; at += 3) {
    const face: number[] = hostIndices.slice(at, at + 3);
    if (!face.every((vertex: number): boolean => vertices.has(vertex)))
      continue;
    triangles.push(...face);
    for (let corner: number = 0; corner < 3; corner++) {
      const a: number = face[corner],
        b: number = face[(corner + 1) % 3];
      const key: string = Math.min(a, b) + ":" + Math.max(a, b);
      const entry: number[] | undefined = edges.get(key);
      if (entry === undefined) edges.set(key, [a, b, 1]);
      else entry[2]++;
    }
  }
  let boundary: number[][] = [...edges.values()].filter(
    (edge: number[]): boolean => edge[2] === 1,
  );
  if (triangles.length === 0 || boundary.length === 0)
    throw new Error(
      "Medial relief needs a resident skin patch with a boundary.",
    );
  if (
    plicaVertices.some((vertex: number): boolean => !vertices.has(vertex)) ||
    plicaVertices
      .slice(1)
      .some(
        (vertex: number, at: number): boolean =>
          !edges.has(
            Math.min(vertex, plicaVertices[at]) +
              ":" +
              Math.max(vertex, plicaVertices[at]),
          ),
      )
  )
    throw new Error(
      "Medial relief plica path must follow the registered pocket's resident edges.",
    );
  const samples: number[] = [...initialPositions];
  const directions: number[] = material?.normals ?? [
    ...createHumanFaceSkinHost(source.indices, positions).normals,
  ];
  const point: (vertex: number) => number[] = (vertex: number): number[] =>
    samples.slice(3 * vertex, 3 * vertex + 3);
  const margin: IAutoMovieHumanFacePeriocularStation | undefined =
    cage.stations.find(
      (station: IAutoMovieHumanFacePeriocularStation): boolean =>
        station.role === "posteriorMargin",
    );
  if (margin === undefined)
    throw new Error("Medial relief needs its actual posterior margin.");
  const origin: number = positions[3 * margin.vertices[cage.medialColumn]];
  const towards: number = Math.sign(
    positions[3 * margin.vertices[cage.upperColumns[1]]] - origin,
  );
  const extent: number = profile.cornerLength / 1000;
  let span: number = -Infinity;
  for (const vertex of vertices)
    span = Math.max(span, towards * (point(vertex)[0] - origin));
  if (towards === 0 || !(extent > 0) || extent > span)
    throw new Error(
      "Medial relief extent exceeds its registered skin pocket's support: requested " +
        extent +
        " m, support " +
        span +
        " m.",
    );
  // Midpoints are shared by adjacent source triangles, so subdivision adds
  // interior relief samples while preserving the original patch boundary.
  for (let level: number = 0; level < 2; level++) {
    const shared: Map<string, number> = new Map<string, number>();
    const midpoint: (a: number, b: number) => number = (
      a: number,
      b: number,
    ): number => {
      const key: string = Math.min(a, b) + ":" + Math.max(a, b);
      const existing: number | undefined = shared.get(key);
      if (existing !== undefined) return existing;
      const vertex: number = samples.length / 3;
      const normal: number[] = [0, 1, 2].map(
        (axis: number): number =>
          directions[3 * a + axis] + directions[3 * b + axis],
      );
      const length: number = Math.hypot(...normal);
      if (!(length > 0))
        throw new Error(
          "Medial patch subdivision needs compatible skin normals.",
        );
      samples.push(
        ...point(a).map(
          (value: number, axis: number): number =>
            (value + samples[3 * b + axis]) / 2,
        ),
      );
      directions.push(...normal.map((value: number): number => value / length));
      shared.set(key, vertex);
      return vertex;
    };
    const refined: number[] = [];
    for (let at: number = 0; at < triangles.length; at += 3) {
      const a: number = triangles[at],
        b: number = triangles[at + 1],
        c: number = triangles[at + 2];
      const ab: number = midpoint(a, b),
        bc: number = midpoint(b, c),
        ca: number = midpoint(c, a);
      refined.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
    }
    triangles = refined;
  }
  // Clip the actual host to the requested medial-to-iris extent. Crossing
  // edges share their intersection, retaining a continuous resident patch.
  const cuts: Map<string, number> = new Map<string, number>();
  const depth: (vertex: number) => number = (vertex: number): number =>
    towards * (point(vertex)[0] - origin);
  const cut: (a: number, b: number) => number = (
    a: number,
    b: number,
  ): number => {
    if (depth(a) === extent) return a;
    if (depth(b) === extent) return b;
    const key: string = Math.min(a, b) + ":" + Math.max(a, b);
    const prior: number | undefined = cuts.get(key);
    if (prior !== undefined) return prior;
    const t: number = (extent - depth(a)) / (depth(b) - depth(a));
    const vertex: number = samples.length / 3;
    const normal: number[] = [0, 1, 2].map(
      (axis: number): number =>
        directions[3 * a + axis] * (1 - t) + directions[3 * b + axis] * t,
    );
    const length: number = Math.hypot(...normal);
    if (!(length > 0))
      throw new Error("Medial relief cut needs compatible host normals.");
    samples.push(
      ...point(a).map(
        (value: number, axis: number): number =>
          value * (1 - t) + samples[3 * b + axis] * t,
      ),
    );
    directions.push(...normal.map((value: number): number => value / length));
    cuts.set(key, vertex);
    return vertex;
  };
  const clipped: number[] = [];
  for (let at: number = 0; at < triangles.length; at += 3) {
    const face: number[] = triangles.slice(at, at + 3);
    const polygon: number[] = [];
    for (let corner: number = 0; corner < 3; corner++) {
      const a: number = face[corner],
        b: number = face[(corner + 1) % 3];
      if (depth(a) <= extent) polygon.push(a);
      if (
        (depth(a) < extent && depth(b) > extent) ||
        (depth(a) > extent && depth(b) < extent)
      )
        polygon.push(cut(a, b));
    }
    for (let corner: number = 1; corner + 1 < polygon.length; corner++)
      clipped.push(polygon[0], polygon[corner], polygon[corner + 1]);
  }
  triangles = clipped;
  const clippedEdges: Map<string, number[]> = new Map<string, number[]>();
  for (let at: number = 0; at < triangles.length; at += 3)
    for (let corner: number = 0; corner < 3; corner++) {
      const a: number = triangles[at + corner],
        b: number = triangles[at + ((corner + 1) % 3)];
      const key: string = Math.min(a, b) + ":" + Math.max(a, b);
      const edge: number[] | undefined = clippedEdges.get(key);
      if (edge === undefined) clippedEdges.set(key, [a, b, 1]);
      else edge[2]++;
    }
  boundary = [...clippedEdges.values()].filter(
    (edge: number[]): boolean => edge[2] === 1,
  );
  if (triangles.length === 0 || boundary.length === 0)
    throw new Error("Medial relief extent leaves no supported skin patch.");
  const distance: (
    p: readonly number[],
    a: readonly number[],
    b: readonly number[],
  ) => number = (
    p: readonly number[],
    a: readonly number[],
    b: readonly number[],
  ): number => {
    const d: number[] = b.map(
      (value: number, axis: number): number => value - a[axis],
    );
    const squared: number = d.reduce(
      (sum: number, value: number): number => sum + value * value,
      0,
    );
    const t: number =
      squared === 0
        ? 0
        : Math.min(
            1,
            Math.max(
              0,
              d.reduce(
                (sum: number, value: number, axis: number): number =>
                  sum + value * (p[axis] - a[axis]),
                0,
              ) / squared,
            ),
          );
    return Math.hypot(
      ...p.map(
        (value: number, axis: number): number => value - a[axis] - t * d[axis],
      ),
    );
  };
  const path: number[][][] = plicaVertices
    .slice(1)
    .map((vertex: number, at: number): number[][] => [
      point(plicaVertices[at]),
      point(vertex),
    ]);
  if (
    !path.some(
      ([a, b]: number[][]): boolean =>
        Math.hypot(
          ...a.map((value: number, axis: number): number => value - b[axis]),
        ) > 0,
    )
  )
    throw new Error("Medial relief needs a nonzero registered plica path.");
  const resident: number[] = [...new Set(triangles)];
  const border: number[] = resident.map((vertex: number): number =>
    boundary.reduce(
      (nearest: number, [a, b]: number[]): number =>
        Math.min(nearest, distance(point(vertex), point(a), point(b))),
      Infinity,
    ),
  );
  const maximum: number = border.reduce(
    (maximum: number, value: number): number => Math.max(maximum, value),
    -Infinity,
  );
  const width: number = profile.cornerLength / 12000;
  const output: number[] = resident.flatMap(
    (vertex: number, at: number): number[] => {
      const p: number[] = point(vertex);
      const weight: number = maximum === 0 ? 0 : border[at] / maximum;
      const near: number = path.reduce(
        (nearest: number, [a, b]: number[][]): number =>
          Math.min(nearest, distance(p, a, b)),
        Infinity,
      );
      const fold: number = width === 0 ? 0 : Math.exp(-((near / width) ** 2));
      const height: number =
        (weight *
          (profile.caruncleProjection + profile.plicaProjection * fold)) /
        1000;
      return p.map(
        (value: number, axis: number): number =>
          value + directions[3 * vertex + axis] * height,
      );
    },
  );
  const lookup: Map<number, number> = new Map(
    resident.map((vertex: number, at: number): [number, number] => [
      vertex,
      at,
    ]),
  );
  const indices: number[] = triangles.map(
    (vertex: number): number => lookup.get(vertex)!,
  );
  return {
    positions: output,
    indices,
    normals: areaWeightedNormals(output, indices),
    uvs: null,
    skin: null,
  };
}
