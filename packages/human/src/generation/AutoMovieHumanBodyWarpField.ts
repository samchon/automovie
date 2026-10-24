import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanMonotoneCubic } from "../lofting/AutoMovieHumanMonotoneCubic";
import type { IAutoMovieHumanHermiteCurve } from "../lofting/IAutoMovieHumanHermiteCurve";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanBodyGirth } from "./AutoMovieHumanBodyGirth";
import { AutoMovieHumanBodyTree } from "./AutoMovieHumanBodyTree";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanBodySpecimen } from "./IAutoMovieHumanBodySpecimen";

/**
 * The field of the measurement law: for every chain and station, the
 * horizontal map a section undergoes, and per chain the vertical map.
 *
 * Horizontal maps are `x -> ax x + bx`, `z -> az z + bz`, built from three
 * rules:
 *
 * - Own map: a chain scales about its own section centre (its axis) by the
 *   ratio of its region, interpolated over station by
 *   `AutoMovieHumanMonotoneCubic` through the named girth stations of
 *   `AutoMovieHumanBodyGirth` and held constant beyond them. The trunk
 *   reads hip, high hip, waist, underbust and chest; the shoulder chain
 *   runs from the chest ratio to the neck-base ratio; the neck takes the
 *   neck ratio; legs thigh, knee and calf, returning to their basis size at
 *   the ankle; arms biceps, elbow, forearm and wrist; hands and digits the
 *   hand girth; the feet keep their size. The middle and upper head scale
 *   anisotropically about the head centre by the head length (x) and
 *   breadth (z) ratios, and the lower head changes from the neck's map to
 *   the head's over its lower 40 percent; the auricles only move.
 * - Carry: a branch moves rigidly with the point of its parent's map where
 *   it joins, so a wider chest carries the arms outward instead of
 *   bending them.
 * - Continuity: within D = min(40 mm, half the chain) of an event ring the
 *   map blends to the parent's map at that ring with the C1 weight
 *   `1 - smoothstep`, so the inherited ring and the child's first own
 *   rings undergo the same map and stay shared.
 *
 * Each ratio is the specimen's own girth at that station times the input
 * ratio, over the warped body's girth there. The vertical map scales the
 * legs and feet about the floor so the crotch's share of the stature is
 * the specimen's times the ratio of the inputs' inseam-to-height ratios,
 * and moves everything above the crotch up with it unchanged.
 */
export namespace AutoMovieHumanBodyWarpField {
  /** Horizontal affine map of one station. */
  export interface IMap {
    /** x scale. */
    ax: number;

    /** z scale. */
    az: number;

    /** x offset, mm. */
    bx: number;

    /** z offset, mm. */
    bz: number;
  }

  /** Vertical affine map `y -> scale y + offset`, mm. */
  export interface IVertical {
    /** Scale. */
    scale: number;

    /** Offset, mm. */
    offset: number;
  }

  /** One vermilion span. */
  export type ISpan = IAutoMovieHumanHermiteCurve["spans"][number];

  /** A built field. */
  export interface IField {
    /** Horizontal map of a chain at a station. */
    map: (chain: string, s: number) => IMap;

    /** Vertical map of a chain. */
    vertical: (chain: string) => IVertical;

    /** The head's own map, uniform over the face and vault. */
    head: IMap;

    /**
     * Calibration stature after the vertical map, mm: the old one plus the
     * crotch's rise, since everything above the crotch moves with it. The
     * generator's stature scale divides by it, so the person still reaches
     * the height input.
     */
    stature: number;
  }

