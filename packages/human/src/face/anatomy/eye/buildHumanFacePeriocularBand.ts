import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceAttachmentChart } from "../../structures/IAutoMovieHumanFaceAttachmentChart";
import type { IAutoMovieHumanFaceAttachmentContinuation } from "../../structures/IAutoMovieHumanFaceAttachmentContinuation";
import type { IAutoMovieHumanFacePeriocularStation } from "../../structures/IAutoMovieHumanFacePeriocularStation";
import type { IHumanFaceSkinFrame } from "../skin/IHumanFaceSkinFrame";
import type { IHumanFaceSkinSeat } from "../skin/IHumanFaceSkinSeat";
import { HUMAN_FACE_LID_SEAT } from "./HUMAN_FACE_LID_SEAT";
import { createHumanFaceAttachmentChartHost } from "./createHumanFaceAttachmentChartHost";
import { locateHumanFacePeriocularArc } from "./locateHumanFacePeriocularArc";
import { readHumanFacePeriocularStationBoundary } from "./readHumanFacePeriocularStationBoundary";
import type { IHumanFaceAttachmentChartHost } from "./structures/IHumanFaceAttachmentChartHost";
import type { IHumanFacePeriocularArcLocation } from "./structures/IHumanFacePeriocularArcLocation";
import type { IHumanFacePeriocularBand } from "./structures/IHumanFacePeriocularBand";
import type { IHumanFacePeriocularBandInput } from "./structures/IHumanFacePeriocularBandInput";
import type { IHumanFacePeriocularHostSample } from "./structures/IHumanFacePeriocularHostSample";

/**
 * Compile one lid's source-owned band before any tissue offset is applied.
 * Registered material incidence supplies exact host seats and continuous
 * ocular arc correspondence. The source sheet is shared by all same-lid
 * posterior tissues; each actual offset shell stays with its geometry owner.
 * The outer skin starts at the anterior margin. The far border's ocular arc
 * still starts at the registered posterior margin; these are distinct source
 * boundaries, so choosing the skin near edge never changes the extent origin.
 * A zero scalar retains its actual posterior-origin far attachment; it does
 * not identify that attachment with the anterior margin.
 * Registered bands retain every published native boundary knot and divide
 * each native edge into four cells. The consumer's far course joins each
 * unchanged interval's located posterior-origin targets linearly in UV.
 * This does not reconstruct the unavailable continuous authored outline.
 * Exact refinement supplies intervening samples on that same far course.
 * Legacy nearest seating retains its existing geometric refusals.
 *
 * @evidence contracts/common.md#principled-implementation Registered native anterior knots and posterior-origin far targets define one source material boundary, preserving authored ocular arc correspondence.
 * @evidence contracts/common.md#clear-and-simple-design Chart host and arc locator own actual source seats; this band compiles the domain before tissue offsets or exact overlay refinement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent native incidence or unsupported positive source extent refuses; the legacy nearest-seated strip retains its geometric limitations.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes anterior skin boundary, posterior arc origin, zero extent and registered versus legacy construction.
 * @evidence contracts/performance.md#efficient-algorithms Complete chart/native-edge admission and per-column arc location include their actual host, projection and integration costs. Repeated column indexOf searches can add quadratic coarse-column work. Registered near boundaries use four cells per native edge; legacy strips use four cells per coarse interval and eight row intervals.
 * @evidence contracts/performance.md#reuse-equivalent-work One attachment reader and edge-to-triangle map serve all native boundary samples; tissue consumers reuse a compiled band per lid.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned seats/frames/domain arrays belong to the band; edge maps and path lengths expire without external resources.
 */
