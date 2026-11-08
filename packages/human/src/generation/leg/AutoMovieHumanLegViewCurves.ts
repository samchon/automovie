import { type IAutoMovieLoftRelief, type IAutoMovieViewPart } from "@automovie/engine";

import { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanArmViewCurves } from "../arm/AutoMovieHumanArmViewCurves";
import { AutoMovieHumanFairOutline } from "../arm/AutoMovieHumanFairOutline";
import { AutoMovieHumanLegCourse } from "./AutoMovieHumanLegCourse";
import { AutoMovieHumanLegF1Lines } from "./AutoMovieHumanLegF1Lines";
import { AutoMovieHumanLegForefoot } from "./AutoMovieHumanLegForefoot";
import { AutoMovieHumanLegHeel } from "./AutoMovieHumanLegHeel";
import { AutoMovieHumanLegLandmarks } from "./AutoMovieHumanLegLandmarks";
import { AutoMovieHumanLegPatella } from "./AutoMovieHumanLegPatella";
import type { AutoMovieHumanLegSegmentFrames } from "./AutoMovieHumanLegSegmentFrames";
import { AutoMovieHumanLegSiteShoulder } from "./AutoMovieHumanLegSiteShoulder";
import { AutoMovieHumanLegSole } from "./AutoMovieHumanLegSole";
import { AutoMovieHumanLegViewSegments } from "./AutoMovieHumanLegViewSegments";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * L2 of the leg by conic lofting: the thigh (femur frame), the shank (tibia
 * frame) and the foot (calcaneus frame) are drawn by a few 2D view curves,
 * their front outline pair (lateral and medial skin extents), their side
 * outline pair (anterior and posterior; on the foot, dorsal and plantar, the
 * same lines carried round the ankle turn), the axis and the conic fullness.
 * Each outline is one C2 quintic Hermite chain over the whole walk in the
 * engine's one-pole root parameter `q = -sqrt(E - s)` (`E` the toe-web pole),
 * the minimum bending energy under the datums the anatomy fixes
 * (`AutoMovieHumanFairOutline`): box extents at the girth sites, zero slopes
 * at the declared bellies (calf) and waists (ankle minimum) and at the
 * malleoli, and zero radius at the pole. Every free height is supplied by
 * that minimum, never invented.
 *
 * Boxes (half extents lateral, medial, anterior, posterior about the axis):
 * - port (crotch level): the thigh tape's circle leaving parallel to the axis,
 *   an interim while the port's section belongs to f1_trunk's pending hip
 *   band;
 * - gluteal furrow, suprapatella, mid-patella, calf maximum, ankle minimum:
 *   the circle of each tape, the null law while the person's thigh, knee, calf
 *   and ankle breadths and depths are input gaps. This replaces the old leg's
 *   reference-fitted section box, thigh and shank splits and front share
 *   (disposition rows 4-5b to 4-5d), none of which is read here;
 * - ankle bisection (IM, the turn's midpoint plane, stretched by
 *   `1 / cos(theta / 2)` about IM, Thalmann 1996): the bimalleolar skin
 *   breadth across; the anterior extent on the ankle tape's straight tendon
 *   line (the front-ankle juncture; null law while the ankle depth at the
 *   malleoli is an input gap); the posterior extent where the bisection ray
 *   meets the heel's back line, and inside the turn the heel's sagittal
 *   profile (`AutoMovieHumanLegHeel`); the fullness first solved on that box
 *   for the heel-ankle tape, then by the build until the tape's own loop
 *   closes it. ANSUR II's heel-ankle tape runs on its own diagonal plane from
 *   the heel's first floor contact over the front-ankle juncture
 *   (`AutoMovieHumanLegHeelAnkle`), not on the bisection plane: on f1 that
 *   plane measures 268.3 mm against the 308.5 mm tape;
 * - the end of the ankle turn on the foot run: the plantar extent to the
 *   floor (the lateral border stands on the floor from the heel to the
 *   fifth head);
 * - dorsum (half the foot length, no tape): the dorsal point at the
 *   Williams and McClay 2000 arch height index, dorsum height 0.292 of the
 *   truncated foot length (90 % weight bearing; truncated length = the ball
 *   length), and the plantar extent to the floor;
 * - ball (metatarsal heads I-V): the lateral and medial extents read from the
 *   front pair, which closes the forefoot through the heads' skin ends and
 *   the toes' web stations (`AutoMovieHumanLegForefoot`); the plantar extent
 *   to the floor; the section's whole depth from the ball tape as an ellipse
 *   on the breadth (null law; ball height is an input gap).
 * The fullness at each girth site is solved on that site's box so the conic
 * section's taut-tape perimeter equals the tape (the bisection's on its
 * stretched box; `AutoMovieHumanLegSiteShoulder`). Over the forefoot the two
 * plantar quarters depart from that shoulder to hold the flat sole across
 * the heads (`AutoMovieHumanLegSole`), and the ball tape is solved with them.
 */
export namespace AutoMovieHumanLegViewCurves {
  /** The four outline labels. */
  export type Label = "lateral" | "medial" | "anterior" | "posterior";

  /** The four labels. */
  export const LABELS: readonly Label[] = ["lateral", "medial", "anterior", "posterior"];

  /** Arch height index at 90 % weight bearing (Williams and McClay 2000, Table 2). */
  export const ARCH_HEIGHT_INDEX: number = 0.292;

  /** The null conic shoulder, an exact quarter ellipse. */
  export const ELLIPSE: number = Math.SQRT2 - 1;

