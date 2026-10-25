import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanMonotoneCubic } from "../lofting/AutoMovieHumanMonotoneCubic";
import type { IAutoMovieHumanHermiteCurve } from "../lofting/IAutoMovieHumanHermiteCurve";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanBodyGirth } from "./AutoMovieHumanBodyGirth";
import { AutoMovieHumanBodyLandmarks } from "./AutoMovieHumanBodyLandmarks";
import { AutoMovieHumanBodyTree } from "./AutoMovieHumanBodyTree";
import { AutoMovieHumanStretchProfile } from "./AutoMovieHumanStretchProfile";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanBodySpecimen } from "./IAutoMovieHumanBodySpecimen";

/**
 * The field of the measurement law: for every chain and station, the
 * horizontal map a section undergoes, and per chain the new height of a
 * point at a given height.
 *
 * Horizontal maps are `x -> ax x + bx`, `z -> az z + bz`, from three rules:
 *
 * - Own map: a chain scales about its own section centre (its axis) by
 *   ratios interpolated over station by `AutoMovieHumanMonotoneCubic`
 *   through named landmarks and held constant beyond them. The trunk reads
 *   hip, high hip, waist, underbust and chest, the chest anisotropically so
 *   the bust span follows its input while the girth follows the chest (a
 *   flat chest, whose forward-most points lie near the midline, has no
 *   bust span to measure and scales by its girth alone); the
 *   shoulder chain runs from the chest to the neck base, its lateral
 *   extent following the across-shoulder input at the acromion; the neck
 *   takes the neck girth; legs thigh, knee and calf, returning to their
 *   basis size at the ankle; arms biceps, elbow, forearm and wrist; hands
 *   and digits the hand girth; the feet keep their size. The three head
 *   chains share one map over height: the neck girth at the neck, then the
 *   head length front to back, and across the bigonial, bizygomatic and
 *   minimum frontal widths at their heights
 *   (`AutoMovieHumanBodyLandmarks`) and the head breadth at the euryon,
 *   45 mm above eye level. The auricles only move.
 * - Carry: a branch moves rigidly with the point of its parent's map where
 *   it joins, so a wider chest carries the arms outward instead of
 *   bending them.
 * - Continuity: within D = min(40 mm, half the chain) of an event ring the
 *   map blends to the parent's map at that ring with the C1 weight
 *   `1 - smoothstep`, so the inherited ring and the child's first own
 *   rings undergo the same map and stay shared.
 *
 * Lengths move points along their columns, through
 * `AutoMovieHumanStretchProfile`, so every shared ring is moved by the
 * same function from both sides:
 *
 * - The legs and feet scale about the floor so the crotch's share of the
 *   stature is the specimen's times the inseam input ratio; everything
 *   above rises with the crotch.
 * - From the neck base to the menton the neck stretches by the neck-length
 *   ratio, and from the menton to the lower head's top ring (below the
 *   nose) the lower face stretches so the menton-to-eye height follows the
 *   face-height ratio; the middle and upper head rise with it.
 * - Each arm stretches along its own axis from the axillary ring, the
 *   upper arm by the upper-arm-length ratio down to the elbow and the
 *   forearm by the lower-arm-length ratio below it; the hand and digits
 *   move with the wrist.
 *
 * Every ratio, girth, width or length, is the specimen's own measure times
 * the input ratio in stature units, over the same measure of the body the
 * basis shaped, so the shape basis's own change is not counted twice
 * (m1's menton-to-neck-base height came out 46 percent short while the
 * neck rate was the bare input ratio); the generator's stature scale
 * follows. Heights are world
 * heights (`AutoMovieHumanBodyLandmarks`), since the basis lifts sections
 * off their stations.
 * `neckToWaist`, `shoulderToApex` and `frontInterscyeLength` are surface
 * paths over the bust and shoulders that the girths and widths above
 * already fix up to a few millimetres; they are not read.
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

  /** One vermilion span. */
  export type ISpan = IAutoMovieHumanHermiteCurve["spans"][number];

  /** A built field. */
  export interface IField {
    /** Horizontal map of a chain at a station. */
    map: (chain: string, s: number) => IMap;

    /** New height of a point at height y on a chain, mm. */
    height: (chain: string, y: number) => number;

    /**
     * Calibration stature after the field, mm: the old one plus the rise
     * of the vertex. The generator's stature scale divides by it, so the
     * person still reaches the height input.
     */
    stature: number;
  }

  /**
   * Build the field, or null when every read input equals the specimen's
   * and the body is the specimen's own calibration (no change at all).
   *
   * @param specimen The specimen calibration, where landmarks are found.
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

    // Input ratios in stature units: the calibration is the specimen at its
    // own stature and the generator scales it to the person's height
    // afterwards, so a girth or length enters as its share of the height.
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
    const head: IHeadRatios = {
      length: params.head.length / inputs.headLength / stature,
      breadth:
        (params.head.length * params.head.cephalicIndex) /
        100 /
        inputs.headBreadth /
        stature,
      faceHeight: params.head.faceHeight / inputs.faceHeight / stature,
      faceWidth: params.head.faceWidth / inputs.faceWidth / stature,
      mandibular:
        params.head.mandibularWidth / inputs.mandibularWidth / stature,
      frontal:
        params.head.minimumFrontalWidth / inputs.minimumFrontalWidth / stature,
    };
    const read: number[] = [...MEASURES.map(ratio), ...Object.values(head)];
    if (body === specimen && read.every((r: number): boolean => r === 1))
      return null;

    const base: Map<string, IAutoMovieHumanLoftChain> = named(specimen);
    const chains: Map<string, IAutoMovieHumanLoftChain> = named(body);
    const crotch: number = chains.get("trunk")!.layers[0]!.y;
    const cache: ISpecimen = cached(specimen, base, crotch);
    const stations: AutoMovieHumanBodyGirth.IStations = cache.stations;
    const marks: AutoMovieHumanBodyLandmarks.ILandmarks =
      AutoMovieHumanBodyLandmarks.measure(body);

    // Measured ratio: the specimen's girth times the input ratio over the
    // warped body's girth at the same station.
    const measured: (name: string, chain: string, s: number) => number = (
      name: string,
      chain: string,
      s: number,
    ): number =>
      (AutoMovieHumanBodyGirth.at(base.get(chain)!, s) * ratio(name)) /
      AutoMovieHumanBodyGirth.at(chains.get(chain)!, s);

    // Own ratio knots per chain, x and z separately where they differ.
    const knots: Map<string, IKnots> = new Map();
    const iso: (list: [number, number][]) => IKnots = (
      list: [number, number][],
    ): IKnots => ({ x: list, z: list });
    const t: AutoMovieHumanBodyGirth.IStations["trunk"] = stations.trunk;
    const chest: number = measured("chest", "trunk", t.chest);
    const trunk: IAutoMovieHumanLoftChain = chains.get("trunk")!;
    // The bust span exists where the chest has two forward apices; a flat
    // chest's forward-most points lie near the midline (m1: 86 mm against
    // the specimen's 181), so there the chest scales by its girth alone.
    const apices: number = span(trunk, t.chest);
    const bust: [number, number] =
      apices < FLAT * cache.bust
        ? [chest, chest]
        : anisotropic(
            trunk,
            t.chest,
            chest,
            (cache.bust * ratio("bustSpan")) / apices,
          );
    const trunkKnots: [number, number][] = [
      [t.hip, measured("hip", "trunk", t.hip)],
      [t.highHip, measured("highHip", "trunk", t.highHip)],
      [t.waist, measured("waist", "trunk", t.waist)],
      [t.underbust, measured("underbust", "trunk", t.underbust)],
    ];
    knots.set("trunk", {
      x: [...trunkKnots, [t.chest, bust[0]]],
      z: [...trunkKnots, [t.chest, bust[1]]],
    });
    const upper: IAutoMovieHumanLoftChain = chains.get("upper")!;
    const upperTop: number = top(upper);
    const neckBase: number = measured("neckBase", "upper", upperTop - 1);
    knots.set("upper", {
      x: [
        [upper.layers[0]!.y, bust[0]],
        [upperTop, neckBase],
      ],
      z: [
        [upper.layers[0]!.y, bust[1]],
        [
          marks.acromion,
          (cache.marks.shoulder * ratio("acrossShoulder")) / marks.shoulder,
        ],
        [upperTop, neckBase],
      ],
    });
    const neckChain: IAutoMovieHumanLoftChain = chains.get("head")!;
    const neck: number = measured(
      "neck",
      "head",
      (neckChain.layers[0]!.y + top(neckChain)) / 2,
    );
    knots.set("head", iso([[0, neck]]));
    const lower: IAutoMovieHumanLoftChain = chains.get("head.lower")!;
    const headKnots: IKnots = {
      x: [
        [lower.layers[0]!.y + 10, neck],
        [
          marks.heights.gonial,
          (cache.marks.length * head.length) / marks.length,
        ],
      ],
      z: [
        [lower.layers[0]!.y + 10, neck],
        [
          marks.heights.gonial,
          (cache.marks.widths.gonial * head.mandibular) / marks.widths.gonial,
        ],
        [
          marks.heights.zygomatic,
          (cache.marks.widths.zygomatic * head.faceWidth) /
            marks.widths.zygomatic,
        ],
        [
          marks.heights.frontal,
          (cache.marks.widths.frontal * head.frontal) / marks.widths.frontal,
        ],
        [marks.eye + 45, (cache.marks.breadth * head.breadth) / marks.breadth],
      ],
    };
    for (const name of ["head.lower", "head.middle", "head.upper"])
      knots.set(name, headKnots);
    for (const [leg, s] of stations.legs)
      knots.set(
        leg,
        iso([
          // No input measures the ankle; the leg returns to its basis
          // shape there, so the foot, which no input sizes either, meets
          // it unscaled.
          [chains.get(leg)!.layers[0]!.y, 1],
          [s.calf, measured("calf", leg, s.calf)],
          [s.knee, measured("knee", leg, s.knee)],
          [s.thigh, measured("thigh", leg, s.thigh)],
        ]),
      );
    for (const [arm, s] of stations.arms)
      knots.set(
        arm,
        iso([
          [s.wrist, measured("wrist", arm, s.wrist)],
          [s.forearm, measured("forearm", arm, s.forearm)],
          [s.elbow, measured("elbow", arm, s.elbow)],
          [s.bicep, measured("bicep", arm, s.bicep)],
        ]),
      );
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
        if (
          (name.endsWith(`.${side}`) || name.includes(`.${side}.`)) &&
          /^(hand|thumb|finger)\./.test(name)
        )
          knots.set(name, iso([[0, r]]));
    }

    // Heights: legs about the floor, the neck and lower face stretched,
    // everything else risen with the crotch and the face.
    const ring: [number, number, number][] = AutoMovieHumanLoftChain.ring(
      trunk,
      crotch,
      PHASES,
    );
    const current: number =
      ring.reduce(
        (sum: number, p: [number, number, number]): number => sum + p[1],
        0,
      ) / ring.length;
    // The legs scale about the floor by rho and everything above moves up
    // with the crotch: rho c / (H + (rho - 1) c) = P solves to
    // rho = P (H - c) / (c (1 - P)), 1 for the specimen's own inputs.
    const H: number = body.stature;
    const P: number = (crotch / H) * ratio("inseam");
    const rho: number = (P * (H - current)) / (current * (1 - P));
    const lift: number = (rho - 1) * current;
    // World heights: the basis lifts these rings off their stations.
    const neckBottom: number = marks.neck;
    const faceTop: number = marks.face;
    const face: AutoMovieHumanStretchProfile.IProfile =
      AutoMovieHumanStretchProfile.create(
        {
          anchor: neckBottom - 20,
          blend: 6,
          pieces: [
            {
              from: neckBottom,
              to: marks.menton,
              rate:
                ((cache.marks.menton - cache.marks.neck) *
                  ratio("neckLength")) /
                (marks.menton - neckBottom),
            },
            {
              // The whole menton-to-eye change lands below the nose.
              from: marks.menton,
              to: faceTop,
              rate:
                1 +
                ((cache.marks.eye - cache.marks.menton) * head.faceHeight -
                  (marks.eye - marks.menton)) /
                  (faceTop - marks.menton),
            },
          ],
        },
        neckBottom - 20,
        faceTop + 20,
      );
    const legs: Set<string> = AutoMovieHumanBodyTree.descendants(
      body,
      "trunk",
      "down",
    );
    // Arm segments run between the body's own elbow and wrist, found by the
    // specimen's girth rules: the basis moves the elbow along the arm.
    const arms: Map<string, IArm> = new Map();
    const owner: Map<string, IArm> = new Map();
    const elbows: AutoMovieHumanBodyGirth.IStations["arms"] =
      body === specimen
        ? stations.arms
        : AutoMovieHumanBodyGirth.stations(chains, crotch).arms;
    for (const [name, s] of elbows) {
      const own: [number, number] = cache.arms.get(name)!;
      const now: [number, number] = segments(chains.get(name)!, s);
      const arm: IArm = stretch(chains.get(name)!, s.elbow, {
        upper: (own[0] * ratio("upperArmLength")) / now[0],
        lower: (own[1] * ratio("lowerArmLength")) / now[1],
      });
      arms.set(name, arm);
      for (const child of AutoMovieHumanBodyTree.descendants(
        body,
        name,
        "down",
      ))
        owner.set(child, arm);
    }
    const height: (chain: string, y: number) => number = (
      chain: string,
      y: number,
    ): number => {
      if (legs.has(chain)) return rho * y;
      const arm: IArm | undefined = arms.get(chain);
      if (arm !== undefined) return y + lift + arm.at(y)[1];
      const hand: IArm | undefined = owner.get(chain);
      if (hand !== undefined) return y + lift + hand.at(hand.bottom)[1];
      return y + lift + face.displacement(y);
    };

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
      const fixed: boolean = /^(ear|foot|forefoot|toe)\./.test(chain.name);
      const k: IKnots = knots.get(chain.name) ?? iso([[0, 1]]);
      const rx: number = fixed
        ? 1
        : AutoMovieHumanMonotoneCubic.interpolate(k.x, s, 1);
      const rz: number = fixed
        ? 1
        : AutoMovieHumanMonotoneCubic.interpolate(k.z, s, 1);
      // The warp's difference slopes probe just past the end layers, where
      // the axis holds its end value.
      const c: [number, number, number] = AutoMovieHumanLoftChain.axis(
        chain,
        Math.min(top(chain), Math.max(chain.layers[0]!.y, s)),
      );
      const d: [number, number, number] = arms.get(chain.name)?.at(s) ?? [
        0, 0, 0,
      ];
      return {
        ax: rx,
        az: rz,
        bx: c[0] * (1 - rx) + carry[0] + d[0],
        bz: c[2] * (1 - rz) + carry[1] + d[2],
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
        joints.forEach((j: { at: number; map: IMap }, i: number): void => {
          const w: number = weights[i]! * scale;
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
      height,
      stature: height("head.upper", H),
    };
  }
}

/** Head input ratios in stature units. */
interface IHeadRatios {
  length: number;
  breadth: number;
  faceHeight: number;
  faceWidth: number;
  mandibular: number;
  frontal: number;
}

