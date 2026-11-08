import type { AutoMovieHumanArmCurveSpec } from "./AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanArmF1Lines } from "./AutoMovieHumanArmF1Lines";
import { AutoMovieHumanArmF1Pose } from "./AutoMovieHumanArmF1Pose";
import { AutoMovieHumanArmLandmarks } from "./AutoMovieHumanArmLandmarks";
import type { AutoMovieHumanArmSegmentFrames } from "./AutoMovieHumanArmSegmentFrames";
import { AutoMovieHumanArmViewSegments } from "./AutoMovieHumanArmViewSegments";
import { AutoMovieHumanArmViewSpecs } from "./AutoMovieHumanArmViewSpecs";
import { AutoMovieHumanFairOutline } from "./AutoMovieHumanFairOutline";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;
type Spec = AutoMovieHumanArmCurveSpec.ICurveSpec;

/**
 * L2 of the arm experiment by conic lofting: each segment (humerus, forearm,
 * hand) is drawn by a few 2D view curves in its own frame from its own zero,
 * its front outline pair (lateral and medial skin extents), its side outline
 * pair (anterior and posterior), its axis and its four quarters' conic
 * fullness (the shoulder `rho` of `AutoMovieViewSection`, one curve per
 * quarter, the engine's "top" fullness). A section at any station is the
 * conic through the four outline points there, each quarter shaped by its
 * own shoulder.
 *
 * f1-only mission (the owner's order of 2026-11-08): the control points are
 * f1's authored lines (`AutoMovieHumanArmF1Lines`), each station in its own
 * segment's frame from that segment's zero (GH, elbow centre, wrist centre)
 * along its own axis. The parameter laws (tape circles, Perry, Sanada,
 * Maruyama, Larsen, Akagi, Campbell) are set aside verbatim in
 * `AutoMovieHumanArmViewCurvesLaw` for the follow-up algorithmization; the
 * tapes and calipers are carried for that and only label the girth sites.
 *
 * The arm part runs from its dome pole, on the humerus axis at the acromion
 * level, to the palm pole one digit III web length past the knuckle centre.
 * Each outline is one C2 quintic Hermite chain over that walk in the
 * engine's own two-pole angle parameter `x = 2 asin(sqrt((s - B) / (E - B)))`
 * (`B` the dome pole, `E` the palm pole walk station), the minimum bending
 * energy through the authored stations and zero radius at both poles
 * (`AutoMovieHumanFairOutline`). A joint station is authored once, owned by
 * the proximal segment and standing at the distal segment's zero, so the
 * outlines are C2 across the elbow and the wrist. The quarter shoulders are
 * the minimum-energy chains through the authored stations in station, each
 * pole repeating its neighbouring station.
 */
export namespace AutoMovieHumanArmViewCurves {
  /** The four outline labels, chart order independent. */
  export type Label = "lateral" | "medial" | "anterior" | "posterior";

  /** The four labels. */
  export const LABELS: readonly Label[] = ["lateral", "medial", "anterior", "posterior"];

  /** Public tapes and breadths, calibration mm. */
  export interface ITapes {
    /** Relaxed upper-arm girth midway between acromion and olecranon (NHANES), mm. */
    bicep: number;

    /** Elbow girth over the olecranon, arm extended (ANSUR 1988), mm. */
    elbow: number;

    /** Relaxed maximum forearm girth below the epicondyles, mm. */
    forearm: number;

    /** Wrist girth over stylion (ANSUR II), mm. */
    wrist: number;

    /** Hand circumference over metacarpals II-V (ANSUR 1988), mm. */
    hand: number;

    /** Hand breadth across metacarpals II-V (ANSUR II), mm. */
    breadth: number;

    /** Bideltoid breadth: the greatest skin breadth over the deltoids, arms down (ANSUR II 6.4.12), mm. */
    bideltoid?: number;

    /** Biacromial breadth between the acromia (ANSUR II), mm. Read with `bideltoid`. */
    biacromial?: number;

    /** Calibration millimetres per physical millimetre. Read with `bideltoid`. */
    scale?: number;

    /** Axillary arm circumference at the axilla level (ANSUR 1988), mm: the shoulder port's perimeter. */
    axillary?: number;
  }

