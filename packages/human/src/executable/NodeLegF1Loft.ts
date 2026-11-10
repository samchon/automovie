import { AutoMovieMeshCourse, AutoMovieMeshExtract, AutoMovieViewAxis, type IAutoMovieLoftChain } from "@automovie/engine";

import { AutoMovieHumanF1Trace } from "../generation/AutoMovieHumanF1Trace";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import type { AutoMovieHumanF1Fork } from "../generation/trunk/AutoMovieHumanF1Fork";
import type { CaptureModel } from "../inspection/CaptureModel";
import { CaptureSpecs } from "../inspection/CaptureSpecs";
import { NodeLegF1Archive } from "./NodeLegF1Archive";
import { NodeLegF1Hip } from "./NodeLegF1Hip";
import { NodeLegF1Rings } from "./NodeLegF1Rings";

/**
 * The measured course joining the F1 fork, thigh and lower-leg surfaces.
 *
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps this source contract with its region owner.
 */
export namespace NodeLegF1Loft {
  type V2 = NodeLegF1Archive.V2;
  type V3 = NodeLegF1Archive.V3;
  type Frame = NodeLegF1Archive.Frame;
  type IRing = NodeLegF1Rings.IRing;
  type IOrdinaryInterval = NodeLegF1Rings.IOrdinaryInterval;

  /** The original chart placement and vector operations. */
  const { mix, place, scale, sub }: typeof NodeLegF1Archive = NodeLegF1Archive;

  /** Closed-ring construction and verification owned by the leg strip. */
  const { forkClock, inspectOrdinary, inspectSeam, sampleRay, sectionDeviation, stitchForefoot, stitchRows, stitchSeam, stitchTangent }: typeof NodeLegF1Rings = NodeLegF1Rings;

  const Trace: typeof AutoMovieHumanF1Trace = AutoMovieHumanF1Trace;
  const Geometry: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;

  /**
   * The leg’s exact shared fork and its own half-plane.
   *
   * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps this source contract with its region owner.
   */
  export type ILegFork = {
    /** The measured parent fork plane in native world millimetres. */
    parent: AutoMovieHumanF1Fork.IResult["parentPlane"];
    /** The Newell plane and area centroid of this leg's closed half-ring in native world millimetres. */
    half: AutoMovieHumanF1Fork.IResult["leftPlane"];
    /** The sign of this leg's native world Z displacement from the midline. */
    direction: number;
    /** The native world Z coordinate of the sagittal split, in millimetres. */
    midline: number;
  };

  /**
   * Follow the native outline between the measured fork and first thigh plane.
   * The caller keeps the exact fork rim and its shared crotch edges. A turned
   * cut qualifies when it lies downstream of every shared point and its
   * closed outline stays inside the two measured halfspaces on its own side.
   */
  function proximalRings(
    fork: ILegFork,
    boundary: V3[],
    end: Frame,
    spacing: number,
    mesh: AutoMovieMeshExtract.IMesh,
  ): { frame: Frame; points: V3[] }[] {
    const origin = end.origin as V3;
    const forward = AutoMovieViewAxis.normal(end) as V3;
    const upward = scale(forward, -1);
    const length = Geometry.dot(sub(origin, fork.half.centroid), forward);
    if (!(length > spacing && spacing > 0)) return [];
    // Both endpoints of the slab own a signed plane. Start only after every
    // shared seam point lies upstream of the interpolated plane.
    let limit = 0;
    for (const point of boundary) {
      const start = Geometry.dot(sub(point, fork.parent.centroid), fork.parent.normal);
      const end = Geometry.dot(sub(point, origin), upward);
      if (!(end > 0)) return [];
      if (start < 0) limit = Math.max(limit, -start / (end - start));
    }
    const count = Math.ceil((1 - limit) * length / spacing);
    const planes = Array.from({ length: count }, (_, i): AutoMovieMeshCourse.IPlane => {
      const t = limit + (1 - limit) * (i + 0.5) / count;
      const normal = mix(fork.parent.normal, upward, t);
      const unit = Geometry.unit(normal);
      const level = (1 - t) * Geometry.dot(fork.parent.normal, fork.parent.centroid) + t * Geometry.dot(upward, origin);
      const centre = mix(fork.half.centroid, origin, t);
      const correction = (level - Geometry.dot(normal, centre)) / Math.hypot(...normal);
      const anchor: V3 = [centre[0] + correction * unit[0], centre[1] + correction * unit[1], centre[2] + correction * unit[2]];
      const across = end.u as V3;
      const u = Geometry.unit(sub(across, scale(unit, Geometry.dot(across, unit))));
      return { station: t, origin: anchor, u, v: Geometry.cross(u, scale(unit, -1)) };
    });
    const rings: { frame: Frame; points: V3[] }[] = [];
    for (const { plane, loop } of AutoMovieMeshCourse.cut(mesh, planes, Trace.TOLERANCE, 0)) {
      if (loop === null) continue;
      const points = loop.map((uv): V3 => place(plane, uv));
      if (!points.every((p): boolean => fork.direction * (p[2] - fork.midline) > 0 &&
        Geometry.dot(sub(p, fork.parent.centroid), fork.parent.normal) < 0 &&
        Geometry.dot(sub(p, origin), forward) < 0)) continue;
      const normal = AutoMovieViewAxis.normal(plane) as V3;
      const previous = rings[rings.length - 1];
      if (!(previous?.points ?? boundary).every((p): boolean => Geometry.dot(sub(p, plane.origin), normal) < 0)) continue;
      if (previous !== undefined) {
        const previousNormal = AutoMovieViewAxis.normal(previous.frame) as V3;
        if (!points.every((p): boolean => Geometry.dot(sub(p, previous.frame.origin as V3), previousNormal) > 0)) continue;
      }
      rings.push({ frame: plane, points });
    }
    return rings;
  }

