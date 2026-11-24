import {
  AutoMovieLoftViewFullSource,
  AutoMovieMeshExtract,
  AutoMovieSolidBlend,
  AutoMovieSolidVector as V,
  createAutoMovieMeshRayCaster,
  measureAutoMovieMeshCrossings,
} from "@automovie/engine";
import {
  AutoMovieHumanConicSection as Conic,
  AutoMovieHumanConicLoft as Loft,
} from "@automovie/human";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieMillimeterMesh,
  IAutoMovieSolidSurface,
  AutoMovieVector2Tuple as P,
} from "@automovie/interface";
import { readFile, writeFile } from "node:fs/promises";
import { parse } from "node:path";

import { FamilyConicMpfbArmscye as Armscye } from "./FamilyConicMpfbArmscye";
import { FamilyConicMpfbArmscyeTransition as Transition } from "./FamilyConicMpfbArmscyeTransition";
import { FamilyConicMpfbContext as Context } from "./FamilyConicMpfbContext";
import { FamilyConicMpfbFamilies as Families } from "./FamilyConicMpfbFamilies";
import { FamilyConicMpfbMeridianFair as MeridianFair } from "./FamilyConicMpfbMeridianFair";
import { FamilyConicMpfbSource as Mpfb } from "./FamilyConicMpfbSource";
import { FamilyConicMpfbSubdivision as Subdivision } from "./FamilyConicMpfbSubdivision";
import { FamilyConicMpfbUpperStock as UpperStock } from "./FamilyConicMpfbUpperStock";

type Point = Mpfb.Point;
type Jet = IAutoMovieSolidSurface.IJet;
type Side = (point: Point) => number;

/**
 * Measure the exterior rail in the actual conic stock chart before authoring
 * its attachment.
 */
function outerRail(
  parent: Pick<
    FamilyConicMpfbTrunk.ITrunk,
    "phase" | "support" | "readSupport"
  >,
  count: number,
  source?: Mpfb.IGeometry,
) {
  const axis = Loft.axis(parent.support);
  const base: number = parent.support.centres[0]![1];
  const cut = source === undefined ? undefined : Families.prepareCut(source);
  const height = source === undefined ? undefined : topHeight(source.body);
  const rows = Array.from({ length: count }, (_, i) => {
    const phase: number = (2 * Math.PI * i) / count;
    const rail: Jet = parent.phase(phase)(1);
    const station: number = rail.p[1] - base;
    const { origin, u, v } = axis.at(station);
    const offset: Point = V.sub(rail.p, origin);
    const clock: number = Math.atan2(V.dot(offset, v), V.dot(offset, u));
    const parentJet: Jet = parent.readSupport(station, clock);
    const a: Point = V.unit(V.cross(rail.v, rail.u))!;
    const b: Point = V.unit(V.cross(parentJet.u, parentJet.v))!;
    const measured = cut === undefined
      ? undefined
      : observedRadii(cut, axis.at(station), clock, V.norm(offset));
    const upper: number | null | undefined = height?.(rail.p[0], rail.p[2]);
    return {
      phase,
      station,
      clock,
      position: rail.p,
      target: parentJet.p,
      gap: V.norm(V.sub(rail.p, parentJet.p)),
      normalTurn: Math.atan2(V.norm(V.cross(a, b)), V.dot(a, b)),
      measured,
      vertical: upper === undefined || upper === null
        ? upper
        : { gap: Math.abs(upper - rail.p[1]), normalUp: a[1] },
    };
  });
  const area = (
    a: (typeof rows)[number],
    b: (typeof rows)[number],
    p: (typeof rows)[number],
  ): number =>
    (b.station - a.station) * (p.clock - a.clock) -
    (b.clock - a.clock) * (p.station - a.station);
  let crossings: number = 0;
  for (let i: number = 0; i < rows.length; ++i) {
    const a = rows[i]!,
      b = rows[(i + 1) % rows.length]!;
    for (let j: number = i + 2; j < rows.length; ++j) {
      if (i === 0 && j === rows.length - 1) continue;
      const c = rows[j]!,
        d = rows[(j + 1) % rows.length]!;
      if (
        area(a, b, c) * area(a, b, d) < 0 &&
        area(c, d, a) * area(c, d, b) < 0
      )
        ++crossings;
    }
  }
  const extent = (
    read: (row: (typeof rows)[number]) => number,
  ): [number, number] => {
    const values: number[] = rows.map(read);
    return [Math.min(...values), Math.max(...values)];
  };
  return {
    rows,
    crossings,
    stationRange: extent((row): number => row.station),
    phaseRange: extent((row): number => row.clock),
    gap: extent((row): number => row.gap),
    normalTurn: extent((row): number => row.normalTurn),
  };
}

/** Topmost actual surface at a horizontal chart coordinate, in mm. */
function topHeight(body: IAutoMovieMillimeterMesh): (x: number, z: number) => number | null {
  const positions: number[] = Array.from(body.positions, (value): number => value / 1_000);
  let high: number = -Infinity;
  for (let i: number = 1; i < positions.length; i += 3)
    high = Math.max(high, positions[i]!);
  // The top box separates the ray origin from the complete mesh.
  const y: number = high + Number.EPSILON * Math.max(1, Math.abs(high));
  const caster = createAutoMovieMeshRayCaster({
    positions,
    indices: Array.from(body.indices),
    normals: null,
    skin: null,
    uvs: null,
  });
  return (x: number, z: number): number | null => {
    const travel: number | null = caster.nearest(
      [x / 1_000, y, z / 1_000],
      [0, -1, 0],
      Infinity,
    );
    return travel === null ? null : (y - travel) * 1_000;
  };
}

