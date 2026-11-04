import { AutoMovieHumanHeadBackProfile } from "./AutoMovieHumanHeadBackProfile";
import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";
import type { IAutoMovieHumanHeadLandmarks } from "./IAutoMovieHumanHeadLandmarks";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";
import type { IAutoMovieHumanHeadSection } from "./IAutoMovieHumanHeadSection";

/**
 * The cranium: its front apex falling behind the face from the glabella to the
 * zygion, its back apex (the median back profile B from the opisthocranion to
 * the neck), its half width from the eurion to the cranial base at the
 * tragion, the exponent of its plan that closes the head circumference, and
 * its outline along a ray of a section (a super-ellipse about the skull's
 * centre). Skull centre, vertex and the landmarks are its inputs.
 */
export namespace AutoMovieHumanHeadVault {
  /**
   * The cranium's front apex at a height: the vault's ellipse over the
   * glabella, continued under it by the parabola of the same curvature
   * (`crownShare`), so the apex is C2 through the glabella and recedes at most
   * about one millimetre per millimetre of height down to the nose's base.
   *
   * Under the nasion the cranium owns no skin in front of the face's lateral
   * boundary Z (`AutoMovieHumanHeadSection.brow`), so its front apex only
   * shapes its own flank behind the temple sector. A front that fell from the
   * glabella's place to the zygion's within 33 mm of height (2.3 mm per mm)
   * swept its wide flank across each forward place within a few millimetres
   * of height and cut a 15 mm cliff along the temple, the groove from the eye
   * to the ear.
   */
  export function cranialFront(plan: IAutoMovieHumanHeadLayout, y: number): number {
    const g: number = plan.landmarks.glabella[1];
    return plan.centre + (plan.length / 2) * AutoMovieHumanHeadMath.crownShare(y, g, plan.vertex - g);
  }

  /**
   * The taper of the cranium's front half, solved from the minimum frontal
   * breadth: the half width there is `width (1 + k u^3)` at the forward share
   * `u` of the front half-length, so the vault passes the frontotemporale at
   * half the input minimum frontal width (Farkas ft-ft) at the glabella's
   * height. A front exponent under 2 would narrow it too, but a super-ellipse
   * under 2 has unbounded curvature at its widest point, the eurion line E
   * whose jet the temple sector copies; the cube leaves the value, slope and
   * curvature at `u = 0` untouched, so E's jet is the symmetric vault's.
   *
   * @param plan The landmark skeleton: glabella and frontotemporale places, the
   *   skull's centre, length and breadth, the vault exponent and the frontal width.
   * @returns `k`, held so the front half's width stays at least a fifth of the vault's.
   */
  export function frontTaper(plan: IAutoMovieHumanHeadLayout): number {
    const m: IAutoMovieHumanHeadLandmarks = plan.landmarks;

    // At the glabella's height the front apex is the glabella and the axis the
    // skull's centre (the neck's lean has left the sections by then).
    const u: number = (m.frontal[0] - plan.centre) / Math.max(1e-6, m.glabella[0] - plan.centre);
    if (!(u > 0 && u < 1)) return 0;
    const v: number = plan.frontalWidth / Math.max(1e-6, plan.breadth / 2);
    const q: number = (1 - u ** plan.vault) ** (1 / plan.vault);
    return Math.max(-0.8, (v / q - 1) / (u * u * u));
  }

  /**
   * The cranium's gauge at a point of a section's plane: the super-ellipse of
   * its front and back half-lengths, half width and exponent, the front half
   * tapered by the section's `taper`. One gauge serves the cranium alone and
   * the cranium joined to the face.
   *
   * @param section The section's measures.
   * @param x Forward place in the section's plane, mm.
   * @param z Lateral place, mm.
   * @returns The Lame gauge, 1 on the outline.
   */
  export function gauge(section: IAutoMovieHumanHeadSection, x: number, z: number): number {
    const front: boolean = x >= section.axis;
    const u: number =
      (x - section.axis) / Math.max(1e-6, front ? section.crown - section.axis : section.axis - section.back);
    const narrow: number = front ? Math.max(0.2, 1 + section.taper * Math.min(1, u) ** 3) : 1;
    return AutoMovieHumanHeadMath.lame(u, z / (section.width * narrow), section.powerBack);
  }

