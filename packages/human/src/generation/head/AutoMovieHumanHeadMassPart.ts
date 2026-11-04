import { AutoMovieLoftFrame, AutoMovieViewAxis, AutoMovieViewSection, type IAutoMovieViewPart } from "@automovie/engine";
import { AutoMovieHumanHeadBackProfile } from "../AutoMovieHumanHeadBackProfile";
import { AutoMovieHumanHeadMedianProfile } from "../AutoMovieHumanHeadMedianProfile";
import { AutoMovieHumanHeadPrior } from "../AutoMovieHumanHeadPrior";
import { AutoMovieHumanHeadVault } from "../AutoMovieHumanHeadVault";
import type { IAutoMovieHumanHeadLandmarks } from "../IAutoMovieHumanHeadLandmarks";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";

/**
 * The head mass and its neck (cranium, face and neck without the nose,
 * lips and ears) as a part drawn from its three views, the input of the
 * view-to-section operator (`AutoMovieViewLoft`).
 *
 * - Side view: P, the median front profile of the skull and face
 *   (`AutoMovieHumanHeadMedianProfile`), continued under the menton along
 *   the submental line at the lower face-throat angle (Sn-Gn'-C, 100
 *   degrees) to the cervical point C, whose depth from the gnathion is the
 *   lower face's height over the lower vertical height-depth ratio
 *   (Sn-Gn' / C-Gn' = 1.2; Legan and Burstone 1980), and under C the neck's
 *   front, parallel to its back; B, the median back profile
 *   (`AutoMovieHumanHeadBackProfile`), down the nape to the neck ring.
 * - Front view: L, the head's front-view silhouette, one outline through
 *   the vertex, the eurion's level (half the head breadth), the tragion's
 *   (half the cranial base width t-t), the gonion's (half go-go) and the
 *   neck ring (the neck tape's radius).
 * - Axis: straight up through the skull's centre, so every section is
 *   level, as the reference skin is read. An axis leaning to the neck tilted
 *   the sections under the tragion, so the lowest ran from behind the ear to
 *   under the chin and their outlines flared out past the jaw.
 * - Fullness: the vault's quarters take the conic shoulder of the
 *   super-ellipse whose exponent closes the head circumference
 *   (`AutoMovieHumanHeadVault.closing`, `r = 2^(1 - 1/n) - 1`, the share of
 *   the diagonal point of `|x/a|^n + |z/b|^n = 1`); the face's front quarters
 *   depart to the face plan's exponent under the nasion and return to the
 *   vault's over the forehead.
 *
 * The top is a pole at the vertex, every outline reaching 0 there. The
 * bottom is open at the neck's base, inside the trunk: the neck is the head
 * mass's own lower stretch, not a part merged under it, since a neck tube
 * merged under the head met it along the nape and the jaw's underside,
 * where the two skins are one, and traced no clean loop. A submental line
 * carried on below C put P within a few millimetres of the axis and turned
 * the sections concave; the neck's front under C keeps them convex.
 * First pass: compile-only, not wired into generation.
 */
export namespace AutoMovieHumanHeadMassPart {
  /** Control points per section, a multiple of 4. */
  export const ORDER: number = 64;

  /** Ring samples of the emitted chain. */
  export const SAMPLES: number = 256;

  /** Largest station step between layers, mm. */
  export const SPACING: number = 2;

