import { AutoMovieHumanHorizontalChain } from "../lofting/AutoMovieHumanHorizontalChain";
import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanNaturalSpline } from "../lofting/AutoMovieHumanNaturalSpline";

import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanMeasurementProtocol as Protocol } from "./AutoMovieHumanMeasurementProtocol";
import { AutoMovieHumanPelvisGuide } from "./AutoMovieHumanPelvisGuide";
import { AutoMovieHumanTrunkPrior } from "./AutoMovieHumanTrunkPrior";
import { AutoMovieHumanTrunkTapes } from "./AutoMovieHumanTrunkTapes";
import { AutoMovieHumanTrunkPolyline } from "./AutoMovieHumanTrunkPolyline";
import { AutoMovieHumanTrunkBoundary } from "./AutoMovieHumanTrunkBoundary";
import { AutoMovieHumanThoracicCourse } from "./AutoMovieHumanThoracicCourse";
import { AutoMovieHumanEventJoin } from "./AutoMovieHumanEventJoin";
import { AutoMovieHumanEventAnchors } from "./AutoMovieHumanEventAnchors";
import { AutoMovieHumanLoftHorizontal } from "../lofting/AutoMovieHumanLoftHorizontal";
import { AutoMovieHumanNeckCourse } from "./AutoMovieHumanNeckCourse";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * The trunk and shoulders generated as one column from the crotch to the neck.
 *
 * A column stands on the midline. At a height its section is one closed form,
 * mirror-symmetric across the midline: a super-ellipse from its widest point
 * forward to the front and backward to the back, with its depth pulled in
 * toward the midline by a groove of its own width on either side. The groove
 * is what parts the breasts, the buttocks and the thighs, closing to a pinch
 * at the crotch; at the bust it deepens with the chest over the underbust.
 * The navel is a pit of its own on the belly's midline.
 *
 * Every measure of the section runs up the column as a natural spline through
 * a local linear regression, so one height leads into the next whatever the
 * tapes do. Width, front and back follow the hip, high hip, waist, underbust
 * and chest tapes each at its own measured rate: a slim waist narrows far more
 * than it flattens. A height between two tapes reads both by its place between
 * them.
 *
 * The rear under the lumbar is the seat's instead: a parabola about the buttock's
 * crest, placed by the hip tape, running into the column's own rear by the
 * lumbar. A single super-ellipse closed on the hip tape stands short of that
 * crest, and no tape reads the crest's place.
 *
 * The ends belong to the neighbours. The crotch's height comes from the leg
 * law, and the column leans over its top to stand under the neck. Across the
 * shoulders an ellipse, the arm's root, joins the column's section: the ring
 * runs down the torso to where the ellipse leaves it, round the outside of the
 * arm and back to the torso, so that the arm and the trunk share one seam. The
 * ellipse keeps its outer edge where the shoulder puts it and always runs back
 * into the torso. Above the armpit the valleys beside it fill in, until the
 * ring is convex across the shoulder.
 */
export namespace AutoMovieHumanTrunkConstruction {
  /** What a trunk reads, in the same millimetres as the calibration. */
  export interface IInputs {
    /** Hip tape. */
    hip: number;

    /** Horizontal thigh tape inherited by each crotch half-loop. */
    thigh: number;

    /** High hip tape. */
    highHip: number;

    /** Waist tape. */
    waist: number;

    /** Underbust tape. */
    underbust: number;

    /** Chest tape. */
    chest: number;

    /** Bust span. */
    bustSpan: number;

    /** Neck base tape. */
    neckBase: number;

    /** Across-shoulder input. */
    acrossShoulder: number;

    /** Biceps tape. */
    bicep: number;

    /** Neck to waist. */
    neckToWaist: number;

    /** Shoulder to bust apex. */
    shoulderToApex: number;

    /** Front interscye length. */
    frontInterscyeLength: number;

    /** Masculine-feminine control. */
    sex: number;

    /** Fat control. */
    fat: number;

    /** Muscularity control. */
    muscularity: number;

    /** Calibration millimetres per world millimetre. */
    scale: number;
  }