  /** Public tapes and breadths, calibration mm. */
  export interface ITapes {
    /** Thigh tape at the gluteal furrow. */
    thigh: number;

    /** Lower thigh tape at suprapatella. */
    lowerThigh: number;

    /** Knee tape at mid-patella. */
    knee: number;

    /** Calf tape at its maximum. */
    calf: number;

    /** Ankle tape at its minimum above the malleoli. */
    ankle: number;

    /** Heel-ankle tape (ANSUR II). */
    heelAnkle: number;

    /** Ball-of-foot tape over heads I and V. */
    ball: number;

    /** Foot breadth across the metatarsal heads. */
    footBreadth: number;

    /** Bimalleolar breadth. */
    bimalleolar: number;

    /** The hip centre's distance from the midsagittal plane (the trunk's hip port), mm: the furrow's medial extent where the inner thighs meet. Absent, no contact is imposed. */
    midline?: number;

    /** The trunk-thigh lateral line's extent from the femur axis at the crotch (the split's ring, interim for f1_trunk's lateral contour), mm: the furrow's lateral extent. Absent, the tape's circle sets it. */
    thighLateral?: number;

    /** The trunk-thigh back contour's extent behind the femur axis at the fold (f1_trunk's gluteal contour), mm: the furrow's back extent. */
    thighBack?: number;

    /** The thigh root's front extent before the femur axis at the crotch (the split ring's, interim for f1_trunk's front contour), mm: the furrow's front extent, the fullness then closing the tape. */
    thighFront?: number;

    /** The thigh's start on S00's half loop (AutoMovieHumanTrunkPelvisSplit): the ring's lateral, medial, anterior and posterior extents from the femur axis at the crotch and their slopes per mm of walk, the port datums' values and slopes. Absent, the furrow's values, parallel. */
    port?: {
      /** Extents: lateral, medial, anterior, posterior, mm. */
      box: [number, number, number, number];

      /** Their slopes per mm of walk. */
      slopes: [number, number, number, number];

      /** The ring's quarter shoulders (the chart's conic shoulder, NaN where the ring misses the diagonal): lateral-posterior, posterior-medial, medial-anterior, anterior-lateral. */
      shoulders: [number, number, number, number];
    };

    /** The patella relief's footprint row and scale: present, the loft carries the relief and mid-patella's fullness closes the knee tape over it. */
    patella?: { sex: number; scale: number };
  }

  /** One girth site with its box and solved fullness. */
  export interface ISite {
    /** Landmark name. */
    name: string;

    /** Neutral walk station, mm. */
    walk: number;

    /** Half extents lateral, medial, anterior, posterior, mm; at a joint the common extents before the bisection stretch. */
    box: [number, number, number, number];

    /** The tape the section must close, mm. */
    girth: number;

    /** Conic shoulder. */
    shoulder: number;

    /** Basis of the box. */
    basis: string;
  }

  /** A declared extremum at a knot. */
  export type Sense = "max" | "min" | null;

  /** One knot of a whole-walk outline in the neutral root parameter (the leg's own record, the arm's layout). */
  export interface IKnot {
    /** Landmark name. */
    site: string;

    /** Neutral walk station, mm. */
    walk: number;

    /** Root parameter `-sqrt(E - walk)`, sqrt(mm); the fullness uses the walk station itself. */
    q: number;

    /** Skin offset from the axis, mm (dimensionless for the fullness). */
    value: number;

    /** d value / dq. */
    first: number;

    /** d2 value / dq2. */
    second: number;

    /** Declared extremum at this knot (zero slope), if any. */
    sense: Sense;

    /** The datums that fixed it. */
    rule: string;
  }

  /** A segment's own zero and view directions in its own frame. */
  export interface ISegment {
    /** `femur`, `tibia` or `foot`. */
    name: "femur" | "tibia" | "foot";

    /** Its frame name. */
    frame: string;

    /** Walk station of its zero (hip centre, knee centre, IM), mm. */
    walk: number;

    /** Walk interval it owns, mm. */
    interval: [number, number];

    /** Axis point at its zero, own frame, mm. */
    origin: Vec3;

    /** Unit distal direction of its axis, own frame. */
    distal: Vec3;

    /** Unit lateral direction, own frame. */
    lateral: Vec3;

    /** Unit anterior (on the foot dorsal) direction, own frame. */
    anterior: Vec3;
  }

  /** The view curves. */
  export interface IOutput {
    /** Neutral walk station of the port, mm. */
    start: number;

    /** Neutral walk station of the toe-web pole, mm. */
    end: number;

    /** Girth sites proximal to distal. */
    sites: ISite[];

    /** Whole-walk outlines, unsigned skin offsets from the axis, mm. */
    outlines: Record<Label, IKnot[]>;

    /** Whole-walk conic shoulder, its knots in station. */
    fullness: IKnot[];

    /** The forefoot's flat sole: each quarter's held shoulder and its departure knots, the loft chart's quarter order. */
    sole: { needs: IAutoMovieViewPart.IQuarters<number>; departures: IAutoMovieViewPart.IQuarters<AutoMovieHumanLegSole.IKnot[]> };

    /** Segment zeros on the neutral walk and their frames. */
    segments: ISegment[];

    /** Course centres in the femur frame at neutral: port, knee centre, IM, toe-web pole. */
    centres: Vec3[];

    /** Neutral course used for the ankle bisection. */
    course: AutoMovieHumanLegCourse.IOutput;