  /**
   * The head mass as a view part.
   *
   * @param plan The landmark skeleton, the vault exponent solved.
   * @param faceExponent The face plan's super-ellipse exponent (`AutoMovieHumanFacePlan.exponent`); absent, the head prior's row.
   * @param bottom The neck base's station, inside the trunk; absent, the neck ring's height.
   * @returns The part, chain name `head.mass`.
   */
  export function of(plan: IAutoMovieHumanHeadLayout, faceExponent?: number, bottom?: number): IAutoMovieViewPart {
    const m: IAutoMovieHumanHeadLandmarks = plan.landmarks;
    const g: number = m.glabella[1];

    // The bottom: open at the neck's base, inside the trunk the head mass
    // and its neck are merged onto; the neck is this part's lower stretch.
    const throat: number = Math.min(bottom ?? plan.y0, cervical(plan)[1] - SPACING);
    const top: number = plan.vertex - g;

    // The axis: straight up through the skull's centre, every section level
    // as the reference's skin is read.
    const axis: AutoMovieViewAxis.IAxis = AutoMovieViewAxis.straight([plan.centre, 0, 0], [1, 0, 0], [0, 0, 1]);

    // The sites the outlines carry knots at, by station (the axis point's
    // height, the axis being near vertical).
    const sites: [string, number][] = [
      ["throat", throat],
      ["cervical", cervical(plan)[1]],
      ["menton", plan.menton],
      ["gonion", m.gonion[1]],
      ["stomion", plan.stomion],
      ["subnasale", plan.subnasale],
      ["tragion", m.tragion[1]],
      ["nasion", plan.nasion],
      ["glabella", g],
      ["vault.lower", g + 0.35 * top],
      ["vault.upper", g + 0.7 * top],
      ["vertex", plan.vertex],
    ];
    sites.sort((a: [string, number], b: [string, number]): number => a[1] - b[1]);
    const knotted: [string, number][] = sites.filter(
      (site: [string, number], i: number): boolean => i === 0 || site[1] - sites[i - 1]![1] > 0.5,
    );

    // Each site's plane and the outlines' values there.
    const front: IAutoMovieViewPart.IKnot[] = [];
    const back: IAutoMovieViewPart.IKnot[] = [];
    const left: IAutoMovieViewPart.IKnot[] = [];
    const right: IAutoMovieViewPart.IKnot[] = [];
    for (const [site, station] of knotted) {
      const frame: AutoMovieLoftFrame.IFrame = axis.at(station);
      const atPole: boolean = site === "vertex";
      const p: number = atPole ? 0 : reach(frame, 1, (y: number): number => median(plan, y));
      const b: number = atPole ? 0 : reach(frame, -1, (y: number): number => AutoMovieHumanHeadBackProfile.at(AutoMovieHumanHeadVault.backProfile(plan), y));
      const l: number = atPole ? 0 : halfWidth(plan, frame.origin[1]);
      front.push({ site, station, value: Math.max(1e-3, p) });
      back.push({ site, station, value: -Math.max(1e-3, b) });
      left.push({ site, station, value: Math.max(1e-3, l) });
      right.push({ site, station, value: -Math.max(1e-3, l) });
    }
    if (front.length) {
      front[front.length - 1]!.value = 0;
      back[back.length - 1]!.value = 0;
      left[left.length - 1]!.value = 0;
      right[right.length - 1]!.value = 0;
    }

    // The quarters' fullness: the vault's shoulder, the face's in front
    // under the nasion, returning to the vault's over the forehead.
    const vault: number = shoulder(plan.vault);
    const face: number = shoulder(faceExponent ?? AutoMovieHumanHeadPrior.PRIOR.frame.plan);
    const first: number = knotted[0]![1];
    const last: number = knotted[knotted.length - 1]![1];
    const flatAt = (value: number): IAutoMovieViewPart.IOutline => ({
      knots: [
        { site: knotted[0]![0], station: first, value },
        { site: knotted[knotted.length - 1]![0], station: last, value },
      ],
    });
    const faceDeparture: IAutoMovieViewPart.IOutline = {
      knots: [
        { site: knotted[0]![0], station: first, value: face - vault },
        { site: "nasion", station: plan.nasion, value: face - vault },
        { site: "vault.lower", station: g + 0.35 * top, value: 0 },
        { site: knotted[knotted.length - 1]![0], station: last, value: 0 },
      ].filter((k: IAutoMovieViewPart.IKnot, i: number, all: IAutoMovieViewPart.IKnot[]): boolean => i === 0 || k.station > all[i - 1]!.station),
    };

    // Layers: every site and as many even steps between as keep them within
    // the spacing.
    const stations: number[] = [];
    for (let i: number = 0; i + 1 < knotted.length; i++) {
      const a: number = knotted[i]![1];
      const b: number = knotted[i + 1]![1];
      const n: number = Math.max(1, Math.ceil((b - a) / SPACING));
      for (let k: number = 0; k < n; k++) stations.push(a + ((b - a) * k) / n);
    }
    stations.push(last);

    return {
      name: "head.mass",
      axis,
      stations,
      front: { positive: { knots: front }, negative: { knots: back } },
      side: { positive: { knots: left }, negative: { knots: right } },
      fullness: {
        kind: "shoulder",
        shoulder: flatAt(vault),
        departures: [faceDeparture, flatAt(0), flatAt(0), faceDeparture],
      },
      pole: "top",
      order: ORDER,
      samples: SAMPLES,
    };
  }