/** Ratio knots `[station, ratio]` of the x and z scales. */
interface IKnots {
  x: [number, number][];
  z: [number, number][];
}

/** An arm's displacement along its own axis. */
interface IArm {
  /** Displacement `[x, y, z]` of the arm's section at station s, mm. */
  at: (s: number) => [number, number, number];

  /** Bottom station, the wrist ring the hand inherits. */
  bottom: number;
}

/** Specimen measures, found once per calibration object. */
interface ISpecimen {
  stations: AutoMovieHumanBodyGirth.IStations;
  marks: AutoMovieHumanBodyLandmarks.ILandmarks;
  bust: number;

  /** Upper-arm and forearm axis lengths per arm chain, mm. */
  arms: Map<string, [number, number]>;
}

/** Bust span share of the specimen's below which a chest is flat. */
const FLAT: number = 0.6;

/**
 * Axis lengths of an arm's upper arm (top ring to elbow) and forearm
 * (elbow to wrist), mm.
 */
function segments(
  chain: IAutoMovieHumanLoftChain,
  s: Record<"bicep" | "elbow" | "forearm" | "wrist", number>,
): [number, number] {
  const a: [number, number, number] = AutoMovieHumanLoftChain.axis(
    chain,
    top(chain),
  );
  const e: [number, number, number] = AutoMovieHumanLoftChain.axis(
    chain,
    s.elbow,
  );
  const w: [number, number, number] = AutoMovieHumanLoftChain.axis(
    chain,
    s.wrist,
  );
  return [
    Math.hypot(a[0] - e[0], a[1] - e[1], a[2] - e[2]),
    Math.hypot(e[0] - w[0], e[1] - w[1], e[2] - w[2]),
  ];
}

