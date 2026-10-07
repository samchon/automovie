import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceSkinFrame } from "../skin/IHumanFaceSkinFrame";
import { HUMAN_FACE_LID_SEAT } from "./HUMAN_FACE_LID_SEAT";
import { createHumanFaceAttachmentChartHost } from "./createHumanFaceAttachmentChartHost";
import { locateHumanFacePeriocularArc } from "./locateHumanFacePeriocularArc";
import type { IHumanFacePeriocularArcLocation } from "./structures/IHumanFacePeriocularArcLocation";
import type { IHumanFacePeriocularBand } from "./structures/IHumanFacePeriocularBand";
import type { IHumanFacePeriocularBandInput } from "./structures/IHumanFacePeriocularBandInput";
import type { IHumanFacePeriocularHostSample } from "./structures/IHumanFacePeriocularHostSample";

/**
 * Compile one lid's source-owned band before any tissue offset is applied.
 * Registered material incidence supplies exact host seats and continuous
 * ocular arc correspondence. The source sheet is shared by all same-lid
 * posterior tissues; each actual offset shell stays with its geometry owner.
 * Legacy nearest seating retains its existing geometric refusals.
 *
 * @evidence contracts/common.md#principled-implementation Source chart incidence and ocular arc correspondence determine the sheet independently of tissue offsets.
 * @evidence contracts/common.md#clear-and-simple-design One immutable lid band is reused by posterior tissue consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No requested thickness, source ordinal or optical dimension changes.
 * @evidence contracts/common.md#meaningful-documentation Separates source-sheet construction from normal-offset shell admission.
 * @evidence contracts/modeling.md#spatial-conventions Actual host positions and ocular arc quantities are head-frame metres.
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
  const margin = cage.stations[station("anteriorMargin")].vertices,
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
    // Retain one actual zero-height endpoint on either side; columns
    // farther outside this registered support represent no plate area.
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
  const nearChart =
    attachment === undefined
      ? undefined
      : interior.map((column) => attachment.coordinate(rim[column]));
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
  const farChart = farLocations?.map((location) => location.coordinate);
  if (attachment !== undefined)
    for (let at = 0; at < interior.length; at++) {
      const nearFrame = skinHost.frame(
        attachment.vertexSeat(rim[interior[at]]),
      );
      const farFrame = skinHost.frame(farLocations![at].seat);
      near[at] = Vector3.create(...nearFrame.point);
      far[at] = Vector3.create(...farFrame.point);
    }
  const cells = 4,
    bands = 8;
  const stride = cells * (interior.length - 1) + 1;
  const height = bands + 1;
  if (arcs !== undefined)
    for (let at = 0; at < stride; at++) {
      const column = Math.min(interior.length - 2, Math.floor(at / cells));
      const t = at / cells - column;
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
  // The cage locates the band; the actual host triangles supply its
  // skin height and normal rather than a three-row thickness estimate.
  for (let band = 0; band <= bands; band++)
    for (let at = 0; at < stride; at++) {
      const column = Math.min(interior.length - 2, Math.floor(at / cells));
      const t = at / cells - column;
      const sample = mix(
        mix(near[column], near[column + 1], t),
        mix(far[column], far[column + 1], t),
        band / bands,
      );
      const samplePoint = [sample.x, sample.y, sample.z];
      const blendChart = (
        a: readonly number[],
        b: readonly number[],
        weight: number,
      ): [number, number] =>
        weight === 0
          ? [a[0], a[1]]
          : weight === 1
            ? [b[0], b[1]]
            : [a[0] + (b[0] - a[0]) * weight, a[1] + (b[1] - a[1]) * weight];
      const chartPoint =
        attachment === undefined
          ? undefined
          : blendChart(
              blendChart(nearChart![column], nearChart![column + 1], t),
              blendChart(farChart![column], farChart![column + 1], t),
              band / bands,
            );
      const sourceColumn = at / cells;
      const seat =
        chartPoint === undefined
          ? skinHost.seat(samplePoint)
          : Number.isInteger(sourceColumn) &&
              (band === 0 || collapsedColumns.has(at))
            ? attachment!.vertexSeat(rim[interior[sourceColumn]])
            : Number.isInteger(sourceColumn) && band === bands
              ? farLocations![sourceColumn].seat
              : attachment!.seat(chartPoint);
      const frame = skinHost.frame(seat);
      frames.push(frame);
      hostSamples.push({
        row: band,
        column: at,
        point: chartPoint === undefined ? samplePoint : [...frame.point],
        materialPoint: chartPoint,
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
  };
}
