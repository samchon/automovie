import { AutoMovieLoftChain, AutoMovieSolidChain, type IAutoMovieConstructionKnownPortSource, type IAutoMovieLoftChain, type IAutoMovieSolidSurface } from "@automovie/engine";

import type { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanArmViewCurves } from "../arm/AutoMovieHumanArmViewCurves";
import { AutoMovieHumanFairOutline } from "../arm/AutoMovieHumanFairOutline";
import { AutoMovieHumanTrunkPorts } from "../trunk/AutoMovieHumanTrunkPorts";
import type { AutoMovieHumanHandDigits } from "./AutoMovieHumanHandDigits";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * The palm's digit ports as known-port parent sides on the arm part's own
 * chart (station mm along the arm's course, phase rad), the shoulders'
 * pattern (`AutoMovieHumanTrunkPorts`), so each digit is banded to the palm
 * between equal rings with no intersection search (traced branch joins fail
 * where a digit crosses the palm at a grazing angle).
 *
 * Each port is centred where its digit's axis leaves the palm (bisection on
 * the axis between the digit's start inside the palm and its tip, inside
 * meaning nearer the arm's course than the palm's skin at the same station
 * and phase); that crossing's distance along the digit is the digit's rail
 * station. The port is an ellipse in the chart (`AutoMovieHumanTrunkPorts.ellipse`)
 * whose station and phase half-extents keep its world shape round (each
 * half-extent the same world length through the chart's local scales there)
 * and are scaled by bisection so its world perimeter on the palm equals the
 * digit's own section perimeter at its rail (Ramanujan's perimeter of the
 * digit's half-breadth and half-depth there). The digits' roots keep a gap
 * (`AutoMovieHumanHandDigits`), so the knuckle ports do not overlap; each
 * port records its least world gap to its neighbours.
 */
export namespace AutoMovieHumanHandPorts {
  /** One digit's port on the palm. */
  export interface IPort extends Omit<AutoMovieHumanTrunkPorts.IPort, "frame"> {
    /** The digit's rail: its station (mm from its part's start) where it leaves the palm, the child's root ring. */
    rail: number;

    /** Least world distance from this port's curve to any other port's curve, mm. */
    gap: number;
  }

  /**
   * The ports of one hand's digits on the arm chain's palm.
   *
   * @param arm The arm's lofted chain (the palm is its distal end).
   * @param digits The hand's digits.
   */
  export function create(arm: IAutoMovieLoftChain, digits: readonly AutoMovieHumanHandDigits.IDigit[]): IPort[] {
    const field: IAutoMovieSolidSurface | null = AutoMovieSolidChain.surface(arm);
    if (field === null) return [];
    const first: number = arm.layers[0]!.y;
    const last: number = arm.layers[arm.layers.length - 1]!.y;
    const ports: Omit<IPort, "gap">[] = digits.map((d: AutoMovieHumanHandDigits.IDigit): Omit<IPort, "gap"> => {
      // The digit's axis leaves the palm between its start (inside) and its tip (outside).
      const along = (t: number): Vec3 => [d.root[0] + d.axes.distal[0] * t, d.root[1] + d.axes.distal[1] * t, d.root[2] + d.axes.distal[2] * t];
      let lo: number = 0;
      let hi: number = d.length;
      for (let k: number = 0; k < 40; ++k) {
        const mid: number = (lo + hi) / 2;
        if (locate(arm, along(mid), first, last).inside) lo = mid;
        else hi = mid;
      }
      const rail: number = (lo + hi) / 2;
      const at: { station: number; phase: number; inside: boolean } = locate(arm, along(rail), first, last);
      // The digit's own section perimeter at its rail.
      const half = (knots: readonly AutoMovieHumanHandDigits.IKnot[]): number =>
        AutoMovieHumanFairOutline.evaluate(
          knots.map((k: AutoMovieHumanHandDigits.IKnot): number => k.q),
          knots.map((k: AutoMovieHumanHandDigits.IKnot): AutoMovieHumanFairOutline.IJet => ({ value: k.value, first: k.first, second: k.second })),
          -Math.sqrt(Math.max(0, d.length - rail)),
        )[0];
      const girth: number = AutoMovieHumanArmViewCurves.ramanujan(half(d.knots), half(d.depth));
      // A round world shape: each half-extent the same world length through the chart's local scales, then scaled to the girth.
      const jet: IAutoMovieSolidSurface.IJet = field.jet(at.station, at.phase);
      const su: number = Math.hypot(jet.u[0]!, jet.u[1]!, jet.u[2]!);
      const sv: number = Math.hypot(jet.v[0]!, jet.v[1]!, jet.v[2]!);
      const centre: [number, number] = [at.station, at.phase];
      // The station half-extent stays inside the palm chart's owned stations (near the palm's pole there is little room);
      // the phase half-extent then carries the rest of the girth, within 1.2 rad.
      const room: number = 0.95 * Math.min(last - at.station, at.station - first);
      const shape = (r: number): [number, number] => [Math.min(r / su, room), Math.min(r / sv, 1.2)];
      let a: number = 0.01;
      let b: number = 60;
      for (let k: number = 0; k < 50; ++k) {
        const r: number = (a + b) / 2;
        if (perimeter(field, AutoMovieHumanTrunkPorts.ellipse(centre, shape(r), 1)) < girth) a = r;
        else b = r;
      }
      const semi: [number, number] = shape((a + b) / 2);
      const map: IAutoMovieConstructionKnownPortSource.IMap = AutoMovieHumanTrunkPorts.ellipse(centre, semi, 1);
      return {
        name: d.name,
        centre,
        semi,
        sense: 1,
        girth,
        perimeter: perimeter(field, map),
        field,
        map,
        rail,
        curve: (c: number): Vec3 => world(field, map.point(c, 0)),
        jet: (c: number, v: number = 0): IAutoMovieSolidSurface.IJet => compose(field, map.jet(c, v)),
        basis: "where the digit's axis leaves the palm; a round world ellipse sized to the digit's section perimeter at that rail",
      };
    });
    return ports.map((p: Omit<IPort, "gap">, i: number): IPort => {
      let gap: number = Infinity;
      const mine: Vec3[] = Array.from({ length: 48 }, (_: unknown, k: number): Vec3 => p.curve((2 * Math.PI * k) / 48));
      ports.forEach((q: Omit<IPort, "gap">, j: number): void => {
        if (i === j) return;
        for (let k: number = 0; k < 48; ++k) {
          const o: Vec3 = q.curve((2 * Math.PI * k) / 48);
          for (const m of mine) gap = Math.min(gap, Math.hypot(m[0] - o[0], m[1] - o[1], m[2] - o[2]));
        }
      });
      return { ...p, gap };
    });
  }

  /** A world point's arm-chart station and phase, and whether it lies nearer the course than the skin there. */
  function locate(arm: IAutoMovieLoftChain, p: Vec3, first: number, last: number): { station: number; phase: number; inside: boolean } {
    // The station whose section plane passes through the point (planes advance monotonically along the course).
    const side = (s: number): number => {
      const f: { origin: readonly number[]; u: readonly number[]; v: readonly number[] } = AutoMovieLoftChain.frame(arm, s);
      const n: Vec3 = [f.u[1]! * f.v[2]! - f.u[2]! * f.v[1]!, f.u[2]! * f.v[0]! - f.u[0]! * f.v[2]!, f.u[0]! * f.v[1]! - f.u[1]! * f.v[0]!];
      return (p[0] - f.origin[0]!) * n[0] + (p[1] - f.origin[1]!) * n[1] + (p[2] - f.origin[2]!) * n[2];
    };
    let lo: number = first;
    let hi: number = last;
    const sign: number = Math.sign(side(hi) - side(lo)) || 1;
    for (let k: number = 0; k < 50; ++k) {
      const mid: number = (lo + hi) / 2;
      if (side(mid) * sign < 0) lo = mid;
      else hi = mid;
    }
    const station: number = (lo + hi) / 2;
    const axis: readonly number[] = AutoMovieLoftChain.axis(arm, station);
    // The phase whose skin point is nearest the point's direction from the axis.
    let phase: number = 0;
    let best: number = Infinity;
    for (let k: number = 0; k < 360; ++k) {
      const phi: number = (2 * Math.PI * k) / 360;
      const q: readonly number[] = AutoMovieLoftChain.point(arm, station, phi);
      const d: number = Math.hypot(q[0]! - p[0], q[1]! - p[1], q[2]! - p[2]);
      const along: number = (q[0]! - axis[0]!) * (p[0] - axis[0]!) + (q[1]! - axis[1]!) * (p[1] - axis[1]!) + (q[2]! - axis[2]!) * (p[2] - axis[2]!);
      if (along > 0 && d < best) [best, phase] = [d, phi];
    }
    const skin: readonly number[] = AutoMovieLoftChain.point(arm, station, phase);
    const inside: boolean = Math.hypot(p[0] - axis[0]!, p[1] - axis[1]!, p[2] - axis[2]!) < Math.hypot(skin[0]! - axis[0]!, skin[1]! - axis[1]!, skin[2]! - axis[2]!);
    return { station, phase, inside };
  }

  /** The world total2 in the band rectangle by the chain rule over the map's chart jet (as `AutoMovieHumanTrunkPorts`). */
  function compose(field: IAutoMovieSolidSurface, m: IAutoMovieConstructionKnownPortSource.IJet | null): IAutoMovieSolidSurface.IJet {
    if (m === null) throw new Error("hand port: the parent map has no jet there");
    const s: IAutoMovieSolidSurface.IJet = field.jet(m.p[0], m.p[1]);
    const lin = (a: readonly number[]): Vec3 => [0, 1, 2].map((k: number): number => s.u[k]! * a[0]! + s.v[k]! * a[1]!) as Vec3;
    const quad = (a: readonly number[], b: readonly number[], second: readonly number[]): Vec3 =>
      [0, 1, 2].map((k: number): number => s.uu[k]! * a[0]! * b[0]! + s.uv[k]! * (a[0]! * b[1]! + a[1]! * b[0]!) + s.vv[k]! * a[1]! * b[1]! + s.u[k]! * second[0]! + s.v[k]! * second[1]!) as Vec3;
    return { p: [s.p[0]!, s.p[1]!, s.p[2]!], u: lin(m.u), v: lin(m.v), uu: quad(m.u, m.u, m.uu), uv: quad(m.u, m.v, m.uv), vv: quad(m.v, m.v, m.vv) };
  }

  /** World point of a chart point on the field. */
  function world(field: IAutoMovieSolidSurface, chart: [number, number]): Vec3 {
    const p: readonly number[] = field.point !== undefined ? field.point(chart[0], chart[1]) : field.jet(chart[0], chart[1]).p;
    return [p[0]!, p[1]!, p[2]!];
  }

  /** World perimeter of a port map's curve on the field, 128-gon. */
  function perimeter(field: IAutoMovieSolidSurface, map: IAutoMovieConstructionKnownPortSource.IMap): number {
    let total: number = 0;
    let previous: Vec3 = world(field, map.point(0, 0));
    for (let k: number = 1; k <= 128; ++k) {
      const next: Vec3 = world(field, map.point((2 * Math.PI * k) / 128, 0));
      total += Math.hypot(next[0] - previous[0], next[1] - previous[1], next[2] - previous[2]);
      previous = next;
    }
    return total;
  }
}