  /**
   * Calibration with the trunk's rows replaced, or added when it holds none.
   *
   * @param calibration Calibration holding the neck.
   * @param inputs Tapes in calibration millimetres.
   * @param floor Height of the crotch in calibration millimetres.
   */
  export function apply(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IInputs,
    floor: number,
  ): IAutoMovieHumanBodyCalibration {
    let made: IMade = generate(calibration, inputs, floor);
    const neck: IAutoMovieHumanLoftChain = calibration.chains.find((chain: IAutoMovieHumanLoftChain): boolean => chain.name === "head")!;
    const neckTop: number = neck.layers.at(-1)!.y;
    const boundary: [number, number, number][] = AutoMovieHumanLoftChain.ring(neck, neckTop, Array.from({ length: 128 }, (_: unknown, index: number): number => Math.PI * index / 127));
    const contact: [number, number, number] = boundary.reduce((a: [number, number, number], b: [number, number, number]): [number, number, number] => a[2] >= b[2] ? a : b);
    const span: number = made.chains.find((chain: IAutoMovieHumanLoftChain): boolean => chain.name === "upper")!.layers.at(-1)!.y - floor;
    const chestStation: (value: IMade) => number = (value: IMade): number => {
      const geometry: Protocol.ISite["geometry"] = value.sites.chest!.geometry;
      if (geometry.kind !== "section") throw new Error("The trunk chest must own a physical section");
      return geometry.origin[1];
    };
    const length: (value: IMade) => number = (value: IMade): number => AutoMovieHumanThoracicCourse.read([...value.finished, neck], { station: neckTop, lateral: contact[2] }, { station: chestStation(value), lateral: inputs.bustSpan / 2 }).length;

    // The native Shoulder-to-Apex course ends at the independently supplied
    // half Bust Span. Its arclength is not a vertical displacement. The
    // physical endpoint cannot lie farther below the start than that length.
    let low: number = (contact[1] - inputs.shoulderToApex - floor) / span;
    let high: number = (chestStation(made) - floor) / span;
    if (!(low > 0 && low < 1 && high > low && high < 1)) throw new Error("The thoracic course has no ordered axial domain", { cause: { stage: "axial bracket", chains: ["trunk", "upper", "head"], low, high, floor, span, coordinates: contact, target: inputs.shoulderToApex, units: "mm and normalized station" } });
    const lower: IMade = generate(calibration, inputs, floor, low);
    const lowerLength: number = length(lower);
    if (lowerLength < inputs.shoulderToApex) throw new Error("The thoracic course did not bracket its physical lower endpoint", { cause: { stage: "lower bracket", station: chestStation(lower), observed: lowerLength, expected: inputs.shoulderToApex, deviation: lowerLength - inputs.shoulderToApex, tolerance: 0.01, units: "mm" } });
    for (let iteration: number = 0; length(made) > inputs.shoulderToApex; iteration++) {
      if (iteration === 8) throw new Error("The thoracic course has no upper axial bracket", { cause: { stage: "upper bracket", station: chestStation(made), observed: length(made), expected: inputs.shoulderToApex, deviation: length(made) - inputs.shoulderToApex, tolerance: 0.01, units: "mm" } });
      high = (high + 1) / 2;
      made = generate(calibration, inputs, floor, high);
    }
    for (let iteration: number = 0; iteration < 24; iteration++) {
      const station: number = (low + high) / 2;
      made = generate(calibration, inputs, floor, station);
      const observed: number = length(made);
      if (Math.abs(observed - inputs.shoulderToApex) <= 0.01) break;
      if (observed > inputs.shoulderToApex) low = station;
      else high = station;
      if (iteration === 23) throw new Error("The actual thoracic surface course did not converge", { cause: { stage: "physical course closure", station: chestStation(made), bracket: [low, high], observed, expected: inputs.shoulderToApex, deviation: observed - inputs.shoulderToApex, tolerance: 0.01, units: "mm" } });
    }
    const residuals: object[] = Object.entries(made.sites).flatMap(([key, site]: [string, Protocol.ISite]): object[] => {
      if (site.geometry.kind !== "section" || !(key in inputs)) return [];
      const station: number = site.geometry.origin[1];
      const points: [number, number, number][] = AutoMovieHumanLoftHorizontal.points(made.finished, station, AutoMovieHumanTrunkPrior.PRIOR.samples);
      const observed: number = AutoMovieHumanTrunkTapes.perimeter(points.map((point: [number, number, number]): [number, number] => [point[0], point[2]]));
      const expected: number = inputs[key as "hip" | "highHip" | "waist" | "underbust" | "chest"];
      const deviation: number = observed - expected;
      return !Number.isFinite(deviation) || Math.abs(deviation) > 0.05 ? [{ key, station, coordinates: points[0], observed, expected, deviation, tolerance: 0.05, units: "mm", reason: "The composed model course did not converge; no anatomical or clinical acceptance" }] : [];
    });
    if (residuals.length > 0) throw new Error("The composed trunk courses did not converge", { cause: { stage: "composed model tape closure", chains: ["trunk", "upper"], observed: residuals, expected: "All five original model courses close through actual composition", units: "mm" } });
    const others: IAutoMovieHumanLoftChain[] = calibration.chains.filter(
      (c: IAutoMovieHumanLoftChain): boolean =>
        c.name !== "trunk" && c.name !== "upper",
    );

    // The column is mirror-symmetric, so the legs part exactly on the midline.
    return {
      ...calibration,
      thoracicCourse: { owners: ["trunk", "upper", "head"], from: { station: neckTop, lateral: contact[2] }, to: { station: chestStation(made), lateral: inputs.bustSpan / 2 }, guides: AutoMovieHumanThoracicCourse.read([...made.finished, neck], { station: neckTop, lateral: contact[2] }, { station: chestStation(made), lateral: inputs.bustSpan / 2 }).addresses },
      chains: [...made.chains, ...others],
      measurementSites: { ...calibration.measurementSites, ...made.sites },
      events: AutoMovieHumanEventAnchors.retain(calibration.events.map(
        (
          e: IAutoMovieHumanBodyCalibration.IEvent,
        ): IAutoMovieHumanBodyCalibration.IEvent =>
          e.parent === "trunk" && e.direction === "down"
            ? {
                ...e,
                shared: true,
                splits: [
                  { child: "leg.right", arcs: [[Math.PI, 2 * Math.PI]] },
                  { child: "leg.left", arcs: [[0, Math.PI]] },
                ],
              }
            : e,
      ), made.chains, Object.values(made.sites).flatMap((site: Protocol.ISite): number[] => site.geometry.kind === "section" ? [site.geometry.origin[1]] : [])),
    };
  }

  /** The constructed column and its independently readable model addresses. */
  interface IMade {
    /** Trunk and shoulder surface chains. */
    chains: IAutoMovieHumanLoftChain[];

    /** Private once-composed surfaces used by the dimensional solve; final BodyLaw still composes the raw owners once. */
    finished: IAutoMovieHumanLoftChain[];

    /** Named addresses contain geometry, never a target circumference. */
    sites: Protocol.ISites;
  }

  /** One height's measures. */
  interface ISection {
    /** Half width. */
    width: number;

    /** Forward place of the widest point. */
    middle: number;

    /** Forward-most place. */
    front: number;

    /** Rearmost place. */
    back: number;

    /** Super-ellipse power. */
    power: number;

    /** Midline pull at the front, a share of the depth. */
    frontPull: number;

    /** Half width of the front groove. */
    frontGroove: number;

    /** Midline pull at the back, a share of the depth. */
    backPull: number;

    /** Half width of the back groove. */
    backGroove: number;

    /** The crotch's pull at the front's midline, a share of the depth. */
    crotch: number;

    /** Half width of that pull's flat core, mm: the height above the ring. */
    crotchCore: number;

    /** Softness of the fold at that core's edge, mm. */
    foldSoft: number;

    /** Depth of the navel's pit at this height. */
    pit: number;

    /** Half width of the navel's pit. */
    pitWidth: number;

    /** The breast's rise at this height. */
    bust: number;

    /** The breast's place off the midline. */
    bustPlace: number;

    /** The breast's half width. */
    bustWidth: number;
  }

