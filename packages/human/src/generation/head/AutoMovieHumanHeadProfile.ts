import type { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanHeadF1Lines } from "./AutoMovieHumanHeadF1Lines";
import { AutoMovieHumanHeadF1Pose } from "./AutoMovieHumanHeadF1Pose";
import type { AutoMovieHumanHeadFrankfort } from "./AutoMovieHumanHeadFrankfort";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * The nose-lip-chin midline profile in the head frame's midsagittal plane
 * (+X anterior, +Y up): one set of points the nose, lip and chin reliefs all
 * read, so their midline forms agree.
 *
 * Nasion, subnasale, pronasale, the lips' heights about the stomion and the
 * gnathion come from the Frankfort frame (`AutoMovieHumanHeadFrankfort`:
 * FaceBase depths, the public nose and vermilion inputs). The forward places
 * of the lower face come from Legan and Burstone's soft-tissue norms (J Oral
 * Surg 1980;38:744-751), read through Celebi et al. 2013 (Sci World J
 * 2013:806203) Table 1, European-American, as published defaults:
 * - soft pogonion Pg': on the ray from Sn turned `CONVEXITY` behind the
 *   extension of G-Sn (facial convexity G-Sn-Pg' 12 +- 4 degrees) where it
 *   meets the glabella's vertical moved by `PROGNATHISM` (mandibular
 *   prognathism, G vertical to Pg', 0 +- 4 mm);
 * - labrale superius and inferius: `UPPER_LIP` and `LOWER_LIP` ahead of the
 *   Sn-Pg' line (3 +- 1 and 2 +- 1 mm) at their public heights;
 * - stomion: the lips closed and meeting on the deep plane (the Frankfort
 *   stomion on the sn-gn chord, which head.mass's anterior outline passes),
 *   so the upper and lower vermilion stay distinct along the stomion line
 *   (DEBT: the norm's 2 +- 2 mm interlabial gap is a reading of the open
 *   mouth, and opening is a pose);
 * - soft-tissue B point Si: `SULCUS` behind the Li-Pg' line (mentolabial
 *   sulcus 4 +- 2 mm), its height `SULCUS_SHARE` of the way from Li to Pg'
 *   (DEBT);
 * - columella: its tangent at Sn turned `NASOLABIAL` from Sn-Ls (nasolabial
 *   angle Cm-Sn-Ls 102 +- 8 degrees) toward the tip; the dorsum n-prn is a
 *   straight chord (DEBT: the dorsal shape is an input gap).
 * Lips: the upper and lower vermilion stay distinct along the stomion line
 * here; their path to two separate contacting sheets for an opening mouth
 * (the native lip inputs of #3090) is open design debt.
 */
export namespace AutoMovieHumanHeadProfile {
  /** Facial convexity G-Sn-Pg', radians (Legan and Burstone, 12 degrees). */
  export const CONVEXITY: number = (12 * Math.PI) / 180;

  /** Mandibular prognathism, the soft pogonion ahead of the glabella's vertical, mm (Legan and Burstone, 0). */
  export const PROGNATHISM: number = 0;

  /** Nasolabial angle Cm-Sn-Ls, radians (Legan and Burstone, 102 degrees). */
  export const NASOLABIAL: number = (102 * Math.PI) / 180;

  /** Upper lip protrusion, Ls ahead of Sn-Pg', mm (Legan and Burstone, 3). */
  export const UPPER_LIP: number = 3;

  /** Lower lip protrusion, Li ahead of Sn-Pg', mm (Legan and Burstone, 2). */
  export const LOWER_LIP: number = 2;

  /** Mentolabial sulcus, Si behind Li-Pg', mm (Legan and Burstone, 4). */
  export const SULCUS: number = 4;

  /** DEBT: the sulcus's height as the share of the way from Li down to Pg' (no published height read). */
  export const SULCUS_SHARE: number = 0.5;

  /** Maxillary prognathism, Sn ahead of G's vertical, mm (Legan and Burstone, 6 +- 3): a check. */
  export const MAXILLARY: number = 6;

  /** DEBT: without the person's measured soft pogonion, its height as the share of the way from the gnathion up to Li (no published height read). */
  export const POGONION_SHARE: number = 1 / 3;

  /** The profile's named points. */
  export type Name = "n" | "prn" | "sn" | "ls" | "sto" | "li" | "si" | "pg" | "gn";

  /** The profile. */
  export interface IOutput {
    /** Midline points, head frame. */
    points: Record<Name, Vec3>;

    /** Unit tangent of the columella at the subnasale, toward the tip. */
    columella: Vec3;

    /** Unit direction of the Sn-Pg' line, from Sn down to Pg'. */
    chinLine: Vec3;

    /** Basis of each point. */
    basis: Record<Name, string>;

    /** Legan and Burstone's relations read back on the profile, with their norms: the person's variation, not drivers. */
    checks: { name: string; value: number; norm: string }[];
  }

  /** Build the profile from the Frankfort landmarks; throws when the soft pogonion does not fall between the lower lip and the gnathion. */
  export function create(head: AutoMovieHumanHeadFrankfort.IOutput): IOutput {
    const P: Record<AutoMovieHumanHeadFrankfort.Name, Vec3> = head.points;
    const g: Vec3 = P.g;
    const sn: Vec3 = P.sn;

    // The soft pogonion: the person's own measured place when given (her
    // offsets from G and the menton, node:head-measure), else Legan and
    // Burstone's facial convexity from Sn at a declared height. The norms'
    // frame is FH (their horizontal, S-N turned 7 degrees, lies within about
    // a degree of FH at the classic S-N to FH angle); f1's own Sn stands 5.3 mm
    // behind G, so recovering their frame from the maxillary prognathism bent
    // her face toward a norm she does not meet (08:57, withdrawn). The
    // convexity and both prognathisms are read back as checks.
    const w: Vec3 = [sn[0] - g[0], sn[1] - g[1], 0];
    const ray: Vec3 = turn(unit(w), -CONVEXITY);
    if (!(ray[1] < 0)) throw new Error("head profile: the convexity ray does not descend from the subnasale");
    const ypg: number = P.gn[1] + POGONION_SHARE * (P.li[1] - P.gn[1]);
    const pg: Vec3 = head.measured.pogonion ?? [sn[0] + ((ypg - sn[1]) / ray[1]) * ray[0], ypg, 0];
    if (!(pg[1] < P.li[1]) || !(pg[1] > P.gn[1])) throw new Error(`head profile: the soft pogonion at height ${pg[1].toFixed(1)} mm does not fall between the lower lip (${P.li[1].toFixed(1)}) and the gnathion (${P.gn[1].toFixed(1)})`);
    const convexity: number = Math.acos(Math.max(-1, Math.min(1, (unit(w)[0] * unit([pg[0] - sn[0], pg[1] - sn[1], 0])[0] + unit(w)[1] * unit([pg[0] - sn[0], pg[1] - sn[1], 0])[1]))));
    const checks: { name: string; value: number; norm: string }[] = [
      { name: "facial convexity G-Sn-Pg'", value: (convexity * 180) / Math.PI, norm: `${((CONVEXITY * 180) / Math.PI).toFixed(0)} +- 4 deg` },
      { name: "maxillary prognathism, Sn ahead of G's vertical", value: sn[0] - g[0], norm: `${MAXILLARY} +- 3 mm` },
      { name: "mandibular prognathism, Pg' ahead of G's vertical", value: pg[0] - g[0], norm: `${PROGNATHISM} +- 4 mm` },
    ];

    // A point at a given height whose perpendicular distance to a line
    // through `a` along the unit `d` (pointing down) is `ahead` (positive
    // forward): the line's place at that height moved horizontally by
    // `ahead` over the forward normal's horizontal share.
    const off: (a: Vec3, d: Vec3, y: number, ahead: number) => Vec3 = (a: Vec3, d: Vec3, y: number, ahead: number): Vec3 => {
      const normal: number = Math.abs(d[1]);
      return [a[0] + ((y - a[1]) / d[1]) * d[0] + ahead / normal, y, 0];
    };

    // The lips about the Sn-Pg' line.
    const along: Vec3 = unit([pg[0] - sn[0], pg[1] - sn[1], 0]);
    const ls: Vec3 = off(sn, along, P.ls[1], head.measured.lips.upper ?? UPPER_LIP);
    // f1 first (owner, 2026-11-08 13:1x): her labrale inferius (Legan and Burstone's most prominent point) is an authored landmark (`AutoMovieHumanHeadF1Lines.LOWER_LIP`); the protrusion off Sn-Pg' at the vermilion border's height put it 4.2 mm low and waits for the later algorithmization: off(sn, along, P.li[1], head.measured.lips.lower ?? LOWER_LIP).
    const li: Vec3 = AutoMovieHumanHeadF1Pose.upright(AutoMovieHumanHeadF1Lines.LOWER_LIP);
    const sto: Vec3 = P.sto;

    // The sulcus behind the Li-Pg' line.
    const lp: Vec3 = unit([pg[0] - li[0], pg[1] - li[1], 0]);
    const si: Vec3 = off(li, lp, li[1] + SULCUS_SHARE * (pg[1] - li[1]), -SULCUS);

    // The columella's tangent at Sn, turned from Sn-Ls toward the tip.
    const sl: Vec3 = unit([ls[0] - sn[0], ls[1] - sn[1], 0]);
    const columella: Vec3 = turn(sl, NASOLABIAL);

    const source: string = "Legan and Burstone 1980 norms via Celebi et al. 2013 Table 1 (European-American), published defaults";
    return {
      points: { n: P.n, prn: P.prn, sn, ls, sto, li, si, pg, gn: P.gn },
      columella,
      chinLine: along,
      checks,
      basis: {
        n: "Frankfort (FaceBase t-n depth, public face height)",
        prn: "Frankfort (public sn-prn, FaceBase n-prn / n-sn)",
        sn: "Frankfort (FaceBase t-sn depth, public nose height)",
        ls: `${UPPER_LIP} mm ahead of Sn-Pg' at the public upper vermilion height; ${source}`,
        sto: "on the deep plane (Frankfort's sn-gn chord), the lips closed (DEBT: the norm's interlabial gap is an open-mouth reading)",
        li: `${LOWER_LIP} mm ahead of Sn-Pg' at the public lower vermilion height; ${source}`,
        si: `${SULCUS} mm behind Li-Pg', at ${SULCUS_SHARE} of Li to Pg' (height DEBT); ${source}`,
        pg: head.measured.pogonion !== null ? "the person's measured soft pogonion (node:head-measure receipt)" : `facial convexity ${((CONVEXITY * 180) / Math.PI).toFixed(0)} deg off G-Sn at ${POGONION_SHARE.toFixed(2)} of gn to Li (height DEBT); ${source}`,
        gn: "Frankfort (FaceBase t-gn depth, public head height)",
      },
    };
  }

  /** In-plane unit vector; throws on a zero vector. */
  function unit(a: Vec3): Vec3 {
    const n: number = Math.hypot(a[0], a[1]);
    if (!(n > 0)) throw new Error("head profile: zero direction");
    return [a[0] / n, a[1] / n, 0];
  }

  /** In-plane rotation by an angle, counterclockwise with +X forward and +Y up. */
  function turn(a: Vec3, angle: number): Vec3 {
    const c: number = Math.cos(angle);
    const s: number = Math.sin(angle);
    return [a[0] * c - a[1] * s, a[0] * s + a[1] * c, 0];
  }
}