/** Count distinct world-line intersections on the same homogeneous transverse cut. */
function observedRadii(
  cut: ReturnType<typeof Families.prepareCut>,
  frame: ReturnType<ReturnType<typeof Loft.axis>["at"]>,
  clock: number,
  own: number,
): { radii: number[]; gap: number } | { failure: string } {
  try {
    const points: P[] = cut(frame);
    const e: P = [Math.cos(clock), Math.sin(clock)];
    const along = ([x, y]: P): number => e[0] * x + e[1] * y;
    const across = ([x, y]: P): number => e[0] * y - e[1] * x;
    const radii: number[] = [];
    for (let i: number = 0; i < points.length; ++i) {
      const a: P = points[i]!, b: P = points[(i + 1) % points.length]!;
      const x: number = across(a), y: number = across(b);
      if ((x > 0) === (y > 0)) continue;
      const r: number = (x * along(b) - y * along(a)) / (x - y);
      if (r > 0) radii.push(r);
    }
    return {
      radii: radii.sort((a, b): number => a - b),
      gap: Math.min(...radii.map((r): number => Math.abs(r - own))),
    };
  } catch (error: unknown) {
    return { failure: error instanceof Error ? error.message : String(error) };
  }
}

/** A tessellation-independent normal-curvature census on the input phase grid. */
function curvature(read: FamilyConicMpfbTrunk.ITrunk["phase"], count: number) {
  const depths: number[] = [0, 1 / 8, 1 / 4, 1 / 2, 3 / 4, 1];
  const lanes = Array.from({ length: count }, (_, i) => {
    const phase: number = (2 * Math.PI * i) / count;
    const lookup = read(phase);
    return depths.map((depth) => {
      const jet: Jet = lookup(depth);
      const n: Point | null = V.unit(V.cross(jet.u, jet.v));
      if (n === null)
        throw new Error("Curvature was requested at a singular torso jet");
      return {
        point: jet.p,
        normal: n,
        along: V.dot(n, jet.uu) / V.dot(jet.u, jet.u),
        around: V.dot(n, jet.vv) / V.dot(jet.v, jet.v),
      };
    });
  });
  return depths.map((depth, j) => {
    const wave = lanes.map((lane, i) => {
      const a = lane[j]!,
        b = lanes[(i + 1) % count]![j]!;
      const normalTurn: number = Math.atan2(
        V.norm(V.cross(a.normal, b.normal)),
        V.dot(a.normal, b.normal),
      );
      const step: number = V.norm(V.sub(b.point, a.point));
      return {
        phase: (2 * Math.PI * i) / count,
        point: a.point,
        normalTurn,
        step,
        along: a.along,
        around: a.around,
        alongVariation: Math.abs(b.along - a.along),
        aroundVariation: Math.abs(b.around - a.around),
      };
    });
    const maxTurn = wave.reduce((a, b) =>
      b.normalTurn > a.normalTurn ? b : a,
    );
    const maxVariation = wave.reduce((a, b) =>
      b.alongVariation > a.alongVariation ? b : a,
    );
    return {
      depth,
      maxTurn,
      maxVariation,
      meanAlongVariation:
        wave.reduce((sum, x): number => sum + x.alongVariation, 0) / count,
      meanAroundVariation:
        wave.reduce((sum, x): number => sum + x.aroundVariation, 0) / count,
    };
  });
}

/**
 * Angular jumps between actual source facet normals, independent of any
 * analytic patch.
 */
function guideFacets(guide: Armscye.IGuide) {
  const edges = guide.points.map((p, i) => {
    const chord: Point = V.sub(guide.points[(i + 1) % guide.points.length]!, p);
    return {
      step: V.norm(chord),
      normal: V.unit(V.cross(chord, guide.crossTangents[i]!))!,
    };
  });
  const angular = edges.map(({ normal }, i): number => {
    const next: Point = edges[(i + 1) % edges.length]!.normal;
    return Math.atan2(V.norm(V.cross(normal, next)), V.dot(normal, next));
  });
  const lengths: number[] = edges
    .map(({ step }): number => step)
    .sort((a, b): number => a - b);
  return {
    count: edges.length,
    interval: [
      lengths[0]!,
      lengths[Math.floor(lengths.length / 2)]!,
      lengths.at(-1)!,
    ],
    maximumNormalTurn: Math.max(...angular),
    meanNormalTurn:
      angular.reduce((sum, d): number => sum + d, 0) / edges.length,
  };
}
type Line = {
  points: Point[];
  cumulative: number[];
  length: number;
  gap: number;
};

/**
 * Weld the equal-phase boundary once. Other vertices keep their physical chart
 * owner.
 */
function joined(
  parent: IAutoMovieMillimeterMesh,
  child: IAutoMovieMillimeterMesh,
  columns: number,
  rows: number,
  childStride: number = rows + 1,
) {
  const stride: number = rows + 1;
  const positions: number[] = Array.from(parent.positions);
  const indices: number[] = Array.from(parent.indices);
  const joint: number[] = Array.from(
    { length: columns },
    (_, i): number => i * stride,
  );
  let rimRoundoff: number = 0;
  const index: number[] = Array.from(
    { length: child.positions.length / 3 },
    (_, i): number => {
      const start: number = i * 3;
      if (i % childStride === 0) {
        const original: number = joint[i / childStride]!;
        const p: Point = [
          parent.positions[3 * original]!,
          parent.positions[3 * original + 1]!,
          parent.positions[3 * original + 2]!,
        ];
        const q: Point = [
          child.positions[start]!,
          child.positions[start + 1]!,
          child.positions[start + 2]!,
        ];
        const gap: number = V.norm(V.sub(p, q));
        rimRoundoff = Math.max(rimRoundoff, gap);
        // Independent executable samples can differ by floating-point rounding. The parent publishes the one shared mesh vertex.
        if (gap > Number.EPSILON * Math.max(1, V.norm(p), V.norm(q)))
          throw new Error(
            "A sampled parent/child rim vertex differs before welding",
          );
        return original;
      }
      const at: number = positions.length / 3;
      positions.push(
        child.positions[start]!,
        child.positions[start + 1]!,
        child.positions[start + 2]!,
      );
      return at;
    },
  );
  for (let i: number = 0; i < child.indices.length; ++i)
    indices.push(index[child.indices[i]!]!);

  const mesh = { positions, indices };
  const wrist: number[] = Array.from(
    { length: columns },
    (_, i): number => index[(i + 1) * childStride - 1]!,
  );
  return { mesh, topology: topology(mesh, joint, wrist), rimRoundoff, wrist };
}

