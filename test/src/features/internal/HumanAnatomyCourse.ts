import { HumanAnatomy } from "./HumanAnatomy";
import type { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import { HumanAnatomyCourseLandmarks } from "./HumanAnatomyCourseLandmarks";
import { HumanAnatomyShared } from "./HumanAnatomyShared";
import { HumanAnatomyTrunk } from "./HumanAnatomyTrunk";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
type ISubject = HumanAnatomyAudit.ISubject;
type Controls = ISubject["params"]["body"]["controls"];
type Feet = NonNullable<NonNullable<ISubject["params"]["extremities"]>["feet"]>;
type Side = "left" | "right";
type Range = readonly [number, number];
const A: typeof HumanAnatomy = HumanAnatomy;
const L: typeof HumanAnatomyCourseLandmarks = HumanAnatomyCourseLandmarks;
const { SIDES, identity, ratio, band, spineX }: typeof HumanAnatomyShared = HumanAnatomyShared;

/**
 * The trunk's, shoulders' and arms' course measures: lengths and widths
 * between ISO 8559-1:2017 and ANSUR II landmarks located on the skin, each
 * taken as its definition takes it, a straight breadth with a caliper, a
 * length along a limb's axis with a beam caliper, or a tape drawn taut over
 * the skin between two landmarks.
 *
 * Frame: forward +X, up +Y, the body's left +Z, millimetres, floor at y = 0.
 */
export namespace HumanAnatomyCourse {
  /**
   * Allowable errors, mm: ANSUR II Tables 28 to 31 (Gordon et al. 2014),
   * whose values the report states ISO 20685:2010 incorporated. A measure
   * ANSUR II does not take borrows the error of the nearest one it does,
   * named on each member.
   */
  export const ERROR: Readonly<Record<"bustPointWidth" | "acrossShoulder" | "backNeckToWaist" | "sideNeckToBust" | "acromionRadiale" | "radialeStylion" | "insideLeg", number>> = {
    /** Bust point width, a chest-level breadth: chest breadth's 7 mm. */
    bustPointWidth: 7,

    /** Across back shoulder width, a tape across the back between bilateral landmarks: Interscye I's 10 mm. */
    acrossShoulder: 10,

    /** Back neck point to waist: waist back length's 5 mm. */
    backNeckToWaist: 5,

    /** Side neck point to bust point, a tape down the front of the trunk: waist front length's 7 mm. */
    sideNeckToBust: 7,

    /** Acromion-radiale length, 4 mm. */
    acromionRadiale: 4,

    /** Radiale-stylion length, 6 mm. */
    radialeStylion: 6,

    /** Crotch height 10 mm plus lateral malleolus height 2 mm, their errors added. */
    insideLeg: 12,
  };

  /**
   * ANSUR II per-subject ratios, each sex's mean plus and minus 2.326 SD (the
   * normal deviate of the 1st and 99th percentiles) and the union of both
   * sexes, from the public working databases
   * (`packages/human/docs/sources/ansur-ii-course-measures.md`).
   */
  export const RATIOS: Record<"biacromial" | "acromionRadiale" | "radialeStylion" | "insideLeg" | "backCurve", Range> = {
    /** Biacromial breadth over stature: women 0.2244 (SD 0.0096), men 0.2368 (0.0098). */
    biacromial: [0.2021, 0.2597],

    /** Acromion-radiale length over stature: women 0.1911 (0.0065), men 0.1909 (0.0061). */
    acromionRadiale: [0.176, 0.2062],

    /** Radiale-stylion length over stature: women 0.1482 (0.0068), men 0.1525 (0.0061). */
    radialeStylion: [0.1323, 0.1668],

    /** Crotch height less lateral malleolus height, over stature: women 0.4417 (0.0156), men 0.4400 (0.0146). */
    insideLeg: [0.4054, 0.478],

    /** Waist back length over cervicale less omphalion height, the back's surface over its vertical: women 1.0238 (0.0288), men 1.0367 (0.0268). */
    backCurve: [0.9569, 1.0992],
  };

  /** Course landmarks and measures of one skin; NaN or null where a landmark is not found. */
  export interface ICourse {
    /** Bust points, the most anterior point of each breast's prominence. */
    bust: Record<Side, V3 | null>;

    /** Side neck points, the neck base line's lateral ends. */
    sideNeck: Record<Side, V3 | null>;

    /** Shoulder points: the acromion's lateral edge projected vertically to the skin. */
    shoulder: Record<Side, V3 | null>;

    /** Back neck point: where the neck base line crosses the median plane behind the neck. */
    backNeck: V3 | null;

    /** The back's median skin at the waist level. */
    backWaist: V3 | null;

    /** Radiale on the skin, by side. */
    radiale: Record<Side, V3 | null>;

    /** Stylion on the skin, by side. */
    stylion: Record<Side, V3 | null>;

    /** ISO 8559-1 5.2.3 bust point width: the straight breadth between the bust points, mm. */
    bustPointWidth: number;

    /** ISO 8559-1 5.4.3 across back shoulder width: shoulder point through the back neck point to shoulder point, taut over the skin, mm. */
    acrossShoulder: number;

    /** Straight distance between the shoulder points, the biacromial breadth, mm. */
    biacromial: number;

    /** ISO 8559-1 5.4.5 back neck point to waist, taut down the back's median skin, mm. */
    backNeckToWaist: number;

    /** ISO 8559-1 5.4.10 side neck point to bust point, taut over the skin, mm. */
    sideNeckToBust: Record<Side, number>;

    /** ANSUR II acromion-radiale length, along the upper arm's axis, mm. */
    acromionRadiale: Record<Side, number>;

    /** ANSUR II radiale-stylion length, along the forearm's axis, mm. */
    radialeStylion: Record<Side, number>;

    /** ISO 8559-1 5.1.15 inside leg height: the crotch above the floor, mm. */
    crotch: number;
  }

  /**
   * The course rows: each course input at its published site, and the ANSUR
   * II proportions of the bony breadths and segment lengths the same
   * landmarks give.
   *
   * @param subject A generated person or a reference body.
   * @returns Every row, passing or not, for the caller to filter.
   */
  export function course(subject: ISubject): IRow[] {
    const name: string = subject.name;
    const rows: IRow[] = [];
    const c: Controls = subject.params.body.controls;
    const S: number = c.height.value!;
    const skin: HumanAnatomy.ISkin = subject.bind();
    const k: ICourse = courseSites(skin, S);
    const id: (site: string, value: number, input: number | null, tol: number) => void = (
      site: string,
      value: number,
      input: number | null,
      tol: number,
    ): void => {
      if (input !== null) rows.push(identity(name, site, value, input, tol));
    };

    // A bust point is the most anterior point of a breast. The modelled skin
    // leaves the nipples out (construction.md), so a masculine chest, whose
    // chest point is the nipple, carries no bust point its skin can show and
    // its bust rows cannot be read; a feminine chest without one fails them.
    const breasts: boolean = (c.masculineFeminine.value ?? 0) > 0;

    // bustSpan is not read: ISO 8559-1 5.2.3 measures the straight breadth
    // between the bust points, the nipples, and the skin leaves the nipples
    // out, so the most anterior point of each breast stands in for a landmark
    // the skin does not show and the breadth would not be that of the input.
    id("across shoulder: ISO 8559-1 5.4.3 across back shoulder width, shoulder point through the back neck point to shoulder point over the skin, mm", k.acrossShoulder, c.acrossShoulder.value, ERROR.acrossShoulder);

    // frontInterscyeLength is not read: ISO 8559-1 5.4.7 across front width
    // runs between the armpit front fold points, which 3.1.13 sets by a rule
    // pressed under the arm, a contact the skin alone does not fix, and the
    // clause text was not read; the armpit hollow's own deepest point lies at
    // the armpit's middle, not at its front fold.
    id("neck to waist: ISO 8559-1 5.4.5 back neck point to waist level down the back's median skin, mm", k.backNeckToWaist, c.neckToWaist.value, ERROR.backNeckToWaist);
    for (const side of SIDES) {
      if (breasts) id(`${side} shoulder to apex: ISO 8559-1 5.4.10 side neck point to bust point over the skin, mm`, k.sideNeckToBust[side], c.shoulderToApex.value, ERROR.sideNeckToBust);
      id(`${side} upper arm length: ANSUR II acromion-radiale length along the upper arm's axis, mm`, k.acromionRadiale[side], c.upperArmLength.value, ERROR.acromionRadiale);
      id(`${side} lower arm length: ANSUR II radiale-stylion length along the forearm's axis, mm`, k.radialeStylion[side], c.lowerArmLength.value, ERROR.radialeStylion);
    }

    // ISO 8559-1 5.7.6 inside leg length runs from the inside leg level to the
    // outer ankle point; the skin carries no malleolus a test can find (see
    // test_human_anatomy_foot), so its height is the foot's own input, the
    // mean of the two feet's, mm.
    const feet: Feet | undefined = subject.params.extremities?.feet;
    const malleolus: number = feet === undefined ? NaN : (feet.left.ankleHeight + feet.right.ankleHeight) / 2;
    if (c.inseam.value !== null && feet !== undefined)
      id("inseam: ISO 8559-1 5.7.6 inside leg length, the crotch's height less the lateral malleolus height input, read as the crotch's height, mm", k.crotch, c.inseam.value + malleolus, ERROR.insideLeg);
    if (feet !== undefined) rows.push(ratio(name, "crotch height less the lateral malleolus height input, over stature", (k.crotch - malleolus) / S, RATIOS.insideLeg[0], RATIOS.insideLeg[1]));

    // The back's surface length over its vertical drop from the back neck
    // point to the waist level, both mm: a tape on a curved back is longer
    // than the drop by the thoracic and lumbar curves' excess.
    const drop: number = k.backNeck !== null && k.backWaist !== null ? k.backNeck[1] - k.backWaist[1] : NaN;
    rows.push(ratio(name, "back neck point to waist over the skin / its vertical drop", k.backNeckToWaist / drop, RATIOS.backCurve[0], RATIOS.backCurve[1]));
    rows.push(ratio(name, "biacromial breadth (shoulder point to shoulder point) / stature", k.biacromial / S, RATIOS.biacromial[0], RATIOS.biacromial[1]));
    for (const side of SIDES) {
      rows.push(ratio(name, `${side} acromion-radiale length / stature`, k.acromionRadiale[side] / S, RATIOS.acromionRadiale[0], RATIOS.acromionRadiale[1]));
      rows.push(ratio(name, `${side} radiale-stylion length / stature`, k.radialeStylion[side] / S, RATIOS.radialeStylion[0], RATIOS.radialeStylion[1]));
    }
    return rows;
  }

  /**
   * The trunk audit's neck sites of a skin, located once per skin; locating
   * them also leaves the neck base line in `HumanAnatomyTrunk.lines`.
   *
   * @param skin The skin read.
   * @param S Stature, mm.
   */
  export function neckSites(skin: HumanAnatomy.ISkin, S: number): HumanAnatomyShared.INeck {
    let found: HumanAnatomyShared.INeck | undefined = necks.get(skin);
    if (found === undefined) {
      found = HumanAnatomyTrunk.neckSites(skin, S);
      necks.set(skin, found);
    }
    return found;
  }

  /**
   * Locate the course landmarks on a standing skin and take the measures
   * between them, once per skin.
   *
   * @param skin The skin read.
   * @param S Stature, mm.
   */
  export function courseSites(skin: HumanAnatomy.ISkin, S: number): ICourse {
    const found: ICourse | undefined = courses.get(skin);
    if (found !== undefined) return found;

    const t: HumanAnatomyShared.ITrunk = HumanAnatomyTrunk.trunkSites(skin, S);
    neckSites(skin, S);
    const torso: Uint32Array = L.chains(skin, (c: string): boolean => !/^(arm|thumb|hand|finger|head\.|ear)/.test(c));

    // Bust points (ISO 8559-1 3.1.11): the most anterior point of each bust.
    const bust: Record<Side, V3 | null> = {
      left: L.bustPoint(skin, torso, t.heights.chest, S, 1),
      right: L.bustPoint(skin, torso, t.heights.chest, S, -1),
    };

    // Side neck points (3.1.7): the neck base line crosses the trapezius'
    // anterior border at its lateral ends, which the base line's meridian
    // points of greatest lateral reach stand for.
    const line: (V3 | null)[] = HumanAnatomyTrunk.lines.get(skin) ?? [];
    const lateral: (sign: 1 | -1) => V3 | null = (sign: 1 | -1): V3 | null =>
      line.reduce((best: V3 | null, p: V3 | null): V3 | null => (p !== null && (best === null || sign * p[2] > sign * best[2]) ? p : best), null);
    const sideNeck: Record<Side, V3 | null> = { left: lateral(1), right: lateral(-1) };

    // Shoulder points (3.1.1): the lateral edge of the acromion projected
    // vertically to the skin.
    const shoulder: Record<Side, V3 | null> = { left: L.shoulderPoint(skin, "left"), right: L.shoulderPoint(skin, "right") };

    // Back neck point (3.1.6): ISO 8559-1 5.3.3 lays the neck base girth over
    // the back neck point, so it is where the neck base line crosses the
    // median plane behind the neck, which stands at the nape whether or not C7
    // shows as a bump of its own: of the line's points behind the neck joint,
    // the two either side of the median plane nearest it, interpolated to it.
    const nape: number = A.joint(skin, "neck")[0];
    const behind: V3[] = line.filter((p: V3 | null): p is V3 => p !== null && p[0] < nape);
    const nearest: (sign: 1 | -1) => V3 | null = (sign: 1 | -1): V3 | null =>
      behind.filter((p: V3): boolean => sign * p[2] >= 0).reduce((b: V3 | null, p: V3): V3 | null => (b === null || Math.abs(p[2]) < Math.abs(b[2]) ? p : b), null);
    const bl: V3 | null = nearest(1);
    const br: V3 | null = nearest(-1);

    // Linear interpolation in z between the two nearest meridian points: the
    // parameter (0 - z_right) / (z_left - z_right) puts the point at z = 0,
    // the median plane, in the body frame (left +Z, mm).
    const backNeck: V3 | null = bl === null || br === null ? (bl ?? br) : bl[2] === br[2] ? bl : A.lerp(br, bl, (0 - br[2]) / (bl[2] - br[2]));

    // The back's median section between the waist and the back neck point,
    // torso only, from which the waist's point and the back's tape are read.
    const mid: { points: V3[]; closed: boolean }[] = A.polylines(
      skin,
      A.MEDIAN,
      [0, 0, 1],
      band(skin, t.heights.waist - 20, (backNeck?.[1] ?? t.heights.waist) + 20).filter((i: number): boolean => L.member(skin, torso, i)),
    );
    const waistY: number = t.heights.waist;
    const waistX: number = Number.isFinite(waistY) ? L.profile(mid, waistY, spineX(skin, waistY), -1) : NaN;
    const backWaist: V3 | null = Number.isFinite(waistX) ? [waistX, waistY, 0] : null;

    // 5.2.3 bust point width: a breadth, so straight across the body. 5.2's
    // breadths are taken with calipers (4.2.4) across the transverse axis, so
    // the width is the bust points' separation in z, mm, ignoring a height or
    // depth difference between the two sides.
    const bustPointWidth: number = bust.left !== null && bust.right !== null ? bust.left[2] - bust.right[2] : NaN;

    // 5.4.3 across back shoulder width: the tape from one shoulder point over
    // the back neck point to the other, in their plane, bridging every hollow.
    // The plane's normal is the cross product of the two shoulder points'
    // offsets from the back neck point; the tape's outward side is from the
    // chord's middle toward the back neck point, so only skin behind the
    // chord (the upper back and nape) enters the hull. The neck's own section
    // in that plane lies inside the hull and does not lengthen it.
    let acrossShoulder: number = NaN;
    if (shoulder.left !== null && shoulder.right !== null && backNeck !== null) {
      const n: V3 = A.unit(A.cross(A.sub(shoulder.right, backNeck), A.sub(shoulder.left, backNeck)));
      const points: V3[] = A.polylines(skin, backNeck, n, torso).flatMap((l: { points: V3[] }): V3[] => l.points);
      acrossShoulder = taut(shoulder.right, shoulder.left, A.sub(backNeck, A.lerp(shoulder.right, shoulder.left, 0.5)), [...points, backNeck]);
    }
    const biacromial: number = shoulder.left !== null && shoulder.right !== null ? A.dist(shoulder.left, shoulder.right) : NaN;

    // 5.4.5 back neck point to waist: taut down the back's median skin to the
    // waist level, the natural waist the trunk audit locates. The median
    // section's points behind the spine line between the two heights are the
    // back's profile; its outward side is -X (the back faces backward), so the
    // tape follows the thoracic convexity and bridges the lumbar hollow.
    let backNeckToWaist: number = NaN;
    if (backNeck !== null && backWaist !== null) {
      const points: V3[] = mid
        .flatMap((l: { points: V3[] }): V3[] => l.points)
        .filter((p: V3): boolean => p[1] >= backWaist[1] && p[1] <= backNeck[1] && p[0] < spineX(skin, p[1]));
      backNeckToWaist = taut(backNeck, backWaist, [-1, 0, 0], points);
    }

    // 5.4.10 side neck point to bust point: taut over the skin in the plane
    // through both points and the body's outward direction at their middle.
    // On a convex surface the shortest path between two points stays close to
    // the plane through them that holds the surface normal; the radial
    // direction from the spine line to the chord's middle stands for that
    // normal. Only torso skin within half the chord's length of it is cut, so
    // the arm and head stay out.
    const sideNeckToBust: Record<Side, number> = { left: NaN, right: NaN };
    for (const side of SIDES) {
      const a: V3 | null = sideNeck[side];
      const b: V3 | null = bust[side];
      if (a === null || b === null) continue;

      const m: V3 = A.lerp(a, b, 0.5);
      const out: V3 = A.sub(m, [spineX(skin, m[1]), m[1], 0]);
      const n: V3 = A.unit(A.cross(A.sub(b, a), out));
      const near: Uint32Array = A.near(skin, a, b, 0.5 * A.dist(a, b)).filter((i: number): boolean => L.member(skin, torso, i));
      const points: V3[] = A.polylines(skin, a, n, near).flatMap((l: { points: V3[] }): V3[] => l.points);
      sideNeckToBust[side] = taut(a, b, out, points);
    }

    // ANSUR II acromion-radiale and radiale-stylion lengths, each with a beam
    // caliper held parallel to its segment's long axis.
    const radiale: Record<Side, V3 | null> = { left: null, right: null };
    const stylion: Record<Side, V3 | null> = { left: null, right: null };
    const acromionRadiale: Record<Side, number> = { left: NaN, right: NaN };
    const radialeStylion: Record<Side, number> = { left: NaN, right: NaN };
    for (const side of SIDES) {
      const arm: HumanAnatomyCourseLandmarks.IArm = L.arm(skin, side);
      radiale[side] = arm.radiale;
      stylion[side] = arm.stylion;

      // Standing with the arm hanging, as ANSUR II measures, the acromion lies
      // straight above the shoulder joint and on the arm's axis; with the arm
      // raised away from the body it stays above the joint, so the length is
      // the joint-to-radiale run along the axis plus the acromion's height
      // above the joint, mm.
      const sp: V3 | null = shoulder[side];
      if (sp !== null && arm.radiale !== null) acromionRadiale[side] = A.dot(A.sub(arm.radiale, arm.shoulder), arm.upper) + (sp[1] - arm.shoulder[1]);

      // A caliper held parallel to the forearm reads the two landmarks'
      // separation along its axis, mm.
      if (arm.radiale !== null && arm.stylion !== null) radialeStylion[side] = A.dot(A.sub(arm.stylion, arm.radiale), arm.fore);
    }

    const made: ICourse = {
      bust,
      sideNeck,
      shoulder,
      backNeck,
      backWaist,
      radiale,
      stylion,
      bustPointWidth,
      acrossShoulder,
      biacromial,
      backNeckToWaist,
      sideNeckToBust,
      acromionRadiale,
      radialeStylion,
      crotch: t.crotch,
    };
    courses.set(skin, made);
    return made;
  }

  /**
   * Length of a tape drawn taut over a surface from one point to another on
   * one side of their chord: the convex hull, in the plane of the chord and a
   * side direction, of the two points and every given point lying on that
   * side between them, less the chord. A taut tape bridges each hollow, as
   * ANSUR II's tapes do "except where the tape spans the hollow".
   *
   * @param a Start landmark, mm.
   * @param b End landmark, mm.
   * @param side Direction away from the chord toward the surface's outside.
   * @param points Skin points near the path, mm.
   * @returns The tape's length from a to b, mm.
   */
  export function taut(a: V3, b: V3, side: V3, points: V3[]): number {
    const chord: number = A.dist(a, b);
    const e: V3 = A.unit(A.sub(b, a));
    const s: V3 = A.unit(A.reject(side, e));
    const planar: [number, number][] = [
      [0, 0],
      [chord, 0],
    ];

    // Plane coordinates: u along the chord from a (0 to chord), v away from
    // it on the outward side, mm. A taut tape over the points lies on their
    // convex hull's outward chain from a to b; the hull of that chain plus
    // the chord is a closed convex polygon whose perimeter is the chain's
    // length plus the chord.
    for (const p of points) {
      const q: V3 = A.sub(p, a);
      const u: number = A.dot(q, e);
      const v: number = A.dot(q, s);
      if (u > 0 && u < chord && v > 0) planar.push([u, v]);
    }
    return A.hull(planar) - chord;
  }
}

/** Course sites, located once per skin. */
const courses: WeakMap<HumanAnatomy.ISkin, HumanAnatomyCourse.ICourse> = new WeakMap();

/** Neck sites, located once per skin. */
const necks: WeakMap<HumanAnatomy.ISkin, HumanAnatomyShared.INeck> = new WeakMap();
