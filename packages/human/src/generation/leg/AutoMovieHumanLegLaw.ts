import { AutoMovieHumanNaturalSpline } from "../../lofting/AutoMovieHumanNaturalSpline";
import { AutoMovieHumanPolarSection } from "../../lofting/AutoMovieHumanPolarSection";
import type { AutoMovieHumanLegConstruction } from "../AutoMovieHumanLegConstruction";
import { AutoMovieHumanLegPrior } from "../AutoMovieHumanLegPrior";
import type { IAutoMovieHumanBodyCalibration } from "../IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLegAnkleSeam } from "./AutoMovieHumanLegAnkleSeam";
import type { AutoMovieHumanLegAxis } from "./AutoMovieHumanLegAxis";
import { AutoMovieHumanLegCrotchRoot } from "./AutoMovieHumanLegCrotchRoot";
import { AutoMovieHumanLegSampling } from "./AutoMovieHumanLegSampling";
import { AutoMovieHumanLegVector } from "./AutoMovieHumanLegVector";

type Vec3 = AutoMovieHumanLegVector.Vec3;
const { dot, smooth, sub } = AutoMovieHumanLegVector;

/**
 * The former fitted law of the leg's section, kept as it was while the
 * pieces that replace it are built and verified: the prior's area-normalized
 * radial shape, a log-radius profile shifted through the ankle ring's radius
 * and the calf, knee and thigh tapes, and a centre line, all in leg fractions
 * between the two rings.
 *
 * Between its ends a section at leg fraction u, 0 at the ankle and 1 at the
 * crotch, is `C(u) + R(u) rho(u, theta)` in its bone's plane. `rho` is the
 * prior's area-normalized radial shape; `R` the prior's log-radius profile in
 * leg lengths, shifted through the ankle ring's radius and the three tapes (a
 * tape's radius is solved against the hull of the prior section it wraps);
 * `C` the prior's centre line, forward by the prior's forward curve and
 * laterally by a line in the leg's length, the hip tape and the
 * masculine-feminine control, the thigh leaning onto the crotch ring's place
 * and the two thighs' inner edges meeting at the midline and not passing it.
 * The ankle ring's difference from the law fades into the leg over its reach.
 *
 * This file is removed when the spans replace the law (the plan's pieces 7 to
 * 13); until then the fractions below are the law's, not landmarks.
 */
export namespace AutoMovieHumanLegLaw {
  /** The fitted law's channels with one person's keys. */
  export interface IFamily {
    /** Station of the ankle ring. */
    bottom: number;

    /** Distance between the rings. */
    length: number;

    /** Ankle ring centre in the canonical plane. */
    ankle: [number, number];

    /** The ankle ring in the canonical frame, world. */
    ankleWorld: Vec3[];

    /** The ring's height off its plane at each phase. */
    ankleLift: number[];

    /** Offset of the law's last centre from the crotch ring's. */
    crotchOffset: [number, number];

    /** Centre the crotch ring is read about. */
    crotchCentre: [number, number];

    /** The tape and control inputs. */
    inputs: AutoMovieHumanLegConstruction.IInputs;

    /** Log-radius profile along the leg. */
    profile: AutoMovieHumanNaturalSpline.ISpline;

    /** Forward place of the centre along the leg. */
    forward: AutoMovieHumanNaturalSpline.ISpline;

    /** The axis's lateral curves. */
    axis: AutoMovieHumanNaturalSpline.ISpline[];

    /** The shape's Fourier channels. */
    shape: AutoMovieHumanNaturalSpline.ISpline[];

    /** The radius correction through the ankle and the three tapes. */
    correction: AutoMovieHumanNaturalSpline.ISpline;

    /** The ankle ring's radius less the law's, at each phase. */
    ankleResidual: number[];
  }

  /** Section of the law before any end residual. */
  export interface IBare {
    /** Centre in the canonical plane, `[x, z]`. */
    centre: [number, number];

    /** Radii at the leg's phases. */
    radii: number[];
  }

  /**
   * Last fraction the law holds alone; over the rest the leg hands over to the
   * crotch ring, a rise of some 60 mm on a body of average height.
   */
  export const LAST_INTERIOR: number = 0.92;

  /** Softness of the thighs' contact at the midline, mm. */
  export const CONTACT: number = 1.5;

  /** Fraction over which the ankle ring's difference from the law fades. */
  export const ANKLE_REACH: number = 0.12;

  /** Fraction where the thigh starts to lean onto the crotch ring's place. */
  export const THIGH_FROM: number = 0.6;

  /** Reach under the crotch ring over which the leg hands over to it. */
  export function reachOf(family: IFamily): number {
    return (1 - LAST_INTERIOR) * family.length;
  }

