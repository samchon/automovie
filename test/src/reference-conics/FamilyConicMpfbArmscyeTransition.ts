import {
  AutoMovieConstructionPortField,
  AutoMovieLoftViewFullSource,
  AutoMovieMeshExtract,
  AutoMovieNaturalSpline,
  AutoMovieSolidVector as V,
  measureAutoMovieMeshCrossings,
  solveAutoMovieHalfPlaneProgram,
} from "@automovie/engine";
import { AutoMovieHumanConicLoft } from "@automovie/human";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieMesh,
  IAutoMovieMillimeterMesh,
  IAutoMovieSolidSurface,
  AutoMovieVector2Tuple as P,
} from "@automovie/interface";
import { writeFile } from "node:fs/promises";
import { basename } from "node:path";

import { FamilyConicDistalGauge } from "./FamilyConicDistalGauge";
import { FamilyConicMpfbArmscye as Armscye } from "./FamilyConicMpfbArmscye";
import { FamilyConicMpfbFamilies as Families } from "./FamilyConicMpfbFamilies";
import { FamilyConicMpfbMeridianFair as Meridians } from "./FamilyConicMpfbMeridianFair";
import { FamilyConicMpfbSource as Mpfb } from "./FamilyConicMpfbSource";

type Point = Mpfb.Point;
type Jet = IAutoMovieSolidSurface.IJet;
type CurveJet = [point: Point, first: Point, second: Point];

/** Measure and construct the shoulder transition on the independent HM08 source. */
export namespace FamilyConicMpfbArmscyeTransition {
  /** Necessary signed-pole support about a shifted straight proximal course. */
  export interface ICourseSupport {
    /** The least-centre translation in the two section axes, in mm. */
    shift: P;
    /**
     * Whether all necessary signed support planes hold inside the observed
     * disc.
     */
    feasible: boolean;
    /** The smallest residual support distance in mm, negative on failure. */
    minimumSupport: number;
    /** The smallest oriented radial incidence `n · e` on a resolved facet. */
    minimumIncidence: number;
    /** Number of segment phases that move opposite to the loop's winding. */
    reversedSteps: number;
    /** Signed number of turns about the shifted child course. */
    winding: number;
  }

  /**
   * Prepared world chart of the proximal arm, terminating on its unmodified
   * conic section.
   */
  export interface IChart {
    /** The prepared proximal world surface with its physical two-jet. */
    surface: IAutoMovieSolidSurface;
    /** Prepare one world meridian, then read its unit longitudinal coordinate. */
    phase: (phi: number) => (along: number) => Jet;
    /**
     * Prepare the unfitted source meridian for geometric residuals at one
     * phase.
     */
    observe: (phi: number) => (along: number) => Point;
    /**
     * The parent-visible world point and both angular jets. `cross` points into
     * the arm.
     */
    seam: (phase: number) => { curve: CurveJet; cross: CurveJet };
    /** The unfaired source guide for meridian registration. */
    rawSeam: IChart["seam"];
    /** Half-width of the candidate angular fitting support, in radians. */
    fairAngle: number;
    /**
     * Energy and motion of the measured interior line correction, when
     * requested.
     */
    lineFairing?: Meridians.IReport;
    /** First independent conic station on the upper-arm course, mm. */
    mark: number;
    /** Reference physical spacing for the retained conic stock, mm. */
    sectionRate: number;
    /** Outlet station conversion and its angular derivatives, mm per unit meridian parameter. */
    outletRate: (phase: number) => [number, number, number];
    /** Extremal route lengths and endpoint observations in millimetres. */
    measured: {
      shortest: number;
      longest: number;
      outletGap: number;
      startGap: number;
    };
    /** World two-jet of the retained conic on its protected section. */
    outlet: (phase: number) => Jet;
    /** Continue the same meridian phase on the retained conic stock. */
    distal: (phase: number) => (station: number) => Jet;
  }

