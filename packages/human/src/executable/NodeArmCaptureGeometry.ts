import {
  AutoMovieMeshCourse,
  AutoMovieNaturalSpline,
  type AutoMovieViewAxis,
  AutoMovieViewParameter,
  type IAutoMovieContourLoft64,
  type IAutoMovieCurve64,
  tessellateAutoMovieContourLoft64,
  tessellateAutoMovieContourStrip64,
} from "@automovie/engine";

import type { AutoMovieHumanF1Trace } from "../generation/AutoMovieHumanF1Trace";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanArmF1Pose } from "../generation/arm/AutoMovieHumanArmF1Pose";
import { AutoMovieHumanArmJet } from "../generation/arm/AutoMovieHumanArmJet";
import type { CaptureModel } from "../inspection/CaptureModel";
import { NodeArmFingerFan } from "./NodeArmFingerFan";

type V3 = CaptureModel.Vec3;

/** Read the measured arm charts and attach ordinary strips at their existing indexed contours. */
export namespace NodeArmCaptureGeometry {
  /** Join the original armscye rim to the first open conic ring on its next measured plane. */
  export function attachArmscye(
    clay: CaptureModel.ITriangles,
    measured: readonly V3[],
    root: IPhysicalPlane,
    first: ReturnType<AutoMovieViewAxis.IAxis["at"]>,
  ): string {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const count: number = 72;
    const conic: V3[] = Array.from({ length: count }, (_: unknown, i: number): V3 =>
      clay.positions.slice(3 * i, 3 * i + 3) as V3);
    const normal: V3 = S.cross(first.v as V3, first.u as V3);
    const origin: V3 = first.origin as V3;
    const rootErrors: number[] = measured.map((p: V3): number => Math.abs(S.dot(difference(p, root.origin), root.normal)));
    const conicErrors: number[] = conic.map((p: V3): number => Math.abs(S.dot(difference(p, origin), normal)));
    if (measured.length < 3 || Math.max(...rootErrors, ...conicErrors) > 1e-6 ||
      measured.some((p: V3): boolean => S.dot(difference(p, origin), normal) >= 0) ||
      conic.some((p: V3): boolean => S.dot(difference(p, root.origin), root.normal) <= 0))
      throw new Error("the archived armscye and first conic rings are not ordered on their original planes");

    const source: V3[] = orientation(measured, root) * orientation(conic, root) > 0 ? [...measured] : [...measured].reverse();
    const start: number = clay.positions.length / 3;
    const vertex: Map<V3, number> = new Map([
      ...source.map((p: V3, i: number): [V3, number] => [p, start + i]),
      ...conic.map((p: V3, i: number): [V3, number] => [p, i]),
    ]);
    const indices: number[] = [];
    tessellateAutoMovieContourStrip64(source, conic, (a: V3, b: V3, c: V3): void => {
      for (const p of [a, b, c]) {
        const index: number | undefined = vertex.get(p);
        if (index === undefined) throw new Error("the armscye strip added an unowned rim vertex");
        indices.push(index);
      }
    }, (p: V3): string | undefined => vertex.get(p)?.toString(), ({ qualified, diagnostics }): void => {
      if (!qualified) throw new Error(`the measured armscye strip is unqualified: ${diagnostics.join("; ")}`);
    });

    const rim = (triangles: readonly number[], base: number, size: number): Map<number, number> => {
      const found: Map<number, number> = new Map();
      for (let i: number = 0; i < triangles.length; i += 3)
        for (let j: number = 0; j < 3; ++j) {
          const a: number = triangles[i + j]! - base;
          const b: number = triangles[i + (j + 1) % 3]! - base;
          if (a < 0 || a >= size || b < 0 || b >= size) continue;
          if ((a + 1) % size === b && !found.has(a)) found.set(a, 1);
          else if ((b + 1) % size === a && !found.has(b)) found.set(b, -1);
          else throw new Error("the armscye strip changed the existing boundary edge order");
        }
      if (found.size !== size || new Set(found.values()).size !== 1)
        throw new Error(`the armscye strip has only ${found.size}/${size} consistently directed edges`);
      return found;
    };
    const prior: Map<number, number> = rim(clay.indices, 0, count);
    const seam: Map<number, number> = rim(indices, 0, count);
    rim(indices, start, source.length);
    if (prior.get(0) === seam.get(0))
      for (let i: number = 0; i < indices.length; i += 3)
        [indices[i + 1], indices[i + 2]] = [indices[i + 2]!, indices[i + 1]!];
    clay.positions.push(...source.flat());
    clay.indices.push(...indices);
    const advance: number = S.dot(difference(origin, root.origin), root.normal);
    return `Measured armscye remains open at all ${source.length} original indexed edges. The ${advance.toFixed(3)} mm strip shares all ${count} first conic edges`;
  }