  /** The chain. */
  function generate(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IInputs,
    floor: number,
    chestStation?: number,
  ): IMade {
    const prior: AutoMovieHumanTrunkPrior.IPrior = AutoMovieHumanTrunkPrior.PRIOR;
    const tapes: number[] = [
      inputs.hip,
      inputs.highHip,
      inputs.waist,
      inputs.underbust,
      inputs.chest,
      inputs.neckBase,
    ];
    for (const tape of tapes)
      if (!(tape > 0)) throw new Error("A trunk needs positive tapes");
    const logs: number[] = tapes.map((v: number): number =>
      Math.log(v / inputs.scale),
    );
    const tape = (share: readonly number[]): number =>
      share.reduce(
        (s: number, w: number, i: number): number => s + w * logs[i]!,
        0,
      );
    const curve = (values: readonly number[]): AutoMovieHumanNaturalSpline.ISpline =>
      AutoMovieHumanNaturalSpline.create(prior.stations, values);
    const size = (measure: AutoMovieHumanTrunkPrior.ISize): number[] =>
      measure.level.map((v: number, k: number): number =>
        Math.exp(
          v +
            measure.sex[k]! * inputs.sex +
            measure.gain[k]! * tape(prior.shares[k]!) +
            measure.fat[k]! * inputs.fat +
            measure.muscularity[k]! * inputs.muscularity,
        ),
      );
    const fairly = (values: readonly number[]): number[] =>
      fair(prior.stations, values);

    // Above the crotch every measure runs fairly up the column; at the crotch
    // the pulls close to a pinch over a few layers, which must stay sharp.
    const above = (values: readonly number[]): number[] => {
      const faired: number[] = fairly(values);
      return values.map((v: number, k: number): number => {
        const w: number = smooth(
          (prior.stations[k]! - FAIR_FROM) / FAIR_RUN,
        );
        return v + w * (faired[k]! - v);
      });
    };

    // The front and back are carried as places, not as depths from the widest
    // point: that point wanders with what a ring's sides happen to do, and a
    // depth smoothed apart from it would print the wander on the skin.
    // The fit read these two places off a different part of the section above
    // the joint, where the arm's arc is left out, so the tables turn at the
    // joint for no anatomical reason, and the more so the further a person's
    // tapes stand from the mean. The wider reach keeps the anatomy's own run
    // and leaves that turn out.
    const width = curve(fairly(size(prior.width).map(Math.log)));
    const front = curve(
      fair(
        prior.stations,
        size(prior.front).map(
          (v: number, k: number): number => prior.middle[k]! + v,
        ),
        MIDDLE_REACH,
      ),
    );
    const back = curve(
      fair(
        prior.stations,
        size(prior.back).map(
          (v: number, k: number): number => prior.middle[k]! - v,
        ),
        MIDDLE_REACH,
      ),
    );
    const middle = curve(fair(prior.stations, prior.middle, MIDDLE_REACH));
    const power = curve(fairly(prior.power));
    // Under the belly the crotch's own law owns the front's pull, so the fitted
    // pull counts only where the measures run fairly. The fit read the pull at
    // the midline, where the male references carry their genitals, which the
    // modelled skin leaves out.
    const pulls: number[] = prior.frontPull.level.map(
      (v: number, k: number): number =>
        v +
        prior.frontPull.sex[k]! * inputs.sex +
        prior.frontPull.bust[k]! * Math.log(inputs.chest / inputs.underbust),
    );
    const frontPull = curve(
      above(pulls).map(
        (v: number, k: number): number =>
          v * smooth((prior.stations[k]! - FAIR_FROM) / FAIR_RUN),
      ),
    );

    // At the crotch the thighs part from the midline: the front stands back by
    // the ring's pull, falling exponentially with the groove's width across
    // the body, and the midline's core widens as fast as the height rises, so
    // the fold runs out from the pubis toward the hip at 45 degrees while the
    // pull further out stays. Measured on f1, the midline's pull reads 1.07,
    // 0.88, 0.70, 0.45 and 0.32 at 0, 5, 10, 20 and 30 mm above the ring, and
    // this law gives 1.07, 0.89, 0.73, 0.51 and 0.35 from the first alone.
    const crotchPull: number = pulls[0]!;

    // The fold's softness, set once the section is known: the larger of the
    // ring's control pitch at the crotch and the rows' spacing where the fold
    // runs, which it crosses at one millimetre out per millimetre up.
    let foldSoft: number = 1;
    const backPull = curve(above(prior.backPull));
    const frontGroove = curve(above(prior.frontGroove));
    const backGroove = curve(above(prior.backGroove));
    const read = (s: AutoMovieHumanNaturalSpline.ISpline, u: number): number =>
      AutoMovieHumanNaturalSpline.evaluate(s, u);
    const b: AutoMovieHumanTrunkPrior.IBust = prior.bust;
    const excess: number =
      ((b.rise + b.sex * inputs.sex) * (inputs.chest - inputs.underbust)) /
      (2 * Math.PI);
    const soft: number = b.soft * inputs.scale;
    const bust: number = soft * Math.log1p(Math.exp(excess / soft));
    const seat: INeck = neckRing(calibration, prior.shoulderOrder);
    const span: number = seat.y - floor;
    const lengths: AutoMovieHumanTrunkPrior.IBodyLengths = prior.bodyLengths;

    // A height is read at the column's own proportions: a longer neck-to-waist
    // lowers the waist, the crotch and the neck staying where they are.
    const waistAt: number = prior.stations[prior.shares.findIndex(
      (s: readonly number[]): boolean => s[WAIST_TAPE] === 1,
    )]!;
    const drop: number = Math.max(
      -MAX_WAIST_DROP,
      Math.min(
        MAX_WAIST_DROP,
        (inputs.neckToWaist - lengths.neckToWaist * inputs.scale) / span,
      ),
    );

    // Two straight runs from the column's ends to the waist, their meeting
    // rounded over the column's fairing reach: left a corner, every measure
    // turned at that one row and printed a line round the waist.
    const sum: number = 1 / waistAt + 1 / (1 - waistAt);
    const difference: number = 1 / (1 - waistAt) - 1 / waistAt;
    const eased = (u: number): number =>
      u +
      drop *
        (1 -
          (sum / 2) * rounded(u - waistAt, FAIR) -
          (difference / 2) * (u - waistAt));

    // Under the lumbar the rear is the seat's own parabola about the buttock's
    // crest, which the hip tape places, and it runs into the column's own rear
    // by the lumbar. Every derivative up to the second is continuous there.
    const seated: AutoMovieHumanTrunkPrior.ISeat = prior.seat;
    const share: number = calibration.stature / span;
    const crestAt: number = share * seated.crest;
    const lumbarAt: number = share * seated.lumbar;
    const rear = (v: number): number => {
      const seat: number =
        ((-seated.depth + seated.bend * ((v - crestAt) / share) ** 2) *
          inputs.hip) /
        inputs.scale;
      return (
        seat +
        fifth((v - crestAt) / (lumbarAt - crestAt)) * (read(back, v) - seat)
      );
    };

    // A longer shoulder-to-apex lowers the breast's apex; a wider front
    // interscye sets the arm's root further back, since that length is the
    // chest between the arms' front creases.
    const apex: number = chestStation === undefined ? b.station : eased(chestStation);
    const rootBack: number =
      INTERSCYE *
      (inputs.frontInterscyeLength -
        lengths.frontInterscyeLength * inputs.scale);
    const measures = (raw: number, scale: number): ISection => {
      const u: number = eased(raw);
      const m: number = read(middle, u) * inputs.scale;
      const f: number = read(front, u) * inputs.scale;
      const a: number = rear(u) * inputs.scale;
      const rise: number = raw * span;
      const groove: number = Math.max(1, read(frontGroove, u)) * inputs.scale;
      return {
        crotch: crotchPull * Math.exp(-rise / groove),
        crotchCore: rise,
        foldSoft,
        width: scale * Math.exp(read(width, u)) * inputs.scale,
        middle: m,
        front: Math.max(m + 1, m + scale * (f - m)),
        back: Math.min(m - 1, m + scale * (a - m)),
        power: read(power, u),
        frontPull: Math.max(0, read(frontPull, u)),
        frontGroove: groove,
        backPull: Math.max(0, read(backPull, u)),
        backGroove: Math.max(1, read(backGroove, u)) * inputs.scale,

        // The pit is read at the rows' own height, which stand close round it,
        // so that a moved waist cannot carry it into a long span.
        pit:
          prior.navel.depth *
          inputs.scale *
          Math.exp(-(((raw - prior.navel.station) / prior.navel.height) ** 2)),
        pitWidth: prior.navel.width * inputs.scale,
        bust: bust * Math.exp(-(((u - apex) / b.height) ** 2)),
        bustPlace: b.place * inputs.bustSpan,
        bustWidth: b.width * inputs.bustSpan,
      };
    };

    // Shape anchors precede closure. The bust's own apex supplies the chest
    // address even when the abdomen projects farther forward on a male body.
    const inverse: (value: number) => number = (value: number): number => {
      let low: number = 0;
      let high: number = 1;
      for (let k: number = 0; k < 40; k++) {
        const mid: number = (low + high) / 2;
        if (eased(mid) < value) low = mid;
        else high = mid;
      }
      return (low + high) / 2;
    };
    const hipAt: number = inverse(crestAt);
    const chestAt: number = inverse(apex);
    const underAt: number = inverse(apex - b.height / Math.SQRT2);
    let naturalAt: number = hipAt;
    let least: number = Infinity;
    for (let k: number = 1; k < 256; k++) {
      const u: number = hipAt + k * (underAt - hipAt) / 256;
      const value: number = girth(outline(measures(u, 1)));
      if (value < least) {
        least = value;
        naturalAt = u;
      }
    }
    const highAt: number = (hipAt + naturalAt) / 2;
    const named: readonly [Protocol.Key, number, number, string][] = [
      ["hip", hipAt, inputs.hip, "Horizontal course at the posterior seat parabola's crest; model convention, not a palpable landmark."],
      ["highHip", highAt, inputs.highHip, "Horizontal course midway between the model hip and natural-waist addresses."],
      ["waist", naturalAt, inputs.waist, "The pre-closure trunk's least taut course between its seat crest and lower bust transition; fixed before sizing."],
      ["underbust", underAt, inputs.underbust, "Lower inflection of the shared Gaussian bust relief, apex minus its height over sqrt(2); no clinical fold equivalence is asserted."],
      ["chest", chestAt, inputs.chest, "Horizontal course through the shared bust relief's apex, independently of abdominal projection."],
    ];
    {
      const pitch: number = 2 * inputs.thigh / prior.order;
      const reach: number = FOLD_REACH * Math.max(1, read(frontGroove, eased(0))) * inputs.scale;
      const rows: number[] = prior.layers.slice(0, prior.joint + 1).map((u: number): number => u * span);
      let gap: number = 0;
      for (let k: number = 1; k < rows.length && rows[k - 1]! < reach; k++)
        gap = Math.max(gap, rows[k]! - rows[k - 1]!);
      foldSoft = FOLD_SAMPLES * Math.max(pitch, gap);
    }
    const rootScale: number = AutoMovieHumanTrunkTapes.scale(
      inputs.thigh,
      (scale: number): [number, number][] => outline(measures(0, scale)),
    );
    const keys: AutoMovieHumanTrunkTapes.IKey[] = [
      { station: 0, girth: girth(outline(measures(0, rootScale))) },
      ...named.map((entry: readonly [Protocol.Key, number, number, string]): AutoMovieHumanTrunkTapes.IKey => ({ station: entry[1], girth: entry[2] })),
      { station: 1, girth: girth(outline(measures(1, 1))) },
    ];
    const section: (u: number) => ISection = (u: number): ISection => {
      const target: number = AutoMovieHumanTrunkTapes.girth(keys, u);
      return measures(u, AutoMovieHumanTrunkTapes.scale(target, (scale: number): AutoMovieHumanTrunkTapes.Point[] => AutoMovieHumanTrunkTapes.mirror(outline(measures(u, scale)))));
    };
    const build: () => IAutoMovieHumanLoftChain[] = (): IAutoMovieHumanLoftChain[] => {
    const top: number = prior.layers.length - 1;
    const roofSection: ISection = section(1);
    const lift: number = seat.x - (roofSection.front + roofSection.back) / 2;
    const place = (u: number): number => lift * smooth((u - LEAN) / (1 - LEAN));
    const height = (u: number): number => floor + u * (seat.y - floor);
    const baseColumn = (u: number): [number, number, number][] => {
      const own: ISection = section(u);
      const half: [number, number][] = outline(own);
      const hull: [number, number][] = outline({
        ...own,
        frontPull: 0,
        backPull: 0,
        crotch: 0,
        bust: 0,
        pit: 0,
      });
      const d: number = place(u);
      return steady(half, hull, prior.order).map(
        (p: [number, number]): [number, number, number] => [
          p[0] + d,
          height(u),
          p[1],
        ],
      );
    };
    const rootRing: [number, number, number][] = baseColumn(0);
    const hipRing: [number, number, number][] = baseColumn(hipAt);
    const column: (u: number) => [number, number, number][] = (u: number): [number, number, number][] => {
      if (u >= highAt) return baseColumn(u);
      if (u <= hipAt)
        return rootRing.map((p: [number, number, number], j: number): [number, number, number] => [
          AutoMovieHumanPelvisGuide.coordinate(p[0], hipRing[j]![0], 0, hipAt, u).value,
          height(u),
          AutoMovieHumanPelvisGuide.coordinate(p[2], hipRing[j]![2], 0, hipAt, u).value,
        ]);
      const w: number = fifth((u - hipAt) / (highAt - hipAt));
      return baseColumn(u).map((p: [number, number, number], j: number): [number, number, number] => [
        hipRing[j]![0] + w * (p[0] - hipRing[j]![0]),
        height(u),
        hipRing[j]![2] + w * (p[2] - hipRing[j]![2]),
      ]);
    };
    const trunkRows: number[] = [...new Set([
      ...prior.layers.slice(0, prior.joint + 1),
      ...named.map((entry: readonly [Protocol.Key, number, number, string]): number => entry[1]).filter((u: number): boolean => u < prior.layers[prior.joint]!),
    ])].sort((a: number, b: number): number => a - b);
    const trunk: IAutoMovieHumanLoftChain = continuous(
      AutoMovieHumanHorizontalChain.build(
        {
          name: "trunk",
          order: prior.order,
          samples: prior.samples,
          rule: prior.rule,
        },
        trunkRows.map(column),
        column(prior.layers[prior.joint + JOINT_REACH]!),
      ),
    );
    const shoulders: IAutoMovieHumanLoftChain = continuous(
      AutoMovieHumanHorizontalChain.build(
        {
          name: "upper",
          order: prior.shoulderOrder,
          samples: prior.shoulderSamples,
          rule: prior.shoulderRule,
        },
        prior.layers
          .slice(prior.joint, top + 1)
          .map((u: number, q: number): [number, number, number][] => {
            const l: AutoMovieHumanTrunkPrior.ILobe = prior.lobes[q]!;
            const d: number = place(u);
            const lobe: IOval = {
              x: l.x * inputs.scale - rootBack,
              z:
                l.z[0]! * inputs.scale +
                l.z[1]! * inputs.acrossShoulder,
              rx: Math.exp(l.sizeX) * inputs.bicep,
              rz: Math.exp(l.sizeZ) * inputs.bicep,
            };
            return joined(
              outline(section(u)),
              lobe,
              prior.arm,
              prior.shoulderOrder,
              1 - smooth((u - prior.layers[prior.joint]!) / PARTING),
              smooth((u - prior.layers[prior.joint]!) / (2 * PARTING)),
              KEEP * (1 - smooth((u - prior.layers[prior.joint]!) / KEEP_RUN)),
              smooth((u - prior.layers[prior.joint]! - FILL_FROM) / FILL_RUN),
            ).map((p: [number, number], m: number): [number, number, number] => {
              // The top of the column settles onto the neck's ring, phase by
              // phase: the ring is not star-shaped about any centre here. Its
              // height stays the layer's own and only takes the ring's tilt,
              // or the last layers would bunch up under the neck.
              const w: number = fifth((u - prior.layers[prior.joint]!) / (1 - prior.layers[prior.joint]!));
              const on: [number, number, number] = seat.ring[m]!;
              const x: number = p[0] + d;
              return [
                x + w * (on[0] - x),
                height(u) + w * (on[1] - seat.y),
                p[1] + w * (on[2] - p[1]),
              ];
            });
          }),
      ),
    );
    // This full boundary has the same periodic basis and chart as the neck.
    // Sampling and inverse-filtering it again introduces a second, displaced
    // source curve even though the emitted boundary inherits the original.
    const neck: IAutoMovieHumanLoftChain = calibration.chains.find((chain: IAutoMovieHumanLoftChain): boolean => chain.name === "head")!;
    return [trunk, AutoMovieHumanTrunkBoundary.attach(neck, shoulders)];
    };

    // Read the same boundary composition that the final body will consume.
    // Only existing upper/trunk children participate in this private solve;
    // limbs retain their own once-only final reconciliation in BodyLaw.
    const composed: (own: IAutoMovieHumanLoftChain[]) => IAutoMovieHumanLoftChain[] = (own: IAutoMovieHumanLoftChain[]): IAutoMovieHumanLoftChain[] => {
      const others: IAutoMovieHumanLoftChain[] = calibration.chains.filter((chain: IAutoMovieHumanLoftChain): boolean => chain.name !== "trunk" && chain.name !== "upper");
      const names: Set<string> = new Set([...own, ...others].map((chain: IAutoMovieHumanLoftChain): string => chain.name));
      const events: IAutoMovieHumanBodyCalibration.IEvent[] = calibration.events.filter((event: IAutoMovieHumanBodyCalibration.IEvent): boolean => names.has(event.parent)).map((event: IAutoMovieHumanBodyCalibration.IEvent): IAutoMovieHumanBodyCalibration.IEvent => ({ ...event, splits: event.splits.filter((split: IAutoMovieHumanBodyCalibration.ISplit): boolean => split.child === "trunk" || split.child === "upper") })).filter((event: IAutoMovieHumanBodyCalibration.IEvent): boolean => event.splits.length > 0);
      return AutoMovieHumanEventJoin.reconcile({ ...calibration, chains: [...own, ...others], events: AutoMovieHumanEventAnchors.retain(events, own, named.map((entry: readonly [Protocol.Key, number, number, string]): number => floor + entry[1] * span)) }).chains.filter((chain: IAutoMovieHumanLoftChain): boolean => chain.name === "trunk" || chain.name === "upper");
    };

    // A candidate whose current breadth alone exceeds its tape cannot be
    // repaired by blindly flattening its centre. Retain that candidate while
    // the outer course solve changes axial placement; this is not a global
    // feasibility verdict. Apply refuses every remaining composed residual.
    let chains: IAutoMovieHumanLoftChain[] = build();
    let finished: IAutoMovieHumanLoftChain[] = composed(chains);
    for (let round: number = 0; round < 16; round++) {
      let worst: number = 0;
      named.forEach((entry: readonly [Protocol.Key, number, number, string], i: number): void => {
        const y: number = floor + entry[1] * span;
        const points: [number, number, number][] = AutoMovieHumanLoftHorizontal.points(finished, y, prior.samples);
        const measured: number = AutoMovieHumanTrunkTapes.perimeter(points.map((p: [number, number, number]): [number, number] => [p[0], p[2]]));
        const breadth: number = Math.max(...points.map((point: [number, number, number]): number => point[2])) - Math.min(...points.map((point: [number, number, number]): number => point[2]));
        if (2 * breadth > entry[2]) return;
        worst = Math.max(worst, Math.abs(measured - entry[2]));
        keys[i + 1]!.girth *= entry[2] / measured;
      });
      if (worst < 0.05) break;
      chains = build();
      finished = composed(chains);
    }
    const sites: Protocol.ISites = {};
    for (const [key, u, _target, definition] of named) {
      const y: number = floor + u * span;
      const owner: IAutoMovieHumanLoftChain = chains.find((chain: IAutoMovieHumanLoftChain): boolean => y >= chain.layers[0]!.y && y <= chain.layers[chain.layers.length - 1]!.y)!;
      sites[key] = { owner: "trunk", basis: "model-convention", pose: "bind", definition, geometry: { kind: "section", origin: AutoMovieHumanLoftChain.axis(owner, y), normal: [0, 1, 0] } };
    }
    const neckChain: IAutoMovieHumanLoftChain = calibration.chains.find((chain: IAutoMovieHumanLoftChain): boolean => chain.name === "head")!;
    const neckTop: number = neckChain.layers[neckChain.layers.length - 1]!.y;
    const contacts: [number, number, number][] = AutoMovieHumanNeckCourse.contacts(AutoMovieHumanLoftChain.ring(neckChain, neckTop, Array.from({ length: 1024 }, (_: unknown, j: number): number => 2 * Math.PI * j / 1024)), AutoMovieHumanLoftChain.axis(neckChain, neckTop));
    sites.neckBase = { owner: "neck", basis: "model-convention", pose: "bind", definition: "The neck owner's upper collar course through its four cardinal contacts; a model course, not inferred cervicale and suprasternale.", geometry: { kind: "course", origin: AutoMovieHumanLoftChain.axis(neckChain, neckTop), normal: [0, 1, 0], front: [1, 0, 0], contacts: [contacts[0]!, contacts[1]!, contacts[2]!, contacts[3]!] } };
    return { chains, sites, finished };
  }

