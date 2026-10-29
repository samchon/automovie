import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanBodyGirth } from "./AutoMovieHumanBodyGirth";
import { AutoMovieHumanBodyLandmarks } from "./AutoMovieHumanBodyLandmarks";
import { AutoMovieHumanBodyPlacement } from "./AutoMovieHumanBodyPlacement";
import { AutoMovieHumanBodyTree } from "./AutoMovieHumanBodyTree";
import { AutoMovieHumanStretchProfile } from "./AutoMovieHumanStretchProfile";
import { AutoMovieHumanBodyWarpAxis } from "./AutoMovieHumanBodyWarpAxis";
import { AutoMovieHumanBodyWarpMeasures } from "./AutoMovieHumanBodyWarpMeasures";
import type { AutoMovieHumanBodyWarpField } from "./AutoMovieHumanBodyWarpField";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanBodySpecimen } from "./IAutoMovieHumanBodySpecimen";

/** Existing ratio/parent-carry construction, separate from point consumers. */
export namespace AutoMovieHumanBodyWarpBuild {
  /**
   * Retain existing authoring ratios and parent carry while distinguishing
   * source/current measurement addresses and optional regional point maps.
   * A regional extension is considered before the identity fast path.
   */
  export function build(
    specimen: IAutoMovieHumanBodyCalibration,
    body: IAutoMovieHumanBodyCalibration,
    params: IAutoMovieHumanParameters,
    inputs: IAutoMovieHumanBodySpecimen,
    extend?: AutoMovieHumanBodyWarpField.IExtension,
  ): IField | null {
    const diagnostics: IAutoMovieHumanBodyCalibration.IDeformationDiagnostic[] = [];
    const controls: Record<string, { value: number | null; pinned: boolean }> = params.body
      .controls as unknown as Record<string, { value: number | null; pinned: boolean }>;

    // Input ratios in stature units: the calibration is the specimen at its
    // own stature and the generator scales it to the person's height
    // afterwards, so a girth or length enters as its share of the height.
    const raw: (name: string) => number = (name: string): number => {
      const value: number | null | undefined = controls[name]?.value;
      const own: number | undefined = inputs.controls[name];
      if (value !== null && value !== undefined && !(Number.isFinite(value) && value > 0)) {
        diagnostics.push({ name, status: "invalid",
          detail: "Non-positive or non-finite control is not applied." });
        return 1;
      }
      return value === null ||
        value === undefined ||
        own === undefined ||
        !(own > 0)
        ? 1
        : value / own;
    };
    const heightRatio: number = raw("height");
    const ratio: (name: string) => number = (name: string): number =>
      raw(name) / heightRatio;
    const head: IHeadRatios = {
      length: params.head.length / inputs.headLength / heightRatio,
      breadth:
        (params.head.length * params.head.cephalicIndex) /
        100 /
        inputs.headBreadth /
        heightRatio,
      faceHeight: params.head.faceHeight / inputs.faceHeight / heightRatio,
      faceWidth: params.head.faceWidth / inputs.faceWidth / heightRatio,
      mandibular:
        params.head.mandibularWidth / inputs.mandibularWidth / heightRatio,
      frontal:
        params.head.minimumFrontalWidth / inputs.minimumFrontalWidth / heightRatio,
    };
    const read: number[] = [...MEASURES.map(ratio), ...Object.values(head)];
    if (
      body === specimen &&
      extend === undefined &&
      read.every((r: number): boolean => r === 1) && diagnostics.length === 0
    )
      return null;

    const base: Map<string, IAutoMovieHumanLoftChain> = AutoMovieHumanBodyWarpMeasures.named(specimen);
    const chains: Map<string, IAutoMovieHumanLoftChain> = AutoMovieHumanBodyWarpMeasures.named(body);
    const crotch: number = chains.get("trunk")!.layers[0]!.y;
    const cache: ISpecimen = AutoMovieHumanBodyWarpMeasures.cached(
      specimen, base, base.get("trunk")!.layers[0]!.y,
    );
    // Morph preserves material station coordinates. Re-selecting extrema on
    // its changed contour would silently give the same tape a different site.
    const stations: AutoMovieHumanBodyGirth.IStations = cache.stations;
    if (!cache.guided && body !== specimen)
      diagnostics.push({
        name: "trunk.materialCourses", status: "unsupported",
        detail: "Legacy source acquisition sites are carried unchanged; anatomical guide authoring remains incomplete.",
      });
    const marks: AutoMovieHumanBodyLandmarks.ILandmarks =
      AutoMovieHumanBodyLandmarks.measure(body);

    const requests: {
      name: string; chain: string; station: number; target: number;
    }[] = [];

    // Authored/acquisition ratios bind the same named source and current
    // courses, including neck and palm. They are not clinical conversions.
    const measured: (name: string, chain: string, s: number) => number = (
      name: string, chain: string, s: number,
    ): number => {
      const target: number = AutoMovieHumanBodyGirth.at(
        base.get(chain)!,
        AutoMovieHumanBodyWarpMeasures.reference(cache, base, name, chain),
      ) * ratio(name);
      const current: number = AutoMovieHumanBodyGirth.at(chains.get(chain)!, s);
      if (!(Number.isFinite(target) && target > 0 && Number.isFinite(current) &&
        current > 0 && Number.isFinite(target / current))) {
        diagnostics.push({ name, status: "invalid",
          detail: "The requested course overflows or is degenerate; its existing ratio is retained." });
        return 1;
      }
      requests.push({ name, chain, station: s, target });
      return target / current;
    };

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
    const apices: number = AutoMovieHumanBodyWarpMeasures.span(trunk, t.chest);
    const bust: [number, number] =
      apices < FLAT * cache.bust
        ? [chest, chest]
        : AutoMovieHumanBodyWarpMeasures.anisotropic(
            trunk, t.chest, chest,
            (cache.bust * ratio("bustSpan")) / apices,
            {
              girth: controls.chest?.pinned === true &&
                controls.chest.value !== null,
              lateral: controls.bustSpan?.pinned === true &&
                controls.bustSpan.value !== null,
            },
            diagnostics,
          );
    if (apices < FLAT * cache.bust && ratio("bustSpan") !== 1)
      diagnostics.push({
        name: "bustSpan", status: "unsupported",
        detail: "The retained flat-chest branch does not define paired apices.",
      });
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
    const upperTop: number = AutoMovieHumanBodyWarpMeasures.top(upper);
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
      (neckChain.layers[0]!.y + AutoMovieHumanBodyWarpMeasures.top(neckChain)) / 2,
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
        (hand.layers[0]!.y + AutoMovieHumanBodyWarpMeasures.top(hand)) / 2,
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
    const elbows: AutoMovieHumanBodyGirth.IStations["arms"] = stations.arms;
    for (const [name, s] of elbows) {
      const own: [number, number] = cache.arms.get(name)!;
      const now: [number, number] = AutoMovieHumanBodyWarpMeasures.segments(chains.get(name)!, s);
      const arm: IArm = AutoMovieHumanBodyWarpAxis.stretch(chains.get(name)!, s.elbow, {
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

    // Carry attachment placement once. Parent radial size is not an intrinsic
    // child size target; the inherited arc remains the skin boundary owner.
    const maps: Map<string, (s: number) => IMap> = new Map();
    for (const name of AutoMovieHumanBodyTree.order(body)) {
      const chain: IAutoMovieHumanLoftChain = chains.get(name)!;
      const fixed: boolean = /^(ear|foot|forefoot|toe)\./.test(name);
      const k: IKnots = fixed ? iso([[0, 1]]) : knots.get(name) ?? iso([[0, 1]]);
      const advance: (s: number) => [number, number, number] =
        (s: number): [number, number, number] => arms.get(name)?.at(s) ?? [0, 0, 0];
      const unplaced: (s: number) => IMap = AutoMovieHumanBodyPlacement.create(
        chain, k, advance, [0, 0],
      );
      let carry: [number, number] = [0, 0];
      let attached: boolean = false;
      for (const event of body.events)
        for (const split of event.splits) {
          if (split.child !== name || attached) continue;
          const parent: IAutoMovieHumanLoftChain = chains.get(event.parent)!;
          const sp: number = event.direction === "down"
            ? parent.layers[0]!.y : AutoMovieHumanBodyWarpMeasures.top(parent);
          const sc: number = event.direction === "down"
            ? AutoMovieHumanBodyWarpMeasures.top(chain) : chain.layers[0]!.y;
          const m: IMap = maps.get(event.parent)!(sp);
          const c: [number, number, number] = AutoMovieHumanLoftChain.axis(chain, sc);
          const self: IMap = unplaced(sc);
          carry = [
            m.ax * c[0] + m.bx - (self.ax * c[0] + self.bx),
            m.az * c[2] + m.bz - (self.az * c[2] + self.bz),
          ];
          attached = true;
        }
      maps.set(name, AutoMovieHumanBodyPlacement.create(chain, k, advance, carry));
    }
    const stature: number = height("head.upper", H);
    const requestedHeight: number | null = params.body.controls.height.value;
    const physicalHeight: number = requestedHeight !== null &&
      Number.isFinite(requestedHeight) && requestedHeight > 0
      ? requestedHeight : inputs.controls.height!;
    const parent: AutoMovieHumanBodyWarpField.IPointMap = (
      chain: string, station: number,
      p: readonly [number, number, number],
    ): [number, number, number] => {
      const m: IMap = maps.get(chain)!(station);
      return [
        m.ax * p[0] + m.bx,
        height(chain, p[1]),
        m.az * p[2] + m.bz,
      ];
    };
    return {
      map: (chain: string, s: number): IMap => maps.get(chain)!(s),
      height,
      point: extend === undefined
        ? parent
        : extend(parent, stature / physicalHeight),
      courses: (chain: string): readonly number[] => {
        const k: IKnots | undefined = knots.get(chain);
        return [...new Set([
          ...requests.filter(
            (r: { chain: string }): boolean => r.chain === chain,
          ).map((r: { station: number }): number => r.station),
          ...(k === undefined ? [] : [...k.x, ...k.z].map(
            (v: [number, number]): number => v[0],
          )),
        ])];
      },
      calibrationPerPhysicalMm: stature / physicalHeight,
      requests,
      diagnostics,
      retained: new Set<string>(),
      stature,
    };
  }
}

/** The existing positive-side and negative-side ratio knots. */
interface IKnots {
  x: [number, number][];
  z: [number, number][];
}
/** Existing head authoring/acquisition ratios; not clinical landmarks. */
interface IHeadRatios {
  length: number;
  breadth: number;
  faceHeight: number;
  faceWidth: number;
  mandibular: number;
  frontal: number;
}
/** Existing field construction shape. */
type IMap = AutoMovieHumanBodyWarpField.IMap;
/** Existing field result. */
type IField = AutoMovieHumanBodyWarpField.IField;
/** Existing arm-axis displacement. */
type IArm = AutoMovieHumanBodyWarpAxis.IArm;
/** Source measures held per source calibration. */
type ISpecimen = AutoMovieHumanBodyWarpMeasures.ISpecimen;
/** Existing measurement names. */
const MEASURES: string[] = AutoMovieHumanBodyWarpMeasures.MEASURES;
/** Existing section sample phases. */
const PHASES: number[] = AutoMovieHumanBodyWarpMeasures.PHASES;
/** Retained flat-chest policy, not a new independent-span guarantee. */
const FLAT: number = 0.6;