  /** One physical reference plane in capture-world millimetres. */
  interface IPhysicalPlane {
    origin: V3;
    u: V3;
    v: V3;
    normal: V3;
  }

  /** Original contours up to a measured whole-hand termination. */
  export interface IPalmArchive {
    /** Ordered source and measured collar cuts ending at the whole-hand plane. */
    rows: IReferenceSection[];

    /** Last whole-hand ring in capture-world millimetres, with implicit closure. */
    outline: V3[];

    /** Last whole-hand cutting plane origin in capture-world millimetres. */
    end: V3;

    /** Capture diagnostic naming the terminal plane, measured area, and raw cut flags. */
    receipt: string;
  }

  /** Read the final whole-hand contour without changing either observed plane. */
  export function measuredPalm(
    side: "left" | "right",
    mesh: CaptureModel.ITriangles,
    sections: readonly IReferenceSection[],
    start: number,
    root: readonly V3[],
  ): IPalmArchive {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const right: IReferenceSection | undefined = sections.find((row: IReferenceSection): boolean => row.station === 144);
    const record: string = side === "left" ? "left issue s80" : "right archive row 144 (60 mm from its own wrist)";
    let end: IPhysicalPlane;
    if (side === "right") {
      if (right === undefined) throw new Error("the right archive has no measured row 144");
      end = physicalPlane(right);
    } else {
      const left: AutoMovieHumanArmF1Pose.ILandmarks = AutoMovieHumanArmF1Pose.LEFT;
      const normal: V3 = S.unit(left.handAxis);
      const across = (a: V3, n: V3): V3 => difference(a, scaled(n, S.dot(a, n)));
      const forearm: V3 = S.unit(difference(left.wristZero, left.EC));
      const u: V3 = S.unit(across(across(difference(left.RS, left.US), forearm), normal));
      end = { origin: added(left.wristZero, scaled(normal, 80)), normal, u, v: S.cross(u, normal) };
    }

    const raw: AutoMovieMeshCourse.ISection = AutoMovieMeshCourse.cut(mesh, [{ station: 0, origin: end.origin, u: end.u, v: end.v }], 0.5, 0)[0]!;
    if (raw.loop === null) throw new Error(`${record} has no holding outer contour`);
    const head: [number, number] = raw.loop[0]!;
    const tail: [number, number] = raw.loop[raw.loop.length - 1]!;
    // A repeated closure vertex is already represented by the closed ring.
    const polygon: [number, number][] = head[0] === tail[0] && head[1] === tail[1] ? raw.loop.slice(0, -1) : raw.loop;
    const outline: V3[] = polygon.map(([u, v]: [number, number]): V3 => added(end.origin, added(scaled(end.u, u), scaled(end.v, v))));
    const retained: IReferenceSection[] = [];
    for (const row of sections.slice(start)) {
      if (side === "right" && row.station === 144) break;
      const plane: IPhysicalPlane = physicalPlane(row);
      const before: boolean = row.loops[0]!.curve.spans.every((span: IAutoMovieCurve64.Span): boolean =>
        span.every((p: IAutoMovieCurve64.Vector): boolean => S.dot(difference(world(p), end.origin), end.normal) < 0));
      const after: boolean = outline.every((p: V3): boolean => S.dot(difference(p, plane.origin), plane.normal) > 0);
      if (!before || !after) break;
      retained.push(row);
    }
    if (retained.length === 0) throw new Error(`${record} overlaps the retained wrist boundary`);
    if (orientation(outline, end) * orientation(root, physicalPlane(retained[0]!)) < 0) outline.reverse();
    const terminal: IReferenceSection = {
      station: side === "left" ? 80 : 144,
      stationMm: side === "left" ? 80 : 60,
      coordinateMm: S.dot(end.origin, end.normal),
      originMm: world(end.origin),
      u: world(end.u),
      v: world(scaled(end.v, -1)),
      loops: [{ kind: "closed", curve: linearRing(record, outline.map(world)) }],
    };
    const last: IReferenceSection = retained[retained.length - 1]!;
    const rows: IReferenceSection[] = [...retained];

    // The left archive chart turns into the issue's whole-hand plane. The
    // original mesh holds a ring between them, where the single strip folds.
    if (side === "left") {
      const prior: IPhysicalPlane = physicalPlane(last);
      const points: V3[] = NodeArmFingerFan.sample(last.loops[0]!.curve).map(world);
      const observed = NodeArmFingerFan.between(mesh, points, outline,
        [prior.origin, end.origin], [prior.normal, end.normal], prior.u, 1);
      if (observed.ring === undefined) throw new Error(`The left palm collar has no ordered original middle cut: ${JSON.stringify(observed.receipt)}`);
      const section = observed.ring;
      const ring: V3[] = orientation(section.points, section) * orientation(outline, end) > 0
        ? section.points : [...section.points].reverse();
      rows.push({ station: last.station + 0.5, stationMm: (last.stationMm + terminal.stationMm) / 2,
        coordinateMm: S.dot(section.origin, section.normal), originMm: world(section.origin), u: world(section.u),
        v: world(scaled(section.v, -1)), loops: [{ kind: "closed", curve: linearRing("observed left palm collar", ring.map(world)) }] });
    }
    const receipt: string = `observed whole-hand terminal: ${record}, ${raw.area?.toFixed(3)} mm², after archive row ${last.station}${side === "left" ? " through the measured middle cut" : ""}${raw.flags.length === 0 ? "" : `. Raw cut flags: ${raw.flags.join(", ")}`}`;
    return { rows: [...rows, terminal], outline, end: end.origin, receipt };
  }

