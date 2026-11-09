import { AutoMovieHumanArmBones } from "./AutoMovieHumanArmBones";
import { AutoMovieHumanArmCurveSpec } from "./AutoMovieHumanArmCurveSpec";
import type { AutoMovieHumanArmSegmentFrames } from "./AutoMovieHumanArmSegmentFrames";
import { AutoMovieHumanUpperArmForm } from "./AutoMovieHumanUpperArmForm";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * L1 of the arm experiment: the published arm landmarks and measurement
 * levels, each in its own segment frame, with its walk station on the
 * neutral arm walk (the straight course from the acromion level through the
 * elbow and wrist centres to the web of digit III, arclength in calibration
 * mm). A `point` landmark is a bony or skin point; a `level` landmark is a
 * plane normal to its segment axis, written as its point on the axis, whose
 * skin extent the view outlines own.
 *
 * Sources: ISB, Wu et al. 2005 (J Biomech 38:981-992) for EL, EM, US, RS and
 * the metacarpal heads; de Leva 1996 Table 2 (`docs/sources/de-leva-1996.md`)
 * for the acromion and radiale offsets along acromion-radiale; NHANES
 * 2015-2018 (`nhanes-2015-2018.md`) for the mid-upper-arm site; ANSUR II
 * (`ansur-ii.md`) for the acromion-radiale means and the wrist site over
 * stylion; Gray 1918 (`gray-1918.md`) for the deltoid, its insertion and the
 * olecranon; Perry et al. 2021 (Front Robot AI 8:576783, Table 3) for the
 * forearm maximum station; Heinz et al. 2003 (`heinz-2003-body-dimensions.md`)
 * for the epicondylar and styloid breadths the frames already carry.
 */
export namespace AutoMovieHumanArmLandmarks {
  /** One landmark. */
  export interface ILandmark {
    /** Landmark name, such as `biceps site`. */
    name: string;

    /** `point`: a bony or skin point; `level`: a plane normal to the segment axis, given by its axis point. */
    kind: "point" | "level";

    /** Segment frame the point is written in (`humerus.<side>`, `forearm.<side>`, `hand.<side>`). */
    frame: string;

    /** Coordinates in that frame, calibration mm. */
    point: Vec3;

    /** Station on the neutral arm walk from the acromion level, calibration mm. */
    walk: number;

    /** Published definition the landmark satisfies. */
    definition: string;

    /** Basis of the placement. */
    source: AutoMovieHumanArmCurveSpec.ISource;
  }

  /** A landmark whose published definition needs an input the person does not supply. */
  export interface IGap {
    /** Landmark or quantity. */
    name: string;

    /** Its published definition. */
    definition: string;

    /** The input proposed to close the gap. */
    proposed: string;

    /** What stands in for it meanwhile. */
    interim: string;
  }

  /** The landmarks and the recorded input gaps. */
  export interface IOutput {
    /** Every landmark, proximal to distal. */
    list: ILandmark[];

    /**
     * Neutral walk stations of the course: the dome pole (the skin over the
     * acromion, above walk zero), the acromion level (walk zero), GH (the
     * humeral head), the elbow and wrist centres, the knuckle centre and the
     * palm pole. The hand
     * course runs from the wrist centre through the knuckle centre (the
     * middle of the skin hand breadth across heads II-V) and ends one digit
     * III web length beyond it, at `end`.
     */
    course: { dome: number; acromion: number; port: number; elbow: number; wrist: number; knuckle: number; web: number };

    /** Course points in the humerus frame: dome pole, knuckle centre and palm pole. */
    points: { dome: Vec3; knuckle: Vec3; end: Vec3 };

    /** Input gaps. */
    gaps: IGap[];

    /** Whether the person is a woman: selects the per-sex published laws. */
    female: boolean;
  }

  /**
   * NHANES upper arm length (posterior acromion to the olecranon tip, elbow
   * at 90 degrees) over ANSUR II acromion-radiale, per sex: women 359 / 311.2,
   * men 390 / 335.2 (NHANES 2015-2018 adults 20-29 years; ANSUR II means).
   * Cross-survey ratio of means, US adults; it places the olecranon tip from
   * the person's own acromion-radiale.
   */
  export const OLECRANON_RATIO: { female: number; male: number } = { female: 359 / 311.2, male: 390 / 335.2 };

