import { AutoMovieMeshCourse, type AutoMovieViewAxis, type IAutoMovieCurve64 } from "@automovie/engine";

import type { AutoMovieHumanF1Trace } from "../generation/AutoMovieHumanF1Trace";
import { AutoMovieHumanArmAxis } from "../generation/arm/AutoMovieHumanArmAxis";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanArmF1Lines } from "../generation/arm/AutoMovieHumanArmF1Lines";
import { AutoMovieHumanArmF1Pose } from "../generation/arm/AutoMovieHumanArmF1Pose";
import { AutoMovieHumanHandPalm } from "../generation/hand/AutoMovieHumanHandPalm";
import type { CaptureModel } from "../inspection/CaptureModel";
import { NodeArmFingerFan } from "./NodeArmFingerFan";

type V3 = CaptureModel.Vec3;

/** Read the measured arm charts and attach ordinary strips at their existing indexed contours. */
export namespace NodeArmCaptureGeometry {
  /** Draw the pure F1 sleeve with the inspected arm's exact current wrist boundary. */
  export function sleeve(
    clay: CaptureModel.ITriangles,
    measured: readonly V3[],
    root: IPhysicalPlane,
    sections: readonly { line: CaptureModel.ILine; row: IReferenceSection }[],
    wrist: IPhysicalPlane,
    frame: ReturnType<AutoMovieViewAxis.IAxis["at"]>,
  ): { clay: CaptureModel.ITriangles; lines: CaptureModel.ILine[] } {
    const terminal: V3[] = openTerminal(clay, frame).boundary;
    const source: V3[] = [...measured];
    const emitted: CaptureModel.ITriangles = AutoMovieHumanArmF1Lines.sleeve(
      { points: source, normal: root.normal },
      sections.map(({ line, row }): AutoMovieHumanArmF1Lines.IFixedRing => ({ points: line.points, normal: physicalPlane(row).normal })),
      { points: terminal, normal: wrist.normal },
    );
    return { clay: emitted, lines: [
      { id: "loft:armscye", closed: true, colour: "505050", points: source },
      ...sections.map(({ line }): CaptureModel.ILine => line),
      { id: "loft:wrist", closed: true, colour: "505050", points: terminal },
    ] };
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

  /** The numeric section chart shared with the pure palm loft. */
  export const contourCoordinates: typeof AutoMovieHumanHandPalm.contourCoordinates = AutoMovieHumanHandPalm.contourCoordinates;

  /** Report the quadrant and world ray of the largest same-phase residual. */
  export function describeResidual(layer: AutoMovieHumanF1Trace.ILayer, axis: AutoMovieViewAxis.IAxis): string {
    const f = axis.at(layer.station);
    const radians: number = (layer.phase + 2 * Math.PI) % (2 * Math.PI);
    const quadrant: number = Math.floor(radians / (Math.PI / 2));
    const direction: string = [0, 1, 2].map((i: number): string =>
      (f.u[i]! * Math.cos(radians) + f.v[i]! * Math.sin(radians)).toFixed(3)).join(", ");
    return `raw minus clay ${layer.signed.toFixed(3)} mm, quarter ${quadrant}, phase ${(radians * 180 / Math.PI).toFixed(1)} deg, world ray [${direction}]`;
  }

  /** The exact indexed continuation used by both inspection and fixed F1. */
  export const attachContours: typeof AutoMovieHumanHandPalm.attachFixed = AutoMovieHumanHandPalm.attachFixed;

  /** Read the existing 72-point open conic edge. */
  export const openTerminal: typeof AutoMovieHumanHandPalm.openTerminal = AutoMovieHumanHandPalm.openTerminal;

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

  /** Read the original measured cut chart through the pure shared axis. */
  export function referenceAxis(planes: readonly IReferencePlane[], stations: number[]): AutoMovieViewAxis.IAxis {
    return AutoMovieHumanArmAxis.observed(planes.map((plane: IReferencePlane, i: number): AutoMovieHumanArmAxis.IFixedChart =>
      ({ originMm: plane.origin, stationMm: stations[i]!, u: plane.u, v: plane.v })));
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