  /** The neck's bottom ring. */
  interface INeck {
    /** Forward centre. */
    x: number;

    /** Mean height. */
    y: number;

    /** The ring at the shoulders' uniform phases. */
    ring: [number, number, number][];
  }

  /** The neck's bottom. */
  function neckRing(
    calibration: IAutoMovieHumanBodyCalibration,
    order: number,
  ): INeck {
    const neck: IAutoMovieHumanLoftChain = calibration.chains.find(
      (c: IAutoMovieHumanLoftChain): boolean => c.name === "head",
    )!;
    const ring: [number, number, number][] = AutoMovieHumanLoftChain.ring(
      neck,
      neck.layers[0]!.y,
      Array.from(
        { length: order },
        (_: unknown, i: number): number => (2 * Math.PI * i) / order,
      ),
    );
    const mean = (c: number): number =>
      ring.reduce(
        (s: number, p: [number, number, number]): number => s + p[c]!,
        0,
      ) / ring.length;
    return { x: mean(0), y: mean(1), ring };
  }

  /** An ellipse in a horizontal plane. */
  interface IOval {
    x: number;
    z: number;
    rx: number;
    rz: number;
  }

  /**
   * The torso's half outline joined with the arm's circle, at uniform phases
   * round the whole ring: the torso from the front to where the circle leaves
   * it, the outer way round the circle, and the torso on to the back.
   */
  function joined(
    half: [number, number][],
    root: IOval,
    arm: readonly [number, number],
    order: number,
    pinch: number,
    free: number,
    keep: number,
    fill: number,
  ): [number, number][] {
    // The arm's root keeps its outer edge where the shoulder puts it, and runs
    // back into the torso however far out that is, so the two always cross.
    const side: number = Math.max(
      ...half.map((p: [number, number]): number => p[1]),
    );
    const outer: number = Math.max(root.z + root.rz, side + keep * root.rz);
    const inner: number = Math.min(root.z - root.rz, side - EMBED * root.rz);
    const lobe: IOval = {
      ...root,
      z: (outer + inner) / 2,
      rz: (outer - inner) / 2,
    };
    const gap = (p: [number, number]): number =>
      Math.hypot((p[0] - lobe.x) / lobe.rx, (p[1] - lobe.z) / lobe.rz) - 1;

    const enter: number = half.findIndex(
      (p: [number, number]): boolean => gap(p) < 0,
    );
    let leave: number = half.length - 1;
    while (leave > 0 && gap(half[leave]!) >= 0) leave--;


    // Toward the neck the circle lies inside the torso and adds nothing.
    if (enter <= 0 || leave >= half.length - 1)
      return uniform(fill > 0 ? filled(half, side) : half, order);
    // Places along the torso's outline, fractional so that a crossing moves
    // smoothly from one layer to the next.
    const place = (i: number, j: number): number => {
      const f: number = gap(half[i]!) / (gap(half[i]!) - gap(half[j]!));
      return i + f * (j - i);
    };
    const widest: number = half.reduce(
      (b: number, p: [number, number], i: number): number =>
        p[1] > half[b]![1] ? i : b,
      0,
    );

    // At the armpit the two crossings are one point, the torso's widest, which
    // they leave slowly going up: a sudden parting would turn into a steep
    // station slope.
    const at0: number = place(enter - 1, enter);
    const at1: number = place(leave, leave + 1);
    const from: number = at0 + pinch * (widest - at0);
    const to: number = at1 + pinch * (widest - at1);
    const read = (x: number): [number, number] => {
      const i: number = Math.min(half.length - 2, Math.floor(x));
      const f: number = x - i;
      return [
        half[i]![0] + f * (half[i + 1]![0] - half[i]![0]),
        half[i]![1] + f * (half[i + 1]![1] - half[i]![1]),
      ];
    };
    const start: [number, number] = read(from);
    const end: [number, number] = read(to);
    const a0: number = Math.atan2(
      (start[1] - lobe.z) / lobe.rz,
      (start[0] - lobe.x) / lobe.rx,
    );
    let a1: number = Math.atan2(
      (end[1] - lobe.z) / lobe.rz,
      (end[0] - lobe.x) / lobe.rx,
    );

    // Front to back past the outside of the arm: the angle rises through +z.
    while (a1 <= a0) a1 += 2 * Math.PI;
    const reach0: number = gap(start);
    const reach1: number = gap(end);
    const front: [number, number][] = [
      ...half.slice(0, Math.ceil(from)),
      start,
    ];
    const back: [number, number][] = [end, ...half.slice(Math.floor(to) + 1)];
    const round: [number, number][] = Array.from(
      { length: RING + 1 },
      (_: unknown, i: number): [number, number] => {
        // The arc starts and ends exactly on the seam's two points.
        const f: number = i / RING;
        const a: number = a0 + (a1 - a0) * f;
        const d: number = 1 + reach0 * (1 - f) ** 6 + reach1 * f ** 6;
        const x: number = lobe.x + d * lobe.rx * Math.cos(a);
        const z: number = lobe.z + d * lobe.rz * Math.sin(a);

        // Where the circle would dip into the torso it runs along its side.
        const side: number = sideAt(half, x);

        // Past the torso's front or back there is no side to stay clear of.
        if (side === -Infinity) return [x, z];
        const floor: number = side + pinch * CLEARANCE;
        const over: number = z - floor;
        return [
          x,
          floor +
            Math.max(over, 0) +
            EASE * Math.log1p(Math.exp(-Math.abs(over) / EASE)),
        ];
      },
    );
    const length = (line: [number, number][]): number =>
      line.reduce(
        (s: number, p: [number, number], i: number): number =>
          i === 0
            ? s
            : s + Math.hypot(p[0] - line[i - 1]![0], p[1] - line[i - 1]![1]),
        0,
      );
    const lengths: number[] = [length(front), length(round), length(back)];
    const total: number = lengths[0]! + lengths[1]! + lengths[2]!;
    const whole: [number, number][] = [...front, ...round, ...back];

    // Above the armpit the valleys between the arm and the torso fill in,
    // until the ring is convex across the shoulder.
    const top: [number, number][] | null =
      fill > 0 ? filled(whole, side) : null;
    const onWhole: (fraction: number) => [number, number] = AutoMovieHumanTrunkPolyline.prepare(whole);
    const onTop: ((fraction: number) => [number, number]) | null = top === null ? null : AutoMovieHumanTrunkPolyline.prepare(top);

    // Low on the shoulders the arm's arc keeps its phases, where the arm's
    // chain takes them; toward the neck the ring runs by plain arclength, as
    // the neck's does.
    return Array.from(
      { length: order },
      (_: unknown, m: number): [number, number] => {
        const t: number = (2 * Math.PI * m) / order;
        const s: number = t <= Math.PI ? t : 2 * Math.PI - t;
        const fixed: number =
          s <= arm[0]
            ? (s / arm[0]) * lengths[0]!
            : s <= arm[1]
              ? lengths[0]! +
                ((s - arm[0]) / (arm[1] - arm[0])) * lengths[1]!
              : lengths[0]! +
                lengths[1]! +
                ((s - arm[1]) / (Math.PI - arm[1])) * lengths[2]!;
        const on: [number, number] = onWhole(
          (fixed + free * ((s / Math.PI) * total - fixed)) / total,
        );
        const over: [number, number] =
          onTop === null ? on : onTop(s / Math.PI);
        const p: [number, number] = [
          on[0] + fill * (over[0] - on[0]),
          on[1] + fill * (over[1] - on[1]),
        ];
        return t <= Math.PI ? p : [p[0], -p[1]];
      },
    );
  }

