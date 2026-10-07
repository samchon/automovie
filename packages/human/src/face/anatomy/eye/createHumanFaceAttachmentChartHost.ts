import type { IAutoMovieHumanFaceAttachmentChart } from "../../structures/IAutoMovieHumanFaceAttachmentChart";
import type { IAutoMovieHumanFaceAttachmentPoint } from "../../structures/IAutoMovieHumanFaceAttachmentPoint";
import type { IAutoMovieHumanFaceBasisSurface } from "../../structures/IAutoMovieHumanFaceBasisSurface";
import type { IHumanFaceSkinSeat } from "../skin/IHumanFaceSkinSeat";
import type { IHumanFaceAttachmentChartHost } from "./structures/IHumanFaceAttachmentChartHost";

/**
 * Read a source-owned material disk without projecting free spatial points.
 * Every chart triangle must reproduce its host triangle and canonical sample
 * identities. Positive chart area supplies the barycentric denominator; the
 * producer owns disk embedding and nonoverlap. A chart point therefore reads
 * an actual piece of the current skin even where spatial nearest-point
 * projection would collapse several stations onto one edge.
 *
 * This reader keeps dimensionless chart coordinates separate from metric
 * distances. It admits no nearest-chart fallback, area tolerance or renamed
 * topology; a missing location remains a source-domain refusal.
 * Admission and every later query share privately copied material vertex,
 * coordinate and triangle tables. The caller retains its chart and host;
 * this reader stores neither host geometry nor continuation metadata.
 *
 * @evidence contracts/common.md#principled-implementation Oriented 2D area coordinates locate a point in one positive source triangle and retain that triangle's original host incidence.
 * @evidence contracts/common.md#clear-and-simple-design One immutable coordinate and triangle table answers station coordinates and actual skin attachments.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact source IDs and oriented incidence replace coordinate welding or nearest-point retries.
 * @evidence contracts/common.md#meaningful-documentation States producer embedding responsibility, exact correspondence, units and refusal.
 * @evidence contracts/modeling.md#shared-boundaries The returned seat addresses the original skin triangle, so drawing and tissue attachment share one current surface.
 * @evidence contracts/modeling.md#spatial-conventions Only dimensionless u,v and host triangle IDs enter; the skin host supplies head-frame metres later.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Reads attachment metadata without assigning a rendered part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Source material coordinates add no personal authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits resident attachment seats rather than render primitives.
 * @evidenceExclude contracts/modeling.md#rendered-observation Attached tissue and assembly consumers own observation; this numerical reader has no separate display.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The chart carries source topology, not measured tissue dimensions.
 * @evidenceExclude contracts/anatomy.md#permitted-range Source-domain admission supplies no physiological interval.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal authoring input.
 */