  /**
   * Build the field, or null when every read input equals the specimen's
   * and the body is the specimen's own calibration (no change at all).
   *
   * @param specimen The specimen calibration, where named stations are found.
   * @param body The calibration to warp, after the shape basis.
   * @param params The person's inputs.
   * @param inputs The specimen's own inputs.
   */
  export function build(
    specimen: IAutoMovieHumanBodyCalibration,
    body: IAutoMovieHumanBodyCalibration,
    params: IAutoMovieHumanParameters,
    inputs: IAutoMovieHumanBodySpecimen,
  ): IField | null {
    const controls: Record<string, { value: number | null }> = params.body
      .controls as unknown as Record<string, { value: number | null }>;

    // Input ratios of lengths and girths in stature units: the calibration
    // is the specimen at its own stature and the generator scales it to
    // the person's height afterwards, so a girth or length enters as its
    // share of the height.
    const raw: (name: string) => number = (name: string): number => {
      const value: number | null | undefined = controls[name]?.value;
      const own: number | undefined = inputs.controls[name];
      return value === null ||
        value === undefined ||
        own === undefined ||
        !(own > 0)
        ? 1
        : value / own;
    };
    const stature: number = raw("height");
    const ratio: (name: string) => number = (name: string): number =>
      raw(name) / stature;
    const headLength: number = params.head.length / inputs.headLength / stature;
    const headBreadth: number =
      (params.head.length * params.head.cephalicIndex) /
      100 /
      inputs.headBreadth /
      stature;
    const read: number[] = [
      ...MEASURES.map(ratio),
      headLength,
      headBreadth,
      ratio("inseam"),
    ];
    if (body === specimen && read.every((r: number): boolean => r === 1))
      return null;

    const base: Map<string, IAutoMovieHumanLoftChain> = named(specimen);
    const chains: Map<string, IAutoMovieHumanLoftChain> = named(body);
    const crotch: number = chains.get("trunk")!.layers[0]!.y;
    const stations: AutoMovieHumanBodyGirth.IStations = cached(
      specimen,
      base,
      crotch,
    );

    // Measured ratio: the specimen's girth times the input ratio over the
    // warped body's girth at the same station.
    const measured: (name: string, chain: string, s: number) => number = (
      name: string,
      chain: string,
      s: number,
    ): number =>
      (AutoMovieHumanBodyGirth.at(base.get(chain)!, s) * ratio(name)) /
      AutoMovieHumanBodyGirth.at(chains.get(chain)!, s);

    // Own ratio knots per chain.
    const knots: Map<string, [number, number][]> = new Map();
    const t: AutoMovieHumanBodyGirth.IStations["trunk"] = stations.trunk;
    const chest: number = measured("chest", "trunk", t.chest);
    knots.set("trunk", [
      [t.hip, measured("hip", "trunk", t.hip)],
      [t.highHip, measured("highHip", "trunk", t.highHip)],
      [t.waist, measured("waist", "trunk", t.waist)],
      [t.underbust, measured("underbust", "trunk", t.underbust)],
      [t.chest, chest],
    ]);
    const upper: IAutoMovieHumanLoftChain = chains.get("upper")!;
    const upperTop: number = top(upper);
    knots.set("upper", [
      [upper.layers[0]!.y, chest],
      [upperTop, measured("neckBase", "upper", upperTop - 1)],
    ]);
    const neckChain: IAutoMovieHumanLoftChain = chains.get("head")!;
    const neck: number = measured(
      "neck",
      "head",
      (neckChain.layers[0]!.y + top(neckChain)) / 2,
    );
    knots.set("head", [[0, neck]]);
    knots.set("head.lower", [[0, neck]]);
    for (const [leg, s] of stations.legs)
      knots.set(leg, [
        // No input measures the ankle; the leg returns to its basis shape
        // there, so the foot, which no input sizes either, meets it unscaled.
        [chains.get(leg)!.layers[0]!.y, 1],
        [s.calf, measured("calf", leg, s.calf)],
        [s.knee, measured("knee", leg, s.knee)],
        [s.thigh, measured("thigh", leg, s.thigh)],
      ]);
    for (const [arm, s] of stations.arms)
      knots.set(arm, [
        [s.wrist, measured("wrist", arm, s.wrist)],
        [s.forearm, measured("forearm", arm, s.forearm)],
        [s.elbow, measured("elbow", arm, s.elbow)],
        [s.bicep, measured("bicep", arm, s.bicep)],
      ]);
    for (const side of ["left", "right"]) {
      const hand: IAutoMovieHumanLoftChain | undefined = chains.get(
        `hand.${side}.1`,
      );
      if (hand === undefined) continue;
      const r: number = measured(
        "handCircumference",
        hand.name,
        (hand.layers[0]!.y + top(hand)) / 2,
      );
      for (const name of chains.keys())
        if (name.endsWith(`.${side}`) || name.includes(`.${side}.`))
          if (/^(hand|thumb|finger)\./.test(name)) knots.set(name, [[0, r]]);
    }

    // Head size: the specimen's length and breadth times the input ratios,
    // over the warped body's, about the head centre.
    const extent: (
      source: Map<string, IAutoMovieHumanLoftChain>,
      names: string[],
      axis: 0 | 2,
    ) => number = (
      source: Map<string, IAutoMovieHumanLoftChain>,
      names: string[],
      axis: 0 | 2,
    ): number => {
      let best: number = 0;
      for (const name of names) {
        const chain: IAutoMovieHumanLoftChain = source.get(name)!;
        for (let s: number = chain.layers[0]!.y; s <= top(chain); s += 2) {
          const ring: [number, number, number][] = AutoMovieHumanLoftChain.ring(
            chain,
            s,
            PHASES,
          );
          const values: number[] = ring.map(
            (p: [number, number, number]): number => p[axis],
          );
          best = Math.max(best, Math.max(...values) - Math.min(...values));
        }
      }
      return best;
    };
    const kx: number =
      (extent(base, ["head.middle", "head.upper"], 0) * headLength) /
      extent(chains, ["head.middle", "head.upper"], 0);
    const kz: number =
      (extent(base, ["head.upper"], 2) * headBreadth) /
      extent(chains, ["head.upper"], 2);
    const middle: IAutoMovieHumanLoftChain = chains.get("head.middle")!;
    const centre: [number, number, number] = AutoMovieHumanLoftChain.axis(
      middle,
      (middle.layers[0]!.y + top(middle)) / 2,
    );
    const head: IMap = {
      ax: kx,
      az: kz,
      bx: centre[0] * (1 - kx),
      bz: centre[2] * (1 - kz),
    };

    // Vertical: legs and feet about the floor, the rest between the crotch
    // and the vertex.
    const ring: [number, number, number][] = AutoMovieHumanLoftChain.ring(
      chains.get("trunk")!,
      crotch,
      PHASES,
    );
    const current: number =
      ring.reduce(
        (sum: number, p: [number, number, number]): number => sum + p[1],
        0,
      ) / ring.length;
    // The legs scale about the floor by rho and everything above moves up
    // with the crotch, so the torso and head keep their shape; rho makes
    // crotch over stature the specimen's times the inputs' inseam-to-height
    // ratio: rho c / (H + (rho - 1) c) = P solves to
    // rho = P (H - c) / (c (1 - P)), 1 for the specimen's own inputs.
    const H: number = body.stature;
    const P: number = (crotch / H) * ratio("inseam");
    const rho: number = (P * (H - current)) / (current * (1 - P));
    const lift: number = (rho - 1) * current;
    const below: Set<string> = AutoMovieHumanBodyTree.descendants(
      body,
      "trunk",
      "down",
    );
    const vertical: (chain: string) => IVertical = (
      chain: string,
    ): IVertical =>
      below.has(chain) ? { scale: rho, offset: 0 } : { scale: 1, offset: lift };

    // Maps in parent-before-child order.
    const own: (
      chain: IAutoMovieHumanLoftChain,
      s: number,
      carry: [number, number],
    ) => IMap = (
      chain: IAutoMovieHumanLoftChain,
      s: number,
      carry: [number, number],
    ): IMap => {
      if (chain.name === "head.middle" || chain.name === "head.upper")
        return { ...head, bx: head.bx + carry[0], bz: head.bz + carry[1] };
      const r: number =
        /^ear\./.test(chain.name) || /^(foot|forefoot|toe)\./.test(chain.name)
          ? 1
          : AutoMovieHumanMonotoneCubic.interpolate(
              knots.get(chain.name) ?? [[0, 1]],
              s,
              1,
            );
      const c: [number, number, number] = AutoMovieHumanLoftChain.axis(
        chain,
        s,
      );
      const girth: IMap = {
        ax: r,
        az: r,
        bx: c[0] * (1 - r) + carry[0],
        bz: c[2] * (1 - r) + carry[1],
      };
      if (chain.name !== "head.lower") return girth;

      // The lower head runs from the neck, which the neck girth sizes, up
      // through the jaw, lips and nose, which belong to the head the head
      // length and breadth size. It changes from the girth map to the head
      // map with a smoothstep over the lower 40 percent of its stations,
      // about the jaw angle on an adult (a convention of this prototype; no
      // input locates the mandible).
      const bottom: number = chain.layers[0]!.y;
      const u: number = Math.min(
        1,
        Math.max(0, (s - bottom) / (0.4 * (top(chain) - bottom))),
      );
      const w: number = u * u * (3 - 2 * u);
      return {
        ax: (1 - w) * girth.ax + w * head.ax,
        az: (1 - w) * girth.az + w * head.az,
        bx: (1 - w) * girth.bx + w * (head.bx + carry[0]),
        bz: (1 - w) * girth.bz + w * (head.bz + carry[1]),
      };
    };
    const maps: Map<string, (s: number) => IMap> = new Map();
    for (const name of AutoMovieHumanBodyTree.order(body)) {
      const chain: IAutoMovieHumanLoftChain = chains.get(name)!;
      const joints: { at: number; map: IMap }[] = [];
      let carry: [number, number] = [0, 0];
      for (const event of body.events)
        for (const split of event.splits) {
          if (split.child !== name) continue;
          const parent: IAutoMovieHumanLoftChain = chains.get(event.parent)!;
          const sp: number =
            event.direction === "down" ? parent.layers[0]!.y : top(parent);
          const sc: number =
            event.direction === "down" ? top(chain) : chain.layers[0]!.y;
          const m: IMap = maps.get(event.parent)!(sp);
          if (joints.length === 0) {
            const c: [number, number, number] = AutoMovieHumanLoftChain.axis(
              chain,
              sc,
            );
            const self: IMap = own(chain, sc, [0, 0]);
            carry = [
              m.ax * c[0] + m.bx - (self.ax * c[0] + self.bx),
              m.az * c[2] + m.bz - (self.az * c[2] + self.bz),
            ];
          }
          joints.push({ at: sc, map: m });
        }
      const D: number = Math.min(40, (top(chain) - chain.layers[0]!.y) / 2);
      maps.set(name, (s: number): IMap => {
        const m: IMap = own(chain, s, carry);
        const weights: number[] = joints.map(
          (j: { at: number; map: IMap }): number =>
            1 - smooth(Math.abs(s - j.at) / D),
        );
        const total: number = weights.reduce(
          (a: number, b: number): number => a + b,
          0,
        );
        const scale: number = total > 1 ? 1 / total : 1;
        const keep: number = 1 - total * scale;
        const out: IMap = {
          ax: keep * m.ax,
          az: keep * m.az,
          bx: keep * m.bx,
          bz: keep * m.bz,
        };
        joints.forEach((j: { at: number; map: IMap }, k: number): void => {
          const w: number = weights[k]! * scale;
          out.ax += w * j.map.ax;
          out.az += w * j.map.az;
          out.bx += w * j.map.bx;
          out.bz += w * j.map.bz;
        });
        return out;
      });
    }
    return {
      map: (chain: string, s: number): IMap => maps.get(chain)!(s),
      vertical,
      head,
      stature: H + lift,
    };
  }
}