  /**
   * The signed tangent-plane distance is r(n·e). Holding the shaft direction
   * fixed makes that distance affine in the two in-plane centre shifts. If a
   * protected station is supplied, enforce the necessary star margin at the
   * same time. Checking both ends of each facet chord bounds the full chord
   * because the normal is constant and the station is affine on it.
   */
  export function courseSupport(
    geometry: Armscye.IMeasurement,
    guide: Armscye.IGuide,
    mark?: number,
  ): ICourseSupport {
    if (mark !== undefined && !(mark > guide.stations[1]))
      throw new Error(
        "The protected upper-arm section must follow the full HM08 seam",
      );
    const axis = AutoMovieHumanConicLoft.axis({
      centres: [geometry.shoulder, geometry.elbow],
      halves: [],
      up: [1, 0, 0],
    });
    const { origin, u, v } = axis.at(0);
    const shaft: Point = V.cross(v, u);
    const facets = guide.points.flatMap((p, i) => {
      const q: Point = guide.points[(i + 1) % guide.points.length]!;
      const n: Point | null = V.unit(
        V.cross(V.sub(q, p), guide.crossTangents[i]!),
      );
      if (n === null)
        throw new Error("The HM08 cut contains a zero-length facet chord");
      const x: number = V.dot(n, u),
        y: number = V.dot(n, v),
        down: number = V.dot(n, shaft);
      return [p, q].map((point) => {
        const from: Point = V.sub(point, origin);
        const s: number = V.dot(from, shaft);
        const ray: Point = V.sub(from, V.scale(shaft, s));
        const support: number = V.dot(ray, n);
        const target: number =
          mark === undefined ? 0 : Math.max(0, ((mark - s) * down) / (5 / 2));
        return { x, y, ray, support, target };
      });
    });
    const inset: number = 0.001;
    const lines = facets.flatMap(({ x, y, support, target }) => {
      const length: number = Math.hypot(x, y);
      if (!(length > 0)) return [];
      const a: number = x / length,
        b: number = y / length;
      const offset: number = (support - target - inset) / length;
      return [
        { point: { x: offset * a, y: offset * b }, direction: { x: -b, y: a } },
      ];
    });
    // The observed local arm semidepth bounds the centre search to the limb.
    const result = solveAutoMovieHalfPlaneProgram(lines, geometry.foldDepth, {
      x: 0,
      y: 0,
    });
    const { x, y } = result.point;
    const shift: Point = V.combine([
      [x, u],
      [y, v],
    ]);
    const remaining: number[] = facets.map(
      (p): number => p.support - x * p.x - y * p.y - p.target,
    );
    const incidence: number[] = facets.map(
      (p): number =>
        (p.support - x * p.x - y * p.y) / V.norm(V.sub(p.ray, shift)),
    );
    const phases: number[] = guide.points.map((p): number => {
      const ray: Point = V.sub(V.sub(p, origin), shift);
      return Math.atan2(V.dot(ray, v), V.dot(ray, u));
    });
    const steps: number[] = phases.map((phase, i): number => {
      const d: number = phases[(i + 1) % phases.length]! - phase;
      return Math.atan2(Math.sin(d), Math.cos(d));
    });
    const winding: number = Math.round(
      steps.reduce((sum, d): number => sum + d, 0) / (2 * Math.PI),
    );
    const minimumSupport: number = Math.min(...remaining);
    return {
      shift: [x, y],
      feasible: result.feasible && minimumSupport > 0,
      minimumSupport,
      minimumIncidence: Math.min(...incidence),
      winding,
      reversedSteps: steps.filter((d): boolean => winding * d <= 0).length,
    };
  }

