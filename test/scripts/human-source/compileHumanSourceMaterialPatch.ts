import { HumanExactFraction as F } from "@automovie/human/common/measure/HumanExactFraction";
import type { IHumanExactFraction } from "@automovie/human/common/measure/IHumanExactFraction";
import type { IAutoMovieHumanFaceMaterialPatch } from "@automovie/human/face/structures/IAutoMovieHumanFaceMaterialPatch";

import type { IHumanSourceMaterialClipPoint } from "./structures/IHumanSourceMaterialClipPoint.ts";
import { traceHumanSourceMaterialBoundary } from "./traceHumanSourceMaterialBoundary.ts";
import { compileHumanSourceMaterialDisk } from "./compileHumanSourceMaterialDisk.ts";

/**
 * Intersect actual native triangles with one source-authored material region.
 * A simple, possibly concave loop is ear-decomposed with exact represented
 * predicates in the registered positive native disk. World-space frontal
 * projection is not a material coordinate: it can fold or collapse a curved
 * endpoint star. The same disk supplies every boundary point and clipped cell.
 * Shared support stencils, not coincident XYZ, own
 * intersections. Original native vertices retain their identities at t=0/1.
 * The actual edge-connected component at the medial endpoint owns the patch;
 * ambiguous seeds, open incidence and missing connector endpoints refuse.
 * Native boundary registration precedes disk selection, so a narrow anchor
 * corridor cannot replace the ordered source contour. The actual native
 * lower-to-upper connector is plica support; no clinical boundary is inferred.
 */
