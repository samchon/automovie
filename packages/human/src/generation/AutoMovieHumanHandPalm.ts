import { AutoMovieEngineCurve } from "@automovie/engine";
import type {
  AutoMovieCubicBezierControls3,
  AutoMovieVector3Tuple,
  IAutoMovieContourLoft64,
  IAutoMovieCubicBezierCurve64,
  IAutoMovieHumanArmF1Lines,
  IAutoMovieHumanArmPrior,
  IAutoMovieHumanHandForm,
  IAutoMovieHumanHandPalm,
  IAutoMovieHumanLimbFrame,
  IAutoMovieLoftChain,
  IAutoMovieLoftSectionFrame,
  IAutoMovieViewAxis,
} from "@automovie/interface";

import { AutoMovieHumanArmPrior } from "./AutoMovieHumanArmPrior";
import { AutoMovieHumanLimbFrame } from "./AutoMovieHumanLimbFrame";
import { AutoMovieHumanArmCurveSpec } from "./AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanHandSide } from "./AutoMovieHumanHandSide";
import { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";
import { AutoMovieHumanPalmRelief } from "./AutoMovieHumanPalmRelief";

/**
 * The palm's chain, its sections square to the hand's axis, each carrying the
 * palm's reliefs (`AutoMovieHumanPalmRelief`).
 */
export namespace AutoMovieHumanHandPalm {
  /** Restore one exact three-coordinate tuple at the JSON boundary. */
  export function fixedPoint(value: readonly number[]): AutoMovieVector3Tuple {
    if (
      value.length !== 3 ||
      value.some((x: number): boolean => !Number.isFinite(x))
    )
      throw new Error("A fixed F1 point needs three finite coordinates");
    return [value[0]!, value[1]!, value[2]!];
  }

  /** Restore cubic tuple widths and literal tags without moving any control. */
  export function fixedCurve(
    value: IAutoMovieHumanHandPalm.IFixedCurveInput,
  ): IAutoMovieCubicBezierCurve64 {
    if (
      value.type !== "cubicBezier" ||
      value.unit !== "mm" ||
      (value.phaseUnit !== "mm" &&
        value.phaseUnit !== "turn" &&
        value.phaseUnit !== "normalized")
    )
      throw new Error(
        "The fixed F1 curve has an unsupported representation or unit",
      );
    return {
      ...value,
      type: value.type,
      unit: value.unit,
      phaseUnit: value.phaseUnit,
      spans: value.spans.map(
        (span: number[][]): AutoMovieCubicBezierControls3 => {
          if (span.length !== 4)
            throw new Error("A fixed F1 cubic needs four ordered controls");
          return [
            fixedPoint(span[0]!),
            fixedPoint(span[1]!),
            fixedPoint(span[2]!),
            fixedPoint(span[3]!),
          ];
        },
      ),
    };
  }

  /**
   * Restore the unchanged absolute frame and cubic loops of an authored
   * section.
   */
  export function fixedSection(
    value: IAutoMovieHumanHandPalm.IFixedSectionValue,
  ): IAutoMovieHumanHandPalm.IFixedSection {
    return {
      ...value,
      originMm: fixedPoint(value.originMm),
      u: fixedPoint(value.u),
      v: fixedPoint(value.v),
      loops: value.loops.map(
        (
          loop: (typeof value.loops)[number],
        ): IAutoMovieHumanHandPalm.IFixedSection["loops"][number] => ({
          ...loop,
          curve: fixedCurve(loop.curve),
        }),
      ),
    };
  }

  /**
   * Read each exact observed plane in the contour loft's common numerical
   * chart.
   */
  export function contourCoordinates(
    rows: readonly IAutoMovieHumanHandPalm.IFixedSection[],
    worldCollar: boolean,
  ): IAutoMovieHumanHandPalm.IContourCoordinates {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const planes: IPhysicalPlane[] = rows.map(physicalPlane);
    const stations: number[] = [0];
    for (let i: number = 1; i < planes.length; ++i)
      stations.push(
        stations[i - 1]! +
          Math.hypot(...difference(planes[i]!.origin, planes[i - 1]!.origin)),
      );
    return {
      stations,
      worldCollar,
      into(i: number, point: AutoMovieVector3Tuple): AutoMovieVector3Tuple {
        const p: IPhysicalPlane = planes[i]!;
        const relative: AutoMovieVector3Tuple = difference(point, p.origin);
        if (Math.abs(S.dot(relative, p.normal)) > 1e-6)
          throw new Error(
            `original contour leaves its plane at row ${rows[i]!.station}`,
          );
        return [S.dot(relative, p.u), stations[i]!, S.dot(relative, p.v)];
      },
      out([x, y, z]: AutoMovieVector3Tuple): AutoMovieVector3Tuple {
        const i: number = stations.findIndex(
          (s: number): boolean => Math.abs(s - y) <= 1e-6,
        );
        if (i < 0)
          throw new Error(
            "ordinary strip produced a vertex away from its original section planes",
          );
        const p: IPhysicalPlane = planes[i]!;
        return added(p.origin, added(scaled(p.u, x), scaled(p.v, z)));
      },
    };
  }

  /**
   * Continue the actual open clay boundary through a parallel archive span. The
   * first strip owns the existing boundary vertices; subsequent rows use the
   * original Bézier curves and only a measured terminal closes it.
   */
  export function attachFixed(
    clay: IAutoMovieHumanArmF1Lines.IFixedMesh,
    sections: readonly IAutoMovieHumanHandPalm.IFixedSection[],
    observedRoot: readonly AutoMovieVector3Tuple[],
    frame: ReturnType<IAutoMovieViewAxis.IAxis["at"]>,
    terminal?: IAutoMovieHumanHandPalm.IFixedTerminal,
    coordinates?: IAutoMovieHumanHandPalm.IContourCoordinates,
  ): string {
    const { base, boundary }: ReturnType<typeof openTerminal> = openTerminal(
      clay,
      frame,
    );
    const count: number = boundary.length;
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const chart: IPhysicalPlane = {
      origin: frame.origin as AutoMovieVector3Tuple,
      u: frame.u as AutoMovieVector3Tuple,
      v: frame.v as AutoMovieVector3Tuple,
      normal: S.cross(
        frame.v as AutoMovieVector3Tuple,
        frame.u as AutoMovieVector3Tuple,
      ),
    };
    const samePoint: number = 1e-6;
    const ordered: AutoMovieVector3Tuple[] =
      orientation(boundary, chart) * orientation(observedRoot, chart) > 0
        ? boundary
        : [...boundary].reverse();
    const edge: IAutoMovieCubicBezierCurve64 = linearRing(
      "shared conic edge",
      ordered.map(
        (p: AutoMovieVector3Tuple): AutoMovieVector3Tuple =>
          coordinates === undefined ? world(p) : coordinates.into(0, p),
      ),
    );
    const rows: IAutoMovieContourLoft64.ISection[] = sections.map(
      (
        row: IAutoMovieHumanHandPalm.IFixedSection,
        i: number,
      ): IAutoMovieContourLoft64.ISection => {
        const curve: IAutoMovieCubicBezierCurve64 = row.loops[0]!.curve;

        /*
         * Express this source cubic in the numerical chart of its own plane.
         */
        function read(
          p: Readonly<AutoMovieVector3Tuple>,
        ): AutoMovieVector3Tuple {
          return coordinates!.into(i, world(p));
        }
        const observed: IAutoMovieCubicBezierCurve64 =
          coordinates === undefined
            ? curve
            : {
                ...curve,
                spans: curve.spans.map(
                  ([
                    a,
                    b,
                    c,
                    d,
                  ]: AutoMovieCubicBezierControls3): AutoMovieCubicBezierControls3 => [
                    read(a),
                    read(b),
                    read(c),
                    read(d),
                  ],
                ),
              };
        return {
          coordinateMm: coordinates?.stations[i] ?? row.coordinateMm,
          loops: [{ curve: i === 0 ? edge : observed, winding: 1 }],
        };
      },
    );
    const events: IAutoMovieContourLoft64.IEvent[] = [];
    if (terminal !== undefined) {
      const coordinate: number = terminal.maximum.coordinateMm;
      const before: number = rows[rows.length - 1]!.coordinateMm;
      const after: number | undefined = terminal.coordinatesMm.find(
        (s: number): boolean => s > coordinate,
      );
      if (!(before < coordinate) || after === undefined)
        throw new Error(
          "the observed maximum does not follow its last retained contour",
        );
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
    const ordinary: IAutoMovieContourLoft64.IResult =
      AutoMovieEngineCurve.tessellateContourLoft64({
        sections: rows,
        events,
        chordToleranceMm: 0.1,
      });
    if (ordinary.unresolved.length !== 0 || ordinary.mesh.indices === null)
      throw new Error(
        `ordinary contour loft left unresolved strips: ${JSON.stringify(ordinary.unresolved)}`,
      );

    const positions: number[] = [];
    const remap: number[] = [];
    const start: number = clay.positions.length / 3;
    const p: number[] = ordinary.mesh.positions;
    for (let i: number = 0; i < p.length; i += 3) {
      const point: AutoMovieVector3Tuple = [
        p[i]! * 1000,
        p[i + 1]! * 1000,
        p[i + 2]! * 1000,
      ];
      const vertex: AutoMovieVector3Tuple =
        coordinates === undefined ? world(point) : coordinates.out(point);
      const shared: number = boundary.findIndex(
        (b: AutoMovieVector3Tuple): boolean =>
          Math.hypot(...difference(vertex, b)) <= samePoint,
      );
      if (shared >= 0) remap.push(base + shared);
      else {
        remap.push(start + positions.length / 3);
        positions.push(...vertex);
      }
    }
    const tiles: number[] =
      coordinates?.worldCollar === true
        ? worldCollar(ordinary, coordinates.stations, coordinates.out)
        : ordinary.mesh.indices;
    const indices: number[] = tiles.map(
      (index: number): number => remap[index]!,
    );
    const seam: Map<number, number> = new Map();
    for (let i: number = 0; i < indices.length; i += 3)
      for (let k: number = 0; k < 3; ++k) {
        const a: number = indices[i + k]! - base;
        const b: number = indices[i + ((k + 1) % 3)]! - base;
        if (a < 0 || a >= count || b < 0 || b >= count) continue;
        if ((a + 1) % count === b && !seam.has(a)) seam.set(a, 1);
        else if ((b + 1) % count === a && !seam.has(b)) seam.set(b, -1);
        else
          throw new Error(
            "the ordinary loft changed the existing terminal edge order",
          );
      }
    const seamDirections: Set<number> = new Set(seam.values());
    if (seam.size !== count || seamDirections.size !== 1)
      throw new Error(
        `the ordinary loft shared only ${seam.size}/${count} consistently oriented terminal edges`,
      );
    if (seamDirections.has(1))
      for (let i: number = 0; i < indices.length; i += 3)
        [indices[i + 1], indices[i + 2]] = [indices[i + 2]!, indices[i + 1]!];
    for (const value of positions) clay.positions.push(value);
    for (const index of indices) clay.indices.push(index);
    return `ordinary ${sections.length}-section span shares ${count} existing oriented edges. ${terminal === undefined ? "Distal end remains open" : "Closed at the unique observed terminal"}`;
  }

  /** Read the actual open capture edge and verify every directed mesh edge. */
  export function openTerminal(
    clay: IAutoMovieHumanArmF1Lines.IFixedMesh,
    frame: ReturnType<IAutoMovieViewAxis.IAxis["at"]>,
  ): IAutoMovieHumanHandPalm.IOpenTerminalResult {
    // CaptureSpecs.loft samples the open terminal layer at 72 phases.
    const count: number = 72;
    const base: number = clay.positions.length / 3 - count;
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const normal: AutoMovieVector3Tuple = S.cross(
      frame.v as AutoMovieVector3Tuple,
      frame.u as AutoMovieVector3Tuple,
    );
    const origin: AutoMovieVector3Tuple = frame.origin as AutoMovieVector3Tuple;
    const boundary: AutoMovieVector3Tuple[] = Array.from(
      { length: count },
      (_: unknown, i: number): AutoMovieVector3Tuple => {
        const k: number = (base + i) * 3;
        return [
          clay.positions[k]!,
          clay.positions[k + 1]!,
          clay.positions[k + 2]!,
        ];
      },
    );
    if (
      boundary.some(
        (p: AutoMovieVector3Tuple): boolean =>
          Math.abs(S.dot(difference(p, origin), normal)) > 1e-6,
      )
    )
      throw new Error(
        "the actual terminal vertices do not lie in their archived plane",
      );
    const edges: Set<number> = new Set();
    for (let i: number = 0; i < clay.indices.length; i += 3)
      for (let k: number = 0; k < 3; ++k) {
        const a: number = clay.indices[i + k]! - base;
        const b: number = clay.indices[i + ((k + 1) % 3)]! - base;
        if (a < 0 || b < 0) continue;
        if ((a + 1) % count !== b || edges.has(a))
          throw new Error(
            "the archived terminal is not one open directed mesh ring",
          );
        edges.add(a);
      }
    if (edges.size !== count)
      throw new Error(
        `the captured mesh has only ${edges.size}/${count} open terminal edges`,
      );
    return { base, boundary };
  }

  /** The palm's chain, its sections square to the hand's axis. */
  export function palmOf(
    hand: IAutoMovieHumanHandForm,
    map: IAutoMovieHumanHandPalm.PalmOfMap,
    side: "left" | "right",
    sign: 1 | -1,
  ): IAutoMovieLoftChain {
    const prior: IAutoMovieHumanArmPrior.IHandPrior =
      AutoMovieHumanArmPrior.PRIOR.hand;
    const along: AutoMovieVector3Tuple = [...prior.along];
    const normal: AutoMovieVector3Tuple = scale(along, -1);

    // Each section carries the palm's reliefs in the form's axes before the
    // hand's map; the palm starts at its most proximal section.
    const start: number = Math.min(
      ...hand.palmRings.map(
        (ring: readonly AutoMovieVector3Tuple[]): number => ring[0]![0],
      ),
    );
    const samples: IAutoMovieHumanLimbFrame.ISample[] = hand.palmRings.map(
      (
        ring: readonly AutoMovieVector3Tuple[],
      ): IAutoMovieHumanLimbFrame.ISample => {
        const points: AutoMovieVector3Tuple[] = AutoMovieHumanPalmRelief.ring(
          hand.digits,
          ring,
          start,
        ).map((q: AutoMovieVector3Tuple): AutoMovieVector3Tuple => map(q));
        const c: AutoMovieVector3Tuple = [
          mean(points, 0),
          mean(points, 1),
          mean(points, 2),
        ];
        const frame: IAutoMovieLoftSectionFrame = AutoMovieHumanLimbFrame.frame(
          c,
          normal,
          [...prior.through],
        );
        return {
          station: -dot(c, along),
          frame: sidedFrame(frame, sign),
          ring: reflect(points, sign),
        };
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
        samples.map(
          (
            s: IAutoMovieHumanLimbFrame.ISample,
          ): IAutoMovieHumanLimbFrame.ISample => ({
            ...s,
            station: s.station - first,
          }),
        ),
        prior.palmSection.order,
      ),
    };
  }

  /*
   * The recorded chart after converting its handedness to capture world.
   */
  function physicalPlane(
    row: IAutoMovieHumanHandPalm.IFixedSection,
  ): IPhysicalPlane {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const u: AutoMovieVector3Tuple = world(row.u);
    const v: AutoMovieVector3Tuple = scaled(world(row.v), -1);
    return { origin: world(row.originMm), u, v, normal: S.cross(v, u) };
  }

  /*
   * Signed orientation of a closed ring as seen from its section normal.
   */
  function orientation(
    ring: readonly AutoMovieVector3Tuple[],
    plane: IPhysicalPlane,
  ): number {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    return ring.reduce(
      (sum: number, p: AutoMovieVector3Tuple, i: number): number =>
        sum +
        S.dot(
          S.cross(
            difference(p, plane.origin),
            difference(ring[(i + 1) % ring.length]!, plane.origin),
          ),
          plane.normal,
        ),
      0,
    );
  }

  /*
   * A polygonal edge represented by exact linear cubic spans.
   */
  function linearRing(
    name: string,
    points: readonly AutoMovieVector3Tuple[],
  ): IAutoMovieCubicBezierCurve64 {
    const spans: AutoMovieCubicBezierControls3[] = points.map(
      (a: AutoMovieVector3Tuple, i: number): AutoMovieCubicBezierControls3 => {
        const b: AutoMovieVector3Tuple = points[(i + 1) % points.length]!;
        const d: AutoMovieVector3Tuple = difference(b, a);
        return [a, added(a, scaled(d, 1 / 3)), added(a, scaled(d, 2 / 3)), b];
      },
    );
    return {
      type: "cubicBezier",
      name,
      closed: true,
      unit: "mm",
      phaseUnit: "mm",
      phaseIntervals: points.map(
        (a: AutoMovieVector3Tuple, i: number): number =>
          Math.hypot(...difference(a, points[(i + 1) % points.length]!)),
      ),
      spans,
    };
  }

  /*
   * Convert native reference axes to capture-world axes by reflecting Z at the
   * same scale.
   */
  function world([
    x,
    y,
    z,
  ]: Readonly<AutoMovieVector3Tuple>): AutoMovieVector3Tuple {
    return [x, y, -z];
  }

  /*
   * Sum two vectors in the same absolute chart.
   */
  function added(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /*
   * Scale a vector uniformly in the same chart.
   */
  function scaled(
    p: AutoMovieVector3Tuple,
    factor: number,
  ): AutoMovieVector3Tuple {
    return [p[0] * factor, p[1] * factor, p[2] * factor];
  }

  /*
   * Displacement from b to a in their shared frame and units.
   */
  function difference(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /*
   * Retile both observed palm collar spans in world millimetres without
   * changing any rim vertex.
   */
  function worldCollar(
    loft: IAutoMovieContourLoft64.IResult,
    stations: readonly number[],
    world: (p: AutoMovieVector3Tuple) => AutoMovieVector3Tuple,
  ): number[] {
    const last: number = stations.length - 1;
    let indices: number[] | null = loft.mesh.indices;
    if (indices === null)
      throw new Error("The original palm collar must have indexed strips");
    for (const row of [last, last - 1])
      indices = worldCollarStrip(loft, stations, world, indices, row);
    return indices;
  }

  /*
   * Replace one collar strip while retaining its exact indexed rims and
   * winding.
   */
  function worldCollarStrip(
    loft: IAutoMovieContourLoft64.IResult,
    stations: readonly number[],
    world: (p: AutoMovieVector3Tuple) => AutoMovieVector3Tuple,
    indices: number[],
    last: number,
  ): number[] {
    type Range = NonNullable<
      IAutoMovieContourLoft64.IResult["primitiveRanges"]
    >[number];
    const ranges: Range[] | undefined = loft.primitiveRanges?.filter(
      (row: Range): boolean =>
        row.kind === "strip" &&
        row.beforeMm === stations[last - 1] &&
        row.afterMm === stations[last],
    );
    if (ranges?.length !== 1)
      throw new Error("The original palm collar must own one ordinary strip");
    const range: Range = ranges[0]!;
    const positions: number[] = loft.mesh.positions;
    const begin: number = range.firstTriangle * 3,
      end: number = begin + range.triangleCount * 3;
    const old: number[] = indices.slice(begin, end);

    // Her terminal plane turns across the collar. Comparing separate flattened
    // charts there can match opposite sides of the hand and fold the strip.
    const available: Map<string, number> = new Map(
      [...new Set(old)].map((i: number): [string, number] => [
        positions.slice(i * 3, i * 3 + 3).join(","),
        i,
      ]),
    );
    const identity: Map<AutoMovieVector3Tuple, number> = new Map();
    const rings: AutoMovieVector3Tuple[][] = [last - 1, last].map(
      (row: number): AutoMovieVector3Tuple[] => {
        const rim:
          | IAutoMovieContourLoft64.IResult["construction"][number]
          | undefined = loft.construction.find(
          ({
            id,
          }: IAutoMovieContourLoft64.IResult["construction"][number]): boolean =>
            id.endsWith(`.section.${row}.loop.0`),
        );
        if (!rim)
          throw new Error("The physical palm collar lost an observed boundary");
        return rim.points.map(
          (p: AutoMovieVector3Tuple): AutoMovieVector3Tuple => {
            const index: number | undefined = available.get(p.join(","));
            if (index === undefined)
              throw new Error(
                "A measured collar knot has no indexed boundary vertex",
              );
            const q: AutoMovieVector3Tuple = world(scaled(p, 1000));
            identity.set(q, index);
            return q;
          },
        );
      },
    );
    const tiles: number[] = [];
    AutoMovieEngineCurve.tessellateContourStrip64(
      rings[0]!,
      rings[1]!,
      (
        a: AutoMovieVector3Tuple,
        b: AutoMovieVector3Tuple,
        c: AutoMovieVector3Tuple,
      ): void => {
        tiles.push(identity.get(a)!, identity.get(b)!, identity.get(c)!);
      },
      (point: AutoMovieVector3Tuple): string | undefined =>
        identity.get(point)?.toString(),
      ({
        qualified,
      }: Parameters<
        NonNullable<Parameters<typeof AutoMovieEngineCurve.tessellateContourStrip64>[4]>
      >[0]): void => {
        if (!qualified)
          throw new Error(
            "The world-space palm collar did not retain a qualified strip",
          );
      },
    );

    /*
     * Compare indexed rim winding independently from the physical curve order.
     */
    function boundary(faces: readonly number[]): Map<string, number> {
      const uses: Map<string, number> = new Map();
      for (let i: number = 0; i < faces.length; i += 3)
        for (let j: number = 0; j < 3; j++) {
          const a: number = faces[i + j]!,
            b: number = faces[i + ((j + 1) % 3)]!;
          const key: string = a < b ? `${a}:${b}` : `${b}:${a}`;
          uses.set(key, (uses.get(key) ?? 0) + (a < b ? 1 : -1));
        }
      return new Map(
        [...uses].filter(
          ([, winding]: [string, number]): boolean => winding !== 0,
        ),
      );
    }
    const prior: Map<string, number> = boundary(old),
      next: Map<string, number> = boundary(tiles);
    const direction: Set<number> = new Set(
      [...prior].map(
        ([edge, sign]: [string, number]): number =>
          sign * (next.get(edge) ?? 0),
      ),
    );
    if (prior.size !== next.size || direction.size !== 1 || direction.has(0))
      throw new Error(
        "The world-space palm collar changed the observed rim indices",
      );
    if (direction.has(-1))
      for (let i: number = 0; i < tiles.length; i += 3)
        [tiles[i + 1], tiles[i + 2]] = [tiles[i + 2]!, tiles[i + 1]!];
    return [...indices.slice(0, begin), ...tiles, ...indices.slice(end)];
  }

  /*
   * One physical reference plane in capture-world millimetres.
   */
  interface IPhysicalPlane {
    /*
     * Absolute capture-world millimetre origin.
     */
    origin: AutoMovieVector3Tuple;
    /*
     * Unit first tangent in capture-world axes.
     */
    u: AutoMovieVector3Tuple;
    /*
     * Unit second tangent after the native chart reflection.
     */
    v: AutoMovieVector3Tuple;
    /*
     * Distal normal derived from the retained chart handedness.
     */
    normal: AutoMovieVector3Tuple;
  }
}

const { scale, dot, mean }: typeof AutoMovieHumanHandVector =
  AutoMovieHumanHandVector;

const { sidedFrame, reflect }: typeof AutoMovieHumanHandSide =
  AutoMovieHumanHandSide;