  /** Medial offset of the glenohumeral centre from the acromion landmark, physical mm (Campbell et al. 2009); kept for the set-aside deltoid law. */
  export const GH_MEDIAL_OF_ACROMION: number = 6;

  /**
   * The person's forearm and wrist skin calipers, calibration mm
   * (`IAutoMovieHumanBodyAnatomy.forearmBreadth` and its siblings), carried
   * for the follow-up algorithmization; the f1 lines do not read them.
   */
  export interface ICalipers {
    /** Forearm breadth and depth at 0.2 radiale-stylion past radiale, mm. */
    forearm: { breadth: number; depth: number };

    /** Wrist breadth and depth over stylion, mm. */
    wrist: { breadth: number; depth: number };
  }

  /** One girth site: its box and shoulder read off the drawn lines there, with its tape as a label. */
  export interface ISite {
    /** Landmark name. */
    name: string;

    /** Neutral walk station, mm. */
    walk: number;

    /** Half extents lateral, medial, anterior, posterior, mm. */
    box: [number, number, number, number];

    /** The site's tape, mm (a label: the lines are drawn, not closed on it). */
    girth: number;

    /** The four quarters' mean shoulder there. */
    shoulder: number;

    /** Basis of the box. */
    basis: string;
  }

  /** A declared extremum at a knot: a belly (`max`) or a waist (`min`), or none. */
  export type Sense = "max" | "min" | null;

  /** One knot of a whole-walk outline in the neutral root parameter. */
  export interface IKnot {
    /** Landmark name. */
    site: string;

    /** Neutral walk station, mm. */
    walk: number;

    /** The two-pole angle parameter of the walk station; the fullness uses the walk station itself. */
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

  /** The view curves. */
  export interface IOutput {
    /** Neutral walk station of the dome pole (the acromion level on the humerus axis), mm. */
    start: number;

    /** Neutral walk station of the palm pole, mm. */
    end: number;

    /** The same palm-pole walk station, kept under the name its readers use: the neutral walk length from the acromion level, mm. */
    length: number;

    /** Girth sites proximal to distal, read off the drawn lines. */
    sites: ISite[];

    /** Whole-walk outlines, unsigned skin offsets from the axis, mm. */
    outlines: Record<Label, IKnot[]>;

    /** Whole-walk mean conic shoulder, its knots in station (`q` is the walk station): the four quarters' mean, for drawings. */
    fullness: IKnot[];

    /** The four quarters' shoulders in the arm part's guide order (left arm: lateral-posterior, posterior-medial, medial-anterior, anterior-lateral; right arm: anterior-lateral, medial-anterior, posterior-medial, lateral-posterior), knots in station. */
    quarters: [IKnot[], IKnot[], IKnot[], IKnot[]];

    /** Per segment view-curve specs: four outlines, the axis and the fullness, each in its own frame. */
    specs: Spec[];

    /** The set-aside deltoid support law's reading; null on the f1 lines. */
    deltoid: number | null;

    /** Segment zeros on the neutral walk and their frames. */
    segments: ISegment[];
  }

  /** A segment's own zero and its view directions in its own frame. */
  export interface ISegment {
    /** `humerus`, `forearm` or `hand`. */
    name: "humerus" | "forearm" | "hand";

    /** Its frame name. */
    frame: string;

    /** Walk station of its zero (GH, elbow centre, wrist centre), mm. */
    walk: number;

    /** Walk interval it owns, mm. */
    interval: [number, number];

    /** Axis point at its zero, own frame, mm. */
    origin: Vec3;

    /** Unit distal direction of its axis, own frame. */
    distal: Vec3;

    /** Unit lateral direction (front-view outline direction), own frame: the humerus -Z on the left, carried rigidly by the joints. */
    lateral: Vec3;

    /** Unit anterior (volar) direction (side-view outline direction), own frame. */
    anterior: Vec3;
  }

  /**
   * The engine's two-pole angle parameter of a walk station between the
   * dome pole at `pole` and the palm pole at `end`:
   * `2 asin(sqrt((s - pole) / (end - pole)))`, taken from the nearer pole as
   * the engine does (`AutoMovieViewParameter.at`), rad in [0, pi].
   */
  export function parameter(walk: number, end: number, pole: number): number {
    const span: number = end - pole;
    const a: number = Math.min(span, Math.max(0, walk - pole));
    const b: number = Math.min(span, Math.max(0, end - walk));
    return a <= b ? 2 * Math.asin(Math.sqrt(a / span)) : Math.PI - 2 * Math.asin(Math.sqrt(b / span));
  }