  /**
   * The conic shoulder of a quarter super-ellipse of exponent `n`: its
   * diagonal point `2^(-1/n) (a, b)` written as `(1 + r)(a, b) / 2`.
   *
   * @param n The exponent, 2 for the ellipse.
   */
  export function shoulder(n: number): number {
    return Math.max(AutoMovieViewSection.ELLIPSE / 4, Math.min(0.95, 2 ** (1 - 1 / n) - 1));
  }

  /**
   * P with the submental line under the menton: the skin under the chin leaves
   * the gnathion at the lower face-throat angle from the line to the
   * subnasale (Legan and Burstone 1980, Sn-Gn'-C 100 degrees).
   */
  function median(plan: IAutoMovieHumanHeadLayout, y: number): number {
    if (y >= plan.menton) return AutoMovieHumanHeadMedianProfile.profileAt(plan, y);
    const m: IAutoMovieHumanHeadLandmarks = plan.landmarks;
    const up: number = Math.atan2(m.subnasale[1] - m.gnathion[1], m.subnasale[0] - m.gnathion[0]);
    const throat: number = up + (AutoMovieHumanHeadPrior.PRIOR.mandible.throatAngle * Math.PI) / 180;
    const run: number = Math.cos(throat);
    const fall: number = Math.sin(throat);

    // Along the submental line from the menton, x falls back as y falls, to
    // the cervical point; under it the neck's front, parallel to its back.
    const c: [number, number] = cervical(plan);
    if (y < c[1]) return c[0] + plan.neck.backSlope * (y - c[1]);
    const start: number = AutoMovieHumanHeadMedianProfile.profileAt(plan, plan.menton);
    return fall < -1e-6 ? start + ((plan.menton - y) * run) / -fall : start - (plan.menton - y);
  }

  /**
   * The cervical point C, where the submental line meets the neck's front:
   * on the line from the menton at the lower face-throat angle (Sn-Gn'-C),
   * the lower face's height `Sn-Gn'` over the lower vertical height-depth
   * ratio (Legan and Burstone 1980, `Sn-Gn' / C-Gn' = 1.2`) from the
   * gnathion.
   *
   * @param plan The landmark skeleton.
   * @returns `[x, y]`, mm.
   */
  export function cervical(plan: IAutoMovieHumanHeadLayout): [number, number] {
    const m: IAutoMovieHumanHeadLandmarks = plan.landmarks;
    const up: number = Math.atan2(m.subnasale[1] - m.gnathion[1], m.subnasale[0] - m.gnathion[0]);
    const throat: number = up + (AutoMovieHumanHeadPrior.PRIOR.mandible.throatAngle * Math.PI) / 180;
    const depth: number = Math.hypot(m.subnasale[0] - m.gnathion[0], m.subnasale[1] - m.gnathion[1]) / HEIGHT_DEPTH;
    const start: number = AutoMovieHumanHeadMedianProfile.profileAt(plan, plan.menton);
    return [start + depth * Math.cos(throat), plan.menton + depth * Math.sin(throat)];
  }

  /** Lower vertical height-depth ratio `Sn-Gn' / C-Gn'` (Legan and Burstone 1980). */
  export const HEIGHT_DEPTH: number = 1.2;