/** Count connected components, Euler number and actual edge ownership. */
function topology(
  { positions, indices }: { positions: number[]; indices: number[] },
  joint: readonly number[] = [],
  wrist: readonly number[] = [],
) {
  const vertices: number = positions.length / 3;
  const leaders = Int32Array.from({ length: vertices }, (_, i): number => i);
  const find = (i: number): number => {
    while (i !== leaders[i]) {
      leaders[i] = leaders[leaders[i]!]!;
      i = leaders[i]!;
    }
    return i;
  };
  const address = (a: number, b: number): number =>
    Math.min(a, b) * vertices + Math.max(a, b);
  const edges: Map<number, { uses: number; direction: number }> = new Map();
  for (let i: number = 0; i < indices.length; i += 3)
    for (let j: number = 0; j < 3; ++j) {
      const a: number = indices[i + j]!,
        b: number = indices[i + ((j + 1) % 3)]!;
      const key: number = address(a, b);
      const edge = edges.get(key) ?? { uses: 0, direction: 0 };
      ++edge.uses;
      edge.direction += a < b ? 1 : -1;
      edges.set(key, edge);
      leaders[find(a)] = find(b);
    }
  const boundaryEdges: number = Array.from(edges.values()).filter(
    ({ uses }): boolean => uses === 1,
  ).length;
  const wristBoundaryEdges: number = wrist.filter(
    (a, i): boolean => edges.get(address(a, wrist[(i + 1) % wrist.length]!))?.uses === 1,
  ).length;
  return {
    components: new Set(Array.from(leaders, (_, i): number => find(i))).size,
    euler: vertices - edges.size + indices.length / 3,
    boundaryEdges,
    wristBoundaryEdges,
    otherBoundaryEdges: boundaryEdges - wristBoundaryEdges,
    badInteriorEdges: Array.from(edges.values()).filter(
      ({ uses, direction }): boolean =>
        uses > 2 || (uses === 2 && direction !== 0),
    ).length,
    sewnRimEdges: joint.filter((a, i): boolean => {
      const edge = edges.get(address(a, joint[(i + 1) % joint.length]!));
      return edge?.uses === 2 && edge.direction === 0;
    }).length,
  };
}

/**
 * Upper trunk observations and the parent half of the shared HM08 shoulder
 * chart.
 */
export namespace FamilyConicMpfbTrunk {
  /**
   * Independent lower wall, upper contour predictions and the exact local
   * parent face.
   */
  export interface ITrunk {
    /** The unmodified independently measured body wall below the armscye. */
    lower: IAutoMovieHumanConicLoft.IFamily;
    /** Last used station of the lower wall, below all owned port observations. */
    lowerEnd: number;
    /**
     * A conic support fitted to the host pieces. Its interior across the port
     * is virtual.
     */
    support: IAutoMovieHumanConicLoft.IFamily;
    /** Conic support jet after its smooth handoff from the original lower wall. */
    readSupport: (station: number, phase: number) => Jet;
    /**
     * Trunk-owned pieces of the physical transverse skin observations, in world
     * millimetres.
     */
    sections: { height: number; wall: Point[][]; crossings: number }[];
    /**
     * Observed meridian paths with the shared boundary and tangent, facing into
     * the parent.
     */
    port: IAutoMovieSolidSurface;
    /** Prepare one parent meridian for successive reads across the port. */
    phase: (phi: number) => (along: number) => Jet;
    /**
     * Unmodified smooth fit of the owned section lines, for crossing
     * attribution.
     */
    measured: (phi: number) => (along: number) => Jet;
    /** Largest source seam to measured meridian distance, mm. */
    observationGap: number;
    /** Variation measurements when the interior meridian fairing is enabled. */
    fairness?: MeridianFair.IReport;
  }

