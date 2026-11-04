import type { IAutoMovieHumanEar } from "../../structures/head/IAutoMovieHumanEar";
import { AutoMovieHumanEarPlace } from "../AutoMovieHumanEarPlace";
import { AutoMovieHumanHeadPrior } from "../AutoMovieHumanHeadPrior";
import type { IAutoMovieHumanHeadLandmarks } from "../IAutoMovieHumanHeadLandmarks";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadMassPart } from "./AutoMovieHumanHeadMassPart";

/**
 * One auricle's own frame (`docs/techniques/ear-pieces.md`): `n` the head's
 * outward side at the tragion, `a` the ear's long axis leaning back from the
 * vertical by Banks and Cheney's 15 to 20 degrees (17.5), `b` forward square
 * to both; superaurale its published height over the tragion (or subaurale
 * at the subnasale's height under the tragion),
 * superaurale the ear length up the long axis from it; the rim's centre at
 * its published place behind the skull's centre
 * (`AutoMovieHumanEarPlace.FORWARD`, a share of the head length), the
 * auricle's chord its breadth across. The rims and hollows of the prior's
 * rows are written for a 31 mm ear and scale with the ear's length.
 */
export namespace AutoMovieHumanHeadEarFrame {
  /** An auricle's frame and sizes, calibration mm. */
  export interface IFrame {
    /** The auricle's centre, midway along its long axis and its chord, on the head's side. */
    centre: [number, number, number];

    /** Outward from the head. */
    n: [number, number, number];

    /** Up the long axis. */
    a: [number, number, number];

    /** Forward along the chord. */
    b: [number, number, number];

    /** Ear length sa-sba. */
    length: number;

    /** Ear breadth. */
    breadth: number;

    /** Protrusion of the rim from the head. */
    protrusion: number;

    /** Millimetres of this ear per millimetre of the prior's 31 mm ear. */
    scale: number;
  }

  /** Lean of the long axis back from the vertical, radians. */
  export const LEAN: number = (17.5 * Math.PI) / 180;

  /** The ear length the prior's rim and hollow rows are written for, mm. */
  export const PRIOR_LENGTH: number = 31;

  /**
   * One side's frame.
   *
   * @param plan The landmark skeleton.
   * @param sign 1 for the left ear, -1 for the right.
   * @param ear The ear's inputs, world mm.
   * @param top The auricle's top (superaurale) height, calibration mm, from `AutoMovieHumanEarPlace.aboveTragion`; absent, subaurale stands at the subnasale's height.
   */
  export function of(plan: IAutoMovieHumanHeadLayout, sign: 1 | -1, ear: IAutoMovieHumanEar, top?: number): IFrame {
    const m: IAutoMovieHumanHeadLandmarks = plan.landmarks;
    const k: number = plan.scale;
    const length: number = ear.length * k;
    const breadth: number = ear.breadth * k;
    const a0: [number, number, number] = [-Math.sin(LEAN), Math.cos(LEAN), 0];
    const b0: [number, number, number] = [Math.cos(LEAN), Math.sin(LEAN), 0];
    const z: number = sign * (plan.breadth / 2) * AutoMovieHumanHeadPrior.PRIOR.frame.base;
    const base: [number, number, number] = [m.tragion[0], top === undefined ? plan.subnasale : top - a0[1] * length, z];
    const centreY: number = base[1] + (a0[1] * length) / 2 - (b0[1] * breadth) / 2;

    // The head's side under the ear leans in as the head narrows to the jaw:
    // the front-view outline L's slope at the ear's centre tilts the side's
    // outward normal `(0, -L', sign)`, and the ear's axes are turned with it
    // so the auricle's base lies along the side, not across it.
    const slope: number = (AutoMovieHumanHeadMassPart.halfWidth(plan, centreY + STEP) - AutoMovieHumanHeadMassPart.halfWidth(plan, centreY - STEP)) / (2 * STEP);
    const n: [number, number, number] = unit([0, -slope, sign]);
    const a: [number, number, number] = unit(minus(a0, n));
    const b: [number, number, number] = unit(minus(minus(b0, n), a));
    return {
      centre: [plan.centre + AutoMovieHumanEarPlace.FORWARD.centre * plan.length, centreY, z],
      n,
      a,
      b,
      length,
      breadth,
      protrusion: ear.protrusion * k,
      scale: length / (PRIOR_LENGTH * k),
    };
  }

  /** Height step of the outline's slope, mm. */
  export const STEP: number = 1;

  /** A vector scaled to length 1. */
  function unit(v: readonly number[]): [number, number, number] {
    const l: number = Math.hypot(v[0]!, v[1]!, v[2]!) || 1;
    return [v[0]! / l, v[1]! / l, v[2]! / l];
  }

  /** A vector less its part along a unit vector. */
  function minus(v: readonly number[], u: readonly number[]): [number, number, number] {
    const d: number = v[0]! * u[0]! + v[1]! * u[1]! + v[2]! * u[2]!;
    return [v[0]! - d * u[0]!, v[1]! - d * u[1]!, v[2]! - d * u[2]!];
  }
}