  /**
   * The cranium's back apex behind its centre at a height: the median back
   * profile from the neck ring over the opisthocranion, which stands the head
   * length from the glabella at the nasion's height.
   */
  export function cranialBack(plan: IAutoMovieHumanHeadLayout, y: number): number {
    return plan.centre - AutoMovieHumanHeadBackProfile.at(backProfile(plan), y);
  }

  /** The back profile's owners for a person. */
  export function backProfile(plan: IAutoMovieHumanHeadLayout): AutoMovieHumanHeadBackProfile.IProfile {
    return {
      centre: plan.centre,
      reach: plan.reach,
      occiput: plan.landmarks.occiput,
      vertex: plan.vertex,
      ring: { y: plan.neck.backLevel, x: plan.neck.back, slope: plan.neck.backSlope },
    };
  }

  /** The cranium's half-width share at a height, before the neck. */
  export function cranialWidth(plan: IAutoMovieHumanHeadLayout, y: number): number {
    const m: IAutoMovieHumanHeadLandmarks = plan.landmarks;
    const g: number = m.glabella[1];
    if (y >= g) return AutoMovieHumanHeadMath.crownShare(y, g, plan.vertex - g);
    // Under the eurion's height the vault narrows to the cranial base's
    // width at the tragion.
    const u: number = (g - y) / Math.max(1, g - m.tragion[1]);
    const base: number = AutoMovieHumanHeadPrior.PRIOR.frame.base;
    return Math.max(0.5, 1 - (1 - base) * u * u);
  }

  /** The cranium's radius along a ray. */
  export function cranial(section: IAutoMovieHumanHeadSection, ox: number, theta: number): number {
    const c: number = Math.cos(theta);
    const n: number = Math.sin(theta);
    const reach: number =
      2 * (Math.max(section.crown, section.front) - section.back) +
      2 * Math.max(section.width, section.face);
    return AutoMovieHumanHeadMath.outermost(
      (r: number): number => gauge(section, ox + r * c, r * n),
      reach,
    );
  }

  /**
   * The vault's exponent for a layout: the super-ellipse through the glabella
   * and the cranium's back at the glabella's height, as wide as the head's
   * breadth, whose perimeter is the layout's head tape.
   *
   * @param plan The layout, its `vault` not yet solved.
   * @returns The exponent that closes the head circumference.
   */
  export function closing(plan: IAutoMovieHumanHeadLayout): number {
    const g: number = plan.landmarks.glabella[1];

    return vaultPower(plan.length / 2 + cranialBack(plan, g), plan.breadth, plan.tape);
  }

  /**
   * Exponent of the super-ellipse of a length and a breadth whose perimeter is
   * a tape: the vault's squareness closes the head circumference.
   */
  export function vaultPower(length: number, breadth: number, tape: number): number {
    const a: number = length / 2;
    const b: number = breadth / 2;
    const around = (p: number): number => {
      let sum: number = 0;
      let last: P2 = [a, 0];
      for (let i: number = 1; i <= 360; i++) {
        const t: number = (Math.PI * 2 * i) / 360;
        const c: number = Math.cos(t);
        const s: number = Math.sin(t);
        const q: P2 = [
          a * Math.sign(c) * Math.abs(c) ** (2 / p),
          b * Math.sign(s) * Math.abs(s) ** (2 / p),
        ];
        sum += Math.hypot(q[0] - last[0], q[1] - last[1]);
        last = q;
      }
      return sum;
    };
    let lo: number = 1.6;
    let hi: number = 6;
    for (let i: number = 0; i < 40; i++) {
      const mid: number = (lo + hi) / 2;
      if (around(mid) < tape) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }
}

/** A point of a section. */
type P2 = [number, number];
