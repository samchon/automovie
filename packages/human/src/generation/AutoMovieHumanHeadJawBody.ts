import { AutoMovieHumanSeamUnion } from "../lofting/AutoMovieHumanSeamUnion";
import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";
import { AutoMovieHumanHeadSubmental } from "./AutoMovieHumanHeadSubmental";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";
import type { IAutoMovieHumanHeadMandible } from "./IAutoMovieHumanHeadMandible";

/**
 * The mandible's body as a volume in the frame of the mandibular plane: its
 * arch in plan from the chin to the gonions, its border and ramus, the soft
 * tissue's rounding and the skin's fall under the border. `jawOf` builds the
 * person's jaw from the chin's skin, the ears and the jaw width; `mandible`
 * is its signed distance.
 */
export namespace AutoMovieHumanHeadJawBody {
  /**
   * Signed distance from the jaw's arch in plan, first order, negative inside.
   *
   * The arch is the hull of the chin's turn and an ellipse about the gonions:
   * the body runs straight from each angle to the chin. Over the border the
   * arch widens across by {@link IMandible.spread}, so the jaw's side leans in
   * from the cheek to the angle as the masseter does, while its front, whose
   * skin faces forward, stays where the chin is.
   */
  export function arch(m: IAutoMovieHumanHeadMandible, x: number, y: number, z: number): number {
    const h: number = (y - m.menton - (m.chin - x) * m.slope) * m.cos;
    // Smooth through the border, so the lean starts inside its rounding.
    const over: number = (Math.hypot(h, m.round) + h - m.round) / 2;
    const s: number = Math.max(0.5, 1 + m.spread * over);
    const pz: number = Math.abs(z) / s;

    // Read along the ray from a point on the midline behind the gonions: the
    // distance out to the outline along it, times the cosine of the outline's
    // normal there. The skin under the jaw falls inward by this distance, and
    // a distance to the nearest piece of the outline creases where two pieces
    // are equally near: down the midline and at the chin's centre, which
    // printed a groove under the jaw and a turn of 120 degrees in a ring under
    // the chin. Along rays the outline's own smoothness carries inward, up to
    // the one point the rays leave from; halfway to the chin that point's
    // cone turned a ring under the jaw by 145 degrees, so it stands behind the
    // gonions, inside the neck.
    const vx: number = x - m.origin;
    const l: number = Math.hypot(vx, pz);
    if (l < 1e-9) return -exit(m, 1, 0)[0];
    const ux: number = vx / l;
    const uz: number = pz / l;
    const [reach, nx, nz] = exit(m, ux, uz);
    const d: number = (l - reach) * Math.max(0.2, ux * nx + uz * nz);
    return d / Math.hypot(nx, nz / s);
  }

  /**
   * Where a ray from the arch's origin leaves its left half, and the
   * outline's outward normal there: `[distance, nx, nz]`, for `uz >= 0`.
   */
  function exit(m: IAutoMovieHumanHeadMandible, ux: number, uz: number): [number, number, number] {
    const [sx, sz] = m.side;
    const along: number = ux * sx + uz * sz;
    if (along > 1e-12) {
      const t: number = ((m.start[0] - m.origin) * sx + m.start[1] * sz) / along;
      const qx: number = m.origin + t * ux;
      const qz: number = t * uz;
      const ex: number = m.end[0] - m.start[0];
      const ez: number = m.end[1] - m.start[1];
      const f: number = ((qx - m.start[0]) * ex + (qz - m.start[1]) * ez) / (ex * ex + ez * ez);
      if (f >= 0 && f <= 1) return [t, sx, sz];
    }
    const centre: number = m.front - m.radius;
    const w: number = m.origin - centre;
    const b: number = w * ux;
    const root: number = b * b - (w * w - m.radius * m.radius);
    if (root >= 0) {
      const t: number = -b + Math.sqrt(root);
      const nx: number = (m.origin + t * ux - centre) / m.radius;
      if (t > 0 && nx >= sx) return [t, nx, (t * uz) / m.radius];
    }
    const g: number = m.origin - m.gonion;
    const a2: number = (ux / m.back) ** 2 + (uz / m.width) ** 2;
    const b2: number = (2 * g * ux) / m.back ** 2;
    const c2: number = (g / m.back) ** 2 - 1;
    const t: number = (-b2 + Math.sqrt(Math.max(0, b2 * b2 - 4 * a2 * c2))) / (2 * a2);
    const gx: number = (m.origin + t * ux - m.gonion) / m.back ** 2;
    const gz: number = (t * uz) / m.width ** 2;
    const n: number = Math.hypot(gx, gz) || 1;
    return [t, gx / n, gz / n];
  }

