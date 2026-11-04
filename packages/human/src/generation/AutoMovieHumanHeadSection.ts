import { AutoMovieNaturalSpline } from "@automovie/engine";
import { AutoMovieHumanHeadBackProfile } from "./AutoMovieHumanHeadBackProfile";
import { AutoMovieHumanHeadFaceBoundary } from "./AutoMovieHumanHeadFaceBoundary";
import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import { AutoMovieHumanHeadMedianProfile } from "./AutoMovieHumanHeadMedianProfile";
import { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";
import { AutoMovieHumanHeadVault } from "./AutoMovieHumanHeadVault";
import type { IAutoMovieHumanHeadCompiled } from "./IAutoMovieHumanHeadCompiled";
import type { IAutoMovieHumanHeadLandmarks } from "./IAutoMovieHumanHeadLandmarks";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";
import type { IAutoMovieHumanHeadSection } from "./IAutoMovieHumanHeadSection";

/**
 * The measures of one head section at a station: the tilt of its plane, the
 * cranium's centre, apexes, half width and exponent, the face's front, widest
 * place, half width and exponent, and the jaw. The neck's tube hands over to
 * the skull's sizes up through the jaw; `AutoMovieHumanHeadRadius` draws the
 * outline these measures describe.
 */
export namespace AutoMovieHumanHeadSection {
  /** Measures of the section at station s. */
  export function section(
    compiled: IAutoMovieHumanHeadCompiled,
    plan: IAutoMovieHumanHeadLayout,
    s: number,
  ): IAutoMovieHumanHeadSection {
    const fr: AutoMovieHumanHeadPrior.IFrame = compiled.prior.frame;
    const m: IAutoMovieHumanHeadLandmarks = plan.landmarks;
    const t: number = Math.min(
      4,
      Math.max(0, AutoMovieNaturalSpline.evaluate(plan.station, s)),
    );
    const tilt: number = tiltOf(compiled.prior.tilt, t);
    const cos: number = Math.cos(tilt);
    const sin: number = Math.sin(tilt);

    // The cranium is the neck's tube, handing over to the skull's sizes up
    // through the jaw.
    const R: number = plan.neck.radius;
    const w: number = AutoMovieHumanHeadMath.smooth((HANDOVER - t) / (HANDOVER - HANDED));
    const mix = (v: number): number => v + w * (R - v);
    const axis: number =
      plan.centre + AutoMovieHumanHeadMath.smooth(1 - t / LEAN) * (plan.neck.x - plan.centre);
    const y: number = s + axis * sin;
    // The neck stays where its ring is, front and back, until the skull's
    // sizes take over: the throat under the chin lies over the ring's front.
    const toward = (v: number, neck: number): number => v + w * (neck - v);
    const crown: number = Math.max(
      axis + 0.1 * R,
      toward(AutoMovieHumanHeadVault.cranialFront(plan, y), plan.neck.x + R),
    );
    // The back is the back profile where the tilted plane meets it.
    const B: AutoMovieHumanHeadBackProfile.IProfile = AutoMovieHumanHeadVault.backProfile(plan);
    let rear: number = AutoMovieHumanHeadBackProfile.at(B, s) / cos;
    for (let i: number = 0; i < 4; i++)
      rear = AutoMovieHumanHeadBackProfile.at(B, s + rear * sin) / cos;
    const back: number = Math.min(axis - 0.1 * R, rear);
    const width: number = mix((plan.breadth / 2) * AutoMovieHumanHeadVault.cranialWidth(plan, y));

    // The face: its front on the midline profile, where the tilted plane
    // meets it; its widest place and half-width from the frontotemporale
    // through the zygion to the gonion.
    let front: number = AutoMovieHumanHeadMedianProfile.profileAt(plan, s) / cos;
    for (let i: number = 0; i < 4; i++)
      front = AutoMovieHumanHeadMedianProfile.profileAt(plan, s + front * sin) / cos;
    const g: number = m.glabella[1];
    const top: number = plan.vertex - g;
    const above: number = AutoMovieHumanHeadMath.smooth((s - g) / (0.25 * top));
    front -= (fr.union + 1) * plan.scale * above;
    let waist: number = AutoMovieHumanHeadFaceBoundary.faceWaist(plan, s) / cos;
    for (let i: number = 0; i < 3; i++) waist = AutoMovieHumanHeadFaceBoundary.faceWaist(plan, s + waist * sin) / cos;
    // The face fades into the cranium over the forehead, and draws back into
    // its widest place as it fades into the neck under the chin.
    const yw: number = s + waist * sin;
    const shield: number = AutoMovieHumanHeadMath.smooth((t - SHIELD_FROM) / SHIELD_RISE);
    const rise: number = Math.max(0.05, shield);
    const face: number =
      AutoMovieHumanHeadFaceBoundary.faceHalf(plan, yw) *
      (yw > g ? 1 - AutoMovieHumanHeadMath.smooth((yw - g) / (AutoMovieHumanHeadFaceBoundary.FOREHEAD * top)) : 1) *
      rise;
    front = waist + (front - waist) * rise;
    // Where the face has drawn back past its own widest place, its widest
    // place follows, so it stays behind the cranium's skin.
    waist = Math.min(waist, front - plan.scale);

    // The vault's own shape (its exponent and its front's taper) arrives over
    // the same stations above the nose's base; under them the cranium is the
    // neck's round tube.
    const vaulted: number = AutoMovieHumanHeadMath.smooth((t - 2.2) / 0.6);
    return {
      t,
      tilt,
      axis,
      crown,
      back,
      width,
      powerBack: 2 + (plan.vault - 2) * vaulted,
      taper: AutoMovieHumanHeadVault.frontTaper(plan) * vaulted,
      brow: AutoMovieHumanHeadMath.smooth((y - m.nasion[1]) / Math.max(1e-6, g - m.nasion[1])),
      tube: w,
      front,
      waist,
      face,
      powerFace: fr.plan,
      union: fr.union * plan.scale,
      station: s,
      jaw: plan.mandible,
    };
  }

  /** Station by which the neck ring's own difference has left the sections. */
  export const NECK_FADE: number = 0.95;

  /** Angles of half a section: finer than the face's gathered controls. */
  export const ANGLES: number = 960;
}

/** Station by which the neck's measures have left the sections. */
const HANDOVER: number = 2.5;

/** Station where the face shield starts, above the plain neck. */
const SHIELD_FROM: number = 0.45;

/** Stations over which the shield rises to its width. */
const SHIELD_RISE: number = 0.5;

/** Station by which the neck's lean has brought its axis under the skull. */
const LEAN: number = 1.7;

/** Station up to which the sections are the neck's. */
const HANDED: number = 0.7;

/**
 * Tilt of a section plane: a hump over the jaw, gone by the subnasale, so that
 * the planes pass under the chin and the sections above are level.
 */
function tiltOf(hump: readonly number[], t: number): number {
  const d: number = t - hump[1]!;
  return (
    hump[0]! *
    AutoMovieHumanHeadMath.bell(d / (d < 0 ? hump[2]! : hump[3]!)) *
    (1 - AutoMovieHumanHeadMath.smooth((t - 1.55) / 0.45))
  );
}