  /** Length of a tape round a section: the hull of its half outline, doubled. */
  function girth(half: [number, number][]): number {
    const hull: [number, number][] = upperHull(
      [...half].sort(
        (p: [number, number], q: [number, number]): number => q[0] - p[0],
      ),
    );
    let length: number = hull[0]![1] + hull[hull.length - 1]![1];
    for (let i: number = 1; i < hull.length; i++)
      length += Math.hypot(
        hull[i]![0] - hull[i - 1]![0],
        hull[i]![1] - hull[i - 1]![1],
      );
    return 2 * length;
  }

  /** The hull's side away from the midline of points in descending forward place. */
  function upperHull(points: [number, number][]): [number, number][] {
    const hull: [number, number][] = [];
    for (const p of points) {
      while (hull.length >= 2) {
        const o: [number, number] = hull[hull.length - 2]!;
        const c: [number, number] = hull[hull.length - 1]!;
        const turn: number =
          (c[0] - o[0]) * (p[1] - c[1]) - (c[1] - o[1]) * (p[0] - c[0]);
        if (turn > 0) break;
        hull.pop();
      }
      hull.push(p);
    }
    return hull;
  }

  /**
   * A half outline with its lateral run replaced by the convex hull of that
   * run. The midline's grooves stay: the run starts and ends where the outline
   * has left them.
   */
  function filled(line: [number, number][], side: number): [number, number][] {
    const from: number = HULL_FROM * side;
    const first: number = line.findIndex(
      (p: [number, number]): boolean => p[1] > from,
    );
    let last: number = line.length - 1;
    while (last > 0 && line[last]![1] <= from) last--;
    if (first < 0 || last <= first) return line;
    const a: [number, number] = line[first]!;
    const b: [number, number] = line[last]!;
    const run: [number, number][] = line
      .slice(first, last + 1)
      .filter(
        (p: [number, number]): boolean => p[0] <= a[0] && p[0] >= b[0],
      )
      .sort((p: [number, number], q: [number, number]): number => q[0] - p[0]);
    return [
      ...line.slice(0, first),
      ...upperHull(run),
      ...line.slice(last + 1),
    ];
  }