  /** The walk station of an angle parameter: `pole + (end - pole) sin^2(x / 2)`. */
  export function walkOf(x: number, end: number, pole: number): number {
    return pole + (end - pole) * Math.sin(x / 2) ** 2;
  }

  /**
   * Station derivatives in the angle parameter:
   * `[ds/dx, d2s/dx2] = (end - pole) / 2 [sin x, cos x]`, with `ds/dx`
   * exactly zero at both poles (`x = 0` and `x = pi`, where binary64
   * `sin(pi)` would leave a rounding residue that a chain rule divides by).
   */
  export function stationJet(x: number, end: number, pole: number): [number, number] {
    const sin: number = x <= 0 || x >= Math.PI ? 0 : Math.sin(x);
    return [((end - pole) / 2) * sin, ((end - pole) / 2) * Math.cos(x)];
  }

  /**
   * Build the view curves from the frames and the landmarks on f1's authored
   * lines (`AutoMovieHumanArmF1Lines`), each station placed on the neutral
   * walk from its own segment's zero.
   *
   * @param tapes The person's tapes: labels of the girth sites, kept for the follow-up algorithmization.
   * @param _calipers The person's forearm and wrist calipers, kept for the same.
   * @param posed f1's own pose on the trunk's port (`AutoMovieHumanArmF1Pose`), for a loft on her frame curve: the rail station takes the port loop's section, her humerus stations between the rail and the turn's join are left out (the turn replaces her humerus line there), every walk is her course's (`along`), and the volar values are compensated by her course's own volar offset (`AutoMovieHumanArmF1Pose.volar`). The girth sites and the per-segment specs then read course walks.
   */
  export function create(
    frames: AutoMovieHumanArmSegmentFrames.IOutput,
    landmarks: AutoMovieHumanArmLandmarks.IOutput,
    tapes: ITapes,
    _calipers?: ICalipers,
    posed?: Pick<AutoMovieHumanArmF1Pose.IOutput, "rail" | "join" | "section" | "along">,
  ): IOutput {
    // Posed: every walk station is her course's (`along`: the turn from the port stretched to its arc), so the outlines are faired over the course the loft runs.
    const course = (walk: number): number => (posed === undefined ? walk : landmarks.course.port + posed.along(walk - landmarks.course.port));
    const at = (name: string): number => course(AutoMovieHumanArmLandmarks.get(landmarks, name).walk);
    const start: number = course(landmarks.course.dome);
    const end: number = course(landmarks.course.web);
    const segments: ISegment[] = AutoMovieHumanArmViewSegments.create(frames, landmarks);
    const zero = (name: ISegment["name"]): number => segments.find((s: ISegment): boolean => s.name === name)!.walk;

    // The authored stations on the neutral walk, each from its own segment's zero.
    const stations: { site: string; walk: number; station: AutoMovieHumanArmF1Lines.IStation; extents: [number, number, number, number] }[] = [];
    // The hand's course runs turned volar about the wrist (`AutoMovieHumanArmLandmarks.PALM_POLE_TILT`): a hand station
    // `s` past the wrist has the course `s sin(tilt)` volar of its segment axis, so its volar value loses and its dorsal
    // value gains that much and the palm's skin stays where it is drawn.
    const tilt: number = Math.sin(AutoMovieHumanArmLandmarks.PALM_POLE_TILT);
    const place = (segment: ISegment["name"], list: readonly AutoMovieHumanArmF1Lines.IStation[]): void => {
      for (const authored of list) {
        // Her humerus rows between the rail and the join give way to the turn: placed in the turn as her cuts the arm loft published no chain (2026-11-08 19:51, f1-body-1952 "f1_arm's loft published no chain"); a reported refusal.
        if (posed !== undefined && segment === "humerus" && typeof authored.along === "number" && authored.along > posed.rail && authored.along < posed.join) continue;
        const station: AutoMovieHumanArmF1Lines.IStation =
          posed !== undefined && authored.along === "axilla level" ? { site: `${authored.site} on the shoulder port`, along: authored.along, extents: posed.section.extents, shoulders: posed.section.shoulders } : authored;
        const neutral: number =
          station.along === "elbow"
            ? zero("forearm")
            : station.along === "wrist"
              ? zero("hand")
              : station.along === "axilla level"
                ? AutoMovieHumanArmLandmarks.get(landmarks, "axilla level").walk
                : station.along === "knuckles"
                  ? AutoMovieHumanArmLandmarks.get(landmarks, "knuckles").walk
                  : zero(segment) + station.along;
        // Posed: the course's volar offset in each section's own plane (`AutoMovieHumanArmF1Pose.volar`, C1 over the wrist blend).
        const shift: number = posed !== undefined ? AutoMovieHumanArmF1Pose.volar(neutral - zero("hand")) : segment === "hand" ? (neutral - zero("hand")) * tilt : 0;
        const [l, md, a, p]: [number, number, number, number] = station.extents;
        stations.push({ site: station.site, walk: course(neutral), station, extents: [l, md, Math.max(1, a - shift), p + shift] });
      }
    };
    place("humerus", AutoMovieHumanArmF1Lines.HUMERUS);
    place("forearm", AutoMovieHumanArmF1Lines.FOREARM);
    place("hand", AutoMovieHumanArmF1Lines.HAND);

    // Outlines: the dome pole, the authored stations and the palm pole, the minimum bending energy between.
    const index: Record<Label, number> = { lateral: 0, medial: 1, anterior: 2, posterior: 3 };
    const outlines: Record<Label, IKnot[]> = {} as Record<Label, IKnot[]>;
    for (const label of LABELS) {
      const datums: { site: string; walk: number; value: number; rule: string }[] = [
        { site: "dome pole", walk: start, value: 0, rule: "pole" },
        ...stations.map((s: { site: string; walk: number; extents: [number, number, number, number] }): { site: string; walk: number; value: number; rule: string } => ({ site: s.site, walk: s.walk, value: s.extents[index[label]], rule: "value: f1 authored line (AutoMovieHumanArmF1Lines)" })),
        { site: "web III", walk: end, value: 0, rule: "pole" },
      ];
      const jets: AutoMovieHumanFairOutline.IJet[] = AutoMovieHumanFairOutline.solve(
        datums.map((d: { walk: number; value: number }): AutoMovieHumanFairOutline.IKnot => ({ q: parameter(d.walk, end, start), value: d.value, slope: null })),
      );
      outlines[label] = datums.map((d: { site: string; walk: number; rule: string }, i: number): IKnot => ({
        site: d.site,
        walk: d.walk,
        q: parameter(d.walk, end, start),
        value: jets[i]!.value,
        first: jets[i]!.first,
        second: jets[i]!.second,
        sense: null,
        rule: d.rule,
      }));
    }

    // Quarter shoulders in the part's guide order (`AutoMovieHumanArmViewLoft`: phase 0 lateral, then +v, which is posterior on the left).
    const order: (keyof AutoMovieHumanArmF1Lines.IShoulders)[] =
      frames.medial > 0 ? ["lateralPosterior", "posteriorMedial", "medialAnterior", "anteriorLateral"] : ["anteriorLateral", "medialAnterior", "posteriorMedial", "lateralPosterior"];
    const chain = (values: number[], rule: string): IKnot[] => {
      const datums: { site: string; walk: number; value: number }[] = [
        { site: "dome pole", walk: start, value: values[0]! },
        ...stations.map((s: { site: string; walk: number }, i: number): { site: string; walk: number; value: number } => ({ site: s.site, walk: s.walk, value: values[i]! })),
        { site: "web III", walk: end, value: values[values.length - 1]! },
      ];
      const jets: AutoMovieHumanFairOutline.IJet[] = AutoMovieHumanFairOutline.solve(datums.map((d: { walk: number; value: number }): AutoMovieHumanFairOutline.IKnot => ({ q: d.walk, value: d.value, slope: null })));
      return datums.map((d: { site: string; walk: number }, i: number): IKnot => ({
        site: d.site,
        walk: d.walk,
        q: d.walk,
        value: jets[i]!.value,
        first: jets[i]!.first,
        second: jets[i]!.second,
        sense: null,
        rule: i === 0 || i === datums.length - 1 ? "repeats its neighbouring station" : rule,
      }));
    };
    const quarters: [IKnot[], IKnot[], IKnot[], IKnot[]] = order.map((key: keyof AutoMovieHumanArmF1Lines.IShoulders): IKnot[] =>
      chain(
        stations.map((s: { station: AutoMovieHumanArmF1Lines.IStation }): number => s.station.shoulders[key]),
        `f1 authored ${key} shoulder`,
      ),
    ) as [IKnot[], IKnot[], IKnot[], IKnot[]];
    const mean: number[] = stations.map((s: { station: AutoMovieHumanArmF1Lines.IStation }): number => (s.station.shoulders.lateralPosterior + s.station.shoulders.posteriorMedial + s.station.shoulders.medialAnterior + s.station.shoulders.anteriorLateral) / 4);
    const fullness: IKnot[] = chain(mean, "f1 authored quarters' mean");

    // Girth sites: the drawn lines read at each site, the tape as its label.
    const girths: [string, number | undefined][] = [
      ["axilla level", tapes.axillary],
      ["biceps site", tapes.bicep],
      ["olecranon", tapes.elbow],
      ["forearm maximum", tapes.forearm],
      ["wrist plane", tapes.wrist],
      ["knuckles", tapes.hand],
    ];
    const sites: ISite[] = girths.map(([name, girth]: [string, number | undefined]): ISite => {
      const walk: number = at(name);
      const box: [number, number, number, number] = [value(outlines.lateral, walk, end)[0], value(outlines.medial, walk, end)[0], value(outlines.anterior, walk, end)[0], value(outlines.posterior, walk, end)[0]];
      const shoulder: number = AutoMovieHumanFairOutline.evaluate(
        fullness.map((k: IKnot): number => k.q),
        fullness.map((k: IKnot): AutoMovieHumanFairOutline.IJet => ({ value: k.value, first: k.first, second: k.second })),
        walk,
      )[0];
      return { name, walk, box, girth: girth ?? NaN, shoulder, basis: "f1 authored lines read at the site (AutoMovieHumanArmF1Lines)" };
    });

    const specs: Spec[] = AutoMovieHumanArmViewSpecs.create(segments, outlines, fullness, sites, landmarks, end, start);
    return { start, end, length: end, sites, outlines, fullness, quarters, specs, segments, deltoid: null };
  }