  /**
   * Weld the measured leg transitions to existing conic, ordinary and native end rows.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the measured source in its original chart and preserves its existing construction.
   */
  export function joinedLoft(
    chains: readonly IAutoMovieLoftChain[],
    stations: number[],
    observations: ReadonlyMap<number, V2[]>,
    axis: AutoMovieViewAxis.IAxis,
    fork: V3[] | null,
    mesh: AutoMovieMeshExtract.IMesh,
    diagnostics: string[],
    toeTip?: V3 | null,
    distalRim?: V3[],
    legFork?: ILegFork,
    footRefinements: readonly number[] = [],
  ): CaptureModel.ILoft {
    if (chains.length === 0 && toeTip === undefined && distalRim === undefined && legFork === undefined) return CaptureSpecs.lofts(chains, diagnostics);
    const positions: number[] = [];
    const indices: number[] = [];
    const lines: CaptureModel.ILine[] = fork === null ? [] : [{ id: "fork boundary", points: fork, closed: true, colour: "505050" }];
    const append = (points: V3[]): number[] => points.map(([x, y, z]): number => {
      const index = positions.length / 3;
      positions.push(x, y, z);
      return index;
    });
    const ordinaryIntervals: IOrdinaryInterval[] = [];
    const hipPlanes: AutoMovieMeshCourse.IPlane[] = [];
    const archiveRing = (station: number, phases: number, conic?: { positions: number[]; row: number }): V3[] | null => {
      const measured = observations.get(station)!;
      const reduced = AutoMovieMeshExtract.reduceLoop(measured, Trace.TOLERANCE).knots.map(({ point }): V2 => point);
      // The reduced Hermite curve and the polygon joining its knots have different error bounds.
      const loop = sectionDeviation(measured, reduced) <= Trace.TOLERANCE ? reduced : measured;
      const frame = axis.at(station);
      const points = Array.from({ length: phases }, (_, k): V3 | null => {
        let phi = k * 2 * Math.PI / phases;
        if (conic !== undefined) {
          const offset = 3 * (conic.row * phases + k);
          const p: V3 = [conic.positions[offset]!, conic.positions[offset + 1]!, conic.positions[offset + 2]!];
          const offsetFromCenter = sub(p, frame.origin as V3);
          phi = Math.atan2(Geometry.dot(offsetFromCenter, frame.v as V3), Geometry.dot(offsetFromCenter, frame.u as V3));
        }
        const u = Math.cos(phi);
        const v = Math.sin(phi);
        const actual = sampleRay(frame, measured, u, v);
        if (actual === null) return null;
        const candidate = loop === measured ? actual : sampleRay(frame, loop, u, v);
        return candidate !== null && Math.hypot(...sub(candidate, actual)) <= Trace.TOLERANCE ? candidate : actual;
      });
      return points.every((point): point is V3 => point !== null) ? points : null;
    };
    let previous: (IRing & { adjacent: IRing; observed: boolean }) | undefined;
    for (const [i, chain] of chains.entries()) {
      const loft = CaptureSpecs.loft(chain, []);
      if (loft.status !== "available") throw new Error(loft.cause);
      const from = chain.layers[0]!.y;
      const to = chain.layers[chain.layers.length - 1]!.y;
      const layerStations = CaptureSpecs.steps(from, to, CaptureSpecs.STEP);
      const rows = layerStations.length;
      const phases = loft.clay.positions.length / (3 * rows);
      if (!Number.isInteger(phases) || phases < 3) throw new Error("An open conic strip needs a regular phase grid");
      const observedFrom = legFork === undefined ? null : archiveRing(from, phases, { positions: loft.clay.positions, row: 0 });
      const observedTo = legFork === undefined ? null : archiveRing(to, phases, { positions: loft.clay.positions, row: rows - 1 });
      if (legFork !== undefined) {
        if (observedFrom === null) diagnostics.push(`Archive join ${from} mm has no unique ring along the conic phases.`);
        if (observedTo === null) diagnostics.push(`Archive join ${to} mm has no unique ring along the conic phases.`);
      }
      const ringCoordinates = (station: number, points: V3[] | null, row: number): void => {
        if (points === null) return;
        const offset = row * phases * 3;
        for (const [k, [x, y, z]] of points.entries()) {
          loft.clay.positions[offset + 3 * k] = x;
          loft.clay.positions[offset + 3 * k + 1] = y;
          loft.clay.positions[offset + 3 * k + 2] = z;
        }
        lines.push({ id: `Observed join ${station} mm`, points, closed: true, colour: "505050" });
      };
      ringCoordinates(from, observedFrom, 0);
      ringCoordinates(to, observedTo, rows - 1);
      const base = positions.length / 3;
      for (const coordinate of loft.clay.positions) positions.push(coordinate);
      for (const index of loft.clay.indices) indices.push(base + index);
      for (const line of loft.lines) lines.push({ ...line, id: `conic ${i}:${line.id}` });
      const first = Array.from({ length: phases }, (_, k): number => base + k);
      if (previous === undefined) {
        if (fork !== null) {
          const proximal = stations.filter((station): boolean => station < from);
          if (proximal.length <= 1) {
            const frame = axis.at(from);
            const measured = legFork === undefined ? [] : proximalRings(legFork, fork, frame, stations[1]! - stations[0]!, mesh);
            let row = append(forkClock(fork, measured[0]?.frame ?? frame));
            for (const [k, section] of measured.entries()) {
              const next = append(forkClock(section.points, section.frame));
              stitchRows(row, next, positions, indices, "length");
              row = next;
              lines.push({ id: `Observed fork transition ${k + 1}`, points: section.points, closed: true, colour: "505050" });
              hipPlanes.push({ station: k, origin: section.frame.origin as V3, u: section.frame.u as V3, v: section.frame.v as V3 });
            }
            stitchRows(row, first, positions, indices);
            if (legFork !== undefined) diagnostics.push(`Fork transition: ${measured.length} closed native rings between the shared fork boundary and the first thigh plane.`);
          } else {
            const ordinary = AutoMovieMeshExtract.profileCurve([...proximal, from].map((station) => ({
              station,
              loop: AutoMovieMeshExtract.reduceLoop(observations.get(station)!, Trace.TOLERANCE),
            })));
            const start = proximal[0]!;
            let row = append(forkClock(fork, axis.at(start)));
            for (const station of proximal.slice(1)) {
              const frame = axis.at(station);
              const next = append(Array.from({ length: phases }, (_, k): V3 => place(frame, ordinary.point(station, k / phases))));
              stitchRows(row, next, positions, indices);
              row = next;
            }
            stitchSeam({ station: proximal[proximal.length - 1]!, row }, { station: from, row: first }, axis, positions, indices);
            diagnostics.push(`Observed proximal rings lofted ordinarily from ${start.toFixed(3)} to ${from.toFixed(3)} mm.`);
          }
        }
      } else {
        const gap = stations.filter((s): boolean => s >= previous!.station && s <= from);
        const observedRows = observedFrom !== null && previous.observed
          ? gap.slice(1, -1).map((station): V3[] | null => archiveRing(station, phases))
          : [];
        const observedJoin = observedFrom !== null && previous.observed &&
          observedRows.every((ring): boolean => ring !== null);
        if (legFork !== undefined && !observedJoin)
          diagnostics.push(`The archive rings from ${previous.station} to ${from} mm do not share a single polar correspondence.`);
        const ordinary = observedJoin ? undefined : AutoMovieMeshExtract.profileCurve(gap.map((s) => ({ station: s, loop: AutoMovieMeshExtract.reduceLoop(observations.get(s)!, Trace.TOLERANCE) })));
        const patchRows: IRing[] = gap.slice(1, -1).map((s, k): IRing => {
          const frame = axis.at(s);
          return { station: s, row: append(observedJoin ? observedRows[k]! : Array.from({ length: phases }, (_, k): V3 => place(frame, ordinary!.point(s, k / phases)))) };
        });
        const end: IRing = { station: from, row: first };
        const adjacent: IRing = { station: layerStations[1]!, row: first.map((k): number => k + phases) };
        const targets = [...patchRows, end];
        const connect = (before: IRing, a: IRing, b: IRing, after: IRing): { entry: IRing; exit: IRing; mode: string } => {
          if (!observedJoin) return stitchTangent(before, a, b, after, axis, positions, indices, append);
          const mode = stitchSeam(a, b, axis, positions, indices);
          return { entry: b, exit: a, mode: `observed rings, ${mode}` };
        };
        const entry = connect(previous.adjacent, previous, targets[0]!, targets[1] ?? adjacent);
        for (let k = 1; k < patchRows.length; ++k) stitchRows(patchRows[k - 1]!.row, patchRows[k]!.row, positions, indices);
        const exit = patchRows.length === 0
          ? entry
          : connect(patchRows[patchRows.length - 2] ?? previous, patchRows[patchRows.length - 1]!, end, adjacent);
        ordinaryIntervals.push({
          stations: gap,
          observed: observedJoin,
          modes: [entry.mode, exit.mode],
          entry: inspectSeam(positions, indices, axis, previous.adjacent, previous, entry.entry),
          exit: inspectSeam(positions, indices, axis, exit.exit, end, adjacent),
        });
      }
      previous = {
        station: to,
        observed: observedTo !== null,
        row: first.map((k): number => k + (rows - 1) * phases),
        adjacent: { station: layerStations[rows - 2]!, row: first.map((k): number => k + (rows - 2) * phases) },
      };
    }
    if (legFork !== undefined && fork !== null) {
      const last = stations[stations.length - 1]!;
      const from = previous === undefined ? stations[0]! : previous.station;
      const phases = previous?.row.length ?? 72;
      let row: IRing;
      let nativeThigh = false;
      if (previous === undefined) {
        const frame = axis.at(from);
        const points = archiveRing(from, phases);
        if (points === null) throw new Error("The first thigh section has no unique measured ring");
        const measured = proximalRings(legFork, fork, frame, stations[1]! - stations[0]!, mesh);
        let boundary = append(forkClock(fork, measured[0]?.frame ?? frame));
        const start = measured[0];
        const end = measured.at(-1);
        // Continue the same skin through the first archived thigh plane when
        // its strict native rim matches that measured contour. Intermediate
        // cuts remain independent checks on the interior of this slab.
        const extension = start === undefined ? null : NodeLegF1Hip.append(mesh, legFork, start, { frame, points }, positions, indices, diagnostics);
        const native = extension ?? (start === undefined || end === undefined || start === end
          ? null : NodeLegF1Hip.append(mesh, legFork, start, end, positions, indices, diagnostics));
        for (const [k, section] of measured.entries()) {
          if (k === 0) {
            const next = native?.upper ?? append(forkClock(section.points, section.frame));
            const rails = NodeLegF1Hip.collar(boundary, next, section, legFork, mesh, positions, indices, append, native !== null);
            for (const [i, rail] of rails.entries()) lines.push({ id: `Observed posterior fork rail ${i + 1}`, points: rail, closed: false, colour: "505050" });
            diagnostics.push(`Observed posterior fork rails: ${rails.map((rail): number => rail.length).join(" / ") || "none"} source points between the retained rims.`);
            boundary = next;
          } else if (native === null) {
            const next = append(forkClock(section.points, section.frame));
            stitchRows(boundary, next, positions, indices, "length");
            boundary = next;
          }
          lines.push({ id: `Observed fork transition ${k + 1}`, points: section.points, closed: true, colour: "505050" });
          hipPlanes.push({ station: k, origin: section.frame.origin as V3, u: section.frame.u as V3, v: section.frame.v as V3 });
        }
        nativeThigh = extension !== null;
        row = { station: from, row: extension?.lower ?? append(points) };
        if (extension === null) stitchRows(native?.lower ?? boundary, row.row, positions, indices);
        else lines.push({ id: `Observed native thigh rim ${from.toFixed(3)} mm`, points: row.row.map((i): V3 =>
          [positions[3 * i]!, positions[3 * i + 1]!, positions[3 * i + 2]!]), closed: true, colour: "505050" });
        if (native !== null) diagnostics.push(`Observed proximal skin: ${native.triangles} original-surface triangles and ${native.upper.length} / ${native.lower.length} native rim edges.`);
        diagnostics.push(`Fork transition: ${measured.length} closed native rings between the shared fork boundary and the first thigh plane.`);
      } else row = previous;
      const lower = [...stations, ...footRefinements].filter((s): boolean => s > from && s <= last).sort((a, b): number => a - b);
      const sections: number[] = [from];
      for (const station of lower) {
        const points = archiveRing(station, phases);
        if (points === null) {
          if (distalRim !== undefined) throw new Error(`The regular leg contour at ${station.toFixed(3)} mm fails before the native forefoot seam.`);
          diagnostics.push(`The archive's regular lower-leg rings stop before ${station.toFixed(3)} mm, where a chart ray has more than one contact or no contact.`);
          break;
        }
        if (station === last && distalRim !== undefined) break;
        const next = { station, row: append(points) };
        if (previous !== undefined && row === previous) {
          stitchSeam(row, next, axis, positions, indices);
          const seam = inspectSeam(positions, indices, axis, previous.adjacent, previous, next);
          diagnostics.push(`Knee boundary ${previous.station.toFixed(3)} mm: ${seam.sharedEdges} reciprocal edges, maximum face angle ${seam.angle.toFixed(2)} degrees.`);
        } else if (nativeThigh && row.station === from) {
          const mode = stitchSeam(row, next, axis, positions, indices);
          diagnostics.push(`Observed thigh correspondence from ${from.toFixed(3)} to ${station.toFixed(3)} mm: ${mode}.`);
        } else if (footRefinements.includes(row.station) || footRefinements.includes(station)) {
          // The archived instep charts roll faster than their section planes
          // turn. Carry the upstream direction into both planes for the seam
          // clock. Each observed section keeps its original world vertices.
          const upstream = axis.at(row.station).u as V3;
          const transported: AutoMovieViewAxis.IAxis = {
            at(s): Frame {
              const frame = axis.at(s);
              const n = AutoMovieViewAxis.normal(frame) as V3;
              const u = Geometry.unit(sub(upstream, scale(n, Geometry.dot(upstream, n))));
              return { origin: frame.origin, u, v: Geometry.cross(u, n) };
            },
          };
          const mode = stitchSeam(row, next, transported, positions, indices);
          diagnostics.push(`Observed instep correspondence from ${row.station.toFixed(3)} to ${station.toFixed(3)} mm: ${mode}.`);
        } else stitchRows(row.row, next.row, positions, indices);
        row = next;
        if (!footRefinements.includes(station)) sections.push(station);
        lines.push({ id: `Observed leg ring ${station.toFixed(3)} mm`, points, closed: true, colour: "505050" });
      }
      if (distalRim !== undefined) {
        const seed = { station: last, row: append(forkClock(distalRim, axis.at(last))) };
        if (stitchForefoot(row, seed, axis, positions, indices))
          diagnostics.push(`Forefoot join: ${row.row.length} measured ray intersections guide ${seed.row.length} native rim vertices.`);
        else {
          const mode = stitchSeam(row, seed, axis, positions, indices);
          diagnostics.push(`Forefoot join: the measured ray correspondence was refused, so the existing ${mode} strip was used.`);
        }
        sections.push(last);
      }
      const midpoints = sections.slice(1).map((station, i): AutoMovieMeshCourse.IPlane => {
        const middle = (station + sections[i]!) / 2;
        const frame = axis.at(middle);
        return { station: middle, origin: frame.origin as V3, u: frame.u as V3, v: frame.v as V3 };
      });
      const native = AutoMovieMeshCourse.cut(mesh, midpoints, Trace.TOLERANCE);
      const generated = AutoMovieMeshCourse.cut({ positions, indices }, midpoints, Trace.TOLERANCE);
      const departures = midpoints.flatMap((plane, i): { station: number; error: number }[] => {
        const a = native[i]!.loop;
        const b = generated[i]!.loop;
        return a === null || b === null ? [] : [{ station: plane.station, error: sectionDeviation(a, b) }];
      }).sort((a, b): number => a.error - b.error);
      const worst = departures[departures.length - 1];
      diagnostics.push(`Ordinary leg from ${sections[0]!.toFixed(3)} to ${sections[sections.length - 1]!.toFixed(3)} mm: ${departures.length}/${midpoints.length} same-plane midpoint sections; ${worst === undefined ? "no contour deviation read" : `median ${departures[Math.floor(departures.length / 2)]!.error.toFixed(3)} mm, maximum ${worst.error.toFixed(3)} mm at ${worst.station.toFixed(3)} mm`}.`);
    } else if (toeTip !== undefined || distalRim !== undefined) {
      const phases = previous?.row.length ?? 72;
      const start = previous === undefined ? stations[0]! : previous.station;
      const remaining = stations.filter((s): boolean => s >= start);
      let endRow = previous?.row;
      if (remaining.length > 1) {
        const ordinary = AutoMovieMeshExtract.profileCurve(remaining.map((station) => ({
          station,
          loop: AutoMovieMeshExtract.reduceLoop(observations.get(station)!, Trace.TOLERANCE),
        })));
        let row = previous?.row;
        if (row === undefined && fork !== null) row = append(forkClock(fork, axis.at(start)));
        let station = start;
        for (const s of remaining.slice(row === undefined ? 0 : 1)) {
          const frame = axis.at(s);
          const points = distalRim !== undefined && s === remaining[remaining.length - 1]!
            ? forkClock(distalRim, frame)
            : Array.from({ length: phases }, (_, k): V3 => place(frame, ordinary.point(s, k / phases)));
          const next = append(points);
          if (row !== undefined) {
            if (row === previous?.row) stitchSeam({ station, row }, { station: s, row: next }, axis, positions, indices);
            else stitchRows(row, next, positions, indices);
          }
          row = next;
          station = s;
        }
        endRow = row;
        diagnostics.push(`Observed terminal rings lofted ordinarily from ${start.toFixed(3)} to ${station.toFixed(3)} mm.`);
      }
      if (toeTip !== undefined && toeTip !== null && endRow !== undefined) {
        const tip = append([toeTip])[0]!;
        const row = endRow;
        for (let k = 0; k < row.length; ++k) indices.push(row[k]!, tip, row[(k + 1) % row.length]!);
      }
    }
    diagnostics.push(...inspectOrdinary(ordinaryIntervals, axis, mesh, { positions, indices }));
    if (hipPlanes.length > 0) {
      const native = AutoMovieMeshCourse.cut(mesh, hipPlanes, Trace.TOLERANCE, 0);
      const candidate = AutoMovieMeshCourse.cut({ positions, indices }, hipPlanes, Trace.TOLERANCE, 0);
      const errors = native.flatMap(({ loop }, i): number[] => {
        const observed = candidate[i]!.loop;
        return loop === null || observed === null ? [] : [sectionDeviation(loop, observed)];
      });
      diagnostics.push(`Fork transition comparison: ${errors.length}/${hipPlanes.length} same-plane strict rings; ${errors.length === 0 ? "maximum unavailable" : `maximum ${Math.max(...errors).toFixed(3)} mm`}.`);
    }
    return { status: "available", lines, clay: { positions, indices }, diagnostics: CaptureSpecs.counted(diagnostics) };
  }
}