  /** The torso's side at a forward place: the half outline's largest z there. */
  function sideAt(half: [number, number][], x: number): number {
    let z: number = -Infinity;
    for (let i: number = 0; i + 1 < half.length; i++) {
      const a: [number, number] = half[i]!;
      const b: [number, number] = half[i + 1]!;
      if ((a[0] - x) * (b[0] - x) > 0) continue;
      const f: number = (x - a[0]) / (b[0] - a[0] || 1);
      z = Math.max(z, a[1] + f * (b[1] - a[1]));
    }
    return z;
  }

  /** One section's left half, from the front on the midline to the back. */
  function outline(s: ISection): [number, number][] {
    return Array.from(
      { length: RING + 1 },
      (_: unknown, i: number): [number, number] => {
        // The rational form of the super-ellipse. Its trigonometric form runs
        // through the midline with an infinite speed, which left a groove a
        // single span of the ring and ended the crotch's ring in a sharp V.
        const f: number = (2 * i) / RING;
        const forward: boolean = f <= 1;
        const q: number = forward ? f : 2 - f;
        const depth: number = forward ? s.front - s.middle : s.middle - s.back;
        const pull: number = forward ? s.frontPull : s.backPull;
        const groove: number = forward ? s.frontGroove : s.backGroove;
        const n: number = (q ** s.power + (1 - q) ** s.power) ** (1 / s.power);
        const z: number = (s.width * q) / n;
        // The fitted grooves keep the Gaussian they were fitted as. The
        // crotch's front falls away exponentially instead: it stands back from
        // its full depth by 1.07, 0.55, 0.27 and 0.13 of it at 0, 20, 40 and
        // 60 mm, a decay length of 29 mm, where a Gaussian of that width dies
        // by 50 mm and set the front at full depth there, a lobe across the
        // ring. Used for the spine's groove, that profile printed a crease
        // down the whole back.
        // Inside the fold the front is flat across, as the reference's is: a
        // rounded core sloped toward the midline all the way out and made a
        // trough whose wall faced the midline, a dark lobe under raking light.
        // The fold is as soft as the sampling needs: a fold narrower than the
        // ring's pitch or the rows' run printed teeth along it.
        const soft: number = s.foldSoft;
        const away: number = Math.hypot(z, soft) - soft - s.crotchCore;
        const crotch: number = forward
          ? s.crotch *
            Math.exp(-((Math.hypot(away, soft) + away) / 2) / groove)
          : 0;
        const x: number =
          depth *
            ((1 - q) / n) *
            (1 - pull * Math.exp(-((z / groove) ** 2)) - crotch) +
          // The two breasts, so that the relief is even across the midline: one
          // alone keeps its slope there, and the mirror folds it into a corner
          // that runs from the neck to the belly as a stripe.
          (forward
            ? s.bust *
                (Math.exp(-(((z - s.bustPlace) / s.bustWidth) ** 2)) +
                  Math.exp(-(((z + s.bustPlace) / s.bustWidth) ** 2))) -
              s.pit * Math.exp(-((z / s.pitWidth) ** 2))
            : 0);
        return [s.middle + (forward ? x : -x), z];
      },
    );
  }