/** Body controls the law reads, besides height and inseam. */
const MEASURES: string[] = [
  "chest",
  "underbust",
  "waist",
  "highHip",
  "hip",
  "neck",
  "neckBase",
  "thigh",
  "knee",
  "calf",
  "bicep",
  "elbow",
  "forearm",
  "wrist",
  "handCircumference",
];

/** Uniform phases of extent sections. */
const PHASES: number[] = Array.from(
  { length: 128 },
  (_: unknown, i: number): number => (2 * Math.PI * i) / 128,
);

/** Named stations of the specimen, found once per calibration object. */
const STATIONS: WeakMap<
  IAutoMovieHumanBodyCalibration,
  AutoMovieHumanBodyGirth.IStations
> = new WeakMap();
function cached(
  specimen: IAutoMovieHumanBodyCalibration,
  chains: Map<string, IAutoMovieHumanLoftChain>,
  crotch: number,
): AutoMovieHumanBodyGirth.IStations {
  let found: AutoMovieHumanBodyGirth.IStations | undefined =
    STATIONS.get(specimen);
  if (found === undefined) {
    found = AutoMovieHumanBodyGirth.stations(chains, crotch);
    STATIONS.set(specimen, found);
  }
  return found;
}

/** Chains by name. */
function named(
  calibration: IAutoMovieHumanBodyCalibration,
): Map<string, IAutoMovieHumanLoftChain> {
  return new Map(
    calibration.chains.map(
      (c: IAutoMovieHumanLoftChain): [string, IAutoMovieHumanLoftChain] => [
        c.name,
        c,
      ],
    ),
  );
}

/** Top station of a chain. */
function top(chain: IAutoMovieHumanLoftChain): number {
  return chain.layers[chain.layers.length - 1]!.y;
}

/** Smoothstep on [0, 1], clamped. */
function smooth(x: number): number {
  const t: number = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}