  /**
   * Signed distance from the jaw's skin, negative inside, first order.
   *
   * In plan the jaw is an arch from the gonions to the chin, leaning in from
   * the cheek above its border. Seen from the side its border is the
   * mandibular plane through the menton, turning up at the gonial angle into
   * the ramus's posterior border, the corner rounded by the soft tissue. Under
   * the border the skin falls inward at a fixed angle to meet the neck, and
   * the two faces meet over that soft tissue's radius. The body ends inside
   * the face a fixed height over its border, softly.
   */
  export function mandible(
    m: IAutoMovieHumanHeadMandible,
    x: number,
    y: number,
    z: number,
  ): number {
    const plan: number = arch(m, x, y, z);
    const line: number = m.menton + (m.chin - x) * m.slope;
    const below: number = (line - y) * m.cos;
    const behind: number =
      (m.gonion - x) * m.lean[0] - (y - m.gonionY) * m.lean[1];
    const border: number = AutoMovieHumanHeadMath.rounded(below, behind, m.round * m.taper);
    const under: number = (plan + m.draft * border) / Math.hypot(1, m.draft);

    // The turn under is an ellipse: its radius is the taper times the round
    // where it leaves the jaw's side, which the layers cross nearly square, and
    // the round over the taper squared where it runs into the underside, which
    // they cross at under 20 degrees, a layer spanning 4 mm of it.
    const side: number = AutoMovieHumanHeadMath.rounded(m.taper * plan, under, m.round);
    const top: number = (y - line - m.height) * m.cos;
    return AutoMovieHumanHeadMath.rounded(side, top, JAW_TOP * m.round);
  }

  /**
   * The person's mandible: the plane through the chin's skin at the menton at
   * its angle, the gonion on it a fixed distance ahead of the ears' line at
   * half the jaw width, the ramus leaning back by the gonial angle, the body as
   * tall as the menton to the stomion, and its side leaning in from the cheek,
   * `[half-width, height]` at the zygomatic arch, to the angle. The soft tissue
   * over it, and so its roundings, grows with fat.
   */
  export function jawOf(
    plan: IAutoMovieHumanHeadLayout,
    j: AutoMovieHumanHeadPrior.IMandible,
    chin: number,
    ear: number,
    width: number,
    cheek: [number, number],
  ): IAutoMovieHumanHeadMandible {
    const k: number = plan.scale;
    const degree: number = Math.PI / 180;
    const plane: number = (j.plane[0]! + j.plane[1]! * plan.sex) * degree;
    const angle: number = (j.angle[0]! + j.angle[1]! * plan.sex) * degree;
    const lean: number = angle - Math.PI / 2 - plane;
    const soft: number = softness(j, plan.fat);
    const round: number = j.round * soft * k;
    const gonion: number = ear + j.gonion * k;
    const slope: number = Math.tan(plane);
    const gonionY: number = plan.border + (chin - gonion) * slope;
    const front: number = chin - j.inset * j.taper * round;
    const half: number = width / 2;
    const back: number = j.back * half;

    // The chin turns with the curvature of the parabola through the chin's
    // front and both gonions, the arch form of the mandible's base; the sides
    // run straight from it to the ellipse about the gonions, tangent to both.
    const radius: number = Math.min(0.9 * half, half ** 2 / (2 * (front - gonion)));
    const centre: number = front - radius;
    const gap = (phi: number): number =>
      centre * Math.sin(phi) +
      radius -
      gonion * Math.sin(phi) -
      Math.hypot(back * Math.sin(phi), half * Math.cos(phi));
    let lo: number = 0;
    let hi: number = Math.PI / 2;
    for (let i: number = 0; i < 60; i++) {
      const mid: number = (lo + hi) / 2;
      if (gap(mid) < 0) lo = mid;
      else hi = mid;
    }
    const nx: number = Math.sin(lo);
    const nz: number = Math.cos(lo);
    const q: number = Math.hypot(back * nx, half * nz);

    // The masseter runs from the zygomatic arch down to the angle, so the
    // jaw's side leans in from the cheek at the arch's height to the gonion.
    // The skin under the chin falls as its owner, the submental sheet, says:
    // the lower face-throat angle round from the line up to the subnasale.
    const fall: number = AutoMovieHumanHeadSubmental.fall({ plan, jaw: j });
    const rise: number = cheek[1] - gonionY;
    const spread: number = rise > 10 * k ? (cheek[0] - half) / rise / half : 0;
    return {
      front,
      gonion,
      gonionY,
      width: half,
      back,
      radius,
      origin: gonion - back / 2,
      side: [nx, nz],
      start: [gonion + (back ** 2 * nx) / q, (half ** 2 * nz) / q],
      end: [centre + radius * nx, radius * nz],
      spread,
      chin,
      menton: plan.border,
      slope,
      cos: Math.cos(plane),
      lean: [Math.cos(lean), Math.sin(lean)],
      height: plan.stomion - plan.border,
      draft: 1 / Math.tan(fall),
      round,
      taper: j.taper,
      blend: AutoMovieHumanSeamUnion.width(plan.stomion - plan.border, back / 2),
      throat: j.throat * soft * k,
    };
  }

  /** Growth of the jaw's soft tissue with fat, from the prior's at none. */
  export function softness(j: AutoMovieHumanHeadPrior.IMandible, fat: number): number {
    return Math.exp(j.fat * fat);
  }
}

/** Rounding of the jaw's end inside the face, in its soft tissue's radii. */
const JAW_TOP: number = 3;