export function createHumanFaceAttachmentChartHost(
  chart: IAutoMovieHumanFaceAttachmentChart,
  surface: IAutoMovieHumanFaceBasisSurface,
): IHumanFaceAttachmentChartHost {
  const vertices = [...chart.vertices];
  const coordinates = [...chart.coordinates];
  const indices = [...chart.indices];
  const sourceTriangles = [...chart.sourceTriangles];
  const samples = surface.sourcePartition?.samples;
  if (
    samples === undefined ||
    chart.surface !== surface.id ||
    chart.generation !== surface.sourcePartition?.generation ||
    chart.method !== "uniform-barycentric-convex-disk" ||
    chart.qualification !== "authoredConvention" ||
    coordinates.length !== 2 * vertices.length ||
    chart.sourceVertices.length !== vertices.length ||
    indices.length !== 3 * sourceTriangles.length ||
    coordinates.some((value) => !Number.isFinite(value)) ||
    new Set(vertices).size !== vertices.length ||
    vertices.some((vertex, at) => samples[vertex] !== chart.sourceVertices[at])
  )
    throw new Error(
      "A material attachment chart needs exact same-generation host samples.",
    );
  const ordinal = new Map(vertices.map((vertex, at) => [vertex, at]));
  const hostOrdinal = new Map(
    sourceTriangles.map((triangle, at) => [triangle, at]),
  );
  const vertexSeats = new Map<number, IHumanFaceSkinSeat>();
  for (let triangle = 0; triangle < sourceTriangles.length; triangle++) {
    const hostTriangle = sourceTriangles[triangle];
    if (
      !Number.isSafeInteger(hostTriangle) ||
      hostTriangle < 0 ||
      3 * hostTriangle + 2 >= surface.indices.length
    )
      throw new Error(
        "A material attachment chart needs resident host triangles.",
      );
    for (let corner = 0; corner < 3; corner++) {
      const local = indices[3 * triangle + corner];
      if (
        !Number.isSafeInteger(local) ||
        local < 0 ||
        local >= vertices.length ||
        vertices[local] !== surface.indices[3 * hostTriangle + corner]
      )
        throw new Error(
          "A material attachment chart must preserve oriented host incidence.",
        );
      if (!vertexSeats.has(vertices[local])) {
        const weights: [number, number, number] = [0, 0, 0];
        weights[corner] = 1;
        vertexSeats.set(vertices[local], { triangle: hostTriangle, weights });
      }
    }
    const [a, b, c] = indices.slice(3 * triangle, 3 * triangle + 3);
    const area =
      (coordinates[2 * b] - coordinates[2 * a]) *
        (coordinates[2 * c + 1] - coordinates[2 * a + 1]) -
      (coordinates[2 * b + 1] - coordinates[2 * a + 1]) *
        (coordinates[2 * c] - coordinates[2 * a]);
    if (!(area > 0))
      throw new Error(
        "A material attachment chart triangle must have positive area.",
      );
  }
  const coordinate = (vertex: number): [number, number] => {
    const at = ordinal.get(vertex);
    if (at === undefined)
      throw new Error(
        "A registered station is outside its source attachment disk.",
      );
    return [coordinates[2 * at], coordinates[2 * at + 1]];
  };
  const sourceSeat = (
    point: IAutoMovieHumanFaceAttachmentPoint,
  ): IHumanFaceSkinSeat => {
    const sum = point.weights.reduce((total, weight) => total + weight, 0);
    if (
      !hostOrdinal.has(point.triangle) ||
      point.weights.length !== 3 ||
      point.weights.some(
        (weight) => !Number.isFinite(weight) || weight < 0 || weight > 1,
      ) ||
      Math.abs(sum - 1) > 8 * Number.EPSILON
    )
      throw new Error(
        "A source continuation needs a complete resident barycentric attachment.",
      );
    return {
      triangle: point.triangle,
      weights: [point.weights[0], point.weights[1], point.weights[2]],
    };
  };
  const barycentricAt = (
    triangle: number,
    point: readonly number[],
  ): [number, number, number] => {
    const [a, b, c] = indices.slice(3 * triangle, 3 * triangle + 3);
    const ax = coordinates[2 * a],
      ay = coordinates[2 * a + 1];
    const bx = coordinates[2 * b],
      by = coordinates[2 * b + 1];
    const cx = coordinates[2 * c],
      cy = coordinates[2 * c + 1];
    const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    const u =
      ((point[0] - ax) * (cy - ay) - (point[1] - ay) * (cx - ax)) / area;
    const v =
      ((bx - ax) * (point[1] - ay) - (by - ay) * (point[0] - ax)) / area;
    return [1 - u - v, u, v];
  };
  return {
    coordinate,
    vertexSeat: (vertex) => {
      const seat = vertexSeats.get(vertex);
      if (seat === undefined)
        throw new Error(
          "A station needs its actual source triangle incidence.",
        );
      return { triangle: seat.triangle, weights: [...seat.weights] };
    },
    sourceSeat,
    coordinateAt: (point) => {
      sourceSeat(point);
      const triangle = hostOrdinal.get(point.triangle);
      // Three bounded additions may round the unit sum; this arithmetic bound
      // never changes the supplied weights or geometrical acceptance policy.
      const uv: [number, number] = [0, 0];
      for (let corner = 0; corner < 3; corner++) {
        const vertex = indices[3 * triangle! + corner];
        uv[0] += point.weights[corner] * coordinates[2 * vertex];
        uv[1] += point.weights[corner] * coordinates[2 * vertex + 1];
      }
      return uv;
    },
    seat: (point) => {
      if (point.length !== 2 || !point.every(Number.isFinite))
        throw new Error(
          "A material attachment location needs finite u,v coordinates.",
        );
      for (let triangle = 0; triangle < sourceTriangles.length; triangle++) {
        const [a, b, c] = indices.slice(3 * triangle, 3 * triangle + 3);
        const ax = coordinates[2 * a],
          ay = coordinates[2 * a + 1];
        const bx = coordinates[2 * b],
          by = coordinates[2 * b + 1];
        const cx = coordinates[2 * c],
          cy = coordinates[2 * c + 1];
        if (
          point[0] < Math.min(ax, bx, cx) ||
          point[0] > Math.max(ax, bx, cx) ||
          point[1] < Math.min(ay, by, cy) ||
          point[1] > Math.max(ay, by, cy)
        )
          continue;
        const [w, u, v] = barycentricAt(triangle, point);
        if (u >= 0 && v >= 0 && w >= 0)
          return { triangle: sourceTriangles[triangle], weights: [w, u, v] };
      }
      // Preserve a signed arithmetic witness on refusal without snapping the
      // point, choosing a nearest attachment or expanding the source domain.
      let witness = -1,
        minimumWeight = -Infinity;
      let weights: number[] = [];
      for (let triangle = 0; triangle < sourceTriangles.length; triangle++) {
        const candidate = barycentricAt(triangle, point),
          minimum = Math.min(...candidate);
        if (minimum > minimumWeight) {
          witness = triangle;
          minimumWeight = minimum;
          weights = candidate;
        }
      }
      throw new Error(
        "A material attachment location is outside its source disk: " +
          JSON.stringify({
            point,
            chartTriangle: witness,
            hostTriangle: sourceTriangles[witness],
            weights,
            vertices: indices
              .slice(3 * witness, 3 * witness + 3)
              .map((vertex) => ({
                host: vertices[vertex],
                uv: coordinates.slice(2 * vertex, 2 * vertex + 2),
              })),
          }),
      );
    },
  };
}