  /** The recorded chart after converting its handedness to capture world. */
  export function physicalPlane(row: IReferenceSection): IPhysicalPlane {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const u: V3 = world(row.u);
    const v: V3 = scaled(world(row.v), -1);
    return { origin: world(row.originMm), u, v, normal: S.cross(v, u) };
  }

  /** Signed orientation of a closed ring as seen from its section normal. */
  function orientation(ring: readonly V3[], plane: IPhysicalPlane): number {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    return ring.reduce((sum: number, p: V3, i: number): number =>
      sum + S.dot(S.cross(difference(p, plane.origin), difference(ring[(i + 1) % ring.length]!, plane.origin)), plane.normal), 0);
  }

  /** A polygonal edge represented by exact linear cubic spans. */
  function linearRing(name: string, points: readonly V3[]): IAutoMovieCurve64.Cubic {
    const spans: IAutoMovieCurve64.Span[] = points.map((a: V3, i: number): IAutoMovieCurve64.Span => {
      const b: V3 = points[(i + 1) % points.length]!;
      const d: V3 = difference(b, a);
      return [a, added(a, scaled(d, 1 / 3)), added(a, scaled(d, 2 / 3)), b];
    });
    return {
      type: "cubicBezier", name, closed: true, unit: "mm", phaseUnit: "mm",
      phaseIntervals: points.map((a: V3, i: number): number => Math.hypot(...difference(a, points[(i + 1) % points.length]!))),
      spans,
    };
  }

  /** Numerical chart of the ordinary strip. Its rows are still the original world planes. */
  interface IContourCoordinates {
    stations: number[];
    into(row: number, point: V3): V3;
    out(point: V3): V3;
  }

  /** Read each exact observed plane in the contour loft's common numerical chart. */
  export function contourCoordinates(rows: readonly IReferenceSection[]): IContourCoordinates {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const planes: IPhysicalPlane[] = rows.map(physicalPlane);
    const stations: number[] = [0];
    for (let i: number = 1; i < planes.length; ++i)
      stations.push(stations[i - 1]! + Math.hypot(...difference(planes[i]!.origin, planes[i - 1]!.origin)));
    return {
      stations,
      into(i: number, point: V3): V3 {
        const p: IPhysicalPlane = planes[i]!;
        const relative: V3 = difference(point, p.origin);
        if (Math.abs(S.dot(relative, p.normal)) > 1e-6) throw new Error(`original contour leaves its plane at row ${rows[i]!.station}`);
        return [S.dot(relative, p.u), stations[i]!, S.dot(relative, p.v)];
      },
      out([x, y, z]: V3): V3 {
        const i: number = stations.findIndex((s: number): boolean => Math.abs(s - y) <= 1e-6);
        if (i < 0) throw new Error("ordinary strip produced a vertex away from its original section planes");
        const p: IPhysicalPlane = planes[i]!;
        return added(p.origin, added(scaled(p.u, x), scaled(p.v, z)));
      },
    };
  }