/** Body controls the law reads, besides height. */
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
  "inseam",
  "upperArmLength",
  "lowerArmLength",
  "neckLength",
  "acrossShoulder",
  "bustSpan",
];

/** Uniform phases of measured sections. */
const PHASES: number[] = Array.from(
  { length: 128 },
  (_: unknown, i: number): number => (2 * Math.PI * i) / 128,
);

/** Specimen measures by calibration object. */
const SPECIMENS: WeakMap<IAutoMovieHumanBodyCalibration, ISpecimen> =
  new WeakMap();

/** Specimen measures, computed on first use. */
function cached(
  specimen: IAutoMovieHumanBodyCalibration,
  chains: Map<string, IAutoMovieHumanLoftChain>,
  crotch: number,
): ISpecimen {
  let found: ISpecimen | undefined = SPECIMENS.get(specimen);
  if (found === undefined) {
    const stations: AutoMovieHumanBodyGirth.IStations =
      AutoMovieHumanBodyGirth.stations(chains, crotch);
    found = {
      stations,
      marks: AutoMovieHumanBodyLandmarks.measure(specimen),
      bust: span(chains.get("trunk")!, stations.trunk.chest),
      arms: new Map(
        [...stations.arms].map(
          ([name, s]: [
            string,
            Record<"bicep" | "elbow" | "forearm" | "wrist", number>,
          ]): [string, [number, number]] => [
            name,
            segments(chains.get(name)!, s),
          ],
        ),
      ),
    };
    SPECIMENS.set(specimen, found);
  }
  return found;
}

