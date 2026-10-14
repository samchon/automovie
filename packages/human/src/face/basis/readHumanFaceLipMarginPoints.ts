import { interpolateAutoMovieTrianglePoint } from "@automovie/engine";

import { HumanExactFraction as F } from "../../common/measure/HumanExactFraction";
import { HumanExactFractionJson } from "../../common/measure/HumanExactFractionJson";
import { createHumanFaceAttachmentChartHost } from "../anatomy/eye/createHumanFaceAttachmentChartHost";
import type { IAutoMovieHumanFaceBasisSurface } from "../structures/IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieHumanFaceLipMargin } from "../structures/IAutoMovieHumanFaceLipMargin";
import type { IAutoMovieHumanFaceLipMaterialCourse } from "../structures/IAutoMovieHumanFaceLipMaterialCourse";
import type { IHumanFaceLipMarginPoint } from "./IHumanFaceLipMarginPoint";
import type { IHumanFaceLipMarginPoints } from "./IHumanFaceLipMarginPoints";
import { identifyHumanFaceMaterialPoint } from "./identifyHumanFaceMaterialPoint";
import type { IAutoMovieHumanFaceAttachmentPoint as IAutoMovieHumanFaceAttachmentPointImported } from "../structures/IAutoMovieHumanFaceAttachmentPoint";
import type { IAutoMovieVector3 as IAutoMovieVector3Imported } from "@automovie/interface";
import type { IHumanExactFraction as IHumanExactFractionImported } from "../../common/measure/IHumanExactFraction";
import type { IHumanExactFractionJson as IHumanExactFractionJsonImported } from "../../common/measure/IHumanExactFractionJson";


/** Read legacy vertices and continuous native seats through one geometry owner.
 * Persisted exact correspondence is verified before its one represented weight
 * conversion. Every consumer then uses the engine's unchanged multiply/add
 * interpolation; no reader-specific coefficient normalization enters.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Legacy vertices and native chart seats become one point representation. Native exact fractions must sum to one and convert exactly to persisted represented weights; canonical source-parent identities and native-vertex flags are rederived before unchanged engine interpolation. Current closure/export callers supply the same registered surface layout.
 * @evidence contracts/common.md#clear-and-simple-design One reader owns correspondence admission for both course forms, keeping downstream graph, closure and physical-source owners independent from chart encoding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing dense metadata, unsupported facets, mismatched exact weights/identities or nonfinite points refuse; no coefficient normalization, coordinate welding or sampled replacement reconstructs lost support.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes persisted exact support from its single represented conversion and shared engine interpolation; returned metre points retain original support, identities and optional native vertex.
 * @evidence contracts/performance.md#efficient-algorithms Legacy work follows margin vertices; native work validates the chart/stops and each seat, scans registered source triangles for membership and performs bigint fraction reductions. Cost includes support sorting and operand bit length, not constant arithmetic independent of the chart.
 * @evidence contracts/performance.md#reuse-equivalent-work Each course validates its chart once and uses the common exact identity/interpolation owners; no cross-pose point cache is retained because positions change while support stays fixed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned point/support arrays scale with the two complete courses; exact fractions and chart-validation temporaries are local and no source buffer is mutated or external resource acquired.
 */
