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
 * @evidence contracts/common.md#principled-implementation Positive oriented material triangles must exactly reproduce same-generation canonical host incidence before barycentric queries can read the current skin.
 * @evidence contracts/common.md#clear-and-simple-design Owned material/triangle tables separate dimensionless source coordinates from metric skin frames and retain no spatial-nearest fallback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source embedding/nonoverlap remains the producer's premise; a missing location reports its signed witness rather than snapping or expanding the disk.
 * @evidence contracts/common.md#meaningful-documentation The prose states private copies, exact incidence, positive area, source-domain refusal and embedding ownership.
 * @evidence contracts/performance.md#efficient-algorithms Construction scans chart vertices/triangles; seat lookup scans all T chart triangles and on refusal scans them again for the arithmetic witness.
 * @evidence contracts/performance.md#reuse-equivalent-work Ordinal/host-triangle/vertex-seat maps reuse admitted incidence; coordinate reads are constant-size and barycentric queries use owned copies.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned reader retains copied tables and ordinal maps for caller lifetime; each query returns owned seats/coordinates without retaining query state or handles.
 */
export function createHumanFaceAttachmentChartHost(
  chart: IAutoMovieHumanFaceAttachmentChart,
  surface: IAutoMovieHumanFaceBasisSurface,
): IHumanFaceAttachmentChartHost {
  const vertices: number[] = [...chart.vertices];
  const coordinates: number[] = [...chart.coordinates];
  const indices: number[] = [...chart.indices];
  const sourceTriangles: number[] = [...chart.sourceTriangles];
  const samples: readonly number[] | undefined = surface.sourcePartition?.samples;
  if (
    samples === undefined ||
    chart.surface !== surface.id ||
    chart.generation !== surface.sourcePartition?.generation ||
    chart.method !== "uniform-barycentric-convex-disk" ||
    chart.qualification !== "authoredConvention" ||
    coordinates.length !== 2 * vertices.length ||
    chart.sourceVertices.length !== vertices.length ||
    indices.length !== 3 * sourceTriangles.length ||
    coordinates.some((value: number): boolean  => !Number.isFinite(value)) ||
    new Set(vertices).size !== vertices.length ||
    vertices.some((vertex: number, at: number): boolean  => samples[vertex] !== chart.sourceVertices[at])
  )
    throw new Error(
      "A material attachment chart needs exact same-generation host samples.",
    );
  const ordinal: Map<number, number> = new Map(vertices.map((vertex: number, at: number): [number, number]  => [vertex, at]));
  const hostOrdinal: Map<number, number> = new Map(
    sourceTriangles.map((triangle: number, at: number): [number, number]  => [triangle, at]),
  );
  const vertexSeats: Map<number, IHumanFaceSkinSeat> = new Map<number, IHumanFaceSkinSeat>();
  for (let triangle: number = 0; triangle < sourceTriangles.length; triangle++) {
    const hostTriangle: number = sourceTriangles[triangle];
    if (
      !Number.isSafeInteger(hostTriangle) ||
      hostTriangle < 0 ||
      3 * hostTriangle + 2 >= surface.indices.length
    )
      throw new Error(
        "A material attachment chart needs resident host triangles.",
      );
    for (let corner: number = 0; corner < 3; corner++) {
      const local: number = indices[3 * triangle + corner];
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
    const [a, b, c]: number[] = indices.slice(3 * triangle, 3 * triangle + 3);
    const area: number =
      (coordinates[2 * b] - coordinates[2 * a]) *
        (coordinates[2 * c + 1] - coordinates[2 * a + 1]) -
      (coordinates[2 * b + 1] - coordinates[2 * a + 1]) *
        (coordinates[2 * c] - coordinates[2 * a]);
    if (!(area > 0))
      throw new Error(
        "A material attachment chart triangle must have positive area.",
      );
  }
  const coordinate: (vertex: number) => [number, number] = (vertex: number): [number, number] => {
    const at: number | undefined = ordinal.get(vertex);
    if (at === undefined)
      throw new Error(
        "A registered station is outside its source attachment disk.",
      );
    return [coordinates[2 * at], coordinates[2 * at + 1]];
  };
  const sourceSeat: (point: IAutoMovieHumanFaceAttachmentPoint) => IHumanFaceSkinSeat = (
    point: IAutoMovieHumanFaceAttachmentPoint,
  ): IHumanFaceSkinSeat => {
    const sum: number = point.weights.reduce((total: number, weight: number): number  => total + weight, 0);
    if (
      !hostOrdinal.has(point.triangle) ||
      point.weights.length !== 3 ||
      [point.weights[0], point.weights[1], point.weights[2]].some(
        (weight: number): boolean  => !Number.isFinite(weight) || weight < 0 || weight > 1,
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
  const barycentricAt: (triangle: number, point: readonly number[]) => [number, number, number] = (
    triangle: number,
    point: readonly number[],
  ): [number, number, number] => {
    const [a, b, c]: number[] = indices.slice(3 * triangle, 3 * triangle + 3);
    const ax: number = coordinates[2 * a],
      ay: number = coordinates[2 * a + 1];
    const bx: number = coordinates[2 * b],
      by: number = coordinates[2 * b + 1];
    const cx: number = coordinates[2 * c],
      cy: number = coordinates[2 * c + 1];
    const area: number = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    const u: number =
      ((point[0] - ax) * (cy - ay) - (point[1] - ay) * (cx - ax)) / area;
    const v: number =
      ((bx - ax) * (point[1] - ay) - (by - ay) * (point[0] - ax)) / area;
    return [1 - u - v, u, v];
  };
  return {
    coordinate,
    vertexSeat: (vertex: number): { triangle: number; weights: [number, number, number]; }  => {
      const seat: IHumanFaceSkinSeat | undefined = vertexSeats.get(vertex);
      if (seat === undefined)
        throw new Error(
          "A station needs its actual source triangle incidence.",
        );
      return { triangle: seat.triangle, weights: [...seat.weights] };
    },
    sourceSeat,
    coordinateAt: (point: IAutoMovieHumanFaceAttachmentPoint): [number, number]  => {
      sourceSeat(point);
      const triangle: number | undefined = hostOrdinal.get(point.triangle);
      // Three bounded additions may round the unit sum; this arithmetic bound
      // never changes the supplied weights or geometrical acceptance policy.
      const uv: [number, number] = [0, 0];
      for (let corner: number = 0; corner < 3; corner++) {
        const vertex: number = indices[3 * triangle! + corner];
        uv[0] += point.weights[corner] * coordinates[2 * vertex];
        uv[1] += point.weights[corner] * coordinates[2 * vertex + 1];
      }
      return uv;
    },
    seat: (point: readonly number[]): { triangle: number; weights: [number, number, number]; }  => {
      if (point.length !== 2 || !point.every(Number.isFinite))
        throw new Error(
          "A material attachment location needs finite u,v coordinates.",
        );
      for (let triangle: number = 0; triangle < sourceTriangles.length; triangle++) {
        const [a, b, c]: number[] = indices.slice(3 * triangle, 3 * triangle + 3);
        const ax: number = coordinates[2 * a],
          ay: number = coordinates[2 * a + 1];
        const bx: number = coordinates[2 * b],
          by: number = coordinates[2 * b + 1];
        const cx: number = coordinates[2 * c],
          cy: number = coordinates[2 * c + 1];
        if (
          point[0] < Math.min(ax, bx, cx) ||
          point[0] > Math.max(ax, bx, cx) ||
          point[1] < Math.min(ay, by, cy) ||
          point[1] > Math.max(ay, by, cy)
        )
          continue;
        const [w, u, v]: [number, number, number] = barycentricAt(triangle, point);
        if (u >= 0 && v >= 0 && w >= 0)
          return { triangle: sourceTriangles[triangle], weights: [w, u, v] };
      }
      // Preserve a signed arithmetic witness on refusal without snapping the
      // point, choosing a nearest attachment or expanding the source domain.
      let witness: number = -1,
        minimumWeight: number = -Infinity;
      let weights: number[] = [];
      for (let triangle: number = 0; triangle < sourceTriangles.length; triangle++) {
        const candidate: [number, number, number] = barycentricAt(triangle, point),
          minimum: number = Math.min(...candidate);
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
              .map((vertex: number): { host: number; uv: number[]; }  => ({
                host: vertices[vertex],
                uv: coordinates.slice(2 * vertex, 2 * vertex + 2),
              })),
          }),
      );
    },
  };
}