  /**
   * The head mass's skin in front at a height and a lateral place: the
   * forward place where its own section at that height (the box of P, B and
   * L about the skull's centre, the face's shoulder in front under the nasion
   * and the vault's over the forehead) passes the lateral place, found on the
   * section's polar curve by bisection of its lateral coordinate over the
   * front quarter. A face part off the midline (a brow, a lid, an orbit)
   * stands on this, not on the midline profile, since the face turns back
   * from the midline toward its sides. Read at the level section, which the
   * head mass's sections are above the tragion.
   *
   * @param plan The landmark skeleton, the vault exponent solved.
   * @param y Height, mm.
   * @param z Lateral place, mm; its side does not matter.
   * @param faceExponent The face plan's exponent; absent, the head prior's row.
   * @returns Forward place, mm; the midline profile's when `z` lies past the section's side.
   */
  export function frontAt(plan: IAutoMovieHumanHeadLayout, y: number, z: number, faceExponent?: number): number {
    const front: number = Math.max(1e-3, median(plan, y) - plan.centre);
    const back: number = Math.max(1e-3, plan.centre - AutoMovieHumanHeadBackProfile.at(AutoMovieHumanHeadVault.backProfile(plan), y));
    const side: number = Math.max(1e-3, halfWidth(plan, y));
    const g: number = plan.landmarks.glabella[1];
    const vault: number = shoulder(plan.vault);
    const face: number = shoulder(faceExponent ?? AutoMovieHumanHeadPrior.PRIOR.frame.plan);
    const share: number = smooth((y - plan.nasion) / Math.max(1, g + 0.35 * (plan.vertex - g) - plan.nasion));
    const fore: number = face + (vault - face) * share;
    const section: AutoMovieViewSection.ISection = AutoMovieViewSection.of({ extents: [front, side, back, side] }, [fore, vault, vault, fore]);
    const lateral = (phi: number): number => AutoMovieViewSection.radius(section, phi)[0] * Math.sin(phi);
    const target: number = Math.abs(z);
    if (!(target < side)) return plan.centre + front;
    let lo: number = 0;
    let hi: number = Math.PI / 2;
    for (let k: number = 0; k < 50; k++) {
      const mid: number = (lo + hi) / 2;
      if (lateral(mid) < target) lo = mid;
      else hi = mid;
    }
    const phi: number = (lo + hi) / 2;
    return plan.centre + AutoMovieViewSection.radius(section, phi)[0] * Math.cos(phi);
  }

  /**
   * The front-view silhouette L's half width at a height: the parts merged
   * onto the head mass add to it (the zygoma at the zygion).
   *
   * @param plan The landmark skeleton.
   * @param y Height, mm.
   */
  export function halfWidth(plan: IAutoMovieHumanHeadLayout, y: number): number {
    const base: number = AutoMovieHumanHeadPrior.PRIOR.frame.base;
    const m: IAutoMovieHumanHeadLandmarks = plan.landmarks;
    const tragion: number = m.tragion[1];
    if (y >= tragion) return (plan.breadth / 2) * AutoMovieHumanHeadVault.cranialWidth(plan, y);
    const t: number = (plan.breadth / 2) * base;
    const go: number = m.gonion[1];
    if (y >= go) return t + (plan.mandibularWidth - t) * smooth((tragion - y) / Math.max(1, tragion - go));
    return plan.mandibularWidth + (plan.neck.radius - plan.mandibularWidth) * smooth((go - y) / Math.max(1, go - plan.y0));
  }

  /**
   * The distance along the plane's `u` (sign 1) or `-u` (sign -1) from its
   * origin to a side-view curve `x(y)` in the sagittal plane, by bisection on
   * the trace of the plane there.
   */
  function reach(frame: AutoMovieLoftFrame.IFrame, sign: 1 | -1, curve: (y: number) => number): number {
    const ux: number = sign * frame.u[0];
    const uy: number = sign * frame.u[1];
    const f = (l: number): number => sign * (curve(frame.origin[1] + l * uy) - (frame.origin[0] + l * ux));
    let lo: number = 0;
    let hi: number = 400;
    if (!(f(lo) > 0)) return 0;
    if (f(hi) > 0) return hi;
    for (let k: number = 0; k < 60; k++) {
      const mid: number = (lo + hi) / 2;
      if (f(mid) > 0) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }

  /** The quintic smoothstep, C2 at both ends. */
  function smooth(u: number): number {
    const x: number = Math.min(1, Math.max(0, u));
    return x * x * x * (10 - 15 * x + 6 * x * x);
  }
}
