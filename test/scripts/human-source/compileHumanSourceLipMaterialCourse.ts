import { interpolateAutoMovieTrianglePoint } from "@automovie/engine";
import { HumanExactFraction as F } from "@automovie/human/common/measure/HumanExactFraction";
import { HumanExactFractionJson } from "@automovie/human/common/measure/HumanExactFractionJson";
import type { IHumanExactFractionJson } from "@automovie/human/common/measure/IHumanExactFractionJson";
import { resolveHumanFaceApertureUp } from "@automovie/human/face/basis/resolveHumanFaceApertureUp";
import { identifyHumanFaceMaterialPoint } from "@automovie/human/face/basis/identifyHumanFaceMaterialPoint";
import type { IAutoMovieHumanFaceAttachmentPoint } from "@automovie/human/face/structures/IAutoMovieHumanFaceAttachmentPoint";

import { compileHumanSourceMaterialDisk } from "./compileHumanSourceMaterialDisk.ts";
import { compileHumanSourceMonotoneFacetCourse } from "./compileHumanSourceMonotoneFacetCourse.ts";
import type { IAutoMovieHumanFaceLipMaterialCourse } from "@automovie/human/face/structures/IAutoMovieHumanFaceLipMaterialCourse";
import type { IHumanSourceLipMaterialCourseInput } from "./structures/IHumanSourceLipMaterialCourseInput.ts";

/**
 * Register unchanged contact stations as a continuous native material course.
 * Native along-level slabs and exact critical-port correspondence construct
 * the path on the complete component before a positive disk is registered.
 * Every used native facet contributes its full corner stars to that disk.
 * No XYZ inversion, nearest-sheet selection or added geometry enters.
 *
 * The source path is an authored construction, not a distance/geodesic claim.
 * Every lifted endpoint is read by the canonical represented interpolation;
 * its actual source along/height must support the two closure consumers.
 * Failure states unsupported source registration, not nonexistence of another
 * continuous monotone surface path. The source geometry and stops stay owned
 * by their original publisher. This producer is wired with native margin
 * admission, gain, measurement and oral/relief consumers in the same unit.
 */
