import { AutoMovieConstructionKnownPort, AutoMovieSolidChain, type IAutoMovieConstructionKnownPortSource, type IAutoMovieSolidSurface } from "@automovie/engine";

import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import type { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import type { AutoMovieHumanTrunkS00 } from "./AutoMovieHumanTrunkS00";
import type { AutoMovieHumanTrunkSegmentFrames } from "./AutoMovieHumanTrunkSegmentFrames";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * The trunk's shoulder ports as known-port parent sides on S00's own chart
 * (station mm, the arclength of the section planes' course, equal to the
 * world height below the neck turn; phase = polar angle in the section
 * plane from +u anterior toward +v right, rad), for the engine's band
 * operator (`AutoMovieConstructionKnownPort`): each port is a closed curve
 * on that chart, the parent field is the S00 surface itself (wall and mounds,
 * `AutoMovieSolidChain.surface`), and the parent map carries the band
 * rectangle (clock `c`, transverse `v` in [0, 1]) into the chart, `v = 0` on
 * the port curve and `v = 1` at the region's centre, so the trimmed region
 * inside the port is the parent's strip of the band.
 *
 * Each port curve is an ellipse in the chart, `station = y0 + (1 - v) a cos c`,
 * `phase = p0 + s (1 - v) b sin c`, with `c = 0` at its top, increasing toward
 * the anterior side (`s` = -1 on the right, +1 on the left, so both sides run
 * top, front, bottom, back), period 2 pi. The map is polynomial in `(1 - v)`
 * and trigonometric in `c`, so its total2 is exact. Each shoulder port is
 * centred on the lateral guide (phase +-pi/2) at the station midway between
 * the axilla and acromion heights (ANSUR II; inside the neck turn a height is
 * the station whose plane origin stands there), its half height half their
 * station difference; its phase half-width is set by bisection so the port's
 * world perimeter on S00 equals the child's root girth, the axillary arm
 * circumference (ANSUR 1988, the arm root profile's tape).
 *
 * The hips are not ports: S00 ends open at the crotch and each leg continues
 * from half of that end plus the medial seam (`AutoMovieHumanTrunkPelvisSplit`).
 * A closing bowl with two thigh-girth ports was tried twice and failed (the
 * ports crossed; the bowl under the pole could not carry a thigh-girth loop).
 */
export namespace AutoMovieHumanTrunkPorts {
  /** One port's parent side. */
  export interface IPort {
    /** `shoulder.left` or `shoulder.right`. */
    name: string;

    /** Chart centre `[station mm, phase rad]`. */
    centre: [number, number];

    /** Chart half extents `[station mm, phase rad]`. */
    semi: [number, number];

    /** +1 or -1: the phase sense of increasing clock at `c = pi / 2` (toward anterior). */
    sense: 1 | -1;

    /** The child root girth the port's perimeter was sized to, mm. */
    girth: number;

    /** The port curve's world perimeter on S00, mm (128-gon). */
    perimeter: number;

    /** The S00 surface (parent field), chart (station, phase). */
    field: IAutoMovieSolidSurface;

    /** The parent map from the band rectangle (clock, transverse) into that chart. */
    map: IAutoMovieConstructionKnownPortSource.IMap;

    /** World point of the port curve at clock `c`. */
    curve(c: number): Vec3;

    /**
     * The world total2 of the band rectangle on S00 at clock `c` and
     * transverse `v` (0 on the port curve, 1 at the region's centre): `u` per
     * radian of clock along the loop, `v` per unit of transverse into the
     * trunk's region, by the chain rule of the S00 field's jet over the
     * parent map's exact jet. A child starts its root's lines from `jet(c, 0)`.
     */
    jet(c: number, v?: number): IAutoMovieSolidSurface.IJet;

    /**
     * The port's declared frame in the world: origin at the loop's centroid
     * (128-gon), axis 0 the loop plane's normal by Newell's method pointing
     * out of the trunk (away from the section course), axis 1 the world up
     * made orthogonal to it, axis 2 their cross product (forward on the right
     * port, backward on the left), the child's root frame before its own
     * relative transform.
     */
    frame: { origin: Vec3; axes: [Vec3, Vec3, Vec3] };

    /** Basis of the placement and size. */
    basis: string;
  }

  /** The shoulder ports, or null when S00 has no surface. */
  export interface IOutput {
    /** Shoulder ports by side. */
    shoulders: Record<"left" | "right", IPort>;

    /** The S00 surface the ports lie on. */
    field: IAutoMovieSolidSurface;
  }

  /** Build the shoulder ports from one S00 build. */
  export function create(s00: AutoMovieHumanTrunkS00.IOutput): IOutput | null {
    if (s00.chain === null) return null;
    const field: IAutoMovieSolidSurface | null = AutoMovieSolidChain.surface(s00.chain);
    if (field === null) return null;
    const f: AutoMovieHumanTrunkSegmentFrames.IOutput = s00.datums.frames;
    const m: IAutoMovieHumanBodyMeasures = s00.measures;
    const axilla: number = s00.curves.axis.turn.station(m.axillaHeight);
    const acromion: number = s00.curves.axis.turn.station(f.heights.acromion);
    const centre: number = (axilla + acromion) / 2;

    const make: (name: string, phase: number, sense: 1 | -1) => IPort = (name: string, phase: number, sense: 1 | -1): IPort => {
      // Phase half-width by bisection so the world perimeter equals the girth.
      const at: [number, number] = [centre, phase];
      const half: number = (acromion - axilla) / 2;
      let lo: number = 0.02;
      let hi: number = 1.4;
      for (let k: number = 0; k < 40; ++k) {
        const mid: number = (lo + hi) / 2;
        if (length(field, ellipse(at, [half, mid], sense)) < m.axillaryArmCircumference) lo = mid;
        else hi = mid;
      }
      const semi: [number, number] = [half, (lo + hi) / 2];
      const map: IAutoMovieConstructionKnownPortSource.IMap = ellipse(at, semi, sense);
      const course: number = s00.curves.source.axis?.(f.heights.acromion) ?? s00.curves.axis.xs;
      return {
        name,
        centre: at,
        semi,
        sense,
        girth: m.axillaryArmCircumference,
        perimeter: length(field, map),
        field,
        map,
        curve: (c: number): Vec3 => world(field, map.point(c, 0)),
        jet: (c: number, v: number = 0): IAutoMovieSolidSurface.IJet => compose(field, map.jet(c, v)),
        frame: frameOf(field, map, course),
        basis: "lateral guide, midway axilla-acromion (ANSUR II heights as stations), half height half their difference; phase width so the perimeter is the axillary arm circumference",
      };
    };
    return {
      shoulders: { left: make("shoulder.left", -Math.PI / 2, 1), right: make("shoulder.right", Math.PI / 2, -1) },
      field,
    };
  }

  /** The parent chart map of an elliptic port: exact total2 in (clock, transverse). */
  export function ellipse(centre: [number, number], semi: [number, number], sense: 1 | -1): IAutoMovieConstructionKnownPortSource.IMap {
    const [a, b]: [number, number] = semi;
    const s: number = sense * b;
    return {
      domain: [0, 2 * Math.PI],
      transverse: [0, 1],
      point: (c: number, v: number): [number, number] => [centre[0] + (1 - v) * a * Math.cos(c), centre[1] + (1 - v) * s * Math.sin(c)],
      jet: (c: number, v: number): IAutoMovieConstructionKnownPortSource.IJet => {
        const w: number = 1 - v;
        const cos: number = Math.cos(c);
        const sin: number = Math.sin(c);
        return {
          p: [centre[0] + w * a * cos, centre[1] + w * s * sin],
          u: [-w * a * sin, w * s * cos],
          v: [-a * cos, -s * sin],
          uu: [-w * a * cos, -w * s * sin],
          uv: [a * sin, -s * cos],
          vv: [0, 0],
        };
      },
    };
  }

  /**
   * The band between a trunk port and a limb's root: the engine's known-port
   * operator over the S00 field with this port's map (parent) and the limb's
   * own field and map (child, owned by its region), period 2 pi.
   */
  export function band(port: IPort, child: { field: IAutoMovieSolidSurface; map: IAutoMovieConstructionKnownPortSource.IMap; boundary: string }, orientation: 1 | -1): AutoMovieConstructionKnownPort.IPrepared {
    return AutoMovieConstructionKnownPort({
      definition: {
        name: `band.${port.name}`,
        domain: [0, 2 * Math.PI],
        period: 2 * Math.PI,
        orientation,
        parent: { field: "trunk", map: port.name, boundary: `trunk.port.${port.name}`, material: "trunk", binding: "trunk" },
        child: { field: "child", map: `${port.name}.child`, boundary: child.boundary, material: child.boundary, binding: child.boundary },
      },
      fields: new Map([
        ["trunk", port.field],
        ["child", child.field],
      ]),
      maps: new Map([
        [port.name, port.map],
        [`${port.name}.child`, child.map],
      ]),
    });
  }

  /**
   * The world total2 in the band rectangle (clock, transverse) by the chain
   * rule: with `m` the map's chart jet and `S` the field's jet at `m.p`,
   * `P_c = S_u m_c0 + S_v m_c1`, `P_cc = S_uu m_c0^2 + 2 S_uv m_c0 m_c1 +
   * S_vv m_c1^2 + S_u m_cc0 + S_v m_cc1`, and likewise for the mixed and
   * transverse terms.
   */
  function compose(field: IAutoMovieSolidSurface, m: IAutoMovieConstructionKnownPortSource.IJet | null): IAutoMovieSolidSurface.IJet {
    if (m === null) throw new Error("trunk port: the parent map has no jet there");
    const s: IAutoMovieSolidSurface.IJet = field.jet(m.p[0], m.p[1]);
    const lin = (a: readonly number[]): Vec3 => [0, 1, 2].map((k: number): number => s.u[k]! * a[0]! + s.v[k]! * a[1]!) as Vec3;
    const quad = (a: readonly number[], b: readonly number[], second: readonly number[]): Vec3 =>
      [0, 1, 2].map((k: number): number => s.uu[k]! * a[0]! * b[0]! + s.uv[k]! * (a[0]! * b[1]! + a[1]! * b[0]!) + s.vv[k]! * a[1]! * b[1]! + s.u[k]! * second[0]! + s.v[k]! * second[1]!) as Vec3;
    return {
      p: [s.p[0]!, s.p[1]!, s.p[2]!],
      u: lin(m.u),
      v: lin(m.v),
      uu: quad(m.u, m.u, m.uu),
      uv: quad(m.u, m.v, m.uv),
      vv: quad(m.v, m.v, m.vv),
    };
  }

  /** The port's declared frame: the loop's centroid, its Newell normal pointing away from the course X at the port, world up orthogonalised, and their cross product. */
  function frameOf(field: IAutoMovieSolidSurface, map: IAutoMovieConstructionKnownPortSource.IMap, course: number): { origin: Vec3; axes: [Vec3, Vec3, Vec3] } {
    const ring: Vec3[] = Array.from({ length: 128 }, (_: unknown, k: number): Vec3 => world(field, map.point((2 * Math.PI * k) / 128, 0)));
    const origin: Vec3 = [0, 1, 2].map((i: number): number => ring.reduce((t: number, p: Vec3): number => t + p[i]!, 0) / ring.length) as Vec3;
    const n: Vec3 = [0, 0, 0];
    ring.forEach((a: Vec3, k: number): void => {
      const b: Vec3 = ring[(k + 1) % ring.length]!;
      n[0] += (a[1] - b[1]) * (a[2] + b[2]);
      n[1] += (a[2] - b[2]) * (a[0] + b[0]);
      n[2] += (a[0] - b[0]) * (a[1] + b[1]);
    });
    const unit = (v: Vec3): Vec3 => {
      const l: number = Math.hypot(v[0], v[1], v[2]);
      return [v[0] / l, v[1] / l, v[2] / l];
    };
    let out: Vec3 = unit(n);
    // Out of the trunk: the side of the plane away from the section course (X = course, Z = 0).
    if (out[0] * (origin[0] - course) + out[2] * origin[2] < 0) out = [-out[0], -out[1], -out[2]];
    const upDot: number = out[1];
    const up: Vec3 = unit([-upDot * out[0], 1 - upDot * out[1], -upDot * out[2]]);
    const third: Vec3 = [out[1] * up[2] - out[2] * up[1], out[2] * up[0] - out[0] * up[2], out[0] * up[1] - out[1] * up[0]];
    return { origin, axes: [out, up, third] };
  }

  /** World point of a chart point on the S00 field. */
  function world(field: IAutoMovieSolidSurface, chart: [number, number]): Vec3 {
    const p: readonly number[] = field.point !== undefined ? field.point(chart[0], chart[1]) : field.jet(chart[0], chart[1]).p;
    return [p[0]!, p[1]!, p[2]!];
  }

  /** World perimeter of a port map's curve (v = 0) on the field, 128-gon. */
  function length(field: IAutoMovieSolidSurface, map: IAutoMovieConstructionKnownPortSource.IMap): number {
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
