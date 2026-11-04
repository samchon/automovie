import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanBindingLimb } from "./IAutoMovieHumanBindingLimb";
import type { IAutoMovieHumanBindingPlane } from "./IAutoMovieHumanBindingPlane";
import { AutoMovieHumanLimbCapsule } from "./AutoMovieHumanLimbCapsule";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";
import { AutoMovieHumanSkinStep } from "./AutoMovieHumanSkinStep";

/**
 * The crotch region: where the legs part below the pelvis, and the inner
 * thigh below it.
 *
 * Above the crotch the two sides are one skin, which the midline holds
 * ({@link AutoMovieHumanGroinBinding}). Below it the legs are apart, so the
 * midline's fall is released from the crotch down on the hip's ramp, and the
 * release ends before the knee's ramp begins: a release reaching above the
 * crotch left leg weight on the midline, and one reaching the knee would leave
 * the inner knee on the pelvis.
 */
export namespace AutoMovieHumanCrotchBinding {
  /** Where a thigh has left the crotch, in skin depths at the hip below the hip (convention). */
  export const CROTCH: number = 1.7;

  /** Least half of that release, in skin depths at the hip (convention). */
  export const CROTCH_RAMP: number = 0.6;

  /** Where the release lies. */
  export interface IRelease {
    /** Point where the release is half done, metres. */
    at: Math3D.Vector;

    /** Half of the release, metres. */
    half: number;
  }

  /**
   * The crotch's height: the trunk's lowest skin on the midline.
   *
   * @param calibration The body.
   * @param scale Metres per calibration millimetre.
   * @returns Height in metres, or infinity for a trunk without a midline.
   */
  export function height(
    calibration: IAutoMovieHumanBodyCalibration,
    scale: number,
  ): number {
    const trunk: IAutoMovieHumanBodyCalibration["chains"][number] | undefined =
      calibration.chains.find(
        (c: IAutoMovieHumanBodyCalibration["chains"][number]): boolean =>
          c.name === "trunk",
      );
    let low: number = Infinity;
    if (trunk !== undefined)
      for (const layer of trunk.layers)
        for (const p of AutoMovieHumanLoftChain.ring(trunk, layer.y, PHASES))
          if (Math.abs(p[2]) < BAND) low = Math.min(low, p[1]);
    return low * scale;
  }

  /**
   * A thigh's release before it is placed: a plane `CROTCH` depths down the thigh.
   *
   * @param hip The hip's centre, metres.
   * @param along The thigh's unit direction.
   * @param reach The skin depth the hip's cut is sized by, metres.
   * @returns The release's plane at its least half.
   */
  export function start(
    hip: Math3D.Vector,
    along: Math3D.Vector,
    reach: number,
  ): IAutoMovieHumanBindingPlane {
    return {
      at: Math3D.add(hip, Math3D.times(along, CROTCH * reach)),
      normal: along,
      half: CROTCH_RAMP * reach,
      step: AutoMovieHumanSkinStep.slide,
    };
  }

  /**
   * Place a thigh limb's release below the crotch, from its hip's ramp and
   * its knee's.
   *
   * @param limb The upper leg limb; its `clear` plane is moved and widened.
   * @param crotch The crotch's height, metres; infinity places nothing.
   * @param ramp The hip ramp's half, metres, or undefined when it has none.
   */
  export function place(
    limb: IAutoMovieHumanBindingLimb,
    crotch: number,
    ramp: number | undefined,
  ): void {
    const clear: IAutoMovieHumanBindingPlane | null = limb.clear;
    if (clear === null || !Number.isFinite(crotch)) return;
    const knee: IAutoMovieHumanBindingLimb | undefined = limb.kids.find(
      (k: IAutoMovieHumanBindingLimb): boolean => k.planes.length !== 0,
    );
    const moved: IRelease = release(
      limb.from,
      clear.normal,
      crotch,
      AutoMovieHumanLimbCapsule.length(limb),
      knee === undefined ? 0 : knee.planes[0]!.half,
      ramp ?? clear.half,
      clear.half,
    );
    clear.at = moved.at;
    clear.half = moved.half;
  }

  /**
   * Place a leg's release below the crotch.
   *
   * @param hip The hip's centre, metres.
   * @param along The thigh's unit direction.
   * @param crotch The crotch's height, metres.
   * @param length The thigh's length, metres.
   * @param knee The knee ramp's half, metres.
   * @param ramp The hip ramp's half, metres.
   * @param least The release's least half, metres.
   * @returns The release.
   */
  export function release(
    hip: Math3D.Vector,
    along: Math3D.Vector,
    crotch: number,
    length: number,
    knee: number,
    ramp: number,
    least: number,
  ): IRelease {
    // The crotch's distance down the thigh from the hip's centre, metres; the
    // release starts there (`below + half` is its middle) and its full width
    // fits between the crotch and the knee ramp's start (derived).
    const r: Math3D.Vector = Math3D.sub([hip[0], crotch, 0], hip);
    const below: number = r[0] * along[0] + r[1] * along[1] + r[2] * along[2];
    const room: number = (length - below - knee) / 2;
    const half: number = Math.max(least, Math.min(ramp, room));
    return { at: Math3D.add(hip, Math3D.times(along, below + half)), half };
  }
}

/**
 * Phases sampling the trunk's sections for its midline, finely enough to land
 * on it (convention: 96, under 4 degrees apart, so a symmetric ring lands on
 * the median plane at its front and back).
 */
const PHASES: number[] = Array.from(
  { length: 96 },
  (_: unknown, i: number): number => (2 * Math.PI * i) / 96,
);

/** Distance from the median plane within which a section's point is on the midline, calibration mm (convention). */
const BAND: number = 1;