  /**
   * Construct the proximal arm in a world chart that carries the parent tangent
   * plane through the radial pole. `along = 0` is the shared seam; `along = 1`
   * is the first independent arm section. Each angular view line starts on the
   * parent curve with its published co-normal, and joins the conic with the
   * original point, tangent plane and second jet.
   */
  export function chart(
    source: Mpfb.IGeometry,
    geometry: Armscye.IMeasurement,
    guide: Armscye.IGuide,
    arm: IAutoMovieHumanConicLoft.IFamily,
    fair: boolean = false,
    fairLines: boolean = false,
    matchOutletSpeed: boolean = false,
    alignOutlet: boolean = false,
  ): IChart {
    const mark: number | undefined = arm.rootSectionMark;
    if (mark === undefined)
      throw new Error("The independent HM08 arm has no protected section");
    const known = AutoMovieLoftViewFullSource.create(
      AutoMovieHumanConicLoft.source(arm),
    );
    const next: number | undefined = arm.knots.find((s): boolean => s > mark);
    if (next === undefined)
      throw new Error("The protected arm section has no distal neighbour");
    const sectionRate: number = Math.min(
      mark - guide.stations[1],
      next - mark,
      (known.domain[1] - mark) / 2,
    );
    if (!(sectionRate > 0))
      throw new Error("The public seam and protected conic section overlap");

    const outline = angular(geometry, guide);
    const shaftAxis = AutoMovieHumanConicLoft.axis({
      centres: [geometry.shoulder, geometry.elbow],
      halves: [],
      up: [1, 0, 0],
    });
    const distal = alignOutlet
      ? FamilyConicDistalGauge.align(shaftAxis.at(mark), known, mark)
      : (phi: number) => (station: number): Jet => known.jet(station, phi);
    const rawCurve = periodic(outline.map(({ point }): Point => point));
    const normal = periodic(outline.map(({ normal }): Point => normal));
    const lines = observedLines(
      source,
      geometry,
      outline,
      mark,
      alignOutlet ? (phi): Point => distal(phi)(mark).p : known.pointAt(mark),
    );
    const departures: Point[] = outline.map((_, i): Point => {
      const phi: number = (2 * Math.PI * i) / outline.length;
      const [, tangent] = rawCurve(phi);
      const [outward] = normal(phi);
      // Tangent × normal points into the chart whose (station × phase) is outward.
      const conormal: Point | null = V.unit(V.cross(tangent, outward));
      if (conormal === null)
        throw new Error(
          "The open shoulder has no regular shared cross tangent",
        );
      const line: Line = lines.read[i]!;
      const direction: Point = V.sub(line.points[1]!, line.points[0]!);
      const tangential: Point = V.sub(
        direction,
        V.scale(outward, V.dot(outward, direction) / V.dot(outward, outward)),
      );
      const along: Point | null = V.unit(tangential);
      return V.scale(
        along !== null && V.dot(along, conormal) > 0 ? along : conormal,
        line.length,
      );
    });
    const rawLeave = periodic(departures);
    const fairAngle: number = fair ? facetSpan(geometry, guide) : 0;
    const seam = fair
      ? fairCurve(
          geometry,
          outline.map(({ point }): Point => point),
          fairAngle,
        )
      : rawCurve;
    const leave = fair
      ? periodic(Meridians.smooth(departures, fairAngle))
      : rawLeave;
    // The polygonal lines are read at equal arclength shares. The local
    // measured arm radius determines the pitch used when fitting their jets.
    const intervals: number = Math.max(
      2,
      Math.ceil(lines.longest / (geometry.foldDepth / 4)),
    );
    const longitudinal = measuredChart(lines.read, intervals, fairAngle);
    // The target reach is one measured arm semidepth. The reciprocal rate
    // prevents the distal handover from occupying more than half a line.
    const outletPitch = AutoMovieConstructionPortField.periodic(
      lines.read.map(({ length }): number => 2 + length / geometry.foldDepth),
    );
    const physicalRate = matchOutletSpeed
      ? AutoMovieConstructionPortField.periodic(
          lines.read.map(({ length }, i): number => {
            const phi: number = (2 * Math.PI * i) / lines.read.length;
            const speed: number = V.norm(distal(phi)(mark).u);
            return length / speed;
          }),
        )
      : undefined;
    const outletRate = (phi: number): [number, number, number] =>
      physicalRate?.at(phi) ?? [sectionRate, 0, 0];
    const boundary = (phi: number): { curve: CurveJet; cross: CurveJet } => ({
      curve: seam(phi),
      cross: leave(phi),
    });

    const phase = (phi: number): ((along: number) => Jet) => {
      const {
        curve: [p, a, aa],
        cross: [b, ab, aab],
      } = boundary(phi);
      const conic = distal(phi);
      const end: Jet = conic(mark);
      const path = longitudinal(phi);
      const zero = path(0);
      const last = path(1);
      const pitch = outletPitch.at(phi);
      const [rate, angularRate, angularRate2] = outletRate(phi);
      if (
        !(rate > 0) ||
        mark + (2 * rate) / pitch[0] > known.domain[1]
      )
        throw new Error("The measured outlet continuation leaves the conic's owned range");
      const distalAt = (along: number): Jet => {
        const step: number = 1 - along;
        const take = (multiple: number): Jet =>
          longitudinalJet(
            conic(mark + multiple * step * rate),
            -multiple * rate,
            multiple * step * angularRate,
            -multiple * angularRate,
            multiple * step * angularRate2,
          );
        const first: Jet = take(1),
          second: Jet = take(2);
        // Degree-two one-sided extrapolation of the original conic. The
        // coefficients 3,-3,1 reproduce its value, first and second jets at
        // the mark using only stations in the conic's actual owned domain.
        return {
          p: V.combine([
            [3, end.p],
            [-3, first.p],
            [1, second.p],
          ]),
          u: V.add(V.scale(first.u, -3), second.u),
          v: V.combine([
            [3, end.v],
            [-3, first.v],
            [1, second.v],
          ]),
          uu: V.add(V.scale(first.uu, -3), second.uu),
          uv: V.add(V.scale(first.uv, -3), second.uv),
          vv: V.combine([
            [3, end.vv],
            [-3, first.vv],
            [1, second.vv],
          ]),
        };
      };
      return (along: number): Jet => {
        const measured = path(along);
        // Correct only the proximal control interval to inherit the exact
        // shared boundary and conormal. The measured skin owns the rest.
        const primal: Jet = {
          p: V.combine([
            [1, measured.jet.p],
            [1, V.sub(p, zero.jet.p)],
            [along, V.sub(b, zero.jet.u)],
          ]),
          u: V.add(measured.jet.u, V.sub(b, zero.jet.u)),
          v: V.combine([
            [1, measured.jet.v],
            [1, V.sub(a, zero.jet.v)],
            [along, V.sub(ab, zero.jet.uv)],
          ]),
          uu: measured.jet.uu,
          uv: V.add(measured.jet.uv, V.sub(ab, zero.jet.uv)),
          vv: V.combine([
            [1, measured.jet.vv],
            [1, V.sub(aa, zero.jet.vv)],
            [along, V.sub(aab, zero.uvv)],
          ]),
        };
        const near: Jet = handover(
          primal,
          measured.jet,
          Math.min(1, along * intervals),
          intervals,
        );
        if (1 + (along - 1) * pitch[0] <= 0) return near;
        return outletCorrection(near, distalAt(along), last, along, pitch);
      };
    };
    const fitted = fairLines
      ? Meridians.prepare(phase, lines.read, fairAngle)
      : undefined;
    const read = fitted?.phase ?? phase;
    return {
      mark,
      sectionRate,
      outletRate,
      phase: read,
      observe: (phi: number) => {
        const count: number = lines.read.length;
        const index: number =
          ((((phi / (2 * Math.PI)) * count) % count) + count) % count;
        const low: number = Math.floor(index),
          weight: number = index - low;
        const from: Line = lines.read[low]!,
          to: Line = lines.read[(low + 1) % count]!;
        return (along: number): Point =>
          V.combine([
            [1 - weight, linePoint(from, along)],
            [weight, linePoint(to, along)],
          ]);
      },
      seam: boundary,
      rawSeam: (phi: number) => ({
        curve: rawCurve(phi),
        cross: rawLeave(phi),
      }),
      fairAngle,
      lineFairing: fitted?.report,
      measured: {
        shortest: lines.shortest,
        longest: lines.longest,
        outletGap: lines.outletGap,
        startGap: lines.startGap,
      },
      outlet: (phi: number): Jet => distal(phi)(mark),
      distal,
      surface: {
        name: "hm08.upper-arm.root",
        period: 2 * Math.PI,
        domain: [0, 1],
        orientation: 1,
        jet: (along, phi): Jet => read(phi)(along),
      },
    };
  }