  /**
   * Separate both arms on each level cut, then read a parent meridian patch
   * from the same shared seam.
   */
  export function prepare(
    source: Mpfb.IGeometry,
    geometry: Armscye.IMeasurement,
    guide: Armscye.IGuide,
    lower: IAutoMovieHumanConicLoft.IFamily,
    seam: Transition.IChart["seam"],
    observation?: Pick<Transition.IChart, "rawSeam" | "fairAngle">,
    fairLines: boolean = false,
    endpointQuintic: boolean = false,
  ): ITrunk {
    const side: Side = Armscye.divider(geometry).side;
    const hostSide: Side = ([x, y, z]): number => side([x, y, Math.abs(z)]);
    const axis = Loft.axis(lower);
    const lines: Line[] = meridians(
      source,
      geometry,
      guide.points.length,
      side,
      observation?.rawSeam ?? seam,
    );
    const floor: number = Math.min(
      ...lines.flatMap(({ points }): number[] =>
        points.map((p): number => p[1]),
      ),
    );
    const mark: number | undefined = lower.knots
      .filter((s): boolean => axis.at(s).origin[1] < floor)
      .at(-1);
    if (mark === undefined)
      throw new Error(
        "The parent port reaches below the independent trunk wall",
      );
    const root: Point = axis.at(mark).origin;
    const [first, neck] = lower.centres;
    const through: ReturnType<typeof Families.prepareCut> =
      Families.prepareCut(source);
    const heightMarks: number[] = [
      root[1],
      geometry.apex[1],
      geometry.front[1],
      geometry.cap[1],
      neck![1],
    ]
      .filter((y): boolean => y >= root[1] && y <= neck![1])
      .sort((a, b): number => a - b);
    // ESTIMATE: two pitches per observed fold depth, plus the measured branch landmarks.
    const maxPitch: number = geometry.foldDepth / 2;
    const heights: number[] = [...new Set(heightMarks)].flatMap(
      (height, i, marks): number[] => {
        const next: number | undefined = marks[i + 1];
        if (next === undefined) return [height];
        const steps: number = Math.ceil((next - height) / maxPitch);
        return Array.from(
          { length: steps },
          (_, j): number => height + ((next - height) * j) / steps,
        );
      },
    );
    const sections = heights.map((height) => {
      const frame = {
        origin: [first![0], height, first![2]] as Point,
        u: [1, 0, 0] as Point,
        v: [0, 0, 1] as Point,
      };
      const points: Point[] = through(frame).map(
        ([x, z]): Point => [x + frame.origin[0], height, z + frame.origin[2]],
      );
      const wall: Point[][] = hostPieces(points, hostSide);
      return {
        height,
        wall,
        crossings:
          wall.length === 1 &&
          wall[0]!.length === points.length &&
          wall[0]![0] === points[0]
            ? 0
            : 2 * wall.length,
      };
    });
    const base = Loft.reader(lower);
    const controls = sections.map(({ wall }, i) => {
      if (i === 0)
        return { values: base(mark), origin: [root[0] - first![0], 0] as P };
      const section = Families.centred(
        wall.flat().map(([x, , z]): P => [x - first![0], z - first![2]]),
        true,
      );
      return {
        values: Families.fields(section.points, true),
        origin: section.origin,
      };
    });
    const support: IAutoMovieHumanConicLoft.IFamily = {
      name: "hm08.trunk.upper.support",
      centres: lower.centres,
      halves: lower.halves,
      up: lower.up,
      layout: Conic.bilateral(0),
      knots: heights.map((height): number => height - first![1]),
      values: controls[0]!.values.map((_, k): number[] =>
        controls.map((row): number => row.values[k]!),
      ),
      origin: {
        u: controls.map(({ origin }): number => origin[0]),
        v: controls.map(({ origin }): number => origin[1]),
      },
    };
    const old = AutoMovieLoftViewFullSource.create(Loft.source(lower));
    const next = AutoMovieLoftViewFullSource.create(Loft.source(support));
    const overlapEnd: number = lower.knots.at(-1)!;
    if (!(overlapEnd > mark))
      throw new Error(
        "The lower and upper torso have no independent stock to join across",
      );
    const rate: number = 1 / (overlapEnd - mark);
    const readSupport = (station: number, phase: number): Jet => {
      const dst: Jet = next.jet(station, phase);
      if (station >= overlapEnd) return dst;
      // The original wall is valid over this measured overlap. The quintic has zero first and second endpoint rates.
      return Transition.handover(
        old.jet(station, phase),
        dst,
        (station - mark) * rate,
        rate,
      );
    };
    // ESTIMATE: four intervals in one measured fold depth read the actual turn.
    const intervals: number = 4;
    const measured = Transition.measuredChart(
      lines,
      intervals,
      observation?.fairAngle,
    );
    const phase = (phi: number): ((along: number) => Jet) => {
      const {
        curve: [p, a, aa],
        cross,
      } = seam(phi);
      const [b, ab, aab] = scaleDeparture(cross, -geometry.foldDepth);
      const path = measured(phi);
      const start = path(0);
      const p0: Point = V.sub(p, start.jet.p);
      const u0: Point = V.sub(b, start.jet.u);
      const v0: Point = V.sub(a, start.jet.v);
      const uv0: Point = V.sub(ab, start.jet.uv);
      const vv0: Point = V.sub(aa, start.jet.vv);
      const uvv0: Point = V.sub(aab, start.uvv);
      const through = (along: number): Jet => {
        const { jet } = path(along);
        if (along >= 1 / intervals) return jet;
        const near: Jet = {
          p: V.add(jet.p, V.add(p0, V.scale(u0, along))),
          u: V.add(jet.u, u0),
          v: V.add(jet.v, V.add(v0, V.scale(uv0, along))),
          uu: jet.uu,
          uv: V.add(jet.uv, uv0),
          vv: V.add(jet.vv, V.add(vv0, V.scale(uvv0, along))),
        };
        return Transition.handover(near, jet, along * intervals, intervals);
      };
      return endpointQuintic
        ? quintic(through(0), through(1), aab, path(1).uvv)
        : through;
    };
    const fit = fairLines
      ? MeridianFair.prepare(phase, lines, observation?.fairAngle)
      : undefined;
    const read = fit?.phase ?? phase;
    return {
      lower,
      lowerEnd: mark,
      support,
      readSupport,
      sections,
      phase: read,
      ...(fit === undefined ? {} : { fairness: fit.report }),
      measured: (phi) => {
        const read = measured(phi);
        return (along): Jet => read(along).jet;
      },
      observationGap: Math.max(...lines.map(({ gap }): number => gap)),
      port: {
        name: "hm08.trunk.armscye",
        domain: [0, 1],
        period: 2 * Math.PI,
        orientation: -1,
        jet: (along, phi): Jet => read(phi)(along),
      },
    };
  }
}