/**
 * Lateral distance between the two forward-most points of a trunk
 * section, one on each side of its centre: the bust span at the chest.
 */
function span(chain: IAutoMovieHumanLoftChain, s: number): number {
  const ring: [number, number, number][] = AutoMovieHumanLoftChain.ring(
    chain,
    s,
    PHASES,
  );
  const c: [number, number, number] = AutoMovieHumanLoftChain.axis(chain, s);
  const apex: (side: 1 | -1) => number = (side: 1 | -1): number => {
    let best: [number, number, number] = c;
    for (const p of ring)
      if (side * (p[2] - c[2]) > 0 && p[0] > best[0]) best = p;
    return best[2];
  };
  return apex(1) - apex(-1);
}

/**
 * x and z scales of a section that make its lateral scale `rz` and its
 * girth scale `girth`: for half extents X and Z, a section's perimeter
 * grows nearly as `ax X + az Z`, so `ax = (girth (X + Z) - rz Z) / X`,
 * held within 0.7 to 1.4.
 */
function anisotropic(
  chain: IAutoMovieHumanLoftChain,
  s: number,
  girth: number,
  rz: number,
): [number, number] {
  const ring: [number, number, number][] = AutoMovieHumanLoftChain.ring(
    chain,
    s,
    PHASES,
  );
  const x: number[] = ring.map((p: [number, number, number]): number => p[0]);
  const z: number[] = ring.map((p: [number, number, number]): number => p[2]);
  const X: number = (Math.max(...x) - Math.min(...x)) / 2;
  const Z: number = (Math.max(...z) - Math.min(...z)) / 2;
  const ax: number = (girth * (X + Z) - rz * Z) / X;
  return [Math.min(1.4, Math.max(0.7, ax)), rz];
}