    /** The ankle bisection box after the stretch: lateral, medial, anterior, posterior, about the course point. */
    bisection: [number, number, number, number];

    /** The patella relief's inputs when the leg carries it (its mid-patella fullness then closes the tape over it), or null. */
    patella: { sex: number; scale: number } | null;

    /** The port's quarter shoulders from S00's ring in the chart's quarter order, carried as departures to the gluteal furrow; absent without the split. */
    port?: IAutoMovieViewPart.IQuarters<number>;

    /** Constructor notes. */
    diagnostics: string[];
  }

  /** Root parameter of a walk station for the pole at `end`. */
  export function parameter(walk: number, end: number): number {
    return -Math.sqrt(Math.max(0, end - walk));
  }

  /** Value and first two station derivatives of a whole-walk outline. */
  export function value(knots: readonly IKnot[], walk: number, end: number): [number, number, number] {
    const q: number = parameter(walk, end);
    const [y, yq, yqq]: [number, number, number] = AutoMovieHumanFairOutline.evaluate(
      knots.map((k: IKnot): number => k.q),
      knots.map((k: IKnot): AutoMovieHumanFairOutline.IJet => ({ value: k.value, first: k.first, second: k.second })),
      q,
    );
    // s = E - q^2: ds/dq = -2 q, d2s/dq2 = -2.
    if (!(q < 0)) return [y, NaN, NaN];
    const ys: number = yq / (-2 * q);
    return [y, ys, (yqq + 2 * ys) / (4 * q * q)];
  }

  /** The whole-walk fullness: the sites' solved shoulders, the port and the pole repeating their neighbours', joined by the natural cubic in station. */
  export function fullnessThrough(sites: readonly ISite[], start: number, end: number): IKnot[] {
    const datums: { site: string; walk: number; value: number }[] = [
      { site: "port", walk: start, value: sites[0]!.shoulder },
      ...sites.map((s: ISite): { site: string; walk: number; value: number } => ({ site: s.name, walk: s.walk, value: s.shoulder })),
      { site: "web", walk: end, value: sites[sites.length - 1]!.shoulder },
    ];
    const jets: AutoMovieHumanFairOutline.IJet[] = AutoMovieHumanFairOutline.solve(datums.map((x: { walk: number; value: number }): AutoMovieHumanFairOutline.IKnot => ({ q: x.walk, value: x.value, slope: null })));
    return datums.map((x: { site: string; walk: number }, i: number): IKnot => ({
      site: x.site,
      walk: x.walk,
      q: x.walk,
      value: jets[i]!.value,
      first: jets[i]!.first,
      second: jets[i]!.second,
      sense: null,
      rule: i === 0 || i === datums.length - 1 ? "repeats its neighbouring site" : "solved on the site's box for its tape",
    }));
  }

  /** The fullness's value at a walk. */
  export function fullnessAt(knots: readonly IKnot[], walk: number): number {
    return AutoMovieHumanFairOutline.evaluate(
      knots.map((k: IKnot): number => k.q),
      knots.map((k: IKnot): AutoMovieHumanFairOutline.IJet => ({ value: k.value, first: k.first, second: k.second })),
      walk,
    )[0];
  }

  /**
   * The curves with one site's shoulder replaced (the build closes the
   * heel-ankle tape on its own plane this way): the fullness re-solved
   * through it, and the flat sole's departures re-read against it at their
   * own knots, its held shoulders unchanged.
   */
  export function reshoulder(curves: IOutput, site: string, shoulder: number): IOutput {
    const sites: ISite[] = curves.sites.map((s: ISite): ISite => (s.name === site ? { ...s, shoulder } : s));
    const knots: IKnot[] = fullnessThrough(sites, curves.start, curves.end);
    const walks: { site: string; walk: number }[] = curves.sole.departures[0].map((k: AutoMovieHumanLegSole.IKnot): { site: string; walk: number } => ({ site: k.site, walk: k.walk }));
    const im: number = walks.find((k: { site: string }): boolean => k.site === "IM")?.walk ?? curves.start;
    const departures: IAutoMovieViewPart.IQuarters<AutoMovieHumanLegSole.IKnot[]> = AutoMovieHumanLegSole.departures(
      curves.sole.needs,
      (walk: number): number => fullnessAt(knots, walk),
      walks.filter((k: { site: string }): boolean => k.site !== "port" && k.site !== "IM" && k.site !== "web"),
      curves.start,
      im,
      curves.end,
    );
    return { ...curves, sites, fullness: knots, sole: { needs: curves.sole.needs, departures: seat(departures, curves.port, (walk: number): number => fullnessAt(knots, walk), curves.start, AutoMovieHumanLegF1Lines.fade()) } };
  }

  /**
   * The port's quarter shoulders as departures from the common fullness:
   * each quarter departs at the port by its ring shoulder less the common one
   * there and returns to zero at `until` (the first authored thigh knot),
   * held flat at both as the sole's departures are, so the leg's first
   * section is S00's ring in every quarter and the authored fullness rules
   * from there down.
   */
  function seat(
    departures: IAutoMovieViewPart.IQuarters<AutoMovieHumanLegSole.IKnot[]>,
    quarters: IAutoMovieViewPart.IQuarters<number> | undefined,
    shoulder: (walk: number) => number,
    start: number,
    until: number,
  ): IAutoMovieViewPart.IQuarters<AutoMovieHumanLegSole.IKnot[]> {
    if (quarters === undefined || !(until > start + 1e-6)) return departures;
    return departures.map((list: AutoMovieHumanLegSole.IKnot[], q: number): AutoMovieHumanLegSole.IKnot[] => [
      { site: "port", walk: start, value: quarters[q]! - shoulder(start) },
      { site: "ring fade", walk: until, value: 0 },
      ...list.filter((k: AutoMovieHumanLegSole.IKnot): boolean => k.walk > until + 1e-6),
    ]) as IAutoMovieViewPart.IQuarters<AutoMovieHumanLegSole.IKnot[]>;
  }