export function compileHumanSourceMaterialPatch(
  positions: readonly number[],
  indices: readonly number[],
  anchors: readonly number[],
  medial: number,
  upper: number,
  lower: number,
  generation: string,
  surface: string,
  samples: readonly number[],
): IAutoMovieHumanFaceMaterialPatch {
  const zero = F.create(0n),
    one = F.create(1n);
  if (
    positions.length % 3 ||
    indices.length % 3 ||
    positions.some((value) => !Number.isFinite(value)) ||
    anchors.length < 3 ||
    new Set(anchors).size !== anchors.length ||
    [...indices, ...anchors].some(
      (vertex) =>
        !Number.isSafeInteger(vertex) ||
        vertex < 0 ||
        3 * vertex + 2 >= positions.length,
    )
  )
    throw new Error(
      "Material clipping needs complete finite source triangles and distinct loop identities.",
    );
  const boundary = traceHumanSourceMaterialBoundary(
    indices, positions.length / 3, anchors, upper, lower,
  );
  const loop = boundary.loop;
  const chart = compileHumanSourceMaterialDisk(
    generation, surface, indices, samples, loop,
  );
  const chartVertices = new Map(chart.vertices.map((vertex, at) => [vertex, at]));
  const coordinate = (vertex: number): number[] => {
    const at = chartVertices.get(vertex);
    if (at === undefined)
      throw new Error("Material region leaves its registered native disk.");
    return [chart.coordinates[at * 2], chart.coordinates[at * 2 + 1]];
  };
  const sourcePoints = new Map<number, IHumanExactFraction[]>();
  const xyz = (vertex: number): IHumanExactFraction[] => {
    let point = sourcePoints.get(vertex);
    if (point === undefined) {
      point = coordinate(vertex).map((value) => F.from(value));
      sourcePoints.set(vertex, point);
    }
    return point;
  };
  const orient = (
    a: readonly IHumanExactFraction[],
    b: readonly IHumanExactFraction[],
    c: readonly IHumanExactFraction[],
  ): IHumanExactFraction =>
    F.subtract(
      F.multiply(F.subtract(b[0], a[0]), F.subtract(c[1], a[1])),
      F.multiply(F.subtract(b[1], a[1]), F.subtract(c[0], a[0])),
    );
  const sign = (value: IHumanExactFraction): number =>
    value.numerator < 0n ? -1 : value.numerator > 0n ? 1 : 0;
  const between = (
    value: IHumanExactFraction,
    a: IHumanExactFraction,
    b: IHumanExactFraction,
  ): boolean =>
    F.compare(value, F.compare(a, b) <= 0 ? a : b) >= 0 &&
    F.compare(value, F.compare(a, b) >= 0 ? a : b) <= 0;
  const on = (
    p: readonly IHumanExactFraction[],
    a: readonly IHumanExactFraction[],
    b: readonly IHumanExactFraction[],
  ): boolean =>
    sign(orient(a, b, p)) === 0 &&
    between(p[0], a[0], b[0]) &&
    between(p[1], a[1], b[1]);
  for (let i = 0; i < loop.length; i++)
    for (let j = i + 1; j < loop.length; j++) {
      if (j === i + 1 || (i === 0 && j === loop.length - 1)) continue;
      const a = xyz(loop[i]),
        b = xyz(loop[(i + 1) % loop.length]),
        c = xyz(loop[j]),
        d = xyz(loop[(j + 1) % loop.length]);
      if (
        on(a, c, d) ||
        on(b, c, d) ||
        on(c, a, b) ||
        on(d, a, b) ||
        (sign(orient(a, b, c)) * sign(orient(a, b, d)) < 0 &&
          sign(orient(c, d, a)) * sign(orient(c, d, b)) < 0)
      )
        throw new Error(
          "Material region projection must be a simple source loop.",
        );
    }
  let area = zero;
  for (let i = 0; i < loop.length; i++) {
    const a = xyz(loop[i]),
      b = xyz(loop[(i + 1) % loop.length]);
    area = F.add(
      area,
      F.subtract(F.multiply(a[0], b[1]), F.multiply(a[1], b[0])),
    );
  }
  if (sign(area) === 0)
    throw new Error("Material region has no projected area.");
  const polygon = sign(area) > 0 ? [...loop] : [...loop].reverse();
  const windows: number[][] = [];
  while (polygon.length > 3) {
    let found = false;
    for (let at = 0; at < polygon.length; at++) {
      const a = polygon[(at + polygon.length - 1) % polygon.length],
        b = polygon[at],
        c = polygon[(at + 1) % polygon.length];
      const turn = sign(orient(xyz(a), xyz(b), xyz(c)));
      if (turn === 0) {
        polygon.splice(at, 1);
        found = true;
        break;
      }
      if (
        turn < 0 ||
        polygon.some(
          (vertex) =>
            vertex !== a &&
            vertex !== b &&
            vertex !== c &&
            sign(orient(xyz(a), xyz(b), xyz(vertex))) >= 0 &&
            sign(orient(xyz(b), xyz(c), xyz(vertex))) >= 0 &&
            sign(orient(xyz(c), xyz(a), xyz(vertex))) >= 0,
        )
      )
        continue;
      windows.push([a, b, c]);
      polygon.splice(at, 1);
      found = true;
      break;
    }
    if (!found)
      throw new Error(
        "Material region cannot be decomposed without crossing its source boundary.",
      );
  }
  const lastTurn = sign(
    orient(xyz(polygon[0]), xyz(polygon[1]), xyz(polygon[2])),
  );
  if (lastTurn < 0)
    throw new Error(
      "Material region decomposition reversed its final source window.",
    );
  if (lastTurn > 0) windows.push(polygon);
  const points: IAutoMovieHumanFaceMaterialPatch["points"] = [];
  const exactPoints: IHumanExactFraction[][] = [];
  const keys = new Map<string, number>();
  const nativePoint = new Map<number, number>();
  const faces: number[][] = [],
    faceKeys = new Set<string>();
  const pointIndex = (
    point: IHumanSourceMaterialClipPoint,
    triangle: number,
    corners: readonly number[],
  ): number => {
    const support = corners
      .flatMap((vertex, at) =>
        point.weights[at].numerator === 0n
          ? []
          : [[vertex, point.weights[at]] as const],
      )
      .sort((a, b) => a[0] - b[0]);
    const key = support
      .map(
        ([vertex, weight]) =>
          vertex + ":" + weight.numerator + "/" + weight.denominator,
      )
      .join(";");
    const previous = keys.get(key);
    if (previous !== undefined) return previous;
    const at = points.length;
    keys.set(key, at);
    points.push({
      triangle,
      weights: point.weights.map((value) => F.number(value)),
    });
    exactPoints.push(point.coordinates);
    if (support.length === 1 && F.compare(support[0][1], one) === 0)
      nativePoint.set(support[0][0], at);
    return at;
  };
  const minX = Math.min(...loop.map((v) => coordinate(v)[0])),
    maxX = Math.max(...loop.map((v) => coordinate(v)[0]));
  const minY = Math.min(...loop.map((v) => coordinate(v)[1])),
    maxY = Math.max(...loop.map((v) => coordinate(v)[1]));
  for (const triangle of chart.sourceTriangles) {
    const corners = indices.slice(3 * triangle, 3 * triangle + 3);
    if (
      Math.max(...corners.map((v) => coordinate(v)[0])) < minX ||
      Math.min(...corners.map((v) => coordinate(v)[0])) > maxX ||
      Math.max(...corners.map((v) => coordinate(v)[1])) < minY ||
      Math.min(...corners.map((v) => coordinate(v)[1])) > maxY
    )
      continue;
    for (const window of windows) {
      let clipped: IHumanSourceMaterialClipPoint[] = corners.map(
        (vertex, at) => ({
          coordinates: xyz(vertex),
          weights: [0, 1, 2].map((i) => (i === at ? one : zero)),
        }),
      );
      for (let edge = 0; edge < 3 && clipped.length !== 0; edge++) {
        const a = xyz(window[edge]),
          b = xyz(window[(edge + 1) % 3]),
          input = clipped;
        clipped = [];
        for (let at = 0; at < input.length; at++) {
          const first = input[at],
            last = input[(at + 1) % input.length];
          const da = orient(a, b, first.coordinates),
            db = orient(a, b, last.coordinates);
          if (sign(da) >= 0) clipped.push(first);
          if (sign(da) * sign(db) < 0) {
            const t = F.divide(da, F.subtract(da, db));
            const interpolate = (
              x: readonly IHumanExactFraction[],
              y: readonly IHumanExactFraction[],
            ): IHumanExactFraction[] =>
              x.map((value, axis) =>
                F.add(value, F.multiply(t, F.subtract(y[axis], value))),
              );
            clipped.push({
              coordinates: interpolate(first.coordinates, last.coordinates),
              weights: interpolate(first.weights, last.weights),
            });
          }
        }
      }
      if (clipped.length < 3) continue;
      for (let at = 1; at + 1 < clipped.length; at++) {
        const vertices = [clipped[0], clipped[at], clipped[at + 1]];
        const determinant = orient(
          vertices[0].weights.slice(1),
          vertices[1].weights.slice(1),
          vertices[2].weights.slice(1),
        );
        if (sign(determinant) === 0) continue;
        if (sign(determinant) < 0)
          throw new Error(
            "Material clipping reversed its native source triangle.",
          );
        const face = vertices.map((point) =>
          pointIndex(point, triangle, corners),
        );
        const key = triangle + ":" + [...face].sort((a, b) => a - b).join(":");
        if (!faceKeys.has(key)) {
          faceKeys.add(key);
          faces.push(face);
        }
      }
    }
  }
  const medialPoint = nativePoint.get(medial),
    upperPoint = nativePoint.get(upper),
    lowerPoint = nativePoint.get(lower);
  if (
    medialPoint === undefined ||
    upperPoint === undefined ||
    lowerPoint === undefined
  ) {
    const endpoints = [medial, upper, lower].map((vertex, at) => ({
      role: ["medial", "upper", "lower"][at],
      vertex,
      point: positions.slice(3 * vertex, 3 * vertex + 3),
      retainedPoint: nativePoint.get(vertex) ?? null,
      nativeTriangles: Array.from(
        { length: indices.length / 3 },
        (_value, triangle) => triangle,
      ).filter((triangle) =>
        indices.slice(3 * triangle, 3 * triangle + 3).includes(vertex),
      ),
    }));
    throw new Error(
      "Clipped material patch must retain all actual canthal bed endpoints: " +
        JSON.stringify({
          generation,
          surface,
          endpoints,
          loop,
          windows,
          clippedTriangles: faces.length,
          materialPoints: points.length,
        }),
    );
  }
  const edgeKey = (a: number, b: number): string =>
    Math.min(a, b) + ":" + Math.max(a, b);
  const incident = new Map<string, number[]>();
  faces.forEach((face, at) => {
    for (let i = 0; i < 3; i++) {
      const key = edgeKey(face[i], face[(i + 1) % 3]),
        owners = incident.get(key) ?? [];
      owners.push(at);
      incident.set(key, owners);
      if (owners.length > 2)
        throw new Error(
          "Clipped material region has non-manifold source incidence.",
        );
    }
  });
  const seeds = faces.flatMap((face, at) =>
    face.includes(medialPoint) ? [at] : [],
  );
  if (seeds.length === 0)
    throw new Error(
      "Clipped material patch has no area at its medial endpoint.",
    );
  const selected = new Set<number>([seeds[0]]),
    queue = [seeds[0]];
  for (let at = 0; at < queue.length; at++)
    for (let edge = 0; edge < 3; edge++) {
      const face = faces[queue[at]];
      for (const other of incident.get(
        edgeKey(face[edge], face[(edge + 1) % 3]),
      )!)
        if (!selected.has(other)) {
          selected.add(other);
          queue.push(other);
        }
    }
  if (seeds.some((seed) => !selected.has(seed)))
    throw new Error(
      "Clipped medial endpoint belongs to ambiguous native components.",
    );
  const retainedFaces = [...selected].map((at) => faces[at]);
  const retained = new Set(retainedFaces.flat());
  if (!retained.has(upperPoint) || !retained.has(lowerPoint))
    throw new Error(
      "The actual clipped medial component does not reach both bed endpoints.",
    );
  const successor = new Map<number, number>(),
    incoming = new Map<number, number>();
  const connector = new Map<number, number[]>();
  const connectorSegments = boundary.connector.slice(1).map((vertex, at) =>
    [xyz(boundary.connector[at]), xyz(vertex)],
  );
  for (const at of selected)
    for (let edge = 0; edge < 3; edge++) {
      const a = faces[at][edge],
        b = faces[at][(edge + 1) % 3];
      if (
        incident.get(edgeKey(a, b))!.filter((owner) => selected.has(owner))
          .length !== 1
      )
        continue;
      if (successor.has(a) || incoming.has(b))
        throw new Error("Clipped material boundary branches.");
      successor.set(a, b);
      incoming.set(b, a);
      if (
        connectorSegments.some(([start, end]) =>
          on(exactPoints[a], start, end) && on(exactPoints[b], start, end),
        )
      ) {
        connector.set(a, [...(connector.get(a) ?? []), b]);
        connector.set(b, [...(connector.get(b) ?? []), a]);
      }
    }
  if (
    successor.size === 0 ||
    [...successor.keys()].some((point) => !incoming.has(point))
  )
    throw new Error("Clipped material boundary is open.");
  const boundaries: number[][] = [],
    visited = new Set<number>();
  for (const first of successor.keys()) {
    if (visited.has(first)) continue;
    const boundary: number[] = [];
    let point = first;
    do {
      if (visited.has(point))
        throw new Error("Clipped material boundary does not close once.");
      boundary.push(point);
      visited.add(point);
      point = successor.get(point)!;
    } while (point !== first);
    boundaries.push(boundary);
  }
  const plica = [lowerPoint];
  while (plica[plica.length - 1] !== upperPoint) {
    const current = plica[plica.length - 1],
      previous = plica[plica.length - 2];
    const next = (connector.get(current) ?? []).filter(
      (point) => point !== previous,
    );
    if (next.length !== 1 || plica.includes(next[0]))
      throw new Error(
        "Clipped plica connector must preserve one native lower-to-upper path.",
      );
    plica.push(next[0]);
  }
  const members = [...retained].sort((a, b) => a - b),
    remap = new Map(members.map((point, at) => [point, at]));
  const originalVertices = new Map(
    [...nativePoint].map(([vertex, point]) => [point, vertex]),
  );
  return {
    generation,
    surface,
    points: members.map((point) => points[point]),
    nativeVertices: members.map((point) => originalVertices.get(point) ?? null),
    indices: retainedFaces.flatMap((face) =>
      face.map((point) => remap.get(point)!),
    ),
    boundaries: boundaries.map((boundary) =>
      boundary.map((point) => remap.get(point)!),
    ),
    plica: plica.map((point) => remap.get(point)!),
    medialEndpoint: remap.get(medialPoint)!,
    upperEndpoint: remap.get(upperPoint)!,
    lowerEndpoint: remap.get(lowerPoint)!,
    qualification: "authoredConvention",
  };
}