  /**
   * A half outline as a whole ring, each named place at a fixed phase and the
   * points between them spaced by arclength: the front midline at 0, the
   * widest point at a quarter turn and the rear midline at a half, where the
   * crotch's pinches lie. Arclength round the whole ring slid the phases from
   * layer to layer as the crotch opened; the section's own parameter crowded
   * them at the tip or slid them as the width changed. Anchors hold the places
   * and arclength holds the spacing.
   */
  function steady(
    half: [number, number][],
    hull: [number, number][],
    order: number,
  ): [number, number][] {
    // The spacing is the hull's, without the grooves: a notch closing over a
    // few millimetres changes the outline's length fast, and spacing by it
    // slid the points sideways between rows. The hull changes slowly, and the
    // grooves then move each point only where it already is.
    const widest: number = (half.length - 1) / 2;
    const lengths: number[] = [0];
    for (let i: number = 1; i < hull.length; i++)
      lengths.push(
        lengths[i - 1]! +
          Math.hypot(hull[i]![0] - hull[i - 1]![0], hull[i]![1] - hull[i - 1]![1]),
      );
    const index = (d: number): number => {
      let i: number = 0;
      while (i < hull.length - 2 && lengths[i + 1]! < d) i++;
      return (
        i + (d - lengths[i]!) / Math.max(1e-9, lengths[i + 1]! - lengths[i]!)
      );
    };
    const total: number = lengths[lengths.length - 1]!;
    const middle: number = lengths[widest]!;
    return Array.from(
      { length: order },
      (_: unknown, m: number): [number, number] => {
        const t: number = (2 * m) / order;
        const s: number = t <= 1 ? t : 2 - t;
        const x: number = index(
          s <= 0.5 ? 2 * s * middle : middle + (2 * s - 1) * (total - middle),
        );
        const i: number = Math.min(half.length - 2, Math.floor(x));
        const f: number = x - i;
        const p: [number, number] = [
          half[i]![0] + f * (half[i + 1]![0] - half[i]![0]),
          half[i]![1] + f * (half[i + 1]![1] - half[i]![1]),
        ];
        return t <= 1 ? p : [p[0], -p[1]];
      },
    );
  }

  /** A half outline as a whole ring at uniform sagittal phases. */
  function uniform(half: [number, number][], order: number): [number, number][] {
    const sample: (fraction: number) => [number, number] = AutoMovieHumanTrunkPolyline.prepare(half);
    return Array.from(
      { length: order },
      (_: unknown, m: number): [number, number] => {
        const t: number = (2 * m) / order;
        const p: [number, number] = sample(t <= 1 ? t : 2 - t);
        return t <= 1 ? p : [p[0], -p[1]];
      },
    );
  }
}

/**
 * One person's measure run up the column by local linear regression, each
 * station weighted by the span it stands for. Whatever the tapes do, the skin
 * gets no stripe from where the anchors happen to fall, and unlike a plain mean
 * the ends keep their slope.
 */
function fair(
  stations: readonly number[],
  values: readonly number[],
  reach: number = FAIR,
): number[] {
  const last: number = stations.length - 1;
  return stations.map((s: number): number => {
    let s0: number = 0;
    let s1: number = 0;
    let s2: number = 0;
    let t0: number = 0;
    let t1: number = 0;
    stations.forEach((t: number, j: number): void => {
      const span: number =
        (stations[Math.min(last, j + 1)]! - stations[Math.max(0, j - 1)]!) / 2;
      const d: number = t - s;
      const w: number = span * Math.exp(-((d / reach) ** 2));
      s0 += w;
      s1 += w * d;
      s2 += w * d * d;
      t0 += w * values[j]!;
      t1 += w * d * values[j]!;
    });
    return (s2 * t0 - s1 * t1) / (s0 * s2 - s1 * s1);
  });
}