  /** Build the view curves from the frames, the landmarks and the tapes. */
  export function create(frames: AutoMovieHumanLegSegmentFrames.IOutput, landmarks: AutoMovieHumanLegLandmarks.IOutput, tapes: ITapes): IOutput {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const at: (name: string) => number = (name: string): number => AutoMovieHumanLegLandmarks.get(landmarks, name).walk;
    const start: number = landmarks.course.port;
    const end: number = landmarks.course.web;
    const m: 1 | -1 = frames.medial;
    const diagnostics: string[] = [];

    // Foot course geometry in the foot frame: the slope of IM to the pole.
    const webFoot: Vec3 = AutoMovieHumanLegLandmarks.get(landmarks, "web").point;
    const t: Vec3 = S.unit(webFoot);
    // Dorsal normal: the vertical's part normal to the course (up and forward).
    const n: Vec3 = S.unit([-t[0] * t[1], 1 - t[1] * t[1], -t[2] * t[1]]);
    const floor: number = landmarks.foot.floor;
    const plantar: (along: number) => number = (along: number): number => (along * t[1] - floor) / n[1];
    // The floor seen along the foot run: the plantar extent grows by t_y / n_y per mm of station (a straight line).
    const floorSlope: number = t[1] / n[1];

    /* The parameter-based boxes, kept for the later algorithmization (f1's authored lines, AutoMovieHumanLegF1Lines, replace them):
    // Circle boxes of the tapes (null law).
    const circle: (girth: number) => [number, number, number, number] = (girth: number): [number, number, number, number] => {
      const r: number = girth / (2 * Math.PI);
      return [r, r, r, r];
    };
    // Gluteal furrow: the inner thighs meet at the midsagittal plane when the
    // tape's circle about the hip centre would cross it (the thighs cannot
    // interpenetrate; a thigh gap is an input gap); the box keeps the circle's
    // breadth and depth and the fullness closes the tape.
    const thighR: number = tapes.thigh / (2 * Math.PI);
    const contact: boolean = tapes.midline !== undefined && tapes.midline < thighR;
    const medialFurrow: number = contact ? tapes.midline! : thighR;
    // The lateral side carries the trunk-thigh lateral line from the split's ring when given (interim for f1_trunk's lateral contour); the half depth then closes the tape at the null fullness.
    const depthFor: (lateral: number) => number = (lateral: number): number => {
      let lo: number = 1;
      let hi: number = tapes.thigh;
      for (let k: number = 0; k < 80; ++k) {
        const mid: number = (lo + hi) / 2;
        const p: number = AutoMovieViewSection.length(AutoMovieViewSection.of({ extents: [lateral, mid, medialFurrow, mid] }, [ELLIPSE, ELLIPSE, ELLIPSE, ELLIPSE]));
        if (p < tapes.thigh) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    };
    // With the trunk's back contour at the fold (f1_trunk's gluteal contour), the back is that value and the front closes the tape at the null fullness.
    const frontFor: (lateral: number, back: number) => number = (lateral: number, back: number): number => {
      let lo: number = 1;
      let hi: number = tapes.thigh;
      for (let k: number = 0; k < 80; ++k) {
        const mid: number = (lo + hi) / 2;
        const p: number = AutoMovieViewSection.length(AutoMovieViewSection.of({ extents: [lateral, back, medialFurrow, mid] }, [ELLIPSE, ELLIPSE, ELLIPSE, ELLIPSE]));
        if (p < tapes.thigh) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    };
    const furrow: [number, number, number, number] = tapes.thighLateral !== undefined && tapes.thighBack !== undefined && tapes.thighFront !== undefined ? [tapes.thighLateral, medialFurrow, tapes.thighFront, tapes.thighBack] : tapes.thighLateral !== undefined && tapes.thighBack !== undefined ? [tapes.thighLateral, medialFurrow, frontFor(tapes.thighLateral, tapes.thighBack), tapes.thighBack] : tapes.thighLateral !== undefined ? [tapes.thighLateral, medialFurrow, depthFor(tapes.thighLateral), depthFor(tapes.thighLateral)] : contact ? [2 * thighR - tapes.midline!, tapes.midline!, thighR, thighR] : circle(tapes.thigh);
    */
    const F1: typeof AutoMovieHumanLegF1Lines = AutoMovieHumanLegF1Lines;
    const ballWalk: number = at("ball");
    const ballAlong: number = ballWalk - landmarks.course.im;
    const ballDepth: number = 2 * AutoMovieHumanArmViewCurves.semiAxis(tapes.ball, tapes.footBreadth / 2);
    const ballPlantar: number = plantar(ballAlong);
    const raw: Omit<ISite, "shoulder">[] = [
      { name: "gluteal furrow", walk: at("gluteal furrow"), box: F1.site("gluteal furrow"), girth: tapes.thigh, basis: "authored (AutoMovieHumanLegF1Lines), carrying on from S00's half loop at the crotch" }, // law: box: furrow, basis: tapes.thighLateral !== undefined && tapes.thighBack !== undefined && tapes.thighFront !== undefined ? `every side from the trunk's shared contours at the fold: lateral ${tapes.thighLateral.toFixed(2)} (lateral line), back ${tapes.thighBack.toFixed(2)} (gluteal contour), front ${tapes.thighFront.toFixed(2)} (the split ring's thigh-root front), medial ${medialFurrow.toFixed(2)} mm${contact ? " on the midsagittal plane (the inner thighs meet; thigh gap is an input gap)" : ""}; the fullness closes the tape` : tapes.thighLateral !== undefined && tapes.thighBack !== undefined ? `lateral ${tapes.thighLateral.toFixed(2)} and back ${tapes.thighBack.toFixed(2)} mm from f1_trunk's trunk-thigh contours at the fold (AutoMovieHumanTrunkGlutealContour); medial ${medialFurrow.toFixed(2)} mm${contact ? " on the midsagittal plane (the inner thighs meet; thigh gap is an input gap)" : ""}; front closing the tape at the null fullness` : tapes.thighLateral !== undefined ? `lateral ${tapes.thighLateral.toFixed(2)} mm from the trunk split's ring at the crotch (interim for f1_trunk's trunk-thigh lateral contour); medial ${medialFurrow.toFixed(2)} mm${contact ? " on the midsagittal plane (the inner thighs meet; thigh gap is an input gap)" : ""}; half depth closing the tape at the null fullness` : contact ? `the thigh tape's circle breadth and depth, its medial side on the midsagittal plane ${tapes.midline!.toFixed(2)} mm from the hip centre (the inner thighs meet at the furrow; thigh gap is an input gap)` : "circle of the thigh tape (null law)" },
      // Laws kept: suprapatella, mid-patella, calf maximum and ankle minimum took the circles of the lower thigh, knee, calf and ankle tapes (null law).
      { name: "suprapatella", walk: at("suprapatella"), box: F1.site("suprapatella"), girth: tapes.lowerThigh, basis: "authored (AutoMovieHumanLegF1Lines); the lower thigh tape closes the fullness" },
      { name: "midpatella", walk: at("midpatella"), box: F1.site("midpatella"), girth: tapes.knee, basis: "authored (AutoMovieHumanLegF1Lines); the knee tape closes the fullness over the patella relief" },
      { name: "calf maximum", walk: at("calf maximum"), box: F1.site("calf maximum"), girth: tapes.calf, basis: "authored (AutoMovieHumanLegF1Lines); the calf tape closes the fullness" },
      { name: "ankle minimum", walk: at("ankle minimum"), box: F1.site("ankle minimum"), girth: tapes.ankle, basis: "authored (AutoMovieHumanLegF1Lines); the ankle tape closes the fullness" },
      // The ball's lateral and medial extents are read from the solved front pair below (NaN until then).
      { name: "ball", walk: ballWalk, box: [NaN, NaN, ballDepth - ballPlantar, ballPlantar], girth: tapes.ball, basis: "lateral and medial from the front pair's forefoot closure (heads' skin ends, toes' web stations); plantar extent to the floor; whole depth from the ball tape as an ellipse on the breadth (null law); the plantar quarters held flat across the heads" },
    ];
    if (!(ballDepth - ballPlantar > 0)) diagnostics.push(`ball: the ellipse depth ${ballDepth.toFixed(2)} mm does not reach over the course ${ballPlantar.toFixed(2)} mm above the floor`);
    const box: (name: string, k: number) => number = (name: string, k: number): number => raw.find((s: Omit<ISite, "shoulder">): boolean => s.name === name)!.box[k]!;

    // Dorsum: arch height index (dorsal point) and the floor (plantar), at the dorsal point's station.
    const truncated: number = AutoMovieHumanLegLandmarks.get(landmarks, "metatarsal head I").point[0] - landmarks.foot.heel[0];
    const dorsalPoint: Vec3 = [AutoMovieHumanLegLandmarks.get(landmarks, "dorsum").point[0], floor + ARCH_HEIGHT_INDEX * truncated, 0];
    const dorsumAlong: number = S.dot(dorsalPoint, t);
    const dorsumWalk: number = landmarks.course.im + dorsumAlong;
    const dorsumValue: number = S.dot(dorsalPoint, n);
    const imWalk: number = landmarks.course.im;
    const half: number = tapes.bimalleolar / 2;

    type Datum = { site: string; walk: number; value: number | null; sense: Sense; rule: string; slope?: number; rootSlope?: number };
    const d: (site: string, walk: number, value: number | null, sense: Sense, rule: string) => Datum = (site: string, walk: number, value: number | null, sense: Sense, rule: string): Datum => ({ site, walk, value, sense, rule });
    // The pole closes inside toe II as a round cap of toe II's root half-breadth rho, as a toe's tip pad closes: y = sqrt(2 rho (E - s)) near the pole, dy/dq = -sqrt(2 rho) in the root parameter. Left free, the fair solve carried the steep closure past the outer toes' webs under zero before the pole.
    const cap: number = landmarks.roots[1]!.breadth / 2;
    const pole: Datum = { ...d("web", end, 0, null, `pole: a cap of toe II's root half-breadth ${cap.toFixed(2)} mm`), rootSlope: -Math.sqrt(2 * cap) };
    // The forefoot closes in plan through the heads' skin ends and the toes' web stations (the oblique cascade).
    const forefoot: AutoMovieHumanLegForefoot.IOutput = AutoMovieHumanLegForefoot.create(landmarks, m);
    // The thigh starts from S00's half loop: each outline's port datum is the ring's extent and its station slope per mm of walk (AutoMovieHumanLegBuild), so the leg leaves the trunk's bottom with its value and direction; without the split, the furrow's value, parallel.
    const portDatum: (k: 0 | 1 | 2 | 3) => Datum = (k: 0 | 1 | 2 | 3): Datum =>
      tapes.port === undefined ? d("port", start, box("gluteal furrow", k), null, "port value, parallel") : { ...d("port", start, tapes.port.box[k], null, "S00's half loop: the ring's extent and its station slope"), slope: tapes.port.slopes[k] };
    // f1's authored knots between the sites (AutoMovieHumanLegF1Lines), each at its walk from its segment's zero.
    const authored: (k: 0 | 1 | 2 | 3) => Datum[] = (k: 0 | 1 | 2 | 3): Datum[] => F1.between(k, landmarks.course.knee).map((x: { site: string; walk: number; value: number }): Datum => d(x.site, x.walk, x.value, null, "value (authored knot)"));
    const byWalk: (a: Datum, b: Datum) => number = (a: Datum, b: Datum): number => a.walk - b.walk;
    diagnostics.push(`dorsum law (arch height index): ${dorsumValue.toFixed(2)} mm at walk ${dorsumWalk.toFixed(1)}, replaced by her dorsal line`);
    // Her foot outlines re-based (AutoMovieHumanLegF1Lines.FOOT), in front of IM and short of the forefoot's own datums (the heads' skin ends and the toes' webs).
    const footKnots: (k: 0 | 1) => Datum[] = (k: 0 | 1): Datum[] => {
      const limit: number = Math.min(...(k === 0 ? forefoot.lateral : forefoot.medial).map((x: AutoMovieHumanLegForefoot.IDatum): number => x.walk)) - 8;
      return F1.foot(k, imWalk, imWalk + 10, limit).map((x: { site: string; walk: number; value: number }): Datum => d(x.site, x.walk, x.value, null, "value (her foot outline)"));
    };
    const front: (k: 0 | 1) => Datum[] = (k: 0 | 1): Datum[] => [
      portDatum(k),
      d("gluteal furrow", at("gluteal furrow"), box("gluteal furrow", k), null, "value"),
      ...authored(k),
      // Law kept: the vastus medialis forms a prominence in the lower medial thigh ending abruptly at the knee (Gray 1918), once a stationary medial line at suprapatella; f1's authored knots carry that fullness above the knee instead.
      d("suprapatella", at("suprapatella"), box("suprapatella", k), null, "value"),
      d("midpatella", at("midpatella"), box("midpatella", k), null, "value"),
      // f1's world-matched lines carry the calf's and the ankle's extremes at their own levels (law kept: max at calf maximum, min at ankle minimum).
      d("calf maximum", at("calf maximum"), box("calf maximum", k), null, "value"),
      d("ankle minimum", at("ankle minimum"), box("ankle minimum", k), null, "value"),
      d("IM", imWalk, half, "max", "value, max (malleolus)"),
      ...footKnots(k),
      ...(k === 0 ? forefoot.lateral : forefoot.medial).map((x: AutoMovieHumanLegForefoot.IDatum): Datum => d(x.site, x.walk, x.value, x.sense, x.rule)),
      pole,
    ].sort(byWalk);
    const anteriorPlan: Datum[] = [
      portDatum(2),
      d("gluteal furrow", at("gluteal furrow"), box("gluteal furrow", 2), null, "value"),
      ...authored(2),
      d("suprapatella", at("suprapatella"), box("suprapatella", 2), null, "value"),
      d("midpatella", at("midpatella"), box("midpatella", 2), null, "value"),
      d("calf maximum", at("calf maximum"), box("calf maximum", 2), null, "value"),
      d("ankle minimum", at("ankle minimum"), box("ankle minimum", 2), null, "value"),
      d("IM", imWalk, box("ankle minimum", 2), null, "actual value (front-ankle juncture on the ankle tape's tendon line, stretched onto the bisection plane)"),
      // Her dorsal line re-based (AutoMovieHumanLegF1Lines.FOOT); law kept: the arch height index's dorsum point, recorded in the diagnostics.
      ...F1.foot(2, imWalk, imWalk + 15, ballWalk - 10).map((x: { site: string; walk: number; value: number }): Datum => d(x.site, x.walk, x.value, null, "value (her dorsal line)")),
      d("ball", ballWalk, box("ball", 2), null, "value"),
      pole,
    ].sort(byWalk);
    const solveOutline: (datums: Datum[]) => IKnot[] = (datums: Datum[]): IKnot[] => {
      const jets: AutoMovieHumanFairOutline.IJet[] = AutoMovieHumanFairOutline.solve(
        datums.map((x: Datum): AutoMovieHumanFairOutline.IKnot => ({ q: parameter(x.walk, end), value: x.value, slope: x.rootSlope !== undefined ? x.rootSlope : x.slope !== undefined ? x.slope * -2 * parameter(x.walk, end) : x.sense !== null || x.rule.endsWith("parallel") ? 0 : null })),
      );
      return datums.map((x: Datum, i: number): IKnot => ({ site: x.site, walk: x.walk, q: parameter(x.walk, end), value: jets[i]!.value, first: jets[i]!.first, second: jets[i]!.second, sense: x.sense, rule: x.rule }));
    };
    // The ball is a girth site: its lateral and medial extents are the fair front pair's own values there, carried as knots like every site's (the minimum is unchanged by a datum it already meets), so the loft holds them exactly at its ball layer.
    const withBall: (k: 0 | 1) => IKnot[] = (k: 0 | 1): IKnot[] => {
      const free: IKnot[] = solveOutline(front(k));
      const datums: Datum[] = [...front(k), d("ball", ballWalk, value(free, ballWalk, end)[0], null, "value (the fair front pair's own value at the ball site)")];
      return solveOutline(datums.sort((a: Datum, b: Datum): number => a.walk - b.walk));
    };
    const lateral: IKnot[] = withBall(0);
    const medial: IKnot[] = withBall(1);
    // The anterior line is solved once the course gives its ankle knot's actual bisection-plane extent (below).
    // Front ankle: the anterior extent at IM stays on the ankle tape's straight
    // tendon line (the front-ankle juncture the heel-ankle tape crosses; null
    // law while the ankle's depth at the malleoli is an input gap).
    // Her front-ankle juncture re-based (AutoMovieHumanLegF1Lines.ANKLE_ANTERIOR: the talus' front on her bisection ray, 41.1 mm, times cos(theta / 2)); law kept: the ankle tape's circle radius, tapes.ankle / (2 pi).
    const anteriorIm: number = F1.ANKLE_ANTERIOR;

    // Neutral course; the ankle turns toward anterior, so its inner extent is the anterior one.
    const P: AutoMovieHumanLegSegmentFrames.IPoints = frames.points;
    const centres: Vec3[] = [landmarks.points.port, P.knee, P.im, landmarks.points.web];
    const neutral: number[] = [start, landmarks.course.knee, imWalk, end];
    const kneeInner: number = Math.max(box("midpatella", 2), box("midpatella", 3));
    const course: AutoMovieHumanLegCourse.IOutput = AutoMovieHumanLegCourse.create(centres, neutral, [kneeInner, anteriorIm], [0, 0, -m], { centre: landmarks.bend.point, walk: landmarks.bend.walk, inner: landmarks.bend.inner });
    diagnostics.push(...course.diagnostics);

    // Heel: the bisection plane's posterior extent and the turn's datums from the heel's sagittal profile.
    // Every knot of the side pair at the ankle carries its actual extent in its own section plane (the turn datums do, so the joint knot does too); the loft re-stretches it only for a pose.
    const posteriorSide: boolean = m > 0;
    // The Achilles line behind the shank's own axis at the ankle-minimum level (with authored joints the axis leaves the femur frame's Y: f1's IM stands 13.3 mm forward of the hip; read from x = 0 the line sat that far back of her Achilles and the heel turn opened with an infinite slope).
    // The ankle-minimum level's axis point stands on the shank's knee-IM line at its walk (the walk runs along that line, AutoMovieHumanLegSegmentFrames.IOutput.walk).
    const ankleAt: number = (at("ankle minimum") - landmarks.course.knee) / Math.hypot(P.im[0] - P.knee[0], P.im[1] - P.knee[1], P.im[2] - P.knee[2]);
    const ankleY: number = P.knee[1] + (P.im[1] - P.knee[1]) * ankleAt;
    const axisX: number = P.knee[0] + (P.im[0] - P.knee[0]) * ankleAt;
    const heelBound: AutoMovieHumanLegHeel.IOutput = AutoMovieHumanLegHeel.create({ frames, landmarks, course, achilles: [axisX - box("ankle minimum", 3), ankleY], profile: F1.heel(P.im) });
    diagnostics.push(...heelBound.diagnostics);
    const heel: number = heelBound.reach;
    const turn: (list: AutoMovieHumanLegHeel.IDatum[]) => Datum[] = (list: AutoMovieHumanLegHeel.IDatum[]): Datum[] => list.map((x: AutoMovieHumanLegHeel.IDatum): Datum => ({ ...d(x.site, x.walk, x.value, null, x.rule), slope: x.slope }));

    // The plantar line meets the floor where the foot run leaves the ankle turn.
    const soleAlong: number = course.runs.length > 2 ? course.runs[2]!.from : dorsumAlong / 2;
    const posteriorPlan: Datum[] = [
      portDatum(3),
      d("gluteal furrow", at("gluteal furrow"), box("gluteal furrow", 3), null, "value"),
      ...authored(3),
      d("suprapatella", at("suprapatella"), box("suprapatella", 3), null, "value"),
      d("midpatella", at("midpatella"), box("midpatella", 3), null, "value"),
      d("calf maximum", at("calf maximum"), box("calf maximum", 3), null, "value"),
      d("ankle minimum", at("ankle minimum"), box("ankle minimum", 3), null, "value"),
      ...turn(heelBound.upper),
      d("IM", imWalk, heel, null, "actual value (heel: bisection-plane extent to the pternion back line)"),
      ...turn(heelBound.lower),
      { ...d("sole", imWalk + soleAlong, plantar(soleAlong), null, "value and slope (floor at the end of the ankle turn)"), slope: floorSlope },
      { ...d("dorsum", dorsumWalk, plantar(dorsumAlong), null, "value and slope (floor)"), slope: floorSlope },
      { ...d("ball", ballWalk, box("ball", 3), null, "value and slope (floor)"), slope: floorSlope },
      pole,
    ].sort(byWalk);
    const posterior: IKnot[] = solveOutline(posteriorPlan);
    const anteriorActual: number = AutoMovieHumanLegCourse.bisection(course, 2, P.im, anteriorIm, !posteriorSide);
    const anterior: IKnot[] = solveOutline(anteriorPlan.map((x: Datum): Datum => (x.site === "IM" ? { ...x, value: anteriorActual } : x)));
    const outlines: Record<Label, IKnot[]> = { lateral, medial, anterior, posterior };

    // Shoulders: solved on each box for its tape; the ball's box takes its lateral and medial extents from the solved front pair; the bisection's on its stretched box for the heel-ankle tape.
    // Mid-patella: the knee tape runs over the patella, so with the patella's relief its fullness closes the taut tape (the convex hull) of the conic plus the relief's height along the anterior axis.
    const anteriorPhase: number = m > 0 ? (3 * Math.PI) / 2 : Math.PI / 2;
    const patellaRelief: IAutoMovieLoftRelief | null = tapes.patella === undefined ? null : AutoMovieHumanLegPatella.relief({ station: 0, phase: anteriorPhase, radius: box("midpatella", 2), axis: [0, 0, 0], sex: tapes.patella.sex, scale: tapes.patella.scale });
    const midWalk: number = at("midpatella");
    const solved: ISite[] = raw.map((s: Omit<ISite, "shoulder">): ISite => {
      const boxed: [number, number, number, number] = s.name === "ball" ? [value(lateral, s.walk, end)[0], value(medial, s.walk, end)[0], s.box[2], s.box[3]] : s.box;
      return { ...s, box: boxed, shoulder: AutoMovieHumanLegSiteShoulder.relieved(s.name, boxed, s.girth, diagnostics, patellaRelief, s.walk - midWalk, anteriorPhase, m) };
    });
    const stretched: [number, number, number, number] = [half, half, anteriorActual, heel];
    const bisectionSite: ISite = {
      name: "ankle bisection",
      walk: imWalk,
      box: [half, half, anteriorActual, heel],
      girth: tapes.heelAnkle,
      shoulder: AutoMovieHumanLegSiteShoulder.solve("ankle bisection", stretched, tapes.heelAnkle, diagnostics),
      basis: "bimalleolar breadth across; anterior on the ankle tape's tendon line; posterior to the pternion back line along the bisection ray; fullness solved on the stretched bisection box for the heel-ankle tape",
    };
    solved.splice(5, 0, bisectionSite);

    // Fullness: the solved shoulders at the sites; the port and the pole repeat their neighbours', joined by the natural cubic in station.
    const fullnessOf: (list: ISite[]) => IKnot[] = (list: ISite[]): IKnot[] => fullnessThrough(list, start, end);
    const shoulderOf: (list: IKnot[]) => (walk: number) => number = (list: IKnot[]): ((walk: number) => number) => (walk: number): number => fullnessAt(list, walk);

    // The flat sole: the plantar quarters held so every toe's root lies inside the forefoot at its head; the ball tape solved with them.
    const boxAt: (walk: number) => [number, number, number, number] = (walk: number): [number, number, number, number] => [value(lateral, walk, end)[0], value(medial, walk, end)[0], value(anterior, walk, end)[0], value(posterior, walk, end)[0]];
    const ballSite: ISite = solved.find((s: ISite): boolean => s.name === "ball")!;
    const sole: AutoMovieHumanLegSole.IOutput = AutoMovieHumanLegSole.create({ landmarks, medial: m, box: boxAt, shoulder: shoulderOf(fullnessOf(solved)), ball: { walk: ballSite.walk, box: ballSite.box, girth: ballSite.girth } });
    diagnostics.push(...sole.diagnostics);
    const sites: ISite[] = solved.map((s: ISite): ISite => (s.name === "ball" ? { ...s, shoulder: sole.ball } : s));
    const fullness: IKnot[] = fullnessOf(sites);
    const departures: IAutoMovieViewPart.IQuarters<AutoMovieHumanLegSole.IKnot[]> = AutoMovieHumanLegSole.departures(sole.needs, shoulderOf(fullness), [...sole.heads, { site: "ball", walk: ballWalk }], start, imWalk, end);
    // The port's quarters from S00's ring (AutoMovieHumanLegBuild) in the chart's order (+v posterior on the left leg, anterior on the right), within the engine's open (0, 1) by the heel-ankle secant's own margin 0.05 at both ends (f1's ring: a straight chord, rho -0.010, front-lateral; nearly square, 0.966, back-medial); a quarter the ring never crossed keeps the common one.
    const ringQuarter: (rho: number) => number = (rho: number): number => Math.min(0.95, Math.max(0.05, rho));
    const s: [number, number, number, number] | undefined = tapes.port?.shoulders;
    const port: IAutoMovieViewPart.IQuarters<number> | undefined =
      s === undefined ? undefined : (m > 0 ? [s[0], s[1], s[2], s[3]] : [s[3], s[2], s[1], s[0]]).map((rho: number): number => (Number.isFinite(rho) ? ringQuarter(rho) : fullnessAt(fullness, start))) as IAutoMovieViewPart.IQuarters<number>;
    if (s !== undefined) diagnostics.push(`port quarter shoulders from S00's ring (lateral-posterior, posterior-medial, medial-anterior, anterior-lateral): ${s.map((x: number): string => x.toFixed(3)).join(", ")}; common at the port ${fullnessAt(fullness, start).toFixed(3)}`);

    return { start, end, sites, outlines, fullness, sole: { needs: sole.needs, departures: seat(departures, port, shoulderOf(fullness), start, F1.fade()) }, segments: AutoMovieHumanLegViewSegments.create(frames, landmarks), centres, course, bisection: stretched, patella: tapes.patella ?? null, diagnostics, ...(port === undefined ? {} : { port }) };
  }
}
