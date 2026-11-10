import type {
  AutoMovieConstructionNode,
  AutoMovieConstructionParameter,
  AutoMovieConstructionWidth,
  IAutoMovieConstructionKnot,
  IAutoMovieConstructionOutline,
  IAutoMovieConstructionView,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Analytic solids written as construction trees, for the construction
 * spec tests: each view part is a closed form whose sections, girths and
 * meetings have exact answers ({@link ConstructionShapes.Oracle}), in
 * metres in the construction's frame.
 *
 * Every part's outline knots stand at its stations and carry the closed
 * form's value there, so a section at a knot station has an exact expected
 * box; the fullness is the ellipse's conic shoulder `sqrt(2) - 1`, so every
 * section is the ellipse inscribed in its box.
 */
export namespace ConstructionShapes {
  /** The conic shoulder of the ellipse. */
  export const ELLIPSE: number = Math.SQRT2 - 1;

  /** A frame: an origin and two unit chart axes, the stations advancing along `v x u`. */
  export interface IFrame {
    /** The axis point at station 0, metres. */
    origin: IAutoMovieVector3;

    /** The chart's first axis, unit. */
    u: IAutoMovieVector3;

    /** The chart's second axis, unit and square to `u`. */
    v: IAutoMovieVector3;
  }

  /** The frame of a part along `+z`: `u = +x`, `v = +y`, so `v x u = -z`; stations advance along `-z`. */
  export const DOWN: IFrame = {
    origin: { x: 0, y: 0, z: 0 },
    u: { x: 1, y: 0, z: 0 },
    v: { x: 0, y: 1, z: 0 },
  };

  /**
   * A view part whose four outlines are given functions of the station,
   * knotted at every station, its fullness the ellipse's shoulder.
   *
   * @param name Part name.
   * @param frame Its straight axis.
   * @param stations Its stations, metres, strictly increasing.
   * @param half Half extents `[+u, +v, -u, -v]` at a station, metres, each positive (0 at a pole's station).
   * @param pole Which ends close in a point.
   */
  export function part(
    name: string,
    frame: IFrame,
    stations: number[],
    half: (s: number) => [number, number, number, number],
    pole: IAutoMovieConstructionView["pole"],
  ): IAutoMovieConstructionView {
    const outline: (
      g: number,
      sign: 1 | -1,
    ) => IAutoMovieConstructionOutline = (
      g: number,
      sign: 1 | -1,
    ): IAutoMovieConstructionOutline => ({
      knots: stations.map(
        (s: number, i: number): IAutoMovieConstructionKnot => ({
          site: `${name} ${i}`,
          station: s,
          value: sign * half(s)[g]!,
        }),
      ),
    });
    return {
      type: "view",
      name,
      axis: { type: "straight", origin: frame.origin, u: frame.u, v: frame.v },
      stations: [...stations],
      front: { positive: outline(0, 1), negative: outline(2, -1) },
      side: { positive: outline(1, 1), negative: outline(3, -1) },
      fullness: {
        type: "shoulder",
        shoulder: {
          knots: [stations[0]!, stations[stations.length - 1]!].map(
            (s: number, i: number): IAutoMovieConstructionKnot => ({
              site: `${name} shoulder ${i}`,
              station: s,
              value: ELLIPSE,
            }),
          ),
        },
        departures: null,
      },
      pole,
      order: 16,
      samples: 64,
    };
  }

  /** A circular cylinder of radius `r` from station 0 to `length`, open at both ends. */
  export function cylinder(
    name: string,
    frame: IFrame,
    r: number,
    length: number,
    count: number = 9,
  ): IAutoMovieConstructionView {
    return part(
      name,
      frame,
      uniform(0, length, count),
      (): [number, number, number, number] => [r, r, r, r],
      "open",
    );
  }

  /**
   * An ellipsoid of half axes `a` along `u`, `b` along `v` and `c` along the
   * stations, centred at station 0, closed at both ends: its section at
   * station `s` the ellipse of half axes `a q` and `b q`, `q = sqrt(1 - s^2 / c^2)`.
   */
  export function ellipsoid(
    name: string,
    frame: IFrame,
    a: number,
    b: number,
    c: number,
    count: number = 17,
  ): IAutoMovieConstructionView {
    return part(
      name,
      frame,
      uniform(-c, c, count),
      (s: number): [number, number, number, number] => {
        const q: number = Math.sqrt(Math.max(0, 1 - (s * s) / (c * c)));
        return [a * q, b * q, a * q, b * q];
      },
      "both",
    );
  }

  /** A join node. */
  export function join(
    kind: "merge" | "diff",
    name: string,
    host: AutoMovieConstructionNode,
    part: AutoMovieConstructionNode,
    seed: {
      partFace: string;
      hostFace: string;
      part: [number, number];
      host: [number, number];
    },
    widths: {
      part: AutoMovieConstructionWidth;
      host: AutoMovieConstructionWidth;
    },
    parameter: AutoMovieConstructionParameter = { type: "phase" },
  ): AutoMovieConstructionNode {
    return {
      type: "join",
      kind,
      name,
      host,
      part,
      seed: { type: "point", ...seed },
      parameter,
      partWidth: widths.part,
      hostWidth: widths.host,
      continuity: "G2",
      count: 48,
      rows: 4,
      tolerance: 1e-12,
      grazing: 0.05,
    };
  }

  /**
   * A four-part assembly at scale `k` (metres times `k`): a beam of radius
   * 0.03 along `+x`, a post of radius 0.015 along `+z` merged onto it, a
   * finger of radius 0.005 along `+y` at height 0.06 merged onto the post,
   * and a nail of radius 0.002 along `+z` at the finger's station 0.03
   * merged onto the finger, each chord a third of its part's radius. Each
   * seed is the closed form's meeting point at the part's phase where its
   * curve starts.
   *
   * @param k Scale of every length.
   * @param nested `left` builds `merge(merge(merge(beam, post), finger), nail)`; `right` builds `merge(beam, merge(post, merge(finger, nail)))`, the same solid grouped from the tip.
   */
  export function assembly(
    k: number,
    nested: "left" | "right",
  ): AutoMovieConstructionNode {
    const beam: IAutoMovieConstructionView = cylinder(
      "beam",
      {
        origin: { x: -0.1 * k, y: 0, z: 0 },
        u: { x: 0, y: 0, z: 1 },
        v: { x: 0, y: 1, z: 0 },
      },
      0.03 * k,
      0.2 * k,
    );
    const post: IAutoMovieConstructionView = cylinder(
      "post",
      {
        origin: { x: 0, y: 0, z: 0 },
        u: { x: 0, y: 1, z: 0 },
        v: { x: 1, y: 0, z: 0 },
      },
      0.015 * k,
      0.08 * k,
    );
    const finger: IAutoMovieConstructionView = cylinder(
      "finger",
      {
        origin: { x: 0, y: 0, z: 0.06 * k },
        u: { x: 1, y: 0, z: 0 },
        v: { x: 0, y: 0, z: 1 },
      },
      0.005 * k,
      0.04 * k,
    );
    const nail: IAutoMovieConstructionView = cylinder(
      "nail",
      {
        origin: { x: 0, y: 0.03 * k, z: 0.06 * k },
        u: { x: 0, y: 1, z: 0 },
        v: { x: 1, y: 0, z: 0 },
      },
      0.002 * k,
      0.02 * k,
    );
    const chord: (r: number) => {
      part: AutoMovieConstructionWidth;
      host: AutoMovieConstructionWidth;
    } = (
      r: number,
    ): {
      part: AutoMovieConstructionWidth;
      host: AutoMovieConstructionWidth;
    } => ({
      part: { type: "chord", value: (r / 3) * k },
      host: { type: "chord", value: (r / 3) * k },
    });

    // Seeds: the post's phase pi / 2 point (r, 0, R) on the beam; the finger's phase 0 point (0.005, sqrt(0.015^2 - 0.005^2), 0.06) on the post; the nail's phase 0 point (0, 0.032, 0.065) on the finger.
    const lean: number = Math.sqrt(0.015 ** 2 - 0.005 ** 2);
    const seeds: {
      post: [string, [number, number], [number, number]];
      finger: [string, [number, number], [number, number]];
      nail: [string, [number, number], [number, number]];
    } = {
      post: [
        "beam",
        [(0.03 + 0.001) * k, Math.PI / 2],
        [(0.1 + 0.015) * k, 0.01],
      ],
      finger: [
        "post",
        [(lean + 0.001) * k, 0],
        [0.06 * k, Math.atan2(0.005, lean) + 0.01],
      ],
      nail: ["finger", [0.006 * k, 0], [0.032 * k, Math.PI / 2 + 0.01]],
    };
    const merge: (
      name: string,
      host: AutoMovieConstructionNode,
      part: AutoMovieConstructionNode,
      face: "post" | "finger" | "nail",
      r: number,
    ) => AutoMovieConstructionNode = (
      name: string,
      host: AutoMovieConstructionNode,
      part: AutoMovieConstructionNode,
      face: "post" | "finger" | "nail",
      r: number,
    ): AutoMovieConstructionNode =>
      join(
        "merge",
        name,
        host,
        part,
        {
          partFace: face,
          hostFace: seeds[face][0],
          part: seeds[face][1],
          host: seeds[face][2],
        },
        chord(r),
      );
    return nested === "left"
      ? merge(
          "blend.nail",
          merge(
            "blend.finger",
            merge("blend.post", beam, post, "post", 0.015),
            finger,
            "finger",
            0.005,
          ),
          nail,
          "nail",
          0.002,
        )
      : merge(
          "blend.post",
          beam,
          merge(
            "blend.finger",
            post,
            merge("blend.nail", finger, nail, "nail", 0.002),
            "finger",
            0.005,
          ),
          "post",
          0.015,
        );
  }

  /** `count` uniform values from `a` to `b`. */
  export function uniform(a: number, b: number, count: number): number[] {
    return Array.from(
      { length: count },
      (_: unknown, i: number): number => a + ((b - a) * i) / (count - 1),
    );
  }

  /** Closed forms the spec tests compare with. */
  export namespace Oracle {
    /**
     * The ellipse's perimeter, exact to rounding by the arithmetic-geometric
     * mean: `2 pi (a^2 - sum_n 2^(n-1) c_n^2) / AGM(a, b)` with `c_0^2 = a^2 - b^2`
     * and `c_(n+1) = (a_n - b_n) / 2`; a circle gives `2 pi a`.
     */
    export function perimeter(a: number, b: number): number {
      let an: number = Math.max(a, b);
      let bn: number = Math.min(a, b);
      let sum: number = 0.5 * (an * an - bn * bn);
      let power: number = 0.5;
      for (let i: number = 0; i < 40 && Math.abs(an - bn) > 1e-15 * an; i++) {
        const c: number = (an - bn) / 2;
        const next: number = (an + bn) / 2;
        bn = Math.sqrt(an * bn);
        an = next;
        power *= 2;
        sum += power * c * c;
      }
      return (2 * Math.PI * (Math.max(a, b) ** 2 - sum)) / an;
    }

    /**
     * The Steinmetz curve where a cylinder of radius `r` along `z` meets a
     * cylinder of radius `R >= r` along `x`, both through the origin, on the
     * side `z > 0`: `(r cos t, r sin t, sqrt(R^2 - r^2 sin^2 t))`.
     */
    export function steinmetz(
      r: number,
      R: number,
      t: number,
    ): IAutoMovieVector3 {
      return {
        x: r * Math.cos(t),
        y: r * Math.sin(t),
        z: Math.sqrt(R * R - r * r * Math.sin(t) ** 2),
      };
    }

    /** Signed distance of a point from a sphere's surface, metres: positive outside. */
    export function sphere(
      p: IAutoMovieVector3,
      centre: IAutoMovieVector3,
      R: number,
    ): number {
      return Math.hypot(p.x - centre.x, p.y - centre.y, p.z - centre.z) - R;
    }
  }
}