export function readHumanFaceLipMarginPoints(
  surface: IAutoMovieHumanFaceBasisSurface,
  margin: IAutoMovieHumanFaceLipMargin,
  positions: readonly number[],
): IHumanFaceLipMarginPoints {
  if (positions.length !== surface.positions.length || positions.length % 3 !== 0)
    throw new Error("Lip margin needs the same native position layout.");
  const count: number = positions.length / 3;
  const vertex: (id: number) => IHumanFaceLipMarginPoint = (id: number): IHumanFaceLipMarginPoint => {
    if (!Number.isInteger(id) || id < 0 || id >= count)
      throw new Error("Lip margin names an absent resident vertex.");
    const point: { x: number; y: number; z: number; } = { x: positions[3 * id], y: positions[3 * id + 1], z: positions[3 * id + 2] };
    if (![point.x, point.y, point.z].every(Number.isFinite))
      throw new Error("Lip margin point must be finite.");
    return { point, vertices: [id], weights: [1], nativeVertex: id,
      identity: "skin:" + (surface.sourcePartition?.samples[id] ?? id) };
  };
  const course: (data: IAutoMovieHumanFaceLipMaterialCourse) => IHumanFaceLipMarginPoint[] = (data: IAutoMovieHumanFaceLipMaterialCourse): IHumanFaceLipMarginPoint[] => {
    createHumanFaceAttachmentChartHost(data.chart, surface);
    if (data.points.length < 2 || data.exactWeights.length !== data.points.length ||
        data.identities.length !== data.points.length || data.nativeVertices.length !== data.points.length ||
        data.stops.length < 2)
      throw new Error("Native lip course needs complete ordered point/station metadata.");
    for (let ordinal: number = 0; ordinal < data.stops.length; ordinal++) {
      const at: number = data.stops[ordinal];
      if (!Number.isInteger(at) || at < 0 || at >= data.points.length ||
          (ordinal > 0 && at < data.stops[ordinal - 1]))
        throw new Error("Native lip course needs complete ordered point/station metadata.");
    }
    for (let at: number = 0; at < data.points.length; at++)
      if (data.points[at] === undefined || data.points[at] === null ||
          data.exactWeights[at] === undefined || data.exactWeights[at] === null ||
          typeof data.identities[at] !== "string" || data.nativeVertices[at] === undefined)
        throw new Error("Native lip course needs dense point/correspondence metadata.");
    return data.points.map((seat: IAutoMovieHumanFaceAttachmentPointImported, at: number): { point: IAutoMovieVector3Imported; vertices: number[]; weights: number[]; nativeVertex: number | null; identity: string; }  => {
      if (!Number.isInteger(seat.triangle) || !data.chart.sourceTriangles.includes(seat.triangle) ||
          seat.weights.length !== 3 || data.exactWeights[at].length !== 3)
        throw new Error("Native lip point needs an actual registered source facet.");
      const exact: IHumanExactFractionImported[] = data.exactWeights[at].map((value: IHumanExactFractionJsonImported): IHumanExactFractionImported  => HumanExactFractionJson.decode(value));
      if (exact.some((weight: IHumanExactFractionImported, axis: number): boolean  => weight.numerator < 0n || F.number(weight) !== seat.weights[axis]) ||
          F.compare(exact.reduce((sum: IHumanExactFractionImported, weight: IHumanExactFractionImported): IHumanExactFractionImported  => F.add(sum, weight), F.create(0n)), F.create(1n)) !== 0)
        throw new Error("Native lip represented weights differ from persisted exact support.");
      const vertices: number[] = surface.indices.slice(3 * seat.triangle, 3 * seat.triangle + 3);
      const support: { id: number; weight: IHumanExactFractionImported; }[] = vertices.map((id: number, axis: number): { id: number; weight: IHumanExactFractionImported; }  => ({ id, weight: exact[axis] }))
        .filter((item: { id: number; weight: IHumanExactFractionImported; }): boolean  => item.weight.numerator !== 0n)
        .sort((a: { id: number; weight: IHumanExactFractionImported; }, b: { id: number; weight: IHumanExactFractionImported; }): number  => surface.sourcePartition!.samples[a.id] - surface.sourcePartition!.samples[b.id]);
      const identity: string = identifyHumanFaceMaterialPoint(surface, seat.triangle, exact);
      const nativeVertex: number | null = support.length === 1 && support[0].weight.numerator === support[0].weight.denominator ? support[0].id : null;
      if (identity !== data.identities[at] || nativeVertex !== data.nativeVertices[at])
        throw new Error("Native lip point lost its original source-parent/anchor identity.");
      const point: IAutoMovieVector3Imported = interpolateAutoMovieTrianglePoint(vertices.map((id: number): IAutoMovieVector3Imported  => vertex(id).point), seat.weights);
      return { point, vertices, weights: [...seat.weights], nativeVertex,
        identity: nativeVertex === null ? "skin:" + data.chart.generation + ":" + identity : vertex(nativeVertex).identity };
    });
  };
  return margin.kind === "material"
    ? { upper: course(margin.upper), lower: course(margin.lower) }
    : { upper: margin.upper.map(vertex), lower: margin.lower.map(vertex) };
}
