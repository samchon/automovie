import { AutoMovieSolidChain, type IAutoMovieConstructionKnownPortSource, type IAutoMovieLoftChain, type IAutoMovieSolidSurface } from "@automovie/engine";

import type { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanTrunkPorts } from "../trunk/AutoMovieHumanTrunkPorts";
import type { AutoMovieHumanHeadEarLoft } from "./AutoMovieHumanHeadEarLoft";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * The auricles' ports on head.mass, in the trunk ports' form
 * (`AutoMovieHumanTrunkPorts.IPort`): each an ellipse on head.mass's own
 * chart (station mm, phase rad from +u anterior toward +v right), centred
 * at the station and phase of the auricle's root loop's centroid, its
 * station half extent the root's half length along the head's +Y, its phase
 * half extent solved by bisection so that its perimeter on the head's
 * surface equals the root loop's (`AutoMovieHumanHeadEarLoft.IEar.root`),
 * so the band runs between equal rings. The parent field is head.mass's
 * surface with its reliefs (`AutoMovieSolidChain.surface`); the band itself
 * is the construction tree's known-port join (`AutoMovieHumanTrunkPorts.band`).
 */
export namespace AutoMovieHumanHeadEarPorts {
  /** Both ports by side, or null when head.mass has no surface. */
  export function create(chain: IAutoMovieLoftChain, ears: readonly AutoMovieHumanHeadEarLoft.IEar[]): Record<"left" | "right", AutoMovieHumanTrunkPorts.IPort> | null {
    const field: IAutoMovieSolidSurface | null = AutoMovieSolidChain.surface(chain);
    if (field === null) return null;
    const out: Partial<Record<"left" | "right", AutoMovieHumanTrunkPorts.IPort>> = {};
    for (const ear of ears) {
      if (ear.root.length < 8) return null;
      const centroid: Vec3 = [0, 1, 2].map((i: number): number => ear.root.reduce((t: number, p: Vec3): number => t + p[i]!, 0) / ear.root.length) as Vec3;
      const perimeter: number = ear.root.reduce((t: number, p: Vec3, k: number): number => t + distance(p, ear.root[(k + 1) % ear.root.length]!), 0);
      const ys: number[] = ear.root.map((p: Vec3): number => p[1]);
      const half: number = (Math.max(...ys) - Math.min(...ys)) / 2;
      // The phase of the centroid's direction on the +v (right) or -v (left) side, from the chain's axis at its station.
      const axis: number[] = axisAt(field, centroid[1]);
      const phase: number = Math.atan2(centroid[2] - axis[2]!, centroid[0] - axis[0]!);
      const at: [number, number] = [centroid[1], phase < 0 ? phase + 2 * Math.PI : phase];
      const sense: 1 | -1 = ear.side === "right" ? -1 : 1;
      let lo: number = 0.005;
      let hi: number = 0.6;
      for (let k: number = 0; k < 40; ++k) {
        const mid: number = (lo + hi) / 2;
        if (length(field, AutoMovieHumanTrunkPorts.ellipse(at, [half, mid], sense)) < perimeter) lo = mid;
        else hi = mid;
      }
      const semi: [number, number] = [half, (lo + hi) / 2];
      const map: IAutoMovieConstructionKnownPortSource.IMap = AutoMovieHumanTrunkPorts.ellipse(at, semi, sense);
      out[ear.side] = {
        name: `ear.${ear.side}`,
        centre: at,
        semi,
        sense,
        girth: perimeter,
        perimeter: length(field, map),
        field,
        map,
        curve: (c: number): Vec3 => world(field, map.point(c, 0)),
        jet: (c: number, v: number = 0): IAutoMovieSolidSurface.IJet => compose(field, map.jet(c, v)),
        frame: { origin: centroid, axes: [[0, 0, ear.side === "right" ? 1 : -1], [0, 1, 0], [ear.side === "right" ? -1 : 1, 0, 0]] },
        basis: "the auricle's root loop: its centroid's station and phase on head.mass, its half length along +Y, the phase half extent so the port's perimeter equals the root loop's",
      };
    }
    return out.left !== undefined && out.right !== undefined ? { left: out.left, right: out.right } : null;
  }

  /** The surface's centroid at a station: the mean of 64 points around it. */
  function axisAt(field: IAutoMovieSolidSurface, station: number): number[] {
    const ring: Vec3[] = Array.from({ length: 64 }, (_: unknown, k: number): Vec3 => world(field, [station, (2 * Math.PI * k) / 64]));
    return [0, 1, 2].map((i: number): number => ring.reduce((t: number, p: Vec3): number => t + p[i]!, 0) / ring.length);
  }

  /** The world total2 of the band rectangle by the chain rule over the map's chart jet (as `AutoMovieHumanTrunkPorts`). */
  function compose(field: IAutoMovieSolidSurface, m: IAutoMovieConstructionKnownPortSource.IJet | null): IAutoMovieSolidSurface.IJet {
    if (m === null) throw new Error("ear port: the parent map has no jet there");
    const s: IAutoMovieSolidSurface.IJet = field.jet(m.p[0], m.p[1]);
    const lin: (a: readonly number[]) => Vec3 = (a: readonly number[]): Vec3 => [0, 1, 2].map((k: number): number => s.u[k]! * a[0]! + s.v[k]! * a[1]!) as Vec3;
    const quad: (a: readonly number[], b: readonly number[], second: readonly number[]) => Vec3 = (a: readonly number[], b: readonly number[], second: readonly number[]): Vec3 =>
      [0, 1, 2].map((k: number): number => s.uu[k]! * a[0]! * b[0]! + s.uv[k]! * (a[0]! * b[1]! + a[1]! * b[0]!) + s.vv[k]! * a[1]! * b[1]! + s.u[k]! * second[0]! + s.v[k]! * second[1]!) as Vec3;
    return { p: [s.p[0]!, s.p[1]!, s.p[2]!], u: lin(m.u), v: lin(m.v), uu: quad(m.u, m.u, m.uu), uv: quad(m.u, m.v, m.uv), vv: quad(m.v, m.v, m.vv) };
  }

  /** A chart point on the field, world. */
  function world(field: IAutoMovieSolidSurface, chart: [number, number]): Vec3 {
    const p: readonly number[] = field.point !== undefined ? field.point(chart[0], chart[1]) : field.jet(chart[0], chart[1]).p;
    return [p[0]!, p[1]!, p[2]!];
  }

  /** The port curve's perimeter on the field, 128-gon. */
  function length(field: IAutoMovieSolidSurface, map: IAutoMovieConstructionKnownPortSource.IMap): number {
    let total: number = 0;
    let previous: Vec3 = world(field, map.point(0, 0));
    for (let k: number = 1; k <= 128; ++k) {
      const next: Vec3 = world(field, map.point((2 * Math.PI * k) / 128, 0));
      total += distance(next, previous);
      previous = next;
    }
    return total;
  }

  function distance(a: Vec3, b: Vec3): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }
}