/** Smoothstep clamped to [0, 1]. */
function smooth(x: number): number {
  const t: number = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

/** Absolute value with its corner rounded over a half width, to the second derivative. */
function rounded(x: number, half: number): number {
  const t: number = x / half;
  if (Math.abs(t) >= 1) return Math.abs(x);
  return (
    half *
    (5 / 16 + (15 / 8) * (t ** 2 / 2 - t ** 4 / 6 + t ** 6 / 30))
  );
}

/** Smootherstep clamped to [0, 1], flat to the second derivative at both ends. */
function fifth(x: number): number {
  const t: number = Math.min(1, Math.max(0, x));
  return t * t * t * (t * (6 * t - 15) + 10);
}

/**
 * A chain's slopes solved so that each coefficient's curvature carries across
 * its rows, its end slopes kept. Three-point slopes leave the Hermite spans
 * meeting at a corner in curvature, which shades as a line at every row and
 * shows at the rows where the skin bends most, the waist first.
 */
function continuous(chain: IAutoMovieHumanLoftChain): IAutoMovieHumanLoftChain {
  const rows: readonly IAutoMovieHumanLoftChain.ILayer[] = chain.layers.map(
    (row: IAutoMovieHumanLoftChain.ILayer, i: number): IAutoMovieHumanLoftChain.ILayer => (i === 0 && chain.name === "trunk") || (i === chain.layers.length - 1 && chain.name === "upper")
      ? { ...row, slopes: row.slopes.map((): number => 0), liftSlopes: row.liftSlopes!.map((): number => 0) }
      : row,
  );
  const last: number = rows.length - 1;
  const solved = (
    pick: (l: IAutoMovieHumanLoftChain.ILayer) => readonly number[],
    ends: (l: IAutoMovieHumanLoftChain.ILayer) => readonly number[],
  ): number[][] => {
    const slopes: number[][] = rows.map((l: IAutoMovieHumanLoftChain.ILayer) => [
      ...ends(l),
    ]);
    const sweep: number[] = new Array<number>(rows.length).fill(0);
    const right: number[][] = rows.map((): number[] => []);
    for (let k: number = 1; k < last; k++) {
      const h0: number = rows[k]!.y - rows[k - 1]!.y;
      const h1: number = rows[k + 1]!.y - rows[k]!.y;
      const lower: number = 1 / h0;
      const upper: number = 1 / h1;
      const pivot: number =
        2 * (lower + upper) - (k > 1 ? lower * sweep[k - 1]! : 0);
      sweep[k] = upper / pivot;
      const here: readonly number[] = pick(rows[k]!);
      const below: readonly number[] = pick(rows[k - 1]!);
      const above: readonly number[] = pick(rows[k + 1]!);
      right[k] = here.map((v: number, i: number): number => {
        const b: number =
          3 * ((v - below[i]!) / (h0 * h0) + (above[i]! - v) / (h1 * h1)) -
          (k === 1 ? lower * slopes[0]![i]! : 0) -
          (k === last - 1 ? upper * slopes[last]![i]! : 0);
        return (b - (k > 1 ? lower * right[k - 1]![i]! : 0)) / pivot;
      });
    }
    for (let k: number = last - 1; k >= 1; k--)
      slopes[k] = right[k]!.map((v: number, i: number): number =>
        k === last - 1 ? v : v - sweep[k]! * slopes[k + 1]![i]!,
      );
    return slopes;
  };
  const section: number[][] = solved(
    (l: IAutoMovieHumanLoftChain.ILayer): readonly number[] => l.coefficients,
    (l: IAutoMovieHumanLoftChain.ILayer): readonly number[] => l.slopes,
  );
  const raised: number[][] = solved(
    (l: IAutoMovieHumanLoftChain.ILayer): readonly number[] => l.lift!,
    (l: IAutoMovieHumanLoftChain.ILayer): readonly number[] => l.liftSlopes!,
  );
  const sectionValues: number[][] = rows.map((row: IAutoMovieHumanLoftChain.ILayer): number[] => row.coefficients);
  const liftValues: number[][] = rows.map((row: IAutoMovieHumanLoftChain.ILayer): number[] => row.lift!);

  /** Both surface channels share the same physical station's second jet. */
  const curvature: (values: readonly number[][], slopes: readonly number[][], k: number) => number[] = (values: readonly number[][], slopes: readonly number[][], k: number): number[] => {
    if ((k === 0 && chain.name === "trunk") || (k === last && chain.name === "upper"))
      return values[k]!.map((): number => 0);
    return values[k]!.map((value: number, i: number): number => {
      if (k === 0) {
        const h: number = rows[1]!.y - rows[0]!.y;
        return 6 * (values[1]![i]! - value) / h ** 2 - (4 * slopes[0]![i]! + 2 * slopes[1]![i]!) / h;
      }
      const h: number = rows[k]!.y - rows[k - 1]!.y;
      return 6 * (values[k - 1]![i]! - value) / h ** 2 + (2 * slopes[k - 1]![i]! + 4 * slopes[k]![i]!) / h;
    });
  };

  return {
    ...chain,
    layers: rows.map(
      (
        l: IAutoMovieHumanLoftChain.ILayer,
        k: number,
      ): IAutoMovieHumanLoftChain.ILayer => ({
        ...l,
        slopes: section[k]!,
        liftSlopes: raised[k]!,

        // The pelvis guide and its copied thigh ring leave with zero first
        // and second transverse derivatives. Quintic rows retain that jet;
        // the remaining rows reproduce their existing C2 cubic intervals.
        curvatures: curvature(sectionValues, section, k),
        liftCurvatures: curvature(liftValues, raised, k),
      }),
    ),
  };
}

/** Samples of a half section or a ring's arc. */
const RING: number = 240;

/**
 * How far the arm's root stands from having its centre at the torso's side,
 * in half widths, at the armpit: the arm stays on the body however wide the
 * chest, and the margin runs out toward the neck.
 */
const KEEP: number = 1.3;

/** Fraction of the column above the armpit over which that margin runs out. */
const KEEP_RUN: number = 0.15;

/** Softness of the arc's rise off the torso's side, mm. */
const EASE: number = 3;

/** Gap kept between the arm's root and the torso's side at the armpit, mm. */
const CLEARANCE: number = 1;

/** How far inside the torso's side the arm's root runs, in its half widths. */
const EMBED: number = 0.25;

/** Index of the waist among the tapes. */
const WAIST_TAPE: number = 2;

/** Largest move of the waist up the column, a fraction of it. */
const MAX_WAIST_DROP: number = 0.08;

/** How far the arm's root moves back per unit of the front interscye. */
const INTERSCYE: number = 0.25;

/**
 * Layers above the joint of the ring that gives the trunk's top its slope. The
 * next layer: a further one averages the skin's curvature into that slope, and
 * the join then turns the difference back as a line across the back.
 */
const JOINT_REACH: number = 1;

/**
 * The crotch fold's softness in sampling pitches: a band about two and a half
 * samples wide, so that each ring and each row carries it whole.
 */
const FOLD_SAMPLES: number = 1.25;

/**
 * Height over which the fold runs, in widths of the front groove: there its
 * pull has fallen to a twentieth.
 */
const FOLD_REACH: number = 3;

/** Reach of a measure's regression up the column, in fractions of it. */
const FAIR: number = 0.05;

/** Reach for the widest point's place, which only shapes the section. */
const MIDDLE_REACH: number = 0.1;

/** Fraction of the column where the pulls start to run fairly. */
const FAIR_FROM: number = 0.05;

/** Fraction of the column over which they come to. */
const FAIR_RUN: number = 0.1;

/** Fraction of the column above the armpit where the valleys start to fill. */
const FILL_FROM: number = 0.03;

/** Fraction of the column over which they fill. */
const FILL_RUN: number = 0.1;

/** Share of the torso's half width where the hull's run starts. */
const HULL_FROM: number = 0.5;

/** Fraction of the column over which the armpit's two crossings part. */
const PARTING: number = 0.1;

/** Fraction of the column where it starts to lean under the neck. */
const LEAN: number = 0.8;