/**
 * An arm stretched along its own axis from its top (axillary) ring: the
 * upper arm, above the elbow station, by `rates.upper` and the forearm
 * below it by `rates.lower`, blended over 15 mm. The displacement of a
 * station is the integral of `(rate - 1)` times the axis tangent from the
 * top ring down, tabulated at 1 mm.
 */
function stretch(
  chain: IAutoMovieHumanLoftChain,
  elbow: number,
  rates: { upper: number; lower: number },
): IArm {
  const bottom: number = chain.layers[0]!.y;
  const T: number = top(chain);
  const profile: AutoMovieHumanStretchProfile.IProfile =
    AutoMovieHumanStretchProfile.create(
      {
        anchor: T,
        blend: 15,
        pieces: [
          { from: elbow, to: T + 1000, rate: rates.upper },
          { from: bottom - 1000, to: elbow, rate: rates.lower },
        ],
      },
      bottom,
      T,
    );
  const n: number = Math.max(1, Math.ceil(T - bottom));
  const h: number = (T - bottom) / n;
  const table: [number, number, number][] = [[0, 0, 0]];
  for (let i: number = 1; i <= n; i++) {
    // From the top down: table[i] is the displacement at T - i h.
    const s: number = T - (i - 0.5) * h;
    const a: [number, number, number] = AutoMovieHumanLoftChain.axis(
      chain,
      Math.min(T, s + 0.5 * h),
    );
    const b: [number, number, number] = AutoMovieHumanLoftChain.axis(
      chain,
      Math.max(bottom, s - 0.5 * h),
    );
    const k: number = profile.rate(s) - 1;
    const prev: [number, number, number] = table[i - 1]!;
    table.push([
      prev[0] + k * (b[0] - a[0]),
      prev[1] + k * (b[1] - a[1]),
      prev[2] + k * (b[2] - a[2]),
    ]);
  }
  return {
    bottom,
    at: (s: number): [number, number, number] => {
      const t: number = Math.min(n, Math.max(0, (T - s) / h));
      const i: number = Math.min(n - 1, Math.floor(t));
      const f: number = t - i;
      const p: [number, number, number] = table[i]!;
      const q: [number, number, number] = table[i + 1]!;
      return [
        p[0] + f * (q[0] - p[0]),
        p[1] + f * (q[1] - p[1]),
        p[2] + f * (q[2] - p[2]),
      ];
    },
  };
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