  /** Report the quadrant and world ray of the largest same-phase residual. */
  export function describeResidual(layer: AutoMovieHumanF1Trace.ILayer, axis: AutoMovieViewAxis.IAxis): string {
    const f = axis.at(layer.station);
    const radians: number = (layer.phase + 2 * Math.PI) % (2 * Math.PI);
    const quadrant: number = Math.floor(radians / (Math.PI / 2));
    const direction: string = [0, 1, 2].map((i: number): string =>
      (f.u[i]! * Math.cos(radians) + f.v[i]! * Math.sin(radians)).toFixed(3)).join(", ");
    return `raw minus clay ${layer.signed.toFixed(3)} mm, quarter ${quadrant}, phase ${(radians * 180 / Math.PI).toFixed(1)} deg, world ray [${direction}]`;
  }

  /**
   * Continue the actual open clay boundary through a parallel archive span.
   * The first strip owns the existing boundary vertices; subsequent rows
   * use the original Bézier curves and only a measured terminal closes it.
   */
  export function attachContours(
    clay: CaptureModel.ITriangles,
    sections: readonly IReferenceSection[],
    observedRoot: readonly V3[],
    frame: ReturnType<AutoMovieViewAxis.IAxis["at"]>,
    terminal?: IReferenceTerminal,
    coordinates?: IContourCoordinates,
  ): string {
    const { base, boundary } = openTerminal(clay, frame);
    const count: number = boundary.length;
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const chart: IPhysicalPlane = { origin: frame.origin as V3, u: frame.u as V3, v: frame.v as V3, normal: S.cross(frame.v as V3, frame.u as V3) };
    const samePoint: number = 1e-6;
    const ordered: V3[] = orientation(boundary, chart) * orientation(observedRoot, chart) > 0 ? boundary : [...boundary].reverse();
    const edge: IAutoMovieCurve64.Cubic = linearRing("shared conic edge", ordered.map((p: V3): V3 => coordinates === undefined ? world(p) : coordinates.into(0, p)));
    const rows: IAutoMovieContourLoft64.ISection[] = sections.map((row: IReferenceSection, i: number): IAutoMovieContourLoft64.ISection => {
      const curve: IAutoMovieCurve64.Cubic = row.loops[0]!.curve;
      const read = (p: IAutoMovieCurve64.Vector): V3 => coordinates!.into(i, world(p));
      const observed: IAutoMovieCurve64.Cubic = coordinates === undefined ? curve : {
        ...curve,
        spans: curve.spans.map(([a, b, c, d]: IAutoMovieCurve64.Span): IAutoMovieCurve64.Span => [read(a), read(b), read(c), read(d)]),
      };
      return { coordinateMm: coordinates?.stations[i] ?? row.coordinateMm, loops: [{ curve: i === 0 ? edge : observed, winding: 1 }] };
    });
    const events: IAutoMovieContourLoft64.IEvent[] = [];
    if (terminal !== undefined) {
      const coordinate: number = terminal.maximum.coordinateMm;
      const before: number = rows[rows.length - 1]!.coordinateMm;
      const after: number | undefined = terminal.coordinatesMm.find((s: number): boolean => s > coordinate);
      if (!(before < coordinate) || after === undefined)
        throw new Error("the observed maximum does not follow its last retained contour");
      rows.push({ coordinateMm: after, loops: [] });
      events.push({
        name: "observed digit terminal",
        kind: "maximum",
        coordinateMm: coordinate,
        beforeMm: before,
        afterMm: after,
        before: [0],
        after: [],
        regular: terminal.singleTipQualified,
        terminal: terminal.maximum.pointsMm[0]!,
      });
    }
    const ordinary = tessellateAutoMovieContourLoft64({ sections: rows, events, chordToleranceMm: 0.1 });
    if (ordinary.unresolved.length !== 0 || ordinary.mesh.indices === null)
      throw new Error(`ordinary contour loft left unresolved strips: ${JSON.stringify(ordinary.unresolved)}`);

    const positions: number[] = [];
    const remap: number[] = [];
    const start: number = clay.positions.length / 3;
    const p: number[] = ordinary.mesh.positions;
    for (let i: number = 0; i < p.length; i += 3) {
      const point: V3 = [p[i]! * 1000, p[i + 1]! * 1000, p[i + 2]! * 1000];
      const vertex: V3 = coordinates === undefined ? world(point) : coordinates.out(point);
      const shared: number = boundary.findIndex((b: V3): boolean => Math.hypot(...difference(vertex, b)) <= samePoint);
      if (shared >= 0) remap.push(base + shared);
      else {
        remap.push(start + positions.length / 3);
        positions.push(...vertex);
      }
    }
    const indices: number[] = ordinary.mesh.indices.map((index: number): number => remap[index]!);
    const seam: Map<number, number> = new Map();
    for (let i: number = 0; i < indices.length; i += 3)
      for (let k: number = 0; k < 3; ++k) {
        const a: number = indices[i + k]! - base;
        const b: number = indices[i + ((k + 1) % 3)]! - base;
        if (a < 0 || a >= count || b < 0 || b >= count) continue;
        if ((a + 1) % count === b && !seam.has(a)) seam.set(a, 1);
        else if ((b + 1) % count === a && !seam.has(b)) seam.set(b, -1);
        else throw new Error("the ordinary loft changed the existing terminal edge order");
      }
    const seamDirections: Set<number> = new Set(seam.values());
    if (seam.size !== count || seamDirections.size !== 1)
      throw new Error(`the ordinary loft shared only ${seam.size}/${count} consistently oriented terminal edges`);
    if (seamDirections.has(1))
      for (let i: number = 0; i < indices.length; i += 3)
        [indices[i + 1], indices[i + 2]] = [indices[i + 2]!, indices[i + 1]!];
    for (const value of positions) clay.positions.push(value);
    for (const index of indices) clay.indices.push(index);
    return `ordinary ${sections.length}-section span shares ${count} existing oriented edges. ${terminal === undefined ? "Distal end remains open" : "Closed at the unique observed terminal"}`;
  }