/**
 * Diagnostic model with only the two exact endpoint germs. With fixed endpoint
 * jets, a quintic minimizes the integral of the squared third derivative in the
 * meridian's measured arclength coordinate. The natural endpoints supply an
 * identically zero transverse second field in both angle lanes.
 */
function quintic(
  start: Jet,
  end: Jet,
  startUvv: Point,
  endUvv: Point,
): (along: number) => Jet {
  const zero: Point = [0, 0, 0];
  if (V.norm(start.uu) !== 0 || V.norm(end.uu) !== 0)
    throw new Error(
      "The endpoint-only control requires the measured natural second fields",
    );
  const controls: readonly Point[][] = [
    [start.p, start.u, zero, zero, end.u, end.p],
    [start.v, start.uv, zero, zero, end.uv, end.v],
    [start.vv, startUvv, zero, zero, endUvv, end.vv],
  ];
  return (along: number): Jet => {
    if (along === 0) return start;
    if (along === 1) return end;
    const weights: number[][] = AutoMovieSolidBlend.basis(along);
    const read = (station: number, angle: number): Point =>
      V.combine(
        controls[angle]!.map((field, i): [number, Point] => [
          weights[station]![i]!,
          field,
        ]),
      );
    return {
      p: read(0, 0),
      u: read(1, 0),
      v: read(0, 1),
      uu: read(2, 0),
      uv: read(1, 1),
      vv: read(0, 2),
    };
  };
}

/**
 * Transfer the direction to the parent's arclength units and differentiate the
 * scale exactly.
 */
function scaleDeparture(
  [p, p1, p2]: [Point, Point, Point],
  reach: number,
): [Point, Point, Point] {
  const length: number = V.norm(p);
  const rate: number = V.dot(p, p1) / length;
  const bend: number = (V.dot(p1, p1) + V.dot(p, p2) - rate * rate) / length;
  const a: number = reach / length;
  const b: number = (-a * rate) / length;
  const c: number = (a * (2 * rate * rate - length * bend)) / (length * length);
  return [
    V.scale(p, a),
    V.combine([
      [a, p1],
      [b, p],
    ]),
    V.combine([
      [a, p2],
      [2 * b, p1],
      [c, p],
    ]),
  ];
}

/** Keep actual trunk arcs. Close no gap and fit no detached lobe. */
function hostPieces(points: Point[], side: Side): Point[][] {
  const signs: number[] = points.map(side);
  const outside: number = signs.findIndex((value): boolean => value > 0);
  if (outside === -1) return [points];
  const result: Point[][] = [];
  let run: Point[] = [];
  for (let i: number = 0; i < points.length; ++i) {
    const a: number = (outside + i) % points.length;
    const b: number = (a + 1) % points.length;
    const before: Point = points[a]!;
    const after: Point = points[b]!;
    if (signs[a]! <= 0) run.push(before);
    if (signs[a]! <= 0 === signs[b]! <= 0) continue;
    const boundary = crossing(before, after, side, signs[a]!);
    if (signs[b]! <= 0) run = [boundary];
    else {
      run.push(boundary);
      result.push(run);
      run = [];
    }
  }
  if (result.length === 0)
    throw new Error("No parent skin survived the arm divider");
  return result;
}

/**
 * Refine a polygon edge crossing of the curved divider to the mesh-gap
 * tolerance.
 */
function crossing(a: Point, b: Point, side: Side, first: number): Point {
  let low: Point = a;
  let high: Point = b;
  while (V.norm(V.sub(high, low)) > 0.01) {
    const middle: Point = V.scale(V.add(low, high), 1 / 2);
    if (side(middle) <= 0 === first <= 0) low = middle;
    else high = middle;
  }
  return V.scale(V.add(low, high), 1 / 2);
}

/**
 * Trace the host in meridian planes about the divider axis, which points toward
 * the arm.
 */