  /** f1's hand run turned volar about the wrist, rad: 8 degrees puts the palm pole about 15 mm volar of the knuckles' plane (authored for f1). */
  export const PALM_POLE_TILT: number = (8 * Math.PI) / 180;

  /**
   * The axilla below the acromion over acromion-radiale, per sex: ANSUR II
   * (acromial height - axilla height) / acromion-radiale means, women
   * (1335.1 - 1239.0) / 311.2 and men (1440.7 - 1329.1) / 335.2.
   */
  export const AXILLA_RATIO: { female: number; male: number } = { female: (1335.1 - 1239.0) / 311.2, male: (1440.7 - 1329.1) / 335.2 };

  /** Perry et al. 2021: the fitted forearm perimeter falls monotonically over 0.2-1.0 of radiale-stylion, so its maximum within the fit lies at the fit's proximal end, 0.2 RS distal of radiale. */
  export const FOREARM_MAXIMUM: number = 0.2;

  /** Build the landmarks from the frames and the public lengths. */
  export function create(frames: AutoMovieHumanArmSegmentFrames.IOutput, arms: { upper: number; lower: number; sex: number }): IOutput {
    const L: AutoMovieHumanArmSegmentFrames.ILengths = frames.lengths;
    const P: AutoMovieHumanArmSegmentFrames.IPoints = frames.points;
    const H: string = frames.humerus.name;
    const F: string = frames.forearm.name;
    const N: string = frames.hand.name;
    const female: boolean = arms.sex > 0;
    const radiale: number = AutoMovieHumanArmBones.RADIALE * arms.upper;

    // Walk stations of the course centres (straight neutral course). The
    // knuckle centre is the middle of the skin hand breadth: heads II and V
    // stand one and two quarter breadths either side of MC3 (the frames'
    // convention), so it lies half a quarter breadth medial (ulnar) of MC3.
    const acromion: number = 0;
    // The dome pole: the acromion level on the humerus axis. The acromion is
    // a skin landmark (ANSUR marks it on the skin), so no skin is added.
    const dome: Vec3 = [0, L.acromion, 0];
    const elbow: number = L.acromion + L.humerus;
    const wrist: number = elbow + L.forearm;
    // Across the hand is the hand frame's Z, medial (ulnar) by the side's sign.
    const handZ: Vec3 = AutoMovieHumanArmCurveSpec.compose(frames.forearm.relative, frames.hand.relative).axes[2];
    const ulnar: Vec3 = scale(handZ, frames.medial);
    const knuckle: Vec3 = add(P.metacarpals[2]!.head, scale(ulnar, frames.breadths.hand / 8));
    const toKnuckle: number = Math.hypot(...sub(knuckle, P.wrist));
    // f1's palm pole under the palm pad: the hand's run is turned volar about the wrist by PALM_POLE_TILT with its length
    // kept, so the course's end (between the middle and ring rays, where both fingers would leave the palm on its pole)
    // stands volar of the knuckles' plane and every finger leaves the palm on regular chart ground.
    const handX: Vec3 = AutoMovieHumanArmCurveSpec.compose(frames.forearm.relative, frames.hand.relative).axes[0];
    const straight: Vec3 = scale(sub(knuckle, P.wrist), 1 / toKnuckle);
    const turned: Vec3 = add(scale(straight, Math.cos(PALM_POLE_TILT)), scale(handX, Math.sin(PALM_POLE_TILT)));
    const end: Vec3 = add(P.wrist, scale(turned, toKnuckle + L.web));
    const web: number = wrist + toKnuckle + L.web;
    // Forearm points are read in the ISB forearm frame through its relative transform.
    const toForearm: (p: Vec3) => Vec3 = (p: Vec3): Vec3 => inverseApply(frames.forearm.relative, p);
    const toHand: (p: Vec3) => Vec3 = (p: Vec3): Vec3 => inverseApply(frames.hand.relative, toForearm(p));
    const olecranon: number = (female ? OLECRANON_RATIO.female : OLECRANON_RATIO.male) * arms.upper;
    const axilla: number = (female ? AXILLA_RATIO.female : AXILLA_RATIO.male) * arms.upper;
    const biceps: number = olecranon / 2;
    const forearmMax: number = radiale + FOREARM_MAXIMUM * arms.lower;
    const stylion: number = L.forearm - AutoMovieHumanArmBones.STYLION_WRIST;
    // Forearm levels stand on the posed elbow-to-wrist axis, so they turn with the elbow.
    const forearmAxis: Vec3 = scale(sub(P.wrist, P.elbow), 1 / L.forearm);
    const onForearm: (along: number) => Vec3 = (along: number): Vec3 => add(P.elbow, scale(forearmAxis, along));

    const list: ILandmark[] = [
      {
        name: "dome pole",
        kind: "point",
        frame: H,
        point: dome,
        walk: acromion,
        definition: "The arm's dome pole: the acromion level on the humerus axis, where the deltoid cap's top meets the shoulder line under the trunk's skin over the acromion.",
        source: { kind: "published", citation: "de Leva 1996 Table 2; ANSUR II acromion (a skin landmark)", detail: "the acromion level 0.1044 acromion-radiale above GH, carried onto the humerus axis" },
      },
      {
        name: "acromion",
        kind: "level",
        frame: H,
        point: [0, L.acromion, 0],
        walk: acromion,
        definition: "Acromiale level: the lateral acromion border, projected on the humerus Y; GH lies 0.1044 acromion-radiale below it.",
        source: { kind: "published", citation: "de Leva 1996 Table 2", detail: "shoulder centre 33.7 (F) / 34.5 (M) mm below the acromion of a 322.7 / 330.5 mm acromion-radiale" },
      },
      {
        name: "deltoid point",
        kind: "level",
        frame: H,
        point: [0, 0, 0],
        walk: L.acromion,
        definition: "Most lateral point of the deltoid, over the greater tubercle, the most lateral bony point of the shoulder when the arm hangs.",
        source: { kind: "published", citation: "Gray 1918, surface anatomy of the upper extremity", detail: "the deltoid covers the greater tubercle; its level is taken at the humeral head centre (GH)" },
      },
      {
        name: "axilla level",
        kind: "level",
        frame: H,
        point: [0, L.acromion - axilla, 0],
        walk: axilla,
        definition: "Level of the axilla, where ANSUR 1988's axillary arm circumference is taken: ANSUR II acromial height less axilla height, per sex, over its acromion-radiale.",
        source: { kind: "published", citation: "ANSUR II means (acromial height 1335.1 / 1440.7, axilla height 1239.0 / 1329.1, acromion-radiale 311.2 / 335.2 mm)", detail: `the axilla ${axilla.toFixed(2)} mm below the acromion (ratio of means times acromion-radiale)` },
      },
      {
        name: "deltoid insertion",
        kind: "level",
        frame: H,
        point: [0, -AutoMovieHumanUpperArmForm.INSERTION * L.humerus, 0],
        walk: L.acromion + AutoMovieHumanUpperArmForm.INSERTION * L.humerus,
        definition: "Distal end of the deltoid insertion on the deltoid tuberosity; shows as a depression at mid lateral arm (Gray 1918).",
        source: {
          kind: "published",
          citation: "Huri et al. 2014 Acta Orthop Traumatol Turc 48:584; Morgan et al. 2006 J Orthop Trauma",
          detail: "51 % of the greater tubercle-lateral epicondyle length above the epicondyle, read from GH (the tubercle's level, Gray) to the elbow centre; Morgan's 158 mm from the tuberosity agrees",
        },
      },
      {
        name: "muscle thickness site",
        kind: "level",
        frame: H,
        point: [0, L.acromion - AutoMovieHumanUpperArmForm.SITE * elbow, 0],
        walk: AutoMovieHumanUpperArmForm.SITE * elbow,
        definition: "60 % of the acromion-lateral epicondyle distance from the acromion, where the anterior and posterior muscle thicknesses are measured.",
        source: { kind: "published", citation: "Abe et al. 1994; Sanada et al. 2006 Eur J Appl Physiol 96:24; Akagi et al. 2011 J Physiol Anthropol 30:169", detail: "acromion to the lateral epicondyle (the elbow centre's level here)" },
      },
      {
        name: "biceps site",
        kind: "level",
        frame: H,
        point: [0, L.acromion - biceps, 0],
        walk: biceps,
        definition: "NHANES mid-upper-arm circumference site: midway between the posterior acromion and the olecranon tip, elbow at 90 degrees.",
        source: { kind: "published", citation: "NHANES 2015-2018 upper arm length; ANSUR II acromion-radiale", detail: `olecranon tip ${olecranon.toFixed(2)} mm below the acromion (ratio of means times acromion-radiale)` },
      },
      {
        name: "olecranon",
        kind: "point",
        frame: H,
        point: [0, -L.humerus, 0],
        walk: elbow,
        definition: "Olecranon tip with the elbow extended: level with, and nearer to, the medial epicondyle; its skin extent is the posterior outline at the elbow.",
        source: { kind: "published", citation: "Gray 1918, surface anatomy", detail: "extension: tip level with the epicondyles; the posterior offset is the side outline's" },
      },
      {
        name: "EL",
        kind: "point",
        frame: H,
        point: P.epicondyles.lateral,
        walk: elbow,
        definition: "Most caudal-lateral point on the lateral epicondyle (ISB 2.3.4).",
        source: { kind: "published", citation: "Wu et al. 2005; Heinz et al. 2003", detail: "half the biepicondylar breadth lateral of the elbow centre" },
      },
      {
        name: "EM",
        kind: "point",
        frame: H,
        point: P.epicondyles.medial,
        walk: elbow,
        definition: "Most caudal-medial point on the medial epicondyle (ISB 2.3.4).",
        source: { kind: "published", citation: "Wu et al. 2005; Heinz et al. 2003", detail: "half the biepicondylar breadth medial of the elbow centre" },
      },
      {
        name: "radiale",
        kind: "level",
        frame: F,
        point: toForearm(onForearm(radiale)),
        walk: elbow + radiale,
        definition: "Upper edge of the radial head, 0.0432 acromion-radiale distal of the elbow centre.",
        source: { kind: "published", citation: "de Leva 1996 Table 2", detail: "elbow centre 13.9 (F) / 14.3 (M) mm proximal of radiale" },
      },
      {
        name: "forearm maximum",
        kind: "level",
        frame: F,
        point: toForearm(onForearm(forearmMax)),
        walk: elbow + forearmMax,
        definition: "Maximum forearm girth distal to the epicondyles, at 0.2 radiale-stylion distal of radiale.",
        source: { kind: "published", citation: "Perry et al. 2021, Front Robot AI 8:576783, Table 3 (supination, CS2)", detail: "the fitted major-plus-minor axis falls monotonically over 0.2-1.0 RS; maximum at the fit's proximal end" },
      },
      {
        name: "stylion",
        kind: "point",
        frame: F,
        point: toForearm(P.styloids.radial),
        walk: elbow + stylion,
        definition: "Radial styloid tip (RS, ISB 2.3.6); the wrist girth (ANSUR II) and bistyloid breadth (Heinz) are taken here.",
        source: { kind: "published", citation: "Wu et al. 2005; Heinz et al. 2003; de Leva 1996", detail: "1.5 mm proximal of the wrist centre, half the bistyloid breadth lateral" },
      },
      {
        name: "ulnar styloid",
        kind: "point",
        frame: F,
        point: toForearm(P.styloids.ulnar),
        walk: elbow + stylion,
        definition: "Ulnar styloid tip (US, ISB 2.3.6), the forearm frame's origin.",
        source: { kind: "published", citation: "Wu et al. 2005; Heinz et al. 2003", detail: "half the bistyloid breadth medial, at the stylion level (declared)" },
      },
      {
        name: "wrist plane",
        kind: "level",
        frame: F,
        point: toForearm(onForearm(stylion)),
        walk: elbow + stylion,
        definition: "Wrist breadth and girth plane through stylion, normal to the forearm axis.",
        source: { kind: "published", citation: "ANSUR II wrist circumference; Heinz et al. 2003 bistyloid", detail: "over stylion" },
      },
      ...P.metacarpals.slice(1).map(
        (b: { base: Vec3; head: Vec3 }, k: number): ILandmark => ({
          name: `metacarpal head ${["II", "III", "IV", "V"][k]}`,
          kind: "point",
          frame: N,
          point: toHand(b.head),
          walk: wrist + L.palm,
          definition: "Metacarpal head centre (ISB 4.3.4); heads II to V carry the hand breadth and the hand circumference (ANSUR).",
          source: { kind: "derived", rule: "MC3 head palm length past the wrist centre; heads II-V at quarter hand-breadth intervals, parallel metacarpals (declared convention)" },
        }),
      ),
      {
        name: "knuckles",
        kind: "level",
        frame: N,
        point: toHand(knuckle),
        walk: wrist + toKnuckle,
        definition: "Hand breadth and hand circumference plane across metacarpal heads II-V (ANSUR), on the course through the breadth's middle.",
        source: { kind: "derived", rule: "MC3 head moved half a quarter hand breadth ulnar: the middle of heads II-V under the frames' quarter-breadth convention" },
      },
      {
        name: "web III",
        kind: "level",
        frame: N,
        point: toHand(end),
        walk: web,
        definition: "Web of digit III, 15.33 % of the web-to-tip finger length beyond the MCP joint; the palm's distal pole stands this far beyond the knuckle centre.",
        source: { kind: "published", citation: "Buryanov and Kotiuk 2010 Table III", detail: "web share of the external finger length" },
      },
    ];
    const gaps: IGap[] = [
      { name: "olecranon tip", definition: "NHANES: tip of the olecranon with the elbow flexed 90 degrees", proposed: "upper arm length (acromion-olecranon, NHANES) as a public input", interim: "cross-survey ratio of means times acromion-radiale" },
      { name: "deltoid point (lateral)", definition: "Bideltoid breadth: maximum breadth over the deltoids (ANSUR II)", proposed: "bideltoid breadth with the biacromial breadth, read with the trunk's GH datum", interim: "the lateral outline's free extremum at the GH level" },
      { name: "elbow skin depth split", definition: "Anterior and posterior skin offsets from the flexion axis at the elbow girth plane", proposed: "elbow depth (anterior skin to olecranon), arm extended", interim: "depth from the elbow tape on the epicondylar breadth as an ellipse, split evenly" },
      { name: "radial styloid level", definition: "RS stands distal of US (ISB 2.3.6 places both independently)", proposed: "none needed once a population offset is sourced", interim: "both at the stylion level" },
      { name: "carrying angle", definition: "ISB 3.4.1 beta, a passive response rarely reported", proposed: "carrying angle", interim: "zero lateral lean" },
      { name: "metacarpal head spacing", definition: "Head centres II-V across the knuckle line", proposed: "hand breadth at metacarpals with head positions", interim: "quarter hand-breadth intervals" },
    ];
    return { list, course: { dome: acromion, acromion, port: L.acromion, elbow, wrist, knuckle: wrist + toKnuckle, web }, points: { dome, knuckle, end }, gaps, female };
  }

  /** The named landmark; throws on an unknown name. */
  export function get(output: IOutput, name: string): ILandmark {
    const found: ILandmark | undefined = output.list.find((l: ILandmark): boolean => l.name === name);
    if (found === undefined) throw new Error(`Unknown arm landmark ${name}`);
    return found;
  }
}

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

/** Child coordinates of a parent point under a rigid relative transform. */
function inverseApply(t: AutoMovieHumanArmCurveSpec.ITransform, p: Vec3): Vec3 {
  const d: Vec3 = [p[0] - t.origin[0], p[1] - t.origin[1], p[2] - t.origin[2]];
  return [0, 1, 2].map((k: number): number => t.axes[k]![0] * d[0] + t.axes[k]![1] * d[1] + t.axes[k]![2] * d[2]) as Vec3;
}
