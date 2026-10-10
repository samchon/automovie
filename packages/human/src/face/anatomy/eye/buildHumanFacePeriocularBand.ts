import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceSkinFrame } from "../skin/IHumanFaceSkinFrame";
import { HUMAN_FACE_LID_SEAT } from "./HUMAN_FACE_LID_SEAT";
import { createHumanFaceAttachmentChartHost } from "./createHumanFaceAttachmentChartHost";
import { locateHumanFacePeriocularArc } from "./locateHumanFacePeriocularArc";
import { readHumanFacePeriocularStationBoundary } from "./readHumanFacePeriocularStationBoundary";
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
 */
export function buildHumanFacePeriocularBand(
  input: IHumanFacePeriocularBandInput,
): IHumanFacePeriocularBand {
  const { cage, host, points, skinHost, surface, upper, side, tissue } = input;
  const columns = upper ? cage.upperColumns : cage.lowerColumns;
  const tear = HUMAN_FACE_LID_SEAT.tearFilmMetres;
  const read = (rows: readonly number[], vertex: number): IAutoMovieVector3 =>
    Vector3.create(
      rows[3 * vertex],
      rows[3 * vertex + 1],
      rows[3 * vertex + 2],
    );
  const station = (role: string): number => {
    const found = cage.stations.findIndex((entry) => entry.role === role);
    if (found < 0)
      throw new Error(
        "Periocular tissue needs its station row: " + side + ":" + role,
      );
    return found;
  };
  const collapsedColumns = new Set<number>();
  const hostSamples: IHumanFacePeriocularHostSample[] = [];
  const frames: IHumanFaceSkinFrame[] = [];
  const sourceChart = upper
    ? cage.attachmentCharts?.upper
    : cage.attachmentCharts?.lower;
  const attachment =
    sourceChart === undefined
      ? undefined
      : createHumanFaceAttachmentChartHost(sourceChart, host);
  // The band lies where lid skin covers the globe: it starts under the
  // anterior margin, where the lid has its thickness, and its columns
  // stop short of the medial bed, where the margin leaves the globe.
  const anterior = cage.stations[station("anteriorMargin")];
  if (anterior.boundary !== undefined && attachment === undefined)
    throw new Error("A published anterior native boundary needs its registered material disk.");
  const margin = anterior.vertices,
    crease = cage.stations[station("crease")].vertices,
    rim = cage.stations[station("posteriorMargin")].vertices;
  const arcs = upper
    ? cage.tarsalExtent?.upperArcMetres
    : cage.tarsalExtent?.lowerArcMetres;
  // A tarsal plate ends at the canthal tendons, short of both
  // commissures, so the band spans the interior columns of its lid.
  const bed =
    (upper ? cage.medialBed?.upperColumns : cage.medialBed?.lowerColumns) ??
    undefined;
  let arc = 0;
  let interior = columns.slice(1, -1).filter((column, at) => {
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
    const active = interior.map((column) => arcs[columns.indexOf(column)] > 0);
    const first = active.indexOf(true),
      last = active.lastIndexOf(true);
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
  const nativeSegments = attachment === undefined
    ? undefined
    : readHumanFacePeriocularStationBoundary(
        anterior, host, interior.map((column) => margin[column]),
      );
  if (attachment !== undefined && nativeSegments === undefined)
    throw new Error("Registered periocular tissue needs its published anterior native boundary.");
  const near = interior.map((column) => read(points, margin[column]));
  const far = interior.map((column, at) => {
    const end = read(points, crease[column]);
    const span = Vector3.subtract(end, near[at]);
    const length = Vector3.length(span);
    return arcs === undefined || length === 0
      ? end
      : Vector3.add(
          near[at],
          Vector3.scale(span, arcs[columns.indexOf(interior[at])] / length),
        );
  });
  const farLocations =
    attachment === undefined
      ? undefined
      : interior.map((column): IHumanFacePeriocularArcLocation => {
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
                  cage.stations.map((row) => row.vertices[column]),
                  arcs[columns.indexOf(column)],
                  sourceChart!.continuations?.find(
                    (continuation) => continuation.column === column,
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
  const cells = 4,
    bands = 8;
  const boundarySamples: IHumanFacePeriocularHostSample[] | undefined =
    nativeSegments === undefined ? undefined : [];
  if (nativeSegments !== undefined) {
    const edgeKey = (a: number, b: number): string => a < b ? a + ":" + b : b + ":" + a;
    const edgeTriangles = new Map<string, number>();
    for (let at = 0; at < sourceChart!.indices.length; at += 3)
      for (let corner = 0; corner < 3; corner++) {
        const a = sourceChart!.vertices[sourceChart!.indices[at + corner]],
          b = sourceChart!.vertices[sourceChart!.indices[at + (corner + 1) % 3]];
        const key = edgeKey(a, b);
        if (!edgeTriangles.has(key)) edgeTriangles.set(key, sourceChart!.sourceTriangles[at / 3]);
      }
    for (let segment = 0; segment < nativeSegments.length; segment++) {
      const path = nativeSegments[segment];
      const lengths = path.slice(1).map((vertex, at) => Vector3.length(
        Vector3.subtract(read(host.positions, vertex), read(host.positions, path[at])),
      ));
      const total = lengths.reduce((sum, length) => sum + length, 0);
      if (!(total > 0) || !Number.isFinite(total) || lengths.some((length) => !(length > 0)))
        throw new Error("An anterior native course needs positive finite reference edge lengths.");
      let preceding = 0;
      for (let edge = 0; edge < lengths.length; edge++) {
        const a = path[edge], b = path[edge + 1];
        const triangle = edgeTriangles.get(edgeKey(a, b));
        if (triangle === undefined)
          throw new Error("An anterior native edge is outside its registered material disk.");
        const corners = skinHost.corners(triangle);
        const last = segment === nativeSegments.length - 1 && edge === lengths.length - 1;
        for (let part = 0; part < cells + (last ? 1 : 0); part++) {
          const fraction = part / cells;
          const weights: [number, number, number] = [0, 0, 0];
          weights[corners.indexOf(a)] = 1 - fraction;
          weights[corners.indexOf(b)] = fraction;
          const seat = { triangle, weights };
          const frame = skinHost.frame(seat);
          boundarySamples!.push({
            row: 0,
            column: boundarySamples!.length,
            sourceColumn: part === cells ? segment + 1 :
              segment + (preceding + lengths[edge] * fraction) / total,
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
  const stride = boundarySamples?.length ?? cells * (interior.length - 1) + 1;
  const height = bands + 1;
  if (attachment === undefined && arcs !== undefined)
    for (let at = 0; at < stride; at++) {
      const sourceColumn = boundarySamples?.[at].sourceColumn ?? at / cells;
      const column = Math.min(interior.length - 2, Math.floor(sourceColumn));
      const t = sourceColumn - column;
      const a = arcs[columns.indexOf(interior[column])],
        b = arcs[columns.indexOf(interior[column + 1])];
      if (a + (b - a) * t === 0) collapsedColumns.add(at);
    }
  const floor = tear;
  const mix = (
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
    const canonical = new Map<number, number>();
    const append = (sample: IHumanFacePeriocularHostSample): void => {
      const corners = skinHost.corners(sample.seat.triangle);
      const corner = sample.seat.weights.findIndex((weight) => weight === 1);
      const vertex = corner >= 0 && sample.seat.weights.every(
        (weight, index) => index === corner || weight === 0,
      ) ? corners[corner] : undefined;
      let index = vertex === undefined ? undefined : canonical.get(vertex);
      if (index === undefined) {
        index = hostSamples.length;
        hostSamples.push(sample);
        frames.push(skinHost.frame(sample.seat));
        if (vertex !== undefined) canonical.set(vertex, index);
      }
      if (boundary[boundary.length - 1] !== index) boundary.push(index);
    };
    const farSample = (column: number): IHumanFacePeriocularHostSample => {
      const sourceColumn = boundarySamples[column].sourceColumn!;
      const location = farLocations![sourceColumn];
      return {
        row: bands,
        column,
        sourceColumn,
        point: [...skinHost.frame(location.seat).point],
        materialPoint: [...location.coordinate],
        seat: location.seat,
      };
    };
    for (let column = 0; column < stride; column++) append(boundarySamples[column]);
    // Far coarse targets and the two end edges are the original straight
    // material segments. Their eight-way subdivision belongs to the exact
    // refinement owner; rounded intermediate UVs cannot redefine the edge.
    for (let column = stride - 1; column >= 0; column--)
      if (Number.isInteger(boundarySamples[column].sourceColumn))
        append(farSample(column));
    if (boundary[0] === boundary[boundary.length - 1]) boundary.pop();
    return {
      frames, samples: hostSamples, stride, height, collapsedColumns, floor,
      chart: sourceChart, sourceColumns: [...interior],
      nearBoundary: interior.map((column) => margin[column]),
      farBoundary: farLocations, boundary,
    };
  }
  // Legacy spatial seating retains its original sampled ruled strip.
  // Registered material domains returned above and never enter this path.
  for (let band = 0; band <= bands; band++)
    for (let at = 0; at < stride; at++) {
      const sourceColumn = at / cells;
      const column = Math.min(interior.length - 2, Math.floor(sourceColumn));
      const t = sourceColumn - column;
      const sample = mix(
        mix(near[column], near[column + 1], t),
        mix(far[column], far[column + 1], t),
        band / bands,
      );
      const samplePoint = [sample.x, sample.y, sample.z];
      const seat = skinHost.seat(samplePoint);
      const frame = skinHost.frame(seat);
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
    nearBoundary: interior.map((column) => margin[column]),
    farBoundary: farLocations,
  };
}