export function buildHumanFacePeriocularBand(
  input: IHumanFacePeriocularBandInput,
): IHumanFacePeriocularBand {
  const {
    cage,
    host,
    points,
    skinHost,
    surface,
    upper,
    side,
    tissue,
  }: IHumanFacePeriocularBandInput = input;
  const columns: number[] = upper ? cage.upperColumns : cage.lowerColumns;
  const tear: number = HUMAN_FACE_LID_SEAT.tearFilmMetres;
  const read: (rows: readonly number[], vertex: number) => IAutoMovieVector3 = (
    rows: readonly number[],
    vertex: number,
  ): IAutoMovieVector3 =>
    Vector3.create(
      rows[3 * vertex],
      rows[3 * vertex + 1],
      rows[3 * vertex + 2],
    );
  const station: (role: string) => number = (role: string): number => {
    const found: number = cage.stations.findIndex(
      (entry: IAutoMovieHumanFacePeriocularStation): boolean =>
        entry.role === role,
    );
    if (found < 0)
      throw new Error(
        "Periocular tissue needs its station row: " + side + ":" + role,
      );
    return found;
  };
  const collapsedColumns: Set<number> = new Set<number>();
  const hostSamples: IHumanFacePeriocularHostSample[] = [];
  const frames: IHumanFaceSkinFrame[] = [];
  const sourceChart: IAutoMovieHumanFaceAttachmentChart | undefined = upper
    ? cage.attachmentCharts?.upper
    : cage.attachmentCharts?.lower;
  const attachment: IHumanFaceAttachmentChartHost | undefined =
    sourceChart === undefined
      ? undefined
      : createHumanFaceAttachmentChartHost(sourceChart, host);
  // The band lies where lid skin covers the globe: it starts under the
  // anterior margin, where the lid has its thickness, and its columns
  // stop short of the medial bed, where the margin leaves the globe.
  const anterior: IAutoMovieHumanFacePeriocularStation =
    cage.stations[station("anteriorMargin")];
  if (anterior.boundary !== undefined && attachment === undefined)
    throw new Error(
      "A published anterior native boundary needs its registered material disk.",
    );
  const margin: number[] = anterior.vertices,
    crease: number[] = cage.stations[station("crease")].vertices,
    rim: number[] = cage.stations[station("posteriorMargin")].vertices;
  const arcs: number[] | undefined = upper
    ? cage.tarsalExtent?.upperArcMetres
    : cage.tarsalExtent?.lowerArcMetres;
  // A tarsal plate ends at the canthal tendons, short of both
  // commissures, so the band spans the interior columns of its lid.
  const bed: number | undefined =
    (upper ? cage.medialBed?.upperColumns : cage.medialBed?.lowerColumns) ??
    undefined;
  let arc: number = 0;
  let interior: number[] = columns
    .slice(1, -1)
    .filter((column: number, at: number): boolean => {
      arc += Vector3.length(
        Vector3.subtract(
          read(points, rim[column]),
          read(points, rim[columns[at]]),
        ),
      );
      return bed === undefined
        ? arc >= HUMAN_FACE_LID_SEAT.medialBedMetres
        : at + 1 >= bed;
    });
  if (arcs !== undefined) {
    const active: boolean[] = interior.map(
      (column: number): boolean => arcs[columns.indexOf(column)] > 0,
    );
    const first: number = active.indexOf(true),
      last: number = active.lastIndexOf(true);
    if (first < 0)
      throw new Error(
        "Periocular plate has no supported positive-height source domain: " +
          side +
          ":" +
          tissue,
      );
    // Preserve the existing selected coarse interval, including its adjacent
    // zero samples. Those values do not declare inactive material or a pole.
    interior = interior.slice(
      Math.max(0, first - 1),
      Math.min(interior.length, last + 2),
    );
  }
  if (interior.length < 2)
    throw new Error(
      "Periocular tissue needs lid columns outside its medial bed: " +
        side +
        ":" +
        tissue,
    );
  const nativeSegments: number[][] | undefined =
    attachment === undefined
      ? undefined
      : readHumanFacePeriocularStationBoundary(
          anterior,
          host,
          interior.map((column: number): number => margin[column]),
        );
  if (attachment !== undefined && nativeSegments === undefined)
    throw new Error(
      "Registered periocular tissue needs its published anterior native boundary.",
    );
  const near: IAutoMovieVector3[] = interior.map(
    (column: number): IAutoMovieVector3 => read(points, margin[column]),
  );
  const far: IAutoMovieVector3[] = interior.map(
    (column: number, at: number): IAutoMovieVector3 => {
      const end: IAutoMovieVector3 = read(points, crease[column]);
      const span: IAutoMovieVector3 = Vector3.subtract(end, near[at]);
      const length: number = Vector3.length(span);
      return arcs === undefined || length === 0
        ? end
        : Vector3.add(
            near[at],
            Vector3.scale(span, arcs[columns.indexOf(interior[at])] / length),
          );
    },
  );
  const farLocations: IHumanFacePeriocularArcLocation[] | undefined =
    attachment === undefined
      ? undefined
      : interior.map((column: number): IHumanFacePeriocularArcLocation => {
          try {
            return arcs === undefined
              ? {
                  coordinate: attachment.coordinate(crease[column]),
                  seat: attachment.vertexSeat(crease[column]),
                }
              : locateHumanFacePeriocularArc(
                  attachment,
                  skinHost,
                  surface,
                  cage.stations.map(
                    (row: IAutoMovieHumanFacePeriocularStation): number =>
                      row.vertices[column],
                  ),
                  arcs[columns.indexOf(column)],
                  sourceChart!.continuations?.find(
                    (
                      continuation: IAutoMovieHumanFaceAttachmentContinuation,
                    ): boolean => continuation.column === column,
                  )?.points,
                );
          } catch (error) {
            throw new Error(
              (error instanceof Error ? error.message : String(error)) +
                " material-band:" +
                JSON.stringify({ side, tissue, column }),
            );
          }
        });
  const cells: number = 4 as const,
    bands: number = 8 as const;
  const boundarySamples: IHumanFacePeriocularHostSample[] | undefined =
    nativeSegments === undefined ? undefined : [];
  if (nativeSegments !== undefined) {
    const edgeKey: (a: number, b: number) => string = (
      a: number,
      b: number,
    ): string => (a < b ? a + ":" + b : b + ":" + a);
    const edgeTriangles: Map<string, number> = new Map<string, number>();
    for (let at: number = 0; at < sourceChart!.indices.length; at += 3)
      for (let corner: number = 0; corner < 3; corner++) {
        const a: number =
            sourceChart!.vertices[sourceChart!.indices[at + corner]],
          b: number =
            sourceChart!.vertices[
              sourceChart!.indices[at + ((corner + 1) % 3)]
            ];
        const key: string = edgeKey(a, b);
        if (!edgeTriangles.has(key))
          edgeTriangles.set(key, sourceChart!.sourceTriangles[at / 3]);
      }
    for (let segment: number = 0; segment < nativeSegments.length; segment++) {
      const path: number[] = nativeSegments[segment];
      const lengths: number[] = path
        .slice(1)
        .map((vertex: number, at: number): number =>
          Vector3.length(
            Vector3.subtract(
              read(host.positions, vertex),
              read(host.positions, path[at]),
            ),
          ),
        );
      const total: number = lengths.reduce(
        (sum: number, length: number): number => sum + length,
        0,
      );
      if (
        !(total > 0) ||
        !Number.isFinite(total) ||
        lengths.some((length: number): boolean => !(length > 0))
      )
        throw new Error(
          "An anterior native course needs positive finite reference edge lengths.",
        );
      let preceding: number = 0;
      for (let edge: number = 0; edge < lengths.length; edge++) {
        const a: number = path[edge],
          b: number = path[edge + 1];
        const triangle: number | undefined = edgeTriangles.get(edgeKey(a, b));
        if (triangle === undefined)
          throw new Error(
            "An anterior native edge is outside its registered material disk.",
          );
        const corners: number[] = skinHost.corners(triangle);
        const last: boolean =
          segment === nativeSegments.length - 1 && edge === lengths.length - 1;
        for (let part: number = 0; part < cells + (last ? 1 : 0); part++) {
          const fraction: number = part / cells;
          const weights: [number, number, number] = [0, 0, 0];
          weights[corners.indexOf(a)] = 1 - fraction;
          weights[corners.indexOf(b)] = fraction;
          const seat: { triangle: number; weights: [number, number, number] } =
            { triangle, weights };
          const frame: IHumanFaceSkinFrame = skinHost.frame(seat);
          boundarySamples!.push({
            row: 0,
            column: boundarySamples!.length,
            sourceColumn:
              part === cells
                ? segment + 1
                : segment + (preceding + lengths[edge] * fraction) / total,
            point: [...frame.point],
            materialPoint: attachment!.coordinateAt(seat),
            materialEdge: { vertices: [a, b], fraction },
            seat,
          });
        }
        preceding += lengths[edge];
      }
    }
  }
  const stride: number =
    boundarySamples?.length ?? cells * (interior.length - 1) + 1;
  const height: number = bands + 1;
  if (attachment === undefined && arcs !== undefined)
    for (let at: number = 0; at < stride; at++) {
      const sourceColumn: number =
        boundarySamples?.[at].sourceColumn ?? at / cells;
      const column: number = Math.min(
        interior.length - 2,
        Math.floor(sourceColumn),
      );
      const t: number = sourceColumn - column;
      const a: number = arcs[columns.indexOf(interior[column])],
        b: number = arcs[columns.indexOf(interior[column + 1])];
      if (a + (b - a) * t === 0) collapsedColumns.add(at);
    }
  const floor: number = tear;
  const mix: (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    t: number,
  ) => IAutoMovieVector3 = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    t: number,
  ): IAutoMovieVector3 =>
    Vector3.add(a, Vector3.scale(Vector3.subtract(b, a), t));
  if (attachment !== undefined && boundarySamples !== undefined) {
    // The ordered material boundary owns this registered domain. Interior
    // points are generated by its one conforming triangulation, not a loft
    // whose straight cross-sections may overlap on a concave boundary.
    const boundary: number[] = [];
    const canonical: Map<number, number> = new Map<number, number>();
    const append: (sample: IHumanFacePeriocularHostSample) => void = (
      sample: IHumanFacePeriocularHostSample,
    ): void => {
      const corners: number[] = skinHost.corners(sample.seat.triangle);
      const corner: number = sample.seat.weights.findIndex(
        (weight: number): boolean => weight === 1,
      );
      const vertex: number | undefined =
        corner >= 0 &&
        sample.seat.weights.every(
          (weight: number, index: number): boolean =>
            index === corner || weight === 0,
        )
          ? corners[corner]
          : undefined;
      let index: number | undefined =
        vertex === undefined ? undefined : canonical.get(vertex);
      if (index === undefined) {
        index = hostSamples.length;
        hostSamples.push(sample);
        frames.push(skinHost.frame(sample.seat));
        if (vertex !== undefined) canonical.set(vertex, index);
      }
      if (boundary[boundary.length - 1] !== index) boundary.push(index);
    };
    const farSample: (column: number) => IHumanFacePeriocularHostSample = (
      column: number,
    ): IHumanFacePeriocularHostSample => {
      const sourceColumn: number = boundarySamples[column].sourceColumn!;
      const location: IHumanFacePeriocularArcLocation =
        farLocations![sourceColumn];
      return {
        row: bands,
        column,
        sourceColumn,
        point: [...skinHost.frame(location.seat).point],
        materialPoint: [...location.coordinate],
        seat: location.seat,
      };
    };
    for (let column: number = 0; column < stride; column++)
      append(boundarySamples[column]);
    // Far coarse targets and the two end edges are the original straight
    // material segments. Their eight-way subdivision belongs to the exact
    // refinement owner; rounded intermediate UVs cannot redefine the edge.
    for (let column: number = stride - 1; column >= 0; column--)
      if (Number.isInteger(boundarySamples[column].sourceColumn))
        append(farSample(column));
    if (boundary[0] === boundary[boundary.length - 1]) boundary.pop();
    return {
      frames,
      samples: hostSamples,
      stride,
      height,
      collapsedColumns,
      floor,
      chart: sourceChart,
      sourceColumns: [...interior],
      nearBoundary: interior.map((column: number): number => margin[column]),
      farBoundary: farLocations,
      boundary,
    };
  }
  // Legacy spatial seating retains its original sampled ruled strip.
  // Registered material domains returned above and never enter this path.
  for (let band: number = 0; band <= bands; band++)
    for (let at: number = 0; at < stride; at++) {
      const sourceColumn: number = at / cells;
      const column: number = Math.min(
        interior.length - 2,
        Math.floor(sourceColumn),
      );
      const t: number = sourceColumn - column;
      const sample: IAutoMovieVector3 = mix(
        mix(near[column], near[column + 1], t),
        mix(far[column], far[column + 1], t),
        band / bands,
      );
      const samplePoint: number[] = [sample.x, sample.y, sample.z];
      const seat: IHumanFaceSkinSeat = skinHost.seat(samplePoint);
      const frame: IHumanFaceSkinFrame = skinHost.frame(seat);
      frames.push(frame);
      hostSamples.push({
        row: band,
        column: at,
        sourceColumn,
        point: samplePoint,
        seat,
      });
    }
  return {
    frames,
    samples: hostSamples,
    stride,
    height,
    collapsedColumns,
    floor,
    chart: sourceChart,
    sourceColumns: [...interior],
    nearBoundary: interior.map((column: number): number => margin[column]),
    farBoundary: farLocations,
  };
}