function meridians(
  source: Mpfb.IGeometry,
  geometry: Armscye.IMeasurement,
  count: number,
  side: Side,
  seam: Transition.IChart["seam"],
): Line[] {
  const read = AutoMovieMeshExtract.prepareOutline(source.body);
  const { origin, normal: shaft } = Armscye.divider(geometry);
  const failures: { phi: number; longest: number }[] = [];
  const result = Array.from({ length: count }, (_, i): Line | null => {
    const phi: number = (2 * Math.PI * i) / count;
    const [point] = seam(phi).curve;
    const q: Point = V.sub(point, origin);
    const radial: Point | null = V.unit(
      V.sub(q, V.scale(shaft, V.dot(shaft, q))),
    );
    if (radial === null)
      throw new Error(
        "The shared seam passes through the divider meridian pole",
      );
    const normal: Point = V.cross(shaft, radial);
    const section = read(
      { origin: [...origin], axes: [normal, shaft, radial] },
      [0],
      0,
      0,
      0,
    )[0]!;
    const candidates: Line[] = [];
    let longest: number = 0;
    for (const loop of section.outer) {
      const world: Point[] = loop.points.map(
        ([s, r]): Point =>
          V.combine([
            [1, origin],
            [s, shaft],
            [r, radial],
          ]),
      );
      for (let k: number = 0; k < world.length - (loop.closed ? 0 : 1); ++k) {
        const a: Point = world[k]!;
        const step: Point = V.sub(world[(k + 1) % world.length]!, a);
        const squared: number = V.dot(step, step);
        if (!(squared > 0)) continue;
        const share: number = Math.max(
          0,
          Math.min(1, V.dot(V.sub(point, a), step) / squared),
        );
        const start: Point = V.add(a, V.scale(step, share));
        const gap: number = V.norm(V.sub(start, point));
        if (gap > 0.01) continue;
        for (const direction of [-1, 1] as const) {
          const points: Point[] = [start];
          const cumulative: number[] = [0];
          for (let j: number = 0; j < world.length; ++j) {
            const index: number = k + (direction === 1 ? j + 1 : -j);
            if (!loop.closed && (index < 0 || index >= world.length)) break;
            const end: Point = world[(index + world.length) % world.length]!;
            const from: Point = points.at(-1)!;
            const span: Point = V.sub(end, from);
            const distance: number = V.norm(span);
            if (!(distance > 0)) continue;
            const length: number = cumulative.at(-1)!;
            const travel: number = Math.min(
              distance,
              geometry.foldDepth - length,
            );
            const land: Point = V.add(from, V.scale(span, travel / distance));
            if (
              V.dot(V.sub(land, origin), radial) <= 0 ||
              side(land) > 0.01 ||
              side(V.scale(V.add(from, land), 1 / 2)) > 0.01
            )
              break;
            points.push(land);
            cumulative.push(length + travel);
            longest = Math.max(longest, length + travel);
            if (travel === geometry.foldDepth - length) {
              candidates.push({
                points,
                cumulative,
                length: geometry.foldDepth,
                gap,
              });
              break;
            }
          }
        }
      }
    }
    if (candidates.length === 0) failures.push({ phi, longest });
    return candidates.sort((a, b): number => a.gap - b.gap)[0] ?? null;
  });
  if (failures.length > 0)
    throw new Error(
      "No complementary HM08 trunk meridian: " + JSON.stringify(failures),
    );
  return result as Line[];
}

/**
 * Measure positional and directional closure before requesting a full
 * replacement.
 */