  /** Read the actual open capture edge and verify every directed mesh edge. */
  export function openTerminal(
    clay: CaptureModel.ITriangles,
    frame: ReturnType<AutoMovieViewAxis.IAxis["at"]>,
  ): { base: number; boundary: V3[] } {
    // CaptureSpecs.loft samples the open terminal layer at 72 phases.
    const count: number = 72;
    const base: number = clay.positions.length / 3 - count;
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const normal: V3 = S.cross(frame.v as V3, frame.u as V3);
    const origin: V3 = frame.origin as V3;
    const boundary: V3[] = Array.from({ length: count }, (_: unknown, i: number): V3 => {
      const k: number = (base + i) * 3;
      return [clay.positions[k]!, clay.positions[k + 1]!, clay.positions[k + 2]!];
    });
    if (boundary.some((p: V3): boolean => Math.abs(S.dot(difference(p, origin), normal)) > 1e-6))
      throw new Error("the actual terminal vertices do not lie in their archived plane");
    const edges: Set<number> = new Set();
    for (let i: number = 0; i < clay.indices.length; i += 3)
      for (let k: number = 0; k < 3; ++k) {
        const a: number = clay.indices[i + k]! - base;
        const b: number = clay.indices[i + ((k + 1) % 3)]! - base;
        if (a < 0 || b < 0) continue;
        if ((a + 1) % count !== b || edges.has(a))
          throw new Error("the archived terminal is not one open directed mesh ring");
        edges.add(a);
      }
    if (edges.size !== count) throw new Error(`the captured mesh has only ${edges.size}/${count} open terminal edges`);
    return { base, boundary };
  }

  /** One Bézier section and its cutting chart in native world millimetres. */
  export interface IReferenceSection {
    /** Source row label, with a fractional label for an inserted measured collar cut. */
    station: number;

    /** Distance along the source course in millimetres, used to index the axis. */
    stationMm: number;

    /** Signed cutting-plane coordinate in millimetres in the section's observation chart. */
    coordinateMm: number;

    /** Cutting-plane origin in native reference-world millimetres. */
    originMm: V3;

    /** First unit tangent of the cutting plane in native reference-world axes. */
    u: V3;

    /** Second unit tangent of the cutting plane in the reference chart's handedness. */
    v: V3;

    /** Source contours in native reference-world millimetres with their observed closure kind. */
    loops: { kind: string; curve: IAutoMovieCurve64.Cubic }[];
  }