  /**
   * Value and first two station derivatives of a whole-walk outline at a
   * neutral walk station: the jets are in the two-pole angle parameter from
   * the outline's first knot (the dome pole) to `end` (the palm pole), and
   * the station derivatives follow by the chain rule, `y_s = y_x / s_x`,
   * `y_ss = (y_xx - y_s s_xx) / s_x^2`; at a pole (`s_x = 0`) they are NaN.
   */
  export function value(knots: readonly IKnot[], walk: number, end: number): [number, number, number] {
    const pole: number = knots[0]!.walk;
    const x: number = parameter(walk, end, pole);
    const [y, yx, yxx]: [number, number, number] = AutoMovieHumanFairOutline.evaluate(
      knots.map((k: IKnot): number => k.q),
      knots.map((k: IKnot): AutoMovieHumanFairOutline.IJet => ({ value: k.value, first: k.first, second: k.second })),
      x,
    );
    const [sx, sxx]: [number, number] = stationJet(x, end, pole);
    if (!(Math.abs(sx) > 0)) return [y, NaN, NaN];
    const ys: number = yx / sx;
    return [y, ys, (yxx - ys * sxx) / (sx * sx)];
  }

  /** The second semi-axis of the ellipse with semi-axis `a` and perimeter `length` (Ramanujan 1914), by bisection. */
  export function semiAxis(length: number, a: number): number {
    if (!(length > 4 * a)) throw new Error(`a tape ${length} mm cannot close around the breadth ${2 * a} mm`);
    let lo: number = 0;
    let hi: number = length;
    for (let k: number = 0; k < 100; ++k) {
      const mid: number = (lo + hi) / 2;
      if (ramanujan(a, mid) < length) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }

  /** Ramanujan's first approximation of an ellipse perimeter. */
  export function ramanujan(a: number, b: number): number {
    return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
  }
}