async function main(): Promise<void> {
  const arg = (name: string): string | undefined =>
    process.argv
      .find((value): boolean => value.startsWith(`--${name}=`))
      ?.slice(name.length + 3);
  const asset = await Mpfb.load(arg("mesh"));
  const started: number = performance.now();
  const depth: number | undefined =
    arg("subdivision") === undefined ? undefined : Number(arg("subdivision"));
  const smoothed =
    depth === undefined ? undefined : Subdivision.sample(asset.body, depth);
  const source: Mpfb.ISource =
    smoothed === undefined ? asset : { ...asset, body: smoothed.body };
  const subdivisionMs: number = performance.now() - started;
  const geometry = Armscye.measure(source);
  const guide = Armscye.guide(source, geometry, smoothed?.normals);
  const guideMs: number = performance.now() - started - subdivisionMs;
  const [arm, trunk] = Families.extract(asset, ["arm", "trunk"]);
  const subdivision =
    smoothed === undefined
      ? undefined
      : {
          depth,
          authoredQuads: smoothed.authoredQuads,
          valence: smoothed.valence,
          vertices: smoothed.body.positions.length / 3,
          triangles: smoothed.body.indices.length / 3,
          subdivisionMs,
          guideMs,
        };
  const observedGuide = {
    geometry,
    points: guide.points,
    winding: guide.winding,
    reversedSteps: guide.reversedSteps,
    reversedNormals: guide.reversedNormals,
    guideFacets: guideFacets(guide),
  };
  if (process.argv.includes("--source-only")) {
    const report = {
      source: asset.source,
      subdivision,
      guide: observedGuide,
      courseSupport: Transition.courseSupport(
        geometry,
        guide,
        arm!.family.rootSectionMark,
      ),
    };
    const output: string | undefined = arg("out");
    if (output !== undefined)
      await writeFile(output, JSON.stringify(report, null, 2) + "\n");
    const { points, ...summary } = observedGuide;
    console.log(
      JSON.stringify({
        subdivision,
        guide: summary,
        courseSupport: report.courseSupport,
      }),
    );
    return;
  }
  const fairLines: boolean = process.argv.includes("--fair-lines");
  const storedPath: string | undefined = arg("arm-receipt");
  const stored =
    storedPath === undefined
      ? undefined
      : (JSON.parse(await readFile(storedPath, "utf8")) as {
          source: Mpfb.ISource["source"];
          subdivisionDepth: number;
          arm?: IAutoMovieHumanConicLoft.IFamily;
          sampling?: { speedMatched?: boolean; aligned?: boolean };
          mark: number;
          crossingWitnesses: number;
          candidate: {
            mesh: { positions: number[]; indices: number[] };
            grid: { columns: number; verticesPerColumn: number };
          };
        });
  const child = Transition.chart(
    source,
    geometry,
    guide,
    stored?.arm ?? arm!.family,
    process.argv.includes("--fair"),
    fairLines,
    stored?.sampling?.speedMatched,
    stored?.sampling?.aligned,
  );
  const parent = FamilyConicMpfbTrunk.prepare(
    source,
    geometry,
    guide,
    trunk!.family,
    child.seam,
    child,
    fairLines,
    process.argv.includes("--endpoint-quintic"),
  );
  const support = Loft.create(parent.support, parent.support.knots);
  const lower = AutoMovieLoftViewFullSource.create(Loft.source(parent.lower));
  const parentEnd: number = parent.lowerEnd;
  const upperStart: number = parent.support.knots[0]!;
  const density: number = Number(arg("density") ?? 1);
  if (!(Number.isFinite(density) && density > 0))
    throw new Error("The preview density must be finite and positive");
  const rows: number = Math.ceil(geometry.foldDepth * density);
  if (
    stored !== undefined &&
    (stored.source.sha256 !== source.source.sha256 ||
      stored.subdivisionDepth !== depth ||
      stored.mark !== child.mark)
  )
    throw new Error(
      "The stored arm does not match this source, subdivision and protected conic mark",
    );
  const columns: number =
    stored?.candidate.grid.columns ??
    Math.max(3, Math.ceil(guide.points.length * density));
  const positions: number[] = [],
    raw: number[] = [],
    indices: number[] = [];
  const {
    origin: dividerOrigin,
    normal: dividerNormal,
    side,
  } = Armscye.divider(geometry);
  let rawMinimumRadius: number = Infinity,
    minimumRadius: number = Infinity;
  let maximumObservationDistance: number = 0;
  let rawSide: number = -Infinity,
    maxSide: number = -Infinity;
  let rawBelowStock: number = 0,
    belowStock: number = 0,
    minimumDepartureRatio: number = Infinity,
    maximumDepartureRatio: number = 0;
  let gap: number = 0,
    departure: number = 0,
    minimumJacobian: number = Infinity,
    stockGap: number = 0;
  let stockFirst: number = 0,
    stockSecond: number = 0;
  let normalGap: number = 0;
  const normalCurvatureGap = { along: 0, around: 0, mixed: 0 };
  for (let i: number = 0; i < columns; ++i) {
    const phi: number = (2 * Math.PI * i) / columns;
    const fromChild = child.seam(phi);
    const read = parent.phase(phi);
    const observed = parent.measured(phi);
    const q: Point = V.sub(fromChild.curve[0], dividerOrigin);
    const ray: Point = V.unit(
      V.sub(q, V.scale(dividerNormal, V.dot(dividerNormal, q))),
    )!;
    const radius = (p: Point): number => V.dot(V.sub(p, dividerOrigin), ray);
    const stock: Jet = lower.jet(parentEnd, phi);
    const stockHeight: number = stock.p[1];
    const start: Jet = read(0);
    const childStart: Jet = child.phase(phi)(0);
    const parentNormal: Point = V.unit(V.cross(start.v, start.u))!;
    const childNormal: Point = V.unit(V.cross(childStart.u, childStart.v))!;
    const turn: number = Math.atan2(
      V.norm(V.cross(parentNormal, childNormal)),
      V.dot(parentNormal, childNormal),
    );
    normalGap = Math.max(normalGap, turn);
    const ownAlong: number = V.norm(start.u),
      ownAround: number = V.norm(start.v);
    const childAlong: number = V.norm(childStart.u),
      childAround: number = V.norm(childStart.v);
    normalCurvatureGap.along = Math.max(
      normalCurvatureGap.along,
      Math.abs(
        V.dot(parentNormal, start.uu) / ownAlong ** 2 -
          V.dot(childNormal, childStart.uu) / childAlong ** 2,
      ),
    );
    normalCurvatureGap.around = Math.max(
      normalCurvatureGap.around,
      Math.abs(
        V.dot(parentNormal, start.vv) / ownAround ** 2 -
          V.dot(childNormal, childStart.vv) / childAround ** 2,
      ),
    );
    normalCurvatureGap.mixed = Math.max(
      normalCurvatureGap.mixed,
      Math.abs(
        V.dot(parentNormal, start.uv) / (ownAlong * ownAround) +
          V.dot(childNormal, childStart.uv) / (childAlong * childAround),
      ),
    );
    const departureRatio: number = V.norm(start.u) / V.norm(observed(0).u);
    minimumDepartureRatio = Math.min(minimumDepartureRatio, departureRatio);
    maximumDepartureRatio = Math.max(maximumDepartureRatio, departureRatio);
    gap = Math.max(gap, V.norm(V.sub(start.p, fromChild.curve[0])));
    departure = Math.max(
      departure,
      V.norm(
        V.sub(start.u, scaleDeparture(fromChild.cross, -geometry.foldDepth)[0]),
      ),
    );
    const joint: Jet = parent.readSupport(upperStart, phi);
    const difference = (key: keyof Jet): number =>
      V.norm(V.sub(stock[key], joint[key]));
    stockGap = Math.max(stockGap, difference("p"));
    stockFirst = Math.max(stockFirst, difference("u"), difference("v"));
    stockSecond = Math.max(
      stockSecond,
      difference("uu"),
      difference("uv"),
      difference("vv"),
    );
    for (let j: number = 0; j <= rows; ++j) {
      const jet: Jet = read(j / rows);
      const original: Jet = observed(j / rows);
      maximumObservationDistance = Math.max(
        maximumObservationDistance,
        V.norm(V.sub(jet.p, original.p)),
      );
      minimumRadius = Math.min(minimumRadius, radius(jet.p));
      rawMinimumRadius = Math.min(rawMinimumRadius, radius(original.p));
      maxSide = Math.max(maxSide, side(jet.p));
      rawSide = Math.max(rawSide, side(original.p));
      if (jet.p[1] < stockHeight) ++belowStock;
      if (original.p[1] < stockHeight) ++rawBelowStock;
      minimumJacobian = Math.min(
        minimumJacobian,
        V.norm(V.cross(jet.u, jet.v)),
      );
      positions.push(...jet.p);
      raw.push(...original.p);
      if (j === rows) continue;
      const a: number = i * (rows + 1) + j;
      const b: number = ((i + 1) % columns) * (rows + 1) + j;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const mesh: IAutoMovieMillimeterMesh = { positions, indices };
  const childPreview =
    stored === undefined
      ? Transition.preview(child, columns, rows)
      : {
          mesh: stored.candidate.mesh,
          crossingWitnesses: stored.crossingWitnesses,
        };
  const combined = joined(
    mesh,
    childPreview.mesh,
    columns,
    rows,
    stored?.candidate.grid.verticesPerColumn,
  );
  const context = process.argv.includes("--source-context")
    ? Context.attach(
        combined.mesh,
        Array.from(
          { length: columns },
          (_, i): number => i * (rows + 1) + rows,
        ),
        source.body,
        dividerOrigin,
        dividerNormal,
        geometry.elbow,
      )
    : undefined;
  const metres = {
    positions: positions.map((mm): number => mm / 1_000),
    indices,
    normals: null,
    uvs: null,
    skin: null,
  };
  const childMetres = {
    ...metres,
    positions: Array.from(
      childPreview.mesh.positions,
      (mm): number => mm / 1_000,
    ),
    indices: Array.from(childPreview.mesh.indices),
  };
  const between: number = measureAutoMovieMeshCrossings(metres, childMetres, {
    allPairs: true,
  }).length;
  const contextProof =
    context === undefined
      ? undefined
      : (() => {
          const positions: number[] = context.mesh.positions.map(
            (mm): number => mm / 1_000,
          );
          const count: number = context.owners.analyticTriangles * 3;
          const analytic = {
            ...metres,
            positions,
            indices: context.mesh.indices.slice(0, count),
          };
          const publicContext = {
            ...metres,
            positions,
            indices: context.mesh.indices.slice(count),
          };
          return {
            owners: context.owners,
            sewnOuterEdges: context.sewnEdges,
            maximumSnap: context.maximumSnap,
            crossings: measureAutoMovieMeshCrossings(analytic, publicContext, {
              allPairs: true,
            }).length,
            topology: topology(context.mesh, [], combined.wrist),
          };
        })();
  const baseline = {
    ...metres,
    positions: raw.map((mm): number => mm / 1_000),
  };
  const ordinals = (triangle: number): [number, number] => [
    Math.floor(triangle / (2 * rows)),
    Math.floor((triangle % (2 * rows)) / 2),
  ];
  const audit = (candidate: typeof metres) => {
    const pairs = measureAutoMovieMeshCrossings(candidate, candidate, {
      allPairs: true,
    });
    const byDepth = pairs.reduce((counts, { triangle, other }): number[] => {
      const bin: number = Math.min(ordinals(triangle)[1], ordinals(other)[1]);
      counts[bin] = counts[bin]! + 1;
      return counts;
    }, new Array<number>(rows).fill(0));
    return {
      count: pairs.length,
      byDepth,
      first: pairs
        .slice(0, 12)
        .map(({ triangle, other }) => [ordinals(triangle), ordinals(other)]),
    };
  };
  const crossings = audit(metres);
  const rawCrossings = audit(baseline);
  const upper = UpperStock.derive(parent.sections, parent.support);
  const admittedUpper = upper.sections.every(
    ({ fault }): boolean => fault === null,
  )
    ? Loft.create(upper.family, upper.family.knots)
    : undefined;
  const upperProof =
    admittedUpper?.chain !== null &&
    admittedUpper?.chain !== undefined &&
    admittedUpper.diagnostics.length === 0
      ? outerRail(
          {
            phase: parent.phase,
            support: upper.family,
            readSupport: AutoMovieLoftViewFullSource.create(
              Loft.source(upper.family),
            ).jet,
          },
          columns,
        )
      : undefined;
  const result = {
    source: source.source,
    subdivision,
    guide: observedGuide,
    tessellation: { rows, columns, density },
    curvature: {
      actual: curvature(parent.phase, guide.points.length),
      observed: curvature(parent.measured, guide.points.length),
      source: guideFacets(guide),
    },
    stockRail: outerRail(parent, columns, source),
    independentUpper: {
      ...upper,
      diagnostics: admittedUpper?.diagnostics,
      rail: upperProof,
    },
    support: parent.support,
    sections: parent.sections,
    lowerEnd: parentEnd,
    seam: {
      gap,
      rimRoundoff: combined.rimRoundoff,
      departure,
      stockGap,
      stockFirst,
      stockSecond,
      normalGap,
      normalCurvatureGap,
      observationGap: parent.observationGap,
      maximumObservationDistance,
      minimumJacobian,
      selfCrossings: crossings.count,
      childSelfCrossings: childPreview.crossingWitnesses,
      between,
      topology: combined.topology,
      audit: {
        crossings,
        rawCrossings,
        minimumRadius,
        rawMinimumRadius,
        maxSide,
        rawSide,
        belowStock,
        rawBelowStock,
        minimumDepartureRatio,
        maximumDepartureRatio,
      },
    },
    diagnostics: support.diagnostics,
    fairness: { parent: parent.fairness, child: child.lineFairing },
    context: contextProof,
    candidate: {
      mesh: context?.mesh ?? combined.mesh,
      guide: {
        points: Array.from({ length: columns }, (_, i): Point => {
          const idx: number = 3 * i * (rows + 1);
          return [positions[idx]!, positions[idx + 1]!, positions[idx + 2]!];
        }),
      },
    },
    elapsedMs: performance.now() - started,
  };
  const output: string | undefined = arg("out");
  if (output !== undefined)
    await writeFile(output, JSON.stringify(result, null, 2) + "\n");
  console.log(
    JSON.stringify({
      sections: result.sections.map(({ height, crossings }) => ({
        height,
        crossings,
      })),
      seam: result.seam,
      diagnostics: result.diagnostics,
      elapsedMs: result.elapsedMs,
    }),
  );
}

if (
  typeof require !== "undefined" &&
  typeof module !== "undefined" &&
  require.main === module &&
  parse(process.argv[1] ?? "").name === "FamilyConicMpfbTrunk"
)
  void main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