  /** Read the neighbours' keys and solve this person's radius correction. */
  export function prepare(
    calibration: IAutoMovieHumanBodyCalibration,
    side: "left" | "right",
    sign: 1 | -1,
    inputs: AutoMovieHumanLegConstruction.IInputs,
  ): IFamily {
    const prior: AutoMovieHumanLegPrior.IPrior = AutoMovieHumanLegPrior.PRIOR;

    // Keys in the canonical frame.
    const ankleWorld: Vec3[] = AutoMovieHumanLegAnkleSeam.ring(calibration, side).map((p: Vec3): Vec3 => [p[0], p[1], sign * p[2]]);
    const crotchWorld: Vec3[] = AutoMovieHumanLegCrotchRoot.ring(calibration, side);
    const planar = (ring: readonly Vec3[]): [number, number][] => ring.map((p: Vec3): [number, number] => [p[0], p[2]]);
    const ankle: [number, number][] = planar(ankleWorld);
    const crotch: [number, number][] = crotchWorld.map((p: Vec3): [number, number] => [p[0], sign * p[2]]);
    const ankleSection: AutoMovieHumanPolarSection.ISection = AutoMovieHumanPolarSection.measure(ankle);
    const crotchSection: AutoMovieHumanPolarSection.ISection = AutoMovieHumanPolarSection.measure(crotch);
    const bottom: number = level(ankleWorld);
    const length: number = level(crotchWorld) - bottom;
    if (!(length > 0) || !(inputs.calf > 0) || !(inputs.knee > 0) || !(inputs.thigh > 0))
      throw new Error("A leg needs a positive length and positive tapes");

    // The prior's channels.
    const spline = (values: readonly number[]): AutoMovieHumanNaturalSpline.ISpline => AutoMovieHumanNaturalSpline.create(prior.stations, values);
    const shape: AutoMovieHumanNaturalSpline.ISpline[] = prior.shape[0]!.map(
      (_: number, k: number): AutoMovieHumanNaturalSpline.ISpline => spline(prior.shape.map((row: readonly number[]): number => row[k]!)),
    );
    const profile: AutoMovieHumanNaturalSpline.ISpline = spline(prior.profile);

    // Radius keys: the ankle ring's own radius, then each tape against the
    // hull of the section it wraps.
    const key = (u: number, girth: number, ratio: number): [number, number] => {
      const hull: number = AutoMovieHumanPolarSection.girth(unit(shape, u));
      return [u, Math.log((girth * ratio) / hull / length) - AutoMovieHumanNaturalSpline.evaluate(profile, u)];
    };

    // Above its tape the thigh keeps the tape's correction on the prior's own
    // flare: the crotch ring is the skin's way into the trunk, not a section of
    // the thigh, and only the last reach hands over to it.
    const thigh: [number, number] = key(prior.thigh.station, inputs.thigh, prior.thigh.ratio);
    const keys: [number, number][] = [
      [0, Math.log(ankleSection.radius / length) - AutoMovieHumanNaturalSpline.evaluate(profile, 0)],
      key(prior.calf.station, inputs.calf, prior.calf.ratio),
      key(prior.knee.station, inputs.knee, prior.knee.ratio),
      thigh,
      [LAST_INTERIOR, thigh[1]],
    ];
    const family: IFamily = {
      bottom,
      length,
      ankle: ankleSection.centre,
      ankleWorld,
      ankleLift: [],
      crotchOffset: [0, 0],
      crotchCentre: crotchSection.centre,
      inputs,
      profile,
      forward: spline(prior.forward),
      axis: axisCurves(),
      shape,
      correction: AutoMovieHumanNaturalSpline.create(
        keys.map((k: [number, number]): number => k[0]),
        keys.map((k: [number, number]): number => k[1]),
      ),
      ankleResidual: [],
    };

    // The trunk owns the crotch ring's place, so the thigh leans onto it.
    const reached: IBare = bare(family, LAST_INTERIOR);
    family.crotchOffset = [
      crotchSection.centre[0] + prior.ring.forward * length - reached.centre[0],
      crotchSection.centre[1] + prior.ring.lateral * length - reached.centre[1],
    ];

    // The ankle ring against the bare law, read about the law's own centre:
    // its radius and its height off its plane.
    const start: IBare = bare(family, 0);
    family.ankleResidual = AutoMovieHumanLegAnkleSeam.residual(ankle, start.centre, start.radii);
    family.ankleLift = AutoMovieHumanLegAnkleSeam.lift(ankle, start.centre, ankleWorld, bottom);

    // The crotch ring is read about the law's own last centre: read about its
    // own, a phase would slide round the outline over the last reach.
    family.crotchCentre = bare(family, LAST_INTERIOR).centre;
    return family;
  }

  /** Mean height of a ring. */
  export function level(ring: readonly Vec3[]): number {
    return ring.reduce((s: number, p: Vec3): number => s + p[1], 0) / ring.length;
  }

  /** The ankle centre ahead of the origin, calibration mm. */
  export function forward(inputs: AutoMovieHumanLegConstruction.IInputs): number {
    const line: AutoMovieHumanLegPrior.IAnkle = AutoMovieHumanLegPrior.PRIOR.ankle;
    return (line.offset + line.fat * inputs.fat + line.muscularity * inputs.muscularity) * inputs.scale;
  }