export function compileHumanSourceLipMaterialCourse(
  input: IHumanSourceLipMaterialCourseInput,
): IAutoMovieHumanFaceLipMaterialCourse {
  const source = input.surface, partition = source.sourcePartition;
  if (partition === undefined || input.stops.length < 2)
    throw new Error("Continuous lip registration needs actual source partition and ordered stops.");
  const members = new Set(input.component);
  if (input.stops.some((vertex) => !members.has(vertex)))
    throw new Error("Continuous lip stops leave their registered vermilion component.");
  const native = new Map<string, number>();
  for (let at = 0; at < source.indices.length; at += 3)
    native.set(source.indices.slice(at, at + 3).join("/"), at / 3);
  const indices: number[] = [], triangles: number[] = [];
  for (let at = 0; at < input.regionIndices.length; at += 3) {
    const corners = input.regionIndices.slice(at, at + 3);
    if (!corners.every((vertex) => members.has(vertex))) continue;
    const triangle = native.get(corners.join("/"));
    if (triangle === undefined)
      throw new Error("Continuous lip region has no identical oriented native facet.");
    indices.push(...corners);
    triangles.push(triangle);
  }
  const seats = compileHumanSourceMonotoneFacetCourse(input);
  const usedTriangles = new Set(seats.map((seat) => seat.triangle));
  const anchors = [...new Set([...input.stops, ...[...usedTriangles].flatMap((triangle) =>
    source.indices.slice(3 * triangle, 3 * triangle + 3))])];
  const chart = compileHumanSourceMaterialDisk(
    partition.generation, source.id, indices, partition.samples, anchors,
  );
  chart.sourceTriangles = chart.sourceTriangles.map((triangle) => triangles[triangle]);
  if ([...usedTriangles].some((triangle) => !chart.sourceTriangles.includes(triangle)))
    throw new Error("Source material disk omitted an actual continuous-course native facet.");
  const points: IAutoMovieHumanFaceAttachmentPoint[] = [], nativeVertices: (number | null)[] = [];
  const identities: string[] = [];
  const exactWeights: IHumanExactFractionJson[][] = [];
  for (const seat of seats) {
      const corners = source.indices.slice(3 * seat.triangle, 3 * seat.triangle + 3);
      const support = corners.map((vertex, axis) => ({ vertex, weight: seat.weights[axis] }))
        .filter((item) => item.weight.numerator !== 0n).sort((a, b) => partition.samples[a.vertex] - partition.samples[b.vertex]);
      const identity = identifyHumanFaceMaterialPoint(source, seat.triangle, seat.weights);
      if (identity === identities.at(-1)) continue;
      identities.push(identity);
      points.push({ triangle: seat.triangle, weights: seat.weights.map((weight) => F.number(weight)) });
      exactWeights.push(seat.weights.map((weight) => HumanExactFractionJson.encode(weight)));
      nativeVertices.push(support.length === 1 && support[0].weight.numerator === support[0].weight.denominator ? support[0].vertex : null);
    }
  const up = resolveHumanFaceApertureUp(input.axis);
  const coordinates = points.map((seat, coordinatesIndex) => {
    const corners = source.indices.slice(3 * seat.triangle, 3 * seat.triangle + 3).map((vertex) => ({
      x: source.positions[3 * vertex], y: source.positions[3 * vertex + 1], z: source.positions[3 * vertex + 2],
    }));
    const point = interpolateAutoMovieTrianglePoint(corners, seat.weights);
    const exact = exactWeights[coordinatesIndex].map((weight) => HumanExactFractionJson.decode(weight));
    const exactPoint = [0, 1, 2].map((axis) => corners.reduce((sum, corner, at) =>
      F.add(sum, F.multiply(exact[at], F.from([corner.x, corner.y, corner.z][axis]))), F.create(0n)));
    const exactAlong = exactPoint.reduce((sum, value, axis) => F.add(sum, F.multiply(value, F.from(input.axis[axis]))), F.create(0n));
    const exactHeight = exactPoint.reduce((sum, value, axis) => F.add(sum, F.multiply(value, F.from([up.x, up.y, up.z][axis]))), F.create(0n));
    return { along: point.x * input.axis[0] + point.y * input.axis[1] + point.z * input.axis[2], height: point.x * up.x + point.y * up.y + point.z * up.z, exactAlong, exactHeight };
  });
  const violations = coordinates.flatMap((point, at) => {
    if (at === 0) return [];
    const before = coordinates[at - 1];
    const exactDirection = F.compare(point.exactAlong, before.exactAlong);
    const exactHeightDifference = F.compare(point.exactHeight, before.exactHeight);
    const representedFailure = point.along < before.along || (point.along === before.along && point.height !== before.height);
    const exactFailure = exactDirection < 0 || (exactDirection === 0 && exactHeightDifference !== 0);
    if (!representedFailure) return [];
    return [{ from: at - 1, to: at, representedFailure, exactFailure,
      kind: exactDirection < 0 ? "nativeAlongRegression" : exactDirection === 0 && exactHeightDifference !== 0 ? "equalAlongDifferentHeight" : "representedInterpolation",
      points: [at - 1, at].map((index) => ({
        seat: points[index], exactWeights: exactWeights[index], identity: identities[index], nativeVertex: nativeVertices[index],
        along: coordinates[index].along, height: coordinates[index].height,
        exactAlong: HumanExactFractionJson.encode(coordinates[index].exactAlong), exactHeight: HumanExactFractionJson.encode(coordinates[index].exactHeight),
      })),
    }];
  });
  if (violations.length !== 0)
    throw new Error("Source material lip course is unsupported as an along-monotone single-height trajectory: " + JSON.stringify({
      sourceSurface: source.id, generation: partition.generation, axis: input.axis, up,
      originalStops: input.stops.map((vertex) => ({ vertex, position: source.positions.slice(3 * vertex, 3 * vertex + 3) })), violations,
    }));
  const stops = input.stops.map((vertex) => nativeVertices.indexOf(vertex));
  if (stops.some((at, ordinal) => at < 0 || (ordinal > 0 && at < stops[ordinal - 1])))
    throw new Error("Continuous native lip course lost or reordered an original source stop.");
  return { chart, points, exactWeights, identities, nativeVertices, stops };
}
