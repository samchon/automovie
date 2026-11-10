import { type AutoMovieLoftFrame, type AutoMovieViewAxis, type IAutoMovieContourLoft64, type IAutoMovieCurve64, type IAutoMovieLoftChain, tessellateAutoMovieContourLoft64, tessellateAutoMovieContourStrip64 } from "@automovie/engine";
import { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import type { AutoMovieHumanArmF1Lines } from "../arm/AutoMovieHumanArmF1Lines";
import type { IAutoMovieHumanHandForm } from "./IAutoMovieHumanHandForm";
import { AutoMovieHumanArmPrior } from "../AutoMovieHumanArmPrior";
import { AutoMovieHumanHandSide } from "./AutoMovieHumanHandSide";
import { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";
import { AutoMovieHumanLimbFrame } from "../AutoMovieHumanLimbFrame";
import { AutoMovieHumanPalmRelief } from "./AutoMovieHumanPalmRelief";

type Vec3 = AutoMovieHumanHandVector.Vec3;
type V3 = Vec3;
const { scale, dot, mean }: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;
const { sidedFrame, reflect }: typeof AutoMovieHumanHandSide = AutoMovieHumanHandSide;

/**
 * The palm's chain, its sections square to the hand's axis, each carrying the
 * palm's reliefs (`AutoMovieHumanPalmRelief`).
 */
export namespace AutoMovieHumanHandPalm {
  /** JSON coefficient layout before restoring the engine's fixed tuple widths. */
  export interface IFixedCurveInput {
    /** Declared cubic representation and physical units. */
    type: string;
    /** Original curve identity. */
    name: string;
    /** Original closed-loop flag. */
    closed: boolean;
    /** Position unit of the stored controls. */
    unit: string;
    /** Unit of the original curve parameter. */
    phaseUnit: string;
    /** Original span widths. */
    phaseIntervals: number[];
    /** Four three-coordinate controls per span. */
    spans: number[][][];
  }

  /** Restore one exact three-coordinate tuple at the JSON boundary. */
  export function fixedPoint(value: readonly number[]): V3 {
    if (value.length !== 3 || value.some((x: number): boolean => !Number.isFinite(x)))
      throw new Error("A fixed F1 point needs three finite coordinates");
    return [value[0]!, value[1]!, value[2]!];
  }

  /** Restore cubic tuple widths and literal tags without moving any control. */
  export function fixedCurve(value: IFixedCurveInput): IAutoMovieCurve64.Cubic {
    if (value.type !== "cubicBezier" || value.unit !== "mm" ||
      value.phaseUnit !== "mm" && value.phaseUnit !== "turn" && value.phaseUnit !== "normalized")
      throw new Error("The fixed F1 curve has an unsupported representation or unit");
    return { ...value, type: value.type, unit: value.unit, phaseUnit: value.phaseUnit,
      spans: value.spans.map((span: number[][]): IAutoMovieCurve64.Span => {
        if (span.length !== 4) throw new Error("A fixed F1 cubic needs four ordered controls");
        return [fixedPoint(span[0]!), fixedPoint(span[1]!), fixedPoint(span[2]!), fixedPoint(span[3]!)];
      }) };
  }

  /** Restore the unchanged absolute frame and cubic loops of an authored section. */
  export function fixedSection(value: {
    station: number; stationMm: number; coordinateMm: number; originMm: number[]; u: number[]; v: number[];
    loops: { kind: string; curve: IFixedCurveInput }[];
  }): IFixedSection {
    return { ...value, originMm: fixedPoint(value.originMm), u: fixedPoint(value.u), v: fixedPoint(value.v),
      loops: value.loops.map((loop: typeof value.loops[number]): IFixedSection["loops"][number] => ({ ...loop, curve: fixedCurve(loop.curve) })) };
  }

  /** One physical reference plane in capture-world millimetres. */
  interface IPhysicalPlane {
    /** Absolute capture-world millimetre origin. */
    origin: V3;
    /** Unit first tangent in capture-world axes. */
    u: V3;
    /** Unit second tangent after the native chart reflection. */
    v: V3;
    /** Distal normal derived from the retained chart handedness. */
    normal: V3;
  }


  /** The recorded chart after converting its handedness to capture world. */
  function physicalPlane(row: IFixedSection): IPhysicalPlane {
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
    /** Accumulated distances between the actual plane origins, millimetres. */
    stations: number[];
    /** Whether the measured turning collar is retiled in its world chart. */
    worldCollar: boolean;
    /** Project one world point into its own recorded section chart. */
    into(row: number, point: V3): V3;
    /** Return an evaluated section point to its exact recorded world plane. */
    out(point: V3): V3;
  }

  /** Read each exact observed plane in the contour loft's common numerical chart. */
  export function contourCoordinates(rows: readonly IFixedSection[], worldCollar: boolean): IContourCoordinates {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const planes: IPhysicalPlane[] = rows.map(physicalPlane);
    const stations: number[] = [0];
    for (let i: number = 1; i < planes.length; ++i)
      stations.push(stations[i - 1]! + Math.hypot(...difference(planes[i]!.origin, planes[i - 1]!.origin)));
    return {
      stations, worldCollar,
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


  /**
   * Continue the actual open clay boundary through a parallel archive span.
   * The first strip owns the existing boundary vertices; subsequent rows
   * use the original Bézier curves and only a measured terminal closes it.
   */
  export function attachFixed(
    clay: AutoMovieHumanArmF1Lines.IFixedMesh,
    sections: readonly IFixedSection[],
    observedRoot: readonly V3[],
    frame: ReturnType<AutoMovieViewAxis.IAxis["at"]>,
    terminal?: IFixedTerminal,
    coordinates?: IContourCoordinates,
  ): string {
    const { base, boundary }: ReturnType<typeof openTerminal> = openTerminal(clay, frame);
    const count: number = boundary.length;
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const chart: IPhysicalPlane = { origin: frame.origin as V3, u: frame.u as V3, v: frame.v as V3, normal: S.cross(frame.v as V3, frame.u as V3) };
    const samePoint: number = 1e-6;
    const ordered: V3[] = orientation(boundary, chart) * orientation(observedRoot, chart) > 0 ? boundary : [...boundary].reverse();
    const edge: IAutoMovieCurve64.Cubic = linearRing("shared conic edge", ordered.map((p: V3): V3 => coordinates === undefined ? world(p) : coordinates.into(0, p)));
    const rows: IAutoMovieContourLoft64.ISection[] = sections.map((row: IFixedSection, i: number): IAutoMovieContourLoft64.ISection => {
      const curve: IAutoMovieCurve64.Cubic = row.loops[0]!.curve;

      /** Express this source cubic in the numerical chart of its own plane. */
      const read: (p: IAutoMovieCurve64.Vector) => V3 = (p: IAutoMovieCurve64.Vector): V3 => coordinates!.into(i, world(p));
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
    const ordinary: IAutoMovieContourLoft64.IResult = tessellateAutoMovieContourLoft64({ sections: rows, events, chordToleranceMm: 0.1 });
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
    const tiles: number[] = coordinates?.worldCollar === true
      ? worldCollar(ordinary, coordinates.stations, coordinates.out)
      : ordinary.mesh.indices;
    const indices: number[] = tiles.map((index: number): number => remap[index]!);
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
    clay: AutoMovieHumanArmF1Lines.IFixedMesh,
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
  export interface IFixedSection {
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


  /** Convert native reference axes to capture-world axes by reflecting Z at the same scale. */
  function world([x, y, z]: IAutoMovieCurve64.Vector): V3 {
    return [x, y, -z];
  }

  /** Sum two vectors in the same absolute chart. */
  function added(a: V3, b: V3): V3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /** Scale a vector uniformly in the same chart. */
  function scaled(p: V3, factor: number): V3 {
    return [p[0] * factor, p[1] * factor, p[2] * factor];
  }

  /** Displacement from b to a in their shared frame and units. */
  function difference(a: V3, b: V3): V3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }



  /** Isolated raw-mesh tip and its observed neighbouring coordinates. */
  export interface IFixedTerminal {
    /** Whether the raw-mesh maximum qualifies as a single point for a loft cap. */
    singleTipQualified: boolean;

    /** Terminal plane coordinate and its raw-mesh extremal points in native world millimetres. */
    maximum: { coordinateMm: number; pointsMm: V3[] };

    /** Observed plane coordinates in millimetres, including a cut beyond the maximum. */
    coordinatesMm: number[];
  }
  /** Retile both observed palm collar spans in world millimetres without changing any rim vertex. */
  function worldCollar(loft: IAutoMovieContourLoft64.IResult, stations: readonly number[], world: (p: V3) => V3): number[] {
    const last: number = stations.length - 1;
    let indices: number[] | null = loft.mesh.indices;
    if (indices === null) throw new Error("The original palm collar must have indexed strips");
    for (const row of [last, last - 1]) indices = worldCollarStrip(loft, stations, world, indices, row);
    return indices;
  }

  /** Replace one collar strip while retaining its exact indexed rims and winding. */
  function worldCollarStrip(loft: IAutoMovieContourLoft64.IResult, stations: readonly number[], world: (p: V3) => V3, indices: number[], last: number): number[] {
    type Range = NonNullable<IAutoMovieContourLoft64.IResult["primitiveRanges"]>[number];
    const ranges: Range[] | undefined = loft.primitiveRanges?.filter((row: Range): boolean =>
      row.kind === "strip" && row.beforeMm === stations[last - 1] && row.afterMm === stations[last]);
    if (ranges?.length !== 1)
      throw new Error("The original palm collar must own one ordinary strip");
    const range: Range = ranges[0]!;
    const positions: number[] = loft.mesh.positions;
    const begin: number = range.firstTriangle * 3, end: number = begin + range.triangleCount * 3;
    const old: number[] = indices.slice(begin, end);

    // Her terminal plane turns across the collar. Comparing separate flattened
    // charts there can match opposite sides of the hand and fold the strip.
    const available: Map<string, number> = new Map([...new Set(old)].map((i: number): [string, number] => [positions.slice(i * 3, i * 3 + 3).join(","), i]));
    const identity: Map<V3, number> = new Map();
    const rings: V3[][] = [last - 1, last].map((row: number): V3[] => {
      const rim: IAutoMovieContourLoft64.IResult["construction"][number] | undefined = loft.construction.find(({ id }: IAutoMovieContourLoft64.IResult["construction"][number]): boolean => id.endsWith(`.section.${row}.loop.0`));
      if (!rim) throw new Error("The physical palm collar lost an observed boundary");
      return rim.points.map((p: V3): V3 => {
        const index: number | undefined = available.get(p.join(","));
        if (index === undefined) throw new Error("A measured collar knot has no indexed boundary vertex");
        const q: V3 = world(scaled(p, 1000));
        identity.set(q, index);
        return q;
      });
    });
    const tiles: number[] = [];
    tessellateAutoMovieContourStrip64(rings[0]!, rings[1]!, (a: V3, b: V3, c: V3): void => {
      tiles.push(identity.get(a)!, identity.get(b)!, identity.get(c)!);
    }, (point: V3): string | undefined => identity.get(point)?.toString(), ({ qualified }: Parameters<NonNullable<Parameters<typeof tessellateAutoMovieContourStrip64>[4]>>[0]): void => {
      if (!qualified) throw new Error("The world-space palm collar did not retain a qualified strip");
    });

    /** Compare indexed rim winding independently from the physical curve order. */
    const boundary: (faces: readonly number[]) => Map<string, number> = (faces: readonly number[]): Map<string, number> => {
      const uses: Map<string, number> = new Map();
      for (let i: number = 0; i < faces.length; i += 3)
        for (let j: number = 0; j < 3; j++) {
          const a: number = faces[i + j]!, b: number = faces[i + (j + 1) % 3]!;
          const key: string = a < b ? `${a}:${b}` : `${b}:${a}`;
          uses.set(key, (uses.get(key) ?? 0) + (a < b ? 1 : -1));
        }
      return new Map([...uses].filter(([, winding]: [string, number]): boolean => winding !== 0));
    };
    const prior: Map<string, number> = boundary(old), next: Map<string, number> = boundary(tiles);
    const direction: Set<number> = new Set([...prior].map(([edge, sign]: [string, number]): number => sign * (next.get(edge) ?? 0)));
    if (prior.size !== next.size || direction.size !== 1 || direction.has(0))
      throw new Error("The world-space palm collar changed the observed rim indices");
    if (direction.has(-1))
      for (let i: number = 0; i < tiles.length; i += 3)
        [tiles[i + 1], tiles[i + 2]] = [tiles[i + 2]!, tiles[i + 1]!];
    return [...indices.slice(0, begin), ...tiles, ...indices.slice(end)];
  }

  /** The palm's chain, its sections square to the hand's axis. */
  export function palmOf(
    hand: IAutoMovieHumanHandForm,
    map: (q: readonly [number, number, number]) => Vec3,
    side: "left" | "right",
    sign: 1 | -1,
  ): IAutoMovieLoftChain {
    const prior: AutoMovieHumanArmPrior.IHandPrior = AutoMovieHumanArmPrior.PRIOR.hand;
    const along: Vec3 = [...prior.along];
    const normal: Vec3 = scale(along, -1);

    // Each section carries the palm's reliefs in the form's axes before the
    // hand's map; the palm starts at its most proximal section.
    const start: number = Math.min(...hand.palmRings.map((ring: readonly Vec3[]): number => ring[0]![0]));
    const samples: AutoMovieHumanLimbFrame.ISample[] = hand.palmRings.map(
      (ring: readonly Vec3[]): AutoMovieHumanLimbFrame.ISample => {
        const points: Vec3[] = AutoMovieHumanPalmRelief.ring(hand.digits, ring, start).map((q: Vec3): Vec3 => map(q));
        const c: Vec3 = [mean(points, 0), mean(points, 1), mean(points, 2)];
        const frame: AutoMovieLoftFrame.IFrame = AutoMovieHumanLimbFrame.frame(
          c,
          normal,
          [...prior.through],
        );
        return { station: -dot(c, along), frame: sidedFrame(frame, sign), ring: reflect(points, sign) };
      },
    );
    const first: number = samples[0]!.station;
    return {
      name: `hand.${side}.1`,
      basis: "spline",
      order: prior.palmSection.order,
      samples: prior.palmSection.samples,
      rule: "arclength",
      layers: AutoMovieHumanLimbFrame.layers(
        samples.map((s: AutoMovieHumanLimbFrame.ISample): AutoMovieHumanLimbFrame.ISample => ({
          ...s,
          station: s.station - first,
        })),
        prior.palmSection.order,
      ),
    };
  }
}