  /** The axis's lateral curves, one per term of the prior's line. */
  export function axisCurves(): AutoMovieHumanNaturalSpline.ISpline[] {
    const prior: AutoMovieHumanLegPrior.IPrior = AutoMovieHumanLegPrior.PRIOR;
    return [prior.lateral.offset, prior.lateral.leg, prior.lateral.hip, prior.lateral.sex].map(
      (values: readonly number[]): AutoMovieHumanNaturalSpline.ISpline => AutoMovieHumanNaturalSpline.create(prior.stations, values),
    );
  }

  /** The axis's place off the midline at fraction u, calibration mm. */
  export function lateral(axis: AutoMovieHumanNaturalSpline.ISpline[], u: number, length: number, inputs: AutoMovieHumanLegConstruction.IInputs): number {
    const value = (i: number): number => AutoMovieHumanNaturalSpline.evaluate(axis[i]!, u);
    return value(0) * inputs.scale + value(1) * length + value(2) * inputs.hip + value(3) * inputs.sex * inputs.scale;
  }

  /** The prior's finest knot pitch, in leg lengths. */
  export function coarsest(): number {
    const s: readonly number[] = AutoMovieHumanLegPrior.PRIOR.stations;
    let least: number = Infinity;
    for (let i: number = 1; i < s.length; i++) least = Math.min(least, s[i]! - s[i - 1]!);
    return least;
  }

  /** Radii of the area-normalized prior shape at uniform phases. */
  export function unit(shape: AutoMovieHumanNaturalSpline.ISpline[], u: number): number[] {
    const f: number[] = shape.map((s: AutoMovieHumanNaturalSpline.ISpline): number => AutoMovieHumanNaturalSpline.evaluate(s, u));
    const raw: number[] = AutoMovieHumanLegSampling.PHASES.map((t: number): number => {
      let v: number = f[0]!;
      for (let k: number = 1; 2 * k < f.length; k++) v += f[2 * k - 1]! * Math.cos(k * t) + f[2 * k]! * Math.sin(k * t);
      return v;
    });
    const area: number = raw.reduce((s: number, v: number): number => s + v * v, 0) * (Math.PI / raw.length);
    const k: number = Math.sqrt(Math.PI / area);
    return raw.map((v: number): number => v * k);
  }

  /** The law's centre and radii at fraction u, canonical frame. */
  export function bare(family: IFamily, u: number): IBare {
    const value = (s: AutoMovieHumanNaturalSpline.ISpline): number => AutoMovieHumanNaturalSpline.evaluate(s, u);
    const L: number = family.length;
    const radii: number[] = unit(family.shape, u);
    const R: number = L * Math.exp(value(family.profile) + value(family.correction));
    const inner: number = R * radii[(3 * AutoMovieHumanLegSampling.ORDER) / 4]!;
    const lean: number = smooth((u - THIGH_FROM) / (LAST_INTERIOR - THIGH_FROM));
    const axis: number = lateral(family.axis, u, L, family.inputs) + family.crotchOffset[1] * lean;

    // The inner edge meets the midline and stays on its own side.
    const edge: number = axis - inner;
    const contact: number = Math.max(edge, 0) + CONTACT * Math.log1p(Math.exp(-Math.abs(edge) / CONTACT));
    return {
      centre: [family.ankle[0] + L * value(family.forward) + family.crotchOffset[0] * lean, contact + inner],
      radii: radii.map((v: number): number => R * v),
    };
  }

  /**
   * World points of the law's section at station s, canonical: in the bone's
   * plane when a frame is given, about the prior's centre at that height, with
   * the ankle ring's difference fading in. Without a frame, the horizontal
   * section at that height.
   */
  export function points(family: IFamily, s: number, frame: AutoMovieHumanLegAxis.IFrame | null): Vec3[] {
    const u: number = (s - family.bottom) / family.length;
    const b: IBare = bare(family, u);
    const low: number = 1 - smooth(u / ANKLE_REACH);
    const f: AutoMovieHumanLegAxis.IFrame = frame ?? {
      origin: [b.centre[0], s, b.centre[1]],
      u: [1, 0, 0],
      v: [0, 0, 1],
      n: [0, 1, 0],
    };
    const centre: Vec3 = [b.centre[0], s, b.centre[1]];
    const cx: number = dot(sub(centre, f.origin), f.u);
    const cz: number = dot(sub(centre, f.origin), f.v);
    return AutoMovieHumanLegSampling.PHASES.map((t: number, m: number): Vec3 => {
      const r: number = b.radii[m]! + low * family.ankleResidual[m]!;
      const h: number = low * family.ankleLift[m]!;
      const x: number = cx + r * Math.cos(t);
      const z: number = cz + r * Math.sin(t);
      return [0, 1, 2].map((c: number): number => f.origin[c]! + x * f.u[c]! + z * f.v[c]! + h * f.n[c]!) as Vec3;
    });
  }
}