  /** Sample a source-owned chart for the matched clay inspection. */
  export function preview(
    chart: IChart,
    columns: number,
    rows: number,
  ): {
    mesh: IAutoMovieMillimeterMesh;
    minimumJacobian: number;
    worstShaftTurn: number;
    crossingWitnesses: number;
    seamError: { point: number; first: number; angularSecond: number };
    outletError: { point: number; first: number; second: number };
  } {
    const positions: number[] = [],
      indices: number[] = [];
    let minimumJacobian: number = Infinity,
      worstShaftTurn: number = 1;
    const seamError = { point: 0, first: 0, angularSecond: 0 };
    const outletError = { point: 0, first: 0, second: 0 };
    for (let i: number = 0; i < columns; ++i) {
      const phi: number = (2 * Math.PI * i) / columns;
      const read = chart.phase(phi);
      const begin: Jet = read(0);
      const {
        curve: [point, tangent, angularSecond],
        cross: [departure, mixed],
      } = chart.seam(phi);
      seamError.point = Math.max(
        seamError.point,
        V.norm(V.sub(begin.p, point)),
      );
      seamError.first = Math.max(
        seamError.first,
        V.norm(V.sub(begin.u, departure)),
        V.norm(V.sub(begin.v, tangent)),
      );
      seamError.angularSecond = Math.max(
        seamError.angularSecond,
        V.norm(V.sub(begin.vv, angularSecond)),
        V.norm(V.sub(begin.uv, mixed)),
      );
      const end: Jet = read(1);
      const [rate, angular] = chart.outletRate(phi);
      const original: Jet = longitudinalJet(
        chart.outlet(phi),
        rate,
        0,
        angular,
        0,
      );
      const delta = (key: keyof Jet): number =>
        V.norm(V.sub(end[key], original[key]));
      outletError.point = Math.max(outletError.point, delta("p"));
      outletError.first = Math.max(
        outletError.first,
        delta("u"),
        delta("v"),
      );
      outletError.second = Math.max(
        outletError.second,
        delta("uu"),
        delta("uv"),
        delta("vv"),
      );
      const outward: Point | null = V.unit(V.cross(end.u, end.v));
      if (outward === null)
        throw new Error("The protected HM08 ring is singular");
      for (let j: number = 0; j <= rows; ++j) {
        const jet: Jet = read(j / rows);
        const n: Point = V.cross(jet.u, jet.v);
        const magnitude: number = V.norm(n);
        minimumJacobian = Math.min(minimumJacobian, magnitude);
        worstShaftTurn = Math.min(
          worstShaftTurn,
          V.dot(outward, n) / magnitude,
        );
        positions.push(...jet.p);
        if (j === rows) continue;
        const stride: number = rows + 1;
        const a: number = i * stride + j,
          b: number = ((i + 1) % columns) * stride + j;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
    const meters: IAutoMovieMesh = {
      positions: positions.map((x): number => x / 1_000),
      indices,
      normals: null,
      uvs: null,
      skin: null,
    };
    const crossingWitnesses: number = measureAutoMovieMeshCrossings(
      meters,
      meters,
      { allPairs: true },
    ).length;
    return {
      mesh: { positions, indices },
      minimumJacobian,
      worstShaftTurn,
      crossingWitnesses,
      seamError,
      outletError,
    };
  }

  /** Measure the public seam on the shaft and its protected conic continuation. */
  export async function main(): Promise<void> {
    const arg = (name: string): string | undefined =>
      process.argv
        .find((s): boolean => s.startsWith(`--${name}=`))
        ?.slice(name.length + 3);
    const source = await Mpfb.load(arg("mesh"));
    const start: number = performance.now();
    const geometry = Armscye.measure(source);
    const guide = Armscye.guide(source, geometry);
    const protection = arg("mark");
    const candidate = process.argv.includes("--build")
      ? chart(
          source,
          geometry,
          guide,
          Families.extract(source, ["arm"])[0]!.family,
          process.argv.includes("--fair"),
          process.argv.includes("--fair-lines"),
          process.argv.includes("--match-outlet-speed"),
          process.argv.includes("--align-outlet"),
        )
      : undefined;
    const result =
      JSON.stringify(
        {
          source: source.source,
          orientation: courseSupport(geometry, guide),
          star:
            protection === undefined
              ? undefined
              : courseSupport(geometry, guide, Number(protection)),
          candidate:
            candidate === undefined
              ? undefined
              : {
                  mark: candidate.mark,
                  sectionRate: candidate.sectionRate,
                  fairAngle: candidate.fairAngle,
                  lineFairing: candidate.lineFairing,
                  measured: candidate.measured,
                  ...preview(
                    candidate,
                    guide.points.length,
                    Math.ceil(geometry.foldDepth),
                  ),
                },
          elapsedMs: performance.now() - start,
        },
        null,
        2,
      ) + "\n";
    const out = arg("out");
    if (out === undefined) process.stdout.write(result);
    else await writeFile(out, result);
  }

  /** Read an exact tensor-product C2 chart built from the measured world lines. */
  export function measuredChart(
    lines: readonly Pick<Line, "points" | "cumulative" | "length">[],
    intervals: number,
    fairAngle: number = 0,
  ): (phase: number) => (along: number) => { jet: Jet; uvv: Point } {
    const stations: number[] = Array.from(
      { length: intervals + 1 },
      (_, i): number => i / intervals,
    );
    const rows = stations.map((fraction) =>
      periodic(
        Meridians.smooth(
          lines.map((line): Point => linePoint(line, fraction)),
          fairAngle,
        ),
      ),
    );
    return (phase: number) => {
      const values = rows.map((row): CurveJet => row(phase));
      const splines = ([0, 1, 2] as const).map((derivative) =>
        ([0, 1, 2] as const).map((axis) =>
          AutoMovieNaturalSpline.create(
            stations,
            values.map((j): number => j[derivative][axis]),
          ),
        ),
      );
      return (along: number) => {
        const values = splines.map((lanes) =>
          lanes.map((spline): [number, number, number] =>
            AutoMovieNaturalSpline.read(spline, along),
          ),
        );
        const read = (d: 0 | 1 | 2, e: 0 | 1 | 2): Point => [
          values[e]![0]![d],
          values[e]![1]![d],
          values[e]![2]![d],
        ];
        return {
          jet: {
            p: read(0, 0),
            u: read(1, 0),
            v: read(0, 1),
            uu: read(2, 0),
            uv: read(1, 1),
            vv: read(0, 2),
          },
          uvv: read(1, 2),
        };
      };
    };
  }

  /**
   * Compose the two world germs with a quintic whose first two derivatives
   * vanish at each seam.
   */
  export function handover(a: Jet, b: Jet, t: number, rate: number = 1): Jet {
    const x: number = 1 - t;
    const w: number = t ** 3 * (10 + t * (-15 + 6 * t));
    const dw: number = rate * 30 * t * t * x * x;
    const ddw: number = rate * rate * 60 * t * x * (1 - 2 * t);
    const blend = (key: keyof Jet): Point =>
      V.combine([
        [1 - w, a[key]],
        [w, b[key]],
      ]);
    const dp: Point = V.sub(b.p, a.p);
    return {
      p: blend("p"),
      u: V.combine([
        [1, blend("u")],
        [dw, dp],
      ]),
      v: blend("v"),
      uu: V.combine([
        [1, blend("uu")],
        [2 * dw, V.sub(b.u, a.u)],
        [ddw, dp],
      ]),
      uv: V.combine([
        [1, blend("uv")],
        [dw, V.sub(b.v, a.v)],
      ]),
      vv: blend("vv"),
    };
  }
}

/**
 * Compose a conic jet with (station(t, phase), phase). The station
 * transformation is affine in t, and both angular rates are analytic.
 */
function longitudinalJet(
  jet: Jet,
  t: number,
  phi: number,
  mixed: number,
  angularSecond: number,
): Jet {
  return {
    p: jet.p,
    u: V.scale(jet.u, t),
    v: V.add(jet.v, V.scale(jet.u, phi)),
    uu: V.scale(jet.uu, t * t),
    uv: V.combine([[t, jet.uv], [t * phi, jet.uu], [mixed, jet.u]]),
    vv: V.combine([[1, jet.vv], [2 * phi, jet.uv], [phi * phi, jet.uu], [angularSecond, jet.u]]),
  };
}

/** Prepare continuous angular observations from the public winding-one guide. */
function angular(
  geometry: Armscye.IMeasurement,
  guide: Armscye.IGuide,
): { point: Point; normal: Point }[] {
  if (guide.winding !== 1 || guide.reversedSteps !== 0)
    throw new Error(
      "The public seam needs one directed turn for the angular section correspondence",
    );
  const axis = AutoMovieHumanConicLoft.axis({
    centres: [geometry.shoulder, geometry.elbow],
    halves: [],
    up: [1, 0, 0],
  });
  const { u, v, origin } = axis.at(0);
  const shaft: Point = V.cross(v, u);
  const count: number = guide.points.length;
  const turn: number = 2 * Math.PI;
  const normals: Point[] = guide.points.map((point, i): Point => {
    const next: Point = guide.points[(i + 1) % count]!;
    const normal: Point | null = V.unit(
      V.cross(V.sub(next, point), guide.crossTangents[i]!),
    );
    if (normal === null)
      throw new Error("The open shoulder guide contains a zero-length facet");
    return normal;
  });
  const points = guide.points
    .map((point, i) => {
      const q: Point = V.sub(point, origin);
      const a: number = Math.atan2(V.dot(q, v), V.dot(q, u));
      const normal: Point | null = V.unit(
        V.add(normals[(i + count - 1) % count]!, normals[i]!),
      );
      if (normal === null)
        throw new Error(
          "The two owned facet normals have no mean at the public seam",
        );
      return { point, normal, phase: a < 0 ? a + turn : a };
    })
    .sort((a, b): number => a.phase - b.phase);
  const first = points[0]!,
    last = points.at(-1)!;
  const extended = [
    { ...last, phase: last.phase - turn },
    ...points,
    { ...first, phase: first.phase + turn },
  ];
  let i: number = 0;
  // Twice the source chord count provides one interior angular observation per span on average.
  return Array.from({ length: 2 * count }, (_, j) => {
    const phase: number = (turn * j) / (2 * count);
    while (extended[i + 1]!.phase < phase) ++i;
    const a = extended[i]!,
      b = extended[i + 1]!;
    // Intersect the source chord with the true meridian plane. A linear
    // average of the endpoint angles would lie off that section's skin.
    const radial: Point = V.combine([
      [Math.cos(phase), u],
      [Math.sin(phase), v],
    ]);
    const transverse: Point = V.cross(shaft, radial);
    const da: number = V.dot(V.sub(a.point, origin), transverse);
    const db: number = V.dot(V.sub(b.point, origin), transverse);
    const w: number = da / (da - db);
    return {
      point: V.combine([
        [1 - w, a.point],
        [w, b.point],
      ]),
      normal: V.combine([
        [1 - w, a.normal],
        [w, b.normal],
      ]),
    };
  });
}

/**
 * Three copies of the existing uniform periodic C2 field give a world curve
 * jet.
 */
function periodic(points: readonly Point[]): (phase: number) => CurveJet {
  const fields = ([0, 1, 2] as const).map((axis) =>
    AutoMovieConstructionPortField.periodic(points.map((p): number => p[axis])),
  );
  return (phase: number): CurveJet => {
    const jets = fields.map((field): [number, number, number] =>
      field.at(phase),
    );
    return ([0, 1, 2] as const).map(
      (degree): Point => [jets[0]![degree], jets[1]![degree], jets[2]![degree]],
    ) as CurveJet;
  };
}

/** One typical source facet defines the angular support of a fair fit. */
function facetSpan(
  geometry: Armscye.IMeasurement,
  guide: Armscye.IGuide,
): number {
  const axis = AutoMovieHumanConicLoft.axis({
    centres: [geometry.shoulder, geometry.elbow],
    halves: [],
    up: [1, 0, 0],
  });
  const { u, v, origin } = axis.at(0);
  const phase = (p: Point): number => {
    const q: Point = V.sub(p, origin);
    return Math.atan2(V.dot(q, v), V.dot(q, u));
  };
  const normals: Point[] = guide.points.map(
    (p, i): Point =>
      V.unit(
        V.cross(
          V.sub(guide.points[(i + 1) % guide.points.length]!, p),
          guide.crossTangents[i]!,
        ),
      )!,
  );
  const edges: number[] = guide.points.flatMap((p, i): number[] => {
    const previous: Point =
      normals[(i + guide.points.length - 1) % guide.points.length]!;
    return V.dot(previous, normals[i]!) < 1 - 64 * Number.EPSILON
      ? [phase(p)]
      : [];
  });
  const spans: number[] = edges
    .map((phi, i): number => {
      const step: number = edges[(i + 1) % edges.length]! - phi;
      return (step + 2 * Math.PI) % (2 * Math.PI);
    })
    .sort((a, b): number => a - b);
  const typical: number | undefined = spans[Math.floor(spans.length / 2)];
  if (typical === undefined || !(typical > 0))
    throw new Error("An angular fairing needs a measured facet span");
  return typical;
}

/** Fair the station and radius in the fixed directed child-phase gauge. */
function fairCurve(
  geometry: Armscye.IMeasurement,
  points: readonly Point[],
  width: number,
): (phase: number) => CurveJet {
  const axis = AutoMovieHumanConicLoft.axis({
    centres: [geometry.shoulder, geometry.elbow],
    halves: [],
    up: [1, 0, 0],
  });
  const { u, v, origin } = axis.at(0);
  const shaft: Point = V.cross(v, u);
  const controls = Meridians.smooth(
    points.map((p): Point => {
      const q: Point = V.sub(p, origin);
      return [V.dot(q, shaft), Math.hypot(V.dot(q, u), V.dot(q, v)), 0];
    }),
    width,
  );
  const stations = AutoMovieConstructionPortField.periodic(
    controls.map((p): number => p[0]),
  );
  const radii = AutoMovieConstructionPortField.periodic(
    controls.map((p): number => p[1]),
  );
  return (phi: number): CurveJet => {
    const [s, ds, dds] = stations.at(phi),
      [r, dr, ddr] = radii.at(phi);
    const c: number = Math.cos(phi),
      h: number = Math.sin(phi);
    const e: Point = V.combine([
      [c, u],
      [h, v],
    ]);
    const d: Point = V.combine([
      [-h, u],
      [c, v],
    ]);
    return [
      V.combine([
        [1, origin],
        [s, shaft],
        [r, e],
      ]),
      V.combine([
        [ds, shaft],
        [dr, e],
        [r, d],
      ]),
      V.combine([
        [dds, shaft],
        [ddr - r, e],
        [2 * dr, d],
      ]),
    ];
  };
}

type Line = {
  points: Point[];
  cumulative: number[];
  length: number;
  startGap: number;
  outletGap: number;
};

/** Read an independent polygonal line at its physical arclength fraction. */
function linePoint(
  {
    points,
    cumulative,
    length,
  }: Pick<Line, "points" | "cumulative" | "length">,
  fraction: number,
): Point {
  if (fraction === 0) return points[0]!;
  if (fraction === 1) return points.at(-1)!;
  const d: number = fraction * length;
  const i: number = cumulative.findIndex((s): boolean => s >= d);
  const weight: number =
    (d - cumulative[i - 1]!) / (cumulative[i]! - cumulative[i - 1]!);
  return V.combine([
    [1 - weight, points[i - 1]!],
    [weight, points[i]!],
  ]);
}
type Crossing = { point: P; segment: number; share: number };

/** Read the actual child-owned path on each of the source's meridian planes. */
function observedLines(
  source: Mpfb.IGeometry,
  geometry: Armscye.IMeasurement,
  outline: readonly { point: Point }[],
  mark: number,
  outlet: (phase: number) => Point,
): {
  read: Line[];
  shortest: number;
  longest: number;
  outletGap: number;
  startGap: number;
} {
  const read = AutoMovieMeshExtract.prepareOutline(source.body);
  const side = Armscye.divider(geometry).side;
  const axis = AutoMovieHumanConicLoft.axis({
    centres: [geometry.shoulder, geometry.elbow],
    halves: [],
    up: [1, 0, 0],
  });
  const { u, v, origin } = axis.at(0);
  const shaft: Point = V.cross(v, u);
  const refused: {
    phi: number;
    cut: { closed: boolean; start: number; outlets: number; paths: number }[];
  }[] = [];
  const readLines = outline.map(({ point }, i): Line | null => {
    const phi: number = (2 * Math.PI * i) / outline.length;
    const radial: Point = V.combine([
      [Math.cos(phi), u],
      [Math.sin(phi), v],
    ]);
    const normal: Point = V.cross(shaft, radial);
    const chart = (p: Point): P => [
      V.dot(V.sub(p, origin), shaft),
      V.dot(V.sub(p, origin), radial),
    ];
    const world = ([s, r]: P): Point =>
      V.combine([
        [1, origin],
        [s, shaft],
        [r, radial],
      ]);
    const to: Point = outlet(phi);
    const [from, end] = [chart(point), chart(to)];
    const cut = read(
      { origin: [...origin], axes: [normal, shaft, radial] },
      [0],
      0,
      0,
      0,
    )[0]!;
    const candidates: Line[] = [];
    const inspected: {
      closed: boolean;
      start: number;
      outlets: number;
      paths: number;
    }[] = [];
    for (const loop of cut.outer) {
      if (loop.points.length < 2) continue;
      const polygon: P[] = loop.points;
      const start: Crossing = nearest(polygon, from, loop.closed);
      const startGap: number = Math.hypot(
        start.point[0] - from[0],
        start.point[1] - from[1],
      );
      const inspection = {
        closed: loop.closed,
        start: startGap,
        outlets: 0,
        paths: 0,
      };
      inspected.push(inspection);
      if (startGap > 0.01) continue;
      const ends: Crossing[] = polygon
        .slice(0, loop.closed ? undefined : -1)
        .flatMap((p, j): Crossing[] => {
          const q: P = polygon[(j + 1) % polygon.length]!;
          if (p[0] > mark === q[0] > mark) return [];
          const f: number = (mark - p[0]) / (q[0] - p[0]);
          const r: number = p[1] + f * (q[1] - p[1]);
          return r > 0 && side(world([mark, r])) > 0
            ? [{ point: [mark, r], segment: j, share: f }]
            : [];
        })
        .sort(
          (a, b): number =>
            Math.abs(a.point[1] - end[1]) - Math.abs(b.point[1] - end[1]),
        );
      inspection.outlets = ends.length;
      for (const land of ends)
        for (const sense of [-1, 1] as const) {
          const branch: P[] | null = route(
            polygon,
            start,
            land,
            sense,
            loop.closed,
          );
          if (
            branch === null ||
            branch.some(
              (p, j): boolean => p[1] <= 0 || (j > 0 && side(world(p)) < -0.01),
            )
          )
            continue;
          inspection.paths++;
          const points: Point[] = branch.map(world);
          const cumulative: number[] = [0];
          for (let j: number = 1; j < points.length; ++j)
            cumulative.push(
              cumulative[j - 1]! + V.norm(V.sub(points[j]!, points[j - 1]!)),
            );
          candidates.push({
            points,
            cumulative,
            length: cumulative.at(-1)!,
            startGap: V.norm(V.sub(points[0]!, point)),
            outletGap: V.norm(V.sub(points.at(-1)!, to)),
          });
        }
    }
    const chosen: Line | undefined = candidates.sort(
      (a, b): number => a.outletGap - b.outletGap || a.length - b.length,
    )[0];
    if (chosen === undefined) refused.push({ phi, cut: inspected });
    return chosen ?? null;
  });
  if (refused.length > 0)
    throw new Error(
      "No owned public arm section line: " + JSON.stringify(refused),
    );
  const lines: Line[] = readLines as Line[];
  return {
    read: lines,
    shortest: Math.min(...lines.map((x): number => x.length)),
    longest: Math.max(...lines.map((x): number => x.length)),
    outletGap: Math.max(...lines.map((x): number => x.outletGap)),
    startGap: Math.max(...lines.map((x): number => x.startGap)),
  };
}

function nearest(loop: readonly P[], target: P, closed: boolean): Crossing {
  let distance: number = Infinity;
  let chosen: Crossing | undefined;
  loop.slice(0, closed ? undefined : -1).forEach((a, i): void => {
    const b: P = loop[(i + 1) % loop.length]!;
    const [x, y]: P = [b[0] - a[0], b[1] - a[1]];
    const norm: number = x * x + y * y;
    const t: number =
      norm === 0
        ? 0
        : Math.max(
            0,
            Math.min(
              1,
              ((target[0] - a[0]) * x + (target[1] - a[1]) * y) / norm,
            ),
          );
    const point: P = [a[0] + t * x, a[1] + t * y];
    const d: number = (target[0] - point[0]) ** 2 + (target[1] - point[1]) ** 2;
    if (d < distance) {
      distance = d;
      chosen = { point, segment: i, share: t };
    }
  });
  if (chosen === undefined)
    throw new Error("The HM08 outline has no closest same-plane segment");
  return chosen;
}

function route(
  loop: readonly P[],
  from: Crossing,
  to: Crossing,
  sense: -1 | 1,
  closed: boolean,
): P[] | null {
  const size: number = loop.length;
  const result: P[] = [from.point];
  let segment: number = from.segment;
  let first: boolean = true;
  while (
    segment !== to.segment ||
    (first && sense * (to.share - from.share) < 0)
  ) {
    first = false;
    const vertex: number = (segment + (sense > 0 ? 1 : 0)) % size;
    result.push(loop[vertex]!);
    if (!closed && (segment + sense < 0 || segment + sense >= size - 1))
      return null;
    segment = (segment + sense + size) % size;
  }
  result.push(to.point);
  return result.filter(
    (p, i): boolean =>
      i === 0 || p[0] !== result[i - 1]![0] || p[1] !== result[i - 1]![1],
  );
}

/** Apply only the discrepancy from the measured outlet's own tangent germ. */
function outletCorrection(
  measured: Jet,
  distal: Jet,
  last: { jet: Jet; uvv: Point },
  station: number,
  [rate, angularRate, angularRate2]: [number, number, number],
): Jet {
  const offset: number = station - 1;
  const t: number = 1 + offset * rate;
  const x: number = 1 - t;
  const w: number = t ** 3 * (10 + t * (-15 + 6 * t));
  const first: number = 30 * t * t * x * x;
  const second: number = 60 * t * x * (1 - 2 * t);
  const angular: number = offset * angularRate;
  const u: number = first * rate,
    v: number = first * angular;
  const uu: number = second * rate * rate;
  const uv: number = second * rate * angular + first * angularRate;
  const vv: number = second * angular * angular + first * offset * angularRate2;
  // A natural measured spline has zero second station derivative at 1.
  // Its tangent germ is linear in station with independently smooth phase jets.
  const d: Jet = {
    p: V.combine([
      [1, distal.p],
      [-1, last.jet.p],
      [-offset, last.jet.u],
    ]),
    u: V.sub(distal.u, last.jet.u),
    v: V.combine([
      [1, distal.v],
      [-1, last.jet.v],
      [-offset, last.jet.uv],
    ]),
    uu: distal.uu,
    uv: V.sub(distal.uv, last.jet.uv),
    vv: V.combine([
      [1, distal.vv],
      [-1, last.jet.vv],
      [-offset, last.uvv],
    ]),
  };
  return {
    p: V.combine([
      [1, measured.p],
      [w, d.p],
    ]),
    u: V.combine([
      [1, measured.u],
      [w, d.u],
      [u, d.p],
    ]),
    v: V.combine([
      [1, measured.v],
      [w, d.v],
      [v, d.p],
    ]),
    uu: V.combine([
      [1, measured.uu],
      [w, d.uu],
      [2 * u, d.u],
      [uu, d.p],
    ]),
    uv: V.combine([
      [1, measured.uv],
      [w, d.uv],
      [u, d.v],
      [v, d.u],
      [uv, d.p],
    ]),
    vv: V.combine([
      [1, measured.vv],
      [w, d.vv],
      [2 * v, d.v],
      [vv, d.p],
    ]),
  };
}

if (
  require.main === module &&
  /^FamilyConicMpfbArmscyeTransition\.[cm]?[jt]s$/u.test(
    basename(process.argv[1] ?? ""),
  )
)
  void FamilyConicMpfbArmscyeTransition.main().catch((error: unknown): void => {
    console.error(error);
    process.exitCode = 1;
  });