  /** One archived reference plane in native world millimetres. */
  export interface IReferencePlane {
    /** The observed course point. */
    origin: V3;
    /** The first chart axis. */
    u: V3;
    /** The second chart axis, using the reference handedness. */
    v: V3;
  }

  /**
   * Keep the original section planes at their archived stations. Natural
   * splines continue their origins and directions between measurements; the
   * analytic jet differentiates the orthonormalized chart actually used.
   */
  export function referenceAxis(planes: readonly IReferencePlane[], stations: number[]): AutoMovieViewAxis.IAxis {
    const J: typeof AutoMovieHumanArmJet = AutoMovieHumanArmJet;
    const vector = (read: (p: IReferencePlane) => V3): ((s: number) => AutoMovieHumanArmJet.V) => {
      const components: V3[] = planes.map(read);
      const splines: AutoMovieNaturalSpline.ISpline[] = [0, 1, 2].map((k: number): AutoMovieNaturalSpline.ISpline =>
        AutoMovieNaturalSpline.create(stations, components.map((p: V3): number => p[k]!)));
      return (s: number): AutoMovieHumanArmJet.V => [
        AutoMovieNaturalSpline.read(splines[0]!, s),
        AutoMovieNaturalSpline.read(splines[1]!, s),
        AutoMovieNaturalSpline.read(splines[2]!, s),
      ];
    };
    const origin = vector((p: IReferencePlane): V3 => world(p.origin));
    const across = vector((p: IReferencePlane): V3 => world(p.u));
    const up = vector((p: IReferencePlane): V3 => {
      const [x, y, z]: V3 = world(p.v);
      return [-x, -y, -z];
    });
    const frame = (s: number): { origin: AutoMovieHumanArmJet.V; u: AutoMovieHumanArmJet.V; v: AutoMovieHumanArmJet.V } => {
      const u: AutoMovieHumanArmJet.V = J.unit(across(s));
      const normal: AutoMovieHumanArmJet.V = J.unit(J.cross(up(s), u));
      return { origin: origin(s), u, v: J.cross(u, normal) };
    };
    return {
      at: (s: number): ReturnType<AutoMovieViewAxis.IAxis["at"]> => {
        const f = frame(s);
        return { origin: J.value(f.origin), u: J.value(f.u), v: J.value(f.v) };
      },
      jet: (s, parameter) => {
        const f = frame(s);
        const inverse: [number, number] | null = parameter === undefined ? [1, 0] : AutoMovieViewParameter.inverseJet(parameter, s);
        if (inverse === null) return null;
        const derivatives = (vector: AutoMovieHumanArmJet.V): AutoMovieHumanArmJet.V =>
          vector.map(([value, first, second]: AutoMovieHumanArmJet.J): AutoMovieHumanArmJet.J =>
            [value, first * inverse[0], second * inverse[0] * inverse[0] + first * inverse[1]]) as AutoMovieHumanArmJet.V;
        const origin: AutoMovieHumanArmJet.V = derivatives(f.origin);
        const u: AutoMovieHumanArmJet.V = derivatives(f.u);
        const v: AutoMovieHumanArmJet.V = derivatives(f.v);
        return {
          value: { origin: J.value(origin), u: J.value(u), v: J.value(v) },
          first: { origin: J.first(origin), u: J.first(u), v: J.first(v) },
          second: { origin: J.second(origin), u: J.second(u), v: J.second(v) },
        };
      },
    };
  }

  /** Convert native reference axes to capture-world axes by reflecting Z at the same scale. */
  export function world([x, y, z]: IAutoMovieCurve64.Vector): V3 {
    return [x, y, -z];
  }

  function added(a: V3, b: V3): V3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  function scaled(p: V3, factor: number): V3 {
    return [p[0] * factor, p[1] * factor, p[2] * factor];
  }

  /** Displacement from b to a in their shared frame and units. */
  export function difference(a: V3, b: V3): V3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }


  /** Isolated raw-mesh tip and its observed neighbouring coordinates. */
  export interface IReferenceTerminal {
    /** Whether the raw-mesh maximum qualifies as a single point for a loft cap. */
    singleTipQualified: boolean;

    /** Terminal plane coordinate and its raw-mesh extremal points in native world millimetres. */
    maximum: { coordinateMm: number; pointsMm: V3[] };

    /** Observed plane coordinates in millimetres, including a cut beyond the maximum. */
    coordinatesMm: number[];
  }
}
