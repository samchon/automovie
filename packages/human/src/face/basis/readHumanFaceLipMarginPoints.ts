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

/** Read legacy vertices and continuous native seats through one geometry owner.
 * Persisted exact correspondence is verified before its one represented weight
 * conversion. Every consumer then uses the engine's unchanged multiply/add
 * interpolation; no reader-specific coefficient normalization enters.
 *
 * @evidence contracts/common.md#principled-implementation Same-generation native incidence, exact persisted weights and represented interpolation are verified together.
 * @evidence contracts/common.md#clear-and-simple-design One reader supplies both source representations to contact, oral and relief consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid source/weight identity refuses rather than reseating or renormalizing.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes exact support from the canonical represented point.
 * @evidence contracts/modeling.md#spatial-conventions Supplied source/posed positions use canonical head-frame metres.
 * @evidence contracts/modeling.md#shared-boundaries Stable parent/weight identities serve every joined consumer.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Reads existing skin without making a part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation Assemblies own rendering.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Reads registration without clinical acquisition.
 * @evidenceExclude contracts/anatomy.md#permitted-range Physical consumers own tissue and residual limits.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal coordinates.
 * @author Samchon
 */
export function readHumanFaceLipMarginPoints(
  surface: IAutoMovieHumanFaceBasisSurface,
  margin: IAutoMovieHumanFaceLipMargin,
  positions: readonly number[],
): IHumanFaceLipMarginPoints {
  if (positions.length !== surface.positions.length || positions.length % 3 !== 0)
    throw new Error("Lip margin needs the same native position layout.");
  const count = positions.length / 3;
  const vertex = (id: number): IHumanFaceLipMarginPoint => {
    if (!Number.isInteger(id) || id < 0 || id >= count)
      throw new Error("Lip margin names an absent resident vertex.");
    const point = { x: positions[3 * id], y: positions[3 * id + 1], z: positions[3 * id + 2] };
    if (![point.x, point.y, point.z].every(Number.isFinite))
      throw new Error("Lip margin point must be finite.");
    return { point, vertices: [id], weights: [1], nativeVertex: id,
      identity: "skin:" + (surface.sourcePartition?.samples[id] ?? id) };
  };
  const course = (data: IAutoMovieHumanFaceLipMaterialCourse): IHumanFaceLipMarginPoint[] => {
    createHumanFaceAttachmentChartHost(data.chart, surface);
    if (data.points.length < 2 || data.exactWeights.length !== data.points.length ||
        data.identities.length !== data.points.length || data.nativeVertices.length !== data.points.length ||
        data.stops.length < 2)
      throw new Error("Native lip course needs complete ordered point/station metadata.");
    for (let ordinal = 0; ordinal < data.stops.length; ordinal++) {
      const at = data.stops[ordinal];
      if (!Number.isInteger(at) || at < 0 || at >= data.points.length ||
          (ordinal > 0 && at < data.stops[ordinal - 1]))
        throw new Error("Native lip course needs complete ordered point/station metadata.");
    }
    for (let at = 0; at < data.points.length; at++)
      if (data.points[at] === undefined || data.points[at] === null ||
          data.exactWeights[at] === undefined || data.exactWeights[at] === null ||
          typeof data.identities[at] !== "string" || data.nativeVertices[at] === undefined)
        throw new Error("Native lip course needs dense point/correspondence metadata.");
    return data.points.map((seat, at) => {
      if (!Number.isInteger(seat.triangle) || !data.chart.sourceTriangles.includes(seat.triangle) ||
          seat.weights.length !== 3 || data.exactWeights[at].length !== 3)
        throw new Error("Native lip point needs an actual registered source facet.");
      const exact = data.exactWeights[at].map((value) => HumanExactFractionJson.decode(value));
      if (exact.some((weight, axis) => weight.numerator < 0n || F.number(weight) !== seat.weights[axis]) ||
          F.compare(exact.reduce((sum, weight) => F.add(sum, weight), F.create(0n)), F.create(1n)) !== 0)
        throw new Error("Native lip represented weights differ from persisted exact support.");
      const vertices = surface.indices.slice(3 * seat.triangle, 3 * seat.triangle + 3);
      const support = vertices.map((id, axis) => ({ id, weight: exact[axis] }))
        .filter((item) => item.weight.numerator !== 0n)
        .sort((a, b) => surface.sourcePartition!.samples[a.id] - surface.sourcePartition!.samples[b.id]);
      const identity = identifyHumanFaceMaterialPoint(surface, seat.triangle, exact);
      const nativeVertex = support.length === 1 && support[0].weight.numerator === support[0].weight.denominator ? support[0].id : null;
      if (identity !== data.identities[at] || nativeVertex !== data.nativeVertices[at])
        throw new Error("Native lip point lost its original source-parent/anchor identity.");
      const point = interpolateAutoMovieTrianglePoint(vertices.map((id) => vertex(id).point), seat.weights);
      return { point, vertices, weights: [...seat.weights], nativeVertex,
        identity: nativeVertex === null ? "skin:" + data.chart.generation + ":" + identity : vertex(nativeVertex).identity };
    });
  };
  return margin.kind === "material"
    ? { upper: course(margin.upper), lower: course(margin.lower) }
    : { upper: margin.upper.map(vertex), lower: margin.lower.map(vertex) };
}
