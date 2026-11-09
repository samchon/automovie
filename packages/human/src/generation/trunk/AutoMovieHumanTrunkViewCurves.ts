import { AutoMovieLoftRelief, AutoMovieViewSection, type IAutoMovieLoftRelief } from "@automovie/engine";

import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import type { AutoMovieHumanHeadThroat } from "../head/AutoMovieHumanHeadThroat";
import type { AutoMovieHumanFairOutline } from "../arm/AutoMovieHumanFairOutline";
// For the later algorithmisation (the parameter laws the f1 knots replace): AutoMovieHumanBackProfile,
// AutoMovieHumanTrunkBackProfile, AutoMovieHumanTrunkGlutealContour, AutoMovieHumanTrunkSternum.
import { AutoMovieHumanTrunkBackLineReading } from "./AutoMovieHumanTrunkBackLineReading";
import { AutoMovieHumanTrunkComposedSection } from "./AutoMovieHumanTrunkComposedSection";
import { AutoMovieHumanTrunkF1Lines } from "./AutoMovieHumanTrunkF1Lines";
import { AutoMovieHumanTrunkF1Traced } from "./AutoMovieHumanTrunkF1Traced";
import { AutoMovieHumanTrunkMidlineLength } from "./AutoMovieHumanTrunkMidlineLength";
import { AutoMovieHumanTrunkMound } from "./AutoMovieHumanTrunkMound";
import { AutoMovieHumanTrunkNeckBase } from "./AutoMovieHumanTrunkNeckBase";
import { AutoMovieHumanTrunkNeckTurn } from "./AutoMovieHumanTrunkNeckTurn";
import type { AutoMovieHumanTrunkSegmentFrames } from "./AutoMovieHumanTrunkSegmentFrames";
import { AutoMovieHumanTrunkSpecLandmarks } from "./AutoMovieHumanTrunkSpecLandmarks";
import { AutoMovieHumanTrunkViewMounds } from "./AutoMovieHumanTrunkViewMounds";
import { AutoMovieHumanTrunkViewScalar } from "./AutoMovieHumanTrunkViewScalar";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;
type Source = AutoMovieHumanTrunkComposedSection.ISource;
type Scalar = AutoMovieHumanTrunkComposedSection.IScalar;

/**
 * L2 of the trunk (S00) by conic lofting with composed mounds: level sections
 * (station = world height) on a vertical course under the hip centres, from
 * the open crotch end both legs continue from (`AutoMovieHumanTrunkPelvisSplit`)
 * to the level neck-base end at the cervicale height. Each outline is the
 * fair C2 quintic chain in the station through its datums
 * (`AutoMovieHumanTrunkViewScalar`); the midlines are signed X offsets from
 * the course.
 *
 * f1-only mission (owner, 2026-11-08): the outlines' datums are f1's authored
 * knots in S00's part frames (`AutoMovieHumanTrunkF1Lines`: the pelvis part
 * in the pelvis frame, the thorax part in the thorax frame, carried into the
 * world by the frames' chain), judged against her registered reference:
 * - posterior: the crotch, the cleft, the sacrum's most posterior point, ILS,
 *   the lordosis apex, ITL, the kyphosis apex, the upper back, C7 at the end;
 * - anterior: the crotch notch, the mons, the lower abdomen's most anterior
 *   point, the navel's rim, the natural waist, the xiphoid level, the sternum
 *   at the bust, the sternal angle, the manubrium, IJ (zero slope); above it
 *   f1_head's throat contour (`AutoMovieHumanHeadThroat`, the one definition
 *   both streams read);
 * - lateral: the thighs side by side at the crotch, the buttock level, the top
 *   hip, the natural waist (a minimum), the bust, under the arm; the acromion
 *   (the frames' landmark, a maximum), the trapezius' knots of the shoulder
 *   line, the side neck point at the top (zero slope and curvature).
 * The girth sites stand at f1's own levels (her least girth, top hip, buttock
 * protrusion, bust point) and close her measured tapes by fullness; the
 * breast projection is solved so the apex stands at f1's bust point.
 *
 * The parameter laws these knots replace stay in their modules for the later
 * algorithmisation: the circular-arc back line (`AutoMovieHumanTrunkBackProfile`
 * over `AutoMovieHumanBackProfile`: Ohlendorf 2023, Gray 28 : 18), the ANSUR
 * depths and breadths at their sites, the sternal midline closing the ANSUR
 * chest depth with the published projection, the manubriosternal bend
 * (`AutoMovieHumanTrunkSternum`), the front notch closing the anterior crotch
 * length, the seat by the ANSUR buttock depth and the back notch by the
 * gluteal law (`AutoMovieHumanTrunkGlutealContour.law`), the bust height by
 * the side-neck-to-bust-point chord, and the trapezius parallel to the
 * SNP-acromion chord.
 */
export namespace AutoMovieHumanTrunkViewCurves {
  /** The three outline labels. */
  export type Label = "anterior" | "posterior" | "lateral";

  /** One datum of an outline before the fair solve. */
  export type IDatum = AutoMovieHumanTrunkViewScalar.IDatum;

  /** One solved knot. */
  export interface IKnot extends IDatum {
    /** Source parameter at the knot (the station). */
    q: number;

    /** Solved jet per mm of station. */
    jet: AutoMovieHumanFairOutline.IJet;
  }

  /** A girth site with its solved shoulder. */
  export interface ISite {
    /** Site name. */
    name: string;

    /** World height, mm. */
    y: number;

    /** Tape, mm. */
    girth: number;

    /** What the tape solved: the wall's shoulder there, or the breasts' projection at the bust. */
    unknown: "shoulder" | "breast projection";

    /** The solved value (shoulder share, or projection in mm). */
    value: number;

    /** The wall's shoulder there (solved, or the fullness law's value). */
    shoulder: number;

    /** The composed section's taut-tape perimeter there, mm. */
    perimeter: number;
  }

  /** The solved neck base. */
  export interface INeck {
    /** VP (C7) world X, mm. */
    vp: number;

    /** C7 behind IJ, horizontal, mm. */
    horizontal: number;

    /** C7 to IJ, spatial, mm. */
    spatial: number;

    /** The side neck points' half breadth, mm. */
    half: number;

    /** The ISO loop's length on S00, mm. */
    loop: number;

    /** The composed chest depth at the bust, mm. */
    chestDepth: number;
  }

  /** The view curves. */
  export interface IOutput {
    /** Open bottom (crotch) station = height, mm. */
    bottom: number;

    /** Top station, the level neck-base end at the cervicale height, mm. */
    top: number;

    /** The section planes: the course X and its level frames. */
    axis: { xs: number; turn: AutoMovieHumanTrunkNeckTurn.IOutput };

    /** Front and back midline skin lengths from the notches to the omphalion level, mm. */
    lengths: { anterior: number; posterior: number };

    /** Solved outlines in the station. */
    outlines: Record<Label, IKnot[]>;

    /** Solved shoulder knots in the station. */
    fullness: IKnot[];

    /** Each quarter's shoulder departure knots, quarter order +u+v, +v-u, -u-v, -v+u. */
    departures: [IKnot[], IKnot[], IKnot[], IKnot[]];

    /** Girth sites. */
    sites: ISite[];

    /** Mound specs: the mounds, then the intergluteal cleft (a negative projection). */
    mounds: AutoMovieHumanTrunkMound.ISpec[];

    /** The composed source the sections read. */
    source: Source;

    /** The landmarks with the solved neck base. */
    landmarks: AutoMovieHumanTrunkSpecLandmarks.IOutput;

    /** The solved neck base. */
    neck: INeck;

    /** The back line read by the surface-topography definitions. */
    back: AutoMovieHumanTrunkBackLineReading.IOutput;

    /** Named world datum points for drawing (apices). */
    points: { name: string; point: Vec3 }[];

    /** Fixed-point passes used. */
    iterations: number;

    /** Admission notes and checks. */
    diagnostics: string[];
  }

  /** Build options. */
  export interface IOptions {
    /** Turn the bottom band so the open bottom passes through her forks ({@link AutoMovieHumanTrunkNeckTurn.floor}); absent or false, the bottom is level at the crotch height (the floored band flared into a skirt hem over the thighs in the joined body, 2026-11-08 23:10, body-2026-11-08T14-18-00-685Z). */
    floor?: boolean;
  }

  /** The back notch's least distance behind the crotch point, mm: the anus-to-fourchette distance of adult women (28.4 +- 6.1, 117 women 18-45; 27.2 +- 5.7 in Spanish controls), the crotch point at the fourchette (declared; debt: read through abstracts). Not read while S00 is authored for f1. */
  export const PERINEUM: number = 28;

  /**
   * The front quarters' shoulder at the middle of the band from IJ to the
   * end, a share: close to the chord, the taut tape over the supraclavicular
   * hollow (declared construction; debt: no published section of the neck
   * root read). The departure vanishes at IJ and at the end with zero slope
   * and curvature.
   */
  export const BRIDGE: number = 1;

  /**
   * Build the view curves from the frames, the start landmarks, the measures
   * and f1_head's throat contour (`AutoMovieHumanHeadThroat`, thorax frame:
   * the one definition of the anterior neck both streams read).
   */
  export function create(frames: AutoMovieHumanTrunkSegmentFrames.IOutput, landmarks: AutoMovieHumanTrunkSpecLandmarks.IOutput, measures: IAutoMovieHumanBodyMeasures, crotch: number, throat: AutoMovieHumanHeadThroat.IOutput, options: IOptions = {}): IOutput {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const F: typeof AutoMovieHumanTrunkF1Lines = AutoMovieHumanTrunkF1Lines;
    const at: (name: string) => Vec3 = (name: string): Vec3 => {
      const l: AutoMovieHumanTrunkSpecLandmarks.ILandmark = AutoMovieHumanTrunkSpecLandmarks.get(landmarks, name);
      return S.apply(frames.world(l.frame), l.point);
    };
    const read: (s: Scalar, y: number) => number = AutoMovieHumanTrunkComposedSection.read;
    const scalar: (d: readonly IDatum[]) => Scalar = AutoMovieHumanTrunkViewScalar.scalar;
    const diagnostics: string[] = [];
    const ij: Vec3 = at("IJ");
    const px: Vec3 = at("PX");
    const omphalionY: number = at("omphalion")[1];
    const buttockY: number = at("buttock")[1];
    const crestY: number = at("iliocristale")[1];
    const axillaY: number = at("axilla")[1];
    const waistY: number = at("natural waist")[1];
    const highHipY: number = (waistY + buttockY) / 2;
    // The sternal angle a third of IJ-PX below IJ: the manubrium is 46.7 of the sternum's 133.1 mm in women
    // (Atesoglu 2018, CT), 0.35 along the bone (the breasts' upper extent reads it).
    const sternalAngle: number = ij[1] - (ij[1] - px[1]) / 3;
    const top: number = measures.cervicaleHeight;
    const snpY: number = measures.sideNeckPointHeight;
    const acromionY: number = frames.heights.acromion;
    const hipX: number = frames.hips.right[0] + frames.pelvis.relative.origin[0];
    // The course: the hip-centre vertical up to the natural waist; then over the thorax by the quintic
    // smoothstep to the acromia's X at the acromion height, so the lateral guide passes through both
    // acromion landmarks; held there up to the trapezius tangent's height, then by the same smoothstep to the
    // neck's centre, the X midpoint of C7 and IJ. The midlines are fair in the world (`relScalar`), so the
    // drift does not bend the side profile.
    const neckX: number = (ij[0] + at("C7")[0]) / 2;
    const drift: number = (acromionY + snpY) / 2; // from the trapezius tangent's height, clear of IJ
    const girdle: AutoMovieHumanTrunkNeckTurn.IVia | undefined = waistY < axillaY && axillaY < acromionY && acromionY <= drift ? { x: at("acromion.right")[0], from: waistY, to: acromionY } : undefined;
    const flat: AutoMovieHumanTrunkNeckTurn.IOutput = AutoMovieHumanTrunkNeckTurn.shifted(hipX, neckX, drift, top, girdle);
    // The tilted open bottom (owner's order via main, 2026-11-08 17:56): the planes turn over the bottom band so
    // the bottom plane passes through her forks, the pubic notch's floor and the cleft's top (the ends of
    // AutoMovieHumanTrunkF1Traced.CROTCH_LINE), level across; below the turn's upper end every knot is her
    // reading on the actual turned plane (AutoMovieHumanTrunkF1Traced.BAND) and the tapes there are checks.
    const forks: [number, number][] = AutoMovieHumanTrunkF1Traced.CROTCH_LINE;
    const turn: AutoMovieHumanTrunkNeckTurn.IOutput =
      options.floor === true ? AutoMovieHumanTrunkNeckTurn.floor(flat, [forks[0]![0], forks[0]![1], 0], [forks[forks.length - 1]![0], forks[forks.length - 1]![1], 0], AutoMovieHumanTrunkF1Traced.FLOOR_INNER) : flat;
    const bottom: number = turn.floor?.station ?? crotch;
    // Heights at or above the turn's upper end are stations; the authored world knots below it give way to the band.
    const level: number = turn.floor?.level ?? -Infinity;
    const above = (y: number): boolean => y >= level + 0.5;
    const xs: number = turn.xs;
    const course: (y: number) => [number, number, number] = AutoMovieHumanTrunkNeckTurn.course(hipX, neckX, drift, top, girdle);
    const relative: (d: IDatum) => IDatum = (d: IDatum): IDatum => {
      const [c, c1, c2] = course(d.y);
      return { ...d, value: d.value === null ? null : d.value - c, slope: d.slope === null ? null : d.slope - c1, second: d.second === undefined || d.second === null ? d.second : d.second - c2 };
    };
    // f1_head's throat contour in the world (the thorax axes are the world's): value, slope, curvature.
    const neckFront: (y: number) => [number, number, number] = (y: number): [number, number, number] => {
      const [x, x1, x2] = throat.at(y - ij[1]);
      return [ij[0] + x, x1, x2];
    };
    const throatKnots: IDatum[] = [
      ...[
        ["throat (course band start)", drift],
        ["throat (course band middle)", (drift + top) / 2],
        ["throat fillet's lower end", ij[1] + throat.from[1]],
        ["throat fillet's shoulder", ij[1] + throat.shoulder[1]],
      ].filter(([, y]: (string | number)[]): boolean => (y as number) > ij[1] + 5 && (y as number) < top - 1),
      ["throat (top)", top],
    ].map(([site, y]: (string | number)[]): IDatum => {
      const [x, x1, x2] = neckFront(y as number);
      return { site: site as string, y: y as number, value: x, slope: x1, second: x2, rule: "f1_head's throat contour (AutoMovieHumanHeadThroat), value, slope and curvature" };
    });
    const ellipse: number = AutoMovieViewSection.ELLIPSE;

    // f1's controls in world coordinates (AutoMovieHumanTrunkF1Lines.resolve: the WORLD tables, step 1 of
    // the owner's method). A knot's height and value are the datum's; the crotch knots stand on the open
    // bottom itself.
    const pelvisFrame: AutoMovieHumanArmCurveSpec.ITransform = frames.world("pelvis");
    const W: typeof AutoMovieHumanTrunkF1Lines.WORLD = F.resolve(pelvisFrame, frames.world("thorax"));
    const datum = (k: AutoMovieHumanTrunkF1Lines.IKnot, y: number = k.y): IDatum => ({ site: k.site, y, value: k.x, slope: k.slope ?? null, rule: "f1's authored world knot (AutoMovieHumanTrunkF1Lines.WORLD)" });
    const fromBottom = (k: AutoMovieHumanTrunkF1Lines.IKnot, i: number): IDatum => datum(k, i === 0 ? bottom : k.y);
    // An outline's datums: with the turned bottom, her band readings (the first on the bottom station itself)
    // and the authored knots above the turn; else the authored knots, the first on the level bottom.
    const band: (typeof AutoMovieHumanTrunkF1Traced.BAND)[number][] = turn.floor === undefined ? [] : AutoMovieHumanTrunkF1Traced.BAND;
    const bandRule: string = "her reading on the turned plane (AutoMovieHumanTrunkF1Traced.BAND)";
    const bandY = (r: { station: number }, i: number): number => (i === 0 ? bottom : r.station);
    const outline = (knots: AutoMovieHumanTrunkF1Lines.IKnot[], reading: ((r: (typeof AutoMovieHumanTrunkF1Traced.BAND)[number], y: number) => number) | null): IDatum[] =>
      reading === null || band.length === 0
        ? knots.map(fromBottom)
        : [...band.map((r: (typeof AutoMovieHumanTrunkF1Traced.BAND)[number], i: number): IDatum => ({ site: "bottom band", y: bandY(r, i), value: reading(r, bandY(r, i)), slope: null, rule: bandRule })), ...knots.filter((k: AutoMovieHumanTrunkF1Lines.IKnot): boolean => above(k.y)).map((k: AutoMovieHumanTrunkF1Lines.IKnot): IDatum => datum(k))];

    // The neck base from the landmarks (f1's authored C7 depth and side-neck-point half breadth).
    const depth: number = ij[0] - at("C7")[0];
    const snpHalf: number = at("side neck point.right")[2];
    // The tape sites under a traced table hold the shoulder their tape solved on the wall the table was read
    // over (AutoMovieHumanTrunkF1Traced.FROZEN); the others are solved for their tapes.
    const T: typeof AutoMovieHumanTrunkF1Traced = AutoMovieHumanTrunkF1Traced;
    let values: Record<string, number> = { chest: ellipse, underbust: ellipse, waist: ellipse, "top hip": ellipse, hip: ellipse, ...Object.fromEntries([...W.tapes, ...T.TAPES].map((t: { site: string }): [string, number] => [t.site, ellipse])), ...T.FROZEN };
    // The breast projection: solved so the apex stands at f1's bust point (WORLD.apexX); the published
    // 40 mm (AutoMovieHumanTrunkViewMounds.BREAST_PROJECTION) is only the solve's start.
    let breastP: number = AutoMovieHumanTrunkViewMounds.BREAST_PROJECTION;
    const apexY: number = W.levels.bust;
    const apexX: number = W.apexX;
    let foldY: number = apexY - 40;
    let fullness: IDatum[] = [];
    let bridge: IDatum[] = [];
    let source!: Source;
    let mounds: AutoMovieHumanTrunkMound.ISpec[] = [];
    let moundNotes: string[] = [];

    // The outlines, once: the back line, the front line and the lateral line from f1's knots.
    const back: IDatum[] = [
      ...outline(W.posterior, (r: { back: number }, y: number): number => course(y)[0] + r.back),
      { site: "C7 (the end)", y: top, value: W.c7.x, slope: W.c7.slope, rule: "f1's authored C7 (AutoMovieHumanTrunkF1Lines.WORLD.c7), its value and lean at the end" },
    ].map(relative);
    const front: IDatum[] = [...outline(W.anterior, (r: { front: number }, y: number): number => course(y)[0] + r.front), ...throatKnots].map(relative);
    const underArm: boolean = axillaY > apexY + 5 && axillaY < acromionY - 5;
    const side: IDatum[] = [
      ...outline(W.lateral, (r: { half: number }): number => r.half),
      ...(underArm ? [{ site: "axilla", y: axillaY, value: W.lateral[W.lateral.length - 1]!.x, slope: 0, rule: "the trunk's side under the arm, level with f1's last knot below it; the flare to the acromion lies inside the shoulder port" }] : []),
      { site: "acromion", y: acromionY, value: W.acromionHalf, slope: 0, rule: "f1's authored side at the acromion height (WORLD.acromionHalf), a maximum, on the acromion landmark" },
      ...W.shoulder.map((k: AutoMovieHumanTrunkF1Lines.IKnot): IDatum => datum(k)),
      { site: "SNP (top)", y: top, value: snpHalf, slope: 0, second: 0, rule: "f1's authored side neck points' half breadth (AutoMovieHumanTrunkF1Lines.NECK), leaving straight into the neck (zero slope and curvature)" },
    ];
    const axillaNote: string | null = underArm ? null : `axilla knot left out: axilla ${axillaY.toFixed(1)} mm against the bust ${apexY.toFixed(1)} and the acromion ${acromionY.toFixed(1)}`;

    // The midlines are fair in the world, not in course-relative values: free knots at the course's band
    // ends keep the course one polynomial piece per span, so each relative span is exactly the quintic
    // Hermite of its end jets: the composed source and the engine loft read the world-fair curve.
    const bands: number[] = [...(girdle === undefined ? [] : [girdle.from, girdle.to]), drift, top];
    const withBand: (datums: readonly IDatum[]) => IDatum[] = (datums: readonly IDatum[]): IDatum[] => {
      const ys: number[] = datums.map((d: IDatum): number => d.y);
      const extra: IDatum[] = bands
        .filter((y: number): boolean => y > Math.min(...ys) + 0.5 && y < Math.max(...ys) - 0.5 && !ys.some((v: number): boolean => Math.abs(v - y) < 0.5))
        .map((y: number): IDatum => ({ site: "course band end", y, value: null, slope: null, second: null, rule: "free knot where the course's band ends (the relative span stays an exact quintic)" }));
      return [...datums, ...extra].sort((a: IDatum, b: IDatum): number => a.y - b.y);
    };
    const relScalar: (rel: readonly IDatum[]) => Scalar = (rel: readonly IDatum[]): Scalar => {
      const world: IDatum[] = withBand(rel).map((d: IDatum): IDatum => {
        const [c, c1, c2] = course(d.y);
        return { ...d, value: d.value === null ? null : d.value + c, slope: d.slope === null ? null : d.slope + c1, second: d.second === undefined || d.second === null ? d.second : d.second + c2 };
      });
      const s: Scalar = scalar(world);
      return {
        q: s.q,
        jets: s.jets.map((j: AutoMovieHumanFairOutline.IJet, i: number): AutoMovieHumanFairOutline.IJet => {
          const [c, c1, c2] = course(s.q[i]!);
          return { value: j.value - c, first: j.first - c1, second: j.second - c2 };
        }),
        at: s.at,
      };
    };
    const posterior: Scalar = relScalar(back);
    const anterior: Scalar = relScalar(front);
    const lateral: Scalar = scalar(side);
    const xb: (y: number) => number = (y: number): number => course(y)[0] + read(posterior, y);
    const xf: (y: number) => number = (y: number): number => course(y)[0] + read(anterior, y);
    const frontNotch: number = xf(bottom);
    const backNotch: number = xb(bottom);

    // The wall's fullness, the front quarters' departure and the mounds.
    // f1's extra tapes (AutoMovieHumanTrunkF1Lines.TAPES) take their place by height among the measured ones.
    const tapes: [string, () => number, number][] = [
      ["hip", (): number => buttockY, measures.hipCircumference],
      ...W.tapes.map((t: { site: string; y: number; girth: number }): [string, () => number, number] => [t.site, (): number => t.y, t.girth]),
      ...T.TAPES.map((t: { site: string; y: number; girth: number }): [string, () => number, number] => [t.site, (): number => t.y, t.girth]),
      ["top hip", (): number => highHipY, measures.highHipCircumference],
      ["waist", (): number => waistY, measures.waistCircumference],
      ["underbust", (): number => foldY, measures.underbustCircumference],
      ["chest", (): number => apexY, measures.chestCircumference],
    ];
    const zero: (site: string, y: number) => IDatum = (site: string, y: number): IDatum => ({ site, y, value: 0, slope: 0, second: 0, rule: "no departure" });
    // The back quarters' departure from the shared shoulder: f1's back-less-front quarter split (WORLD.backQuarters).
    // A tape in the turned band is no level girth of S00's sections: it is a check there, not a fullness knot.
    const solvedTape = (y: number): boolean => band.length === 0 || above(y);
    const backQuarter: IDatum[] = [
      ...(band.length === 0 ? [zero("crotch", bottom)] : band.map((r: (typeof AutoMovieHumanTrunkF1Traced.BAND)[number], i: number): IDatum => ({ site: "bottom band", y: bandY(r, i), value: r.rhoBack - r.rhoFront, slope: null, rule: bandRule }))),
      ...W.backQuarters.filter((k: { y: number }): boolean => band.length === 0 || above(k.y)).map((k: { site: string; y: number; value: number }): IDatum => ({ site: k.site, y: k.y, value: k.value, slope: null, rule: "f1's back quarters' departure (AutoMovieHumanTrunkF1Lines.WORLD.backQuarters)" })),
      zero("top", top),
    ];
    const back2: Scalar = scalar(backQuarter);
    const build: () => void = (): void => {
      fullness = [
        ...(band.length === 0
          ? [{ site: "crotch", y: bottom, value: ellipse, slope: null, rule: "ellipse at the open bottom (no tape)" }]
          : band.map((r: (typeof AutoMovieHumanTrunkF1Traced.BAND)[number], i: number): IDatum => ({ site: "bottom band", y: bandY(r, i), value: r.rhoFront, slope: null, rule: bandRule }))),
        ...W.fullness.filter((k: { y: number }): boolean => band.length === 0 || above(k.y)).map((k: { site: string; y: number; value: number }): IDatum => ({ site: k.site, y: k.y, value: k.value, slope: null, rule: "f1's authored fullness (AutoMovieHumanTrunkF1Lines.WORLD.fullness)" })),
        ...tapes.filter(([, y]: [string, () => number, number]): boolean => solvedTape(y())).map(([name, y]: [string, () => number, number]): IDatum => ({ site: name, y: y(), value: values[name]!, slope: null, rule: "solved for the tape" })),
        { site: "top", y: top, value: ellipse, slope: 0, second: 0, rule: "ellipse at the open top (no tape), leaving level into the neck's own fullness (declared)" },
      ].sort((a: IDatum, b: IDatum): number => a.y - b.y);
      const shoulder: Scalar = scalar(fullness);
      const mid: number = (ij[1] + top) / 2;
      bridge = [
        zero("crotch", bottom),
        zero("IJ", ij[1]),
        { site: "neck band middle", y: mid, value: Math.min(0, BRIDGE - read(shoulder, mid)), slope: 0, rule: "front quarters toward the chord (BRIDGE)" },
        zero("top", top),
      ];
      const departure: Scalar = scalar(bridge);
      const draft: Source = { anterior, posterior, lateral, shoulder, departures: [departure, back2, back2, departure], reliefs: [], axis: (y: number): number => course(y)[0] };
      const placed: AutoMovieHumanTrunkViewMounds.IOutput = AutoMovieHumanTrunkViewMounds.create(draft, { frames, measures, xs, hipX, bottom, apexY, breastP, sternalAngle, buttockY, crestY, xf, groove: W.groove, bones: W.bones, fold: W.levels.fold, buttockGap: F.BUTTOCK_GAP, breastBase: F.BREAST, apexHalf: W.apexHalf, tables: { breast: T.BREAST, thigh: T.THIGH, buttock: T.BUTTOCK, groove: T.GROOVE }, ...(turn.floor === undefined ? {} : { tilt: turn.floor.theta }) });
      mounds = placed.mounds;
      foldY = placed.foldY;
      moundNotes = placed.diagnostics;
      source = { ...draft, reliefs: mounds.map(AutoMovieHumanTrunkMound.relief) };
    };

    // The apex's forward place on the composed wall with the breast relief.
    const apexAt: () => number = (): number => {
      const m: AutoMovieHumanTrunkMound.ISpec = mounds[1]!;
      return course(apexY)[0] + (AutoMovieHumanTrunkComposedSection.radius(source, apexY, m.phase) + breastP) * Math.cos(m.phase);
    };
    const loopLength: () => number = (): number => AutoMovieHumanTrunkNeckBase.length(AutoMovieHumanTrunkNeckBase.loop(source, neckX, top, ij[1], AutoMovieHumanTrunkNeckBase.LOOP_POINTS));

    // Sequential: the fullness site by site (the chest tape on the wall's shoulder at the bust), then the
    // breast projection so the apex stands at f1's bust point, repeated only while the mounds settle.
    const clock: Record<"build" | "shoulder" | "projection", number> = { build: 0, shoulder: 0, projection: 0 };
    let builds: number = 0;
    const timed: <T>(key: keyof typeof clock, f: () => T) => T = <T>(key: keyof typeof clock, f: () => T): T => {
      const t: number = performance.now();
      const out: T = f();
      clock[key] += performance.now() - t;
      return out;
    };
    const rebuild: () => void = (): void => {
      ++builds;
      timed("build", build);
    };
    let iterations: number = 0;
    for (iterations = 1; iterations <= 40; ++iterations) {
      rebuild();
      let change: number = 0;
      for (const [name, y, tape] of tapes) {
        if (name in T.FROZEN || !solvedTape(y())) continue;
        const solved: number = timed("shoulder", (): number => AutoMovieHumanTrunkComposedSection.solveShoulder(source, y(), tape, values[name]!, diagnostics));
        change = Math.max(change, Math.abs(solved - values[name]!));
        values = { ...values, [name]: solved };
      }
      // The breast projection is f1's own (WORLD.breastP, read on her apex column over her chest wall), no
      // longer solved to the apex: the apex's place is a check (diagnostics). The secant it replaces:
      //   breastP = AutoMovieHumanTrunkViewScalar.secant((p) => { breastP = p; rebuild(); return apexAt() - apexX; }, ...).x;
      const p0: number = breastP;
      const t0: number = performance.now();
      breastP = W.breastP;
      clock.projection += performance.now() - t0;
      change = Math.max(change, Math.abs(breastP - p0) / 100);
      // Settled when no shoulder moves 1e-5 and the projection 1e-3 mm.
      if (change < 1e-5) break;
    }
    rebuild();
    diagnostics.push(`profile: ${iterations} passes, ${builds} builds ${clock.build.toFixed(0)} ms; shoulder solves ${clock.shoulder.toFixed(0)} ms; projection secants ${clock.projection.toFixed(0)} ms`);
    const ra: number = apexAt() - apexX;
    const rl: number = loopLength() - measures.neckBaseCircumference;
    diagnostics.push(...moundNotes, ...(axillaNote === null ? [] : [axillaNote]));
    const lengths: { anterior: number; posterior: number } = {
      anterior: AutoMovieHumanTrunkMidlineLength.between(anterior, bottom, omphalionY),
      posterior: AutoMovieHumanTrunkMidlineLength.between(posterior, bottom, omphalionY),
    };
    const crotchRead: number = lengths.anterior + lengths.posterior + (frontNotch - backNotch);
    diagnostics.push(`check: crotch length ${crotchRead.toFixed(1)} mm on the outlines (midlines and the seam) against ${measures.crotchLength.toFixed(1)}`);
    // The same reading on the skin: each midline with the reliefs it carries (the cleft, the groove, the
    // mounds reaching it), moved along each relief's own axis, every 1 mm from the open bottom to the
    // omphalion level, plus the seam between the two midline points at the bottom.
    const skinX = (y: number, phase: number): number =>
      course(y)[0] + read(phase === 0 ? anterior : posterior, y) + source.reliefs.reduce((s: number, r: IAutoMovieLoftRelief): number => s + AutoMovieLoftRelief.height(r, y, phase)[0] * r.axis[0], 0);
    const skinLength = (phase: number): number => {
      let total: number = 0;
      for (let y: number = bottom; y < omphalionY; y += 1) total += Math.hypot(1, skinX(Math.min(y + 1, omphalionY), phase) - skinX(y, phase));
      return total;
    };
    const skinAnterior: number = skinLength(0);
    const skinPosterior: number = skinLength(Math.PI);
    const seamFront: number = skinX(bottom, 0) - hipX;
    const seamBack: number = hipX - skinX(bottom, Math.PI);
    diagnostics.push(`check: crotch length on the skin ${(skinAnterior + skinPosterior + seamFront + seamBack).toFixed(1)} mm: anterior ${(skinAnterior + seamFront).toFixed(1)}, posterior ${(skinPosterior + seamBack).toFixed(1)} (f1: 630.0 = 326.2 + 303.8, node:trunk-measure)`);
    diagnostics.push(`check: breast apex ${ra.toFixed(2)} mm from f1's bust point; breast projection ${breastP.toFixed(1)} mm`);
    diagnostics.push(`check: ISO neck-base loop ${(rl + measures.neckBaseCircumference).toFixed(2)} mm against ${measures.neckBaseCircumference.toFixed(2)} (the loop's cos^3 descent on S00, a declared curve)`);

    const perimeter: (y: number) => number = (y: number): number => {
      try {
        return AutoMovieHumanTrunkComposedSection.girth(source, y);
      } catch (error: unknown) {
        diagnostics.push(`girth at ${y.toFixed(1)} mm unreadable: ${error instanceof Error ? error.message : String(error)}`);
        return NaN;
      }
    };
    const sites: ISite[] = [
      ...tapes.map(([name, y, tape]: [string, () => number, number]): ISite => ({ name, y: y(), girth: tape, unknown: "shoulder", value: values[name]!, shoulder: values[name]!, perimeter: perimeter(y()) })),
    ];
    for (const s of sites)
      if (Math.abs(s.perimeter - s.girth) > 0.5 || s.shoulder < 0.03 || s.shoulder > 0.97) diagnostics.push(`${s.name}: tape ${s.girth.toFixed(1)} mm not closed (perimeter ${s.perimeter.toFixed(1)}, shoulder ${s.shoulder.toFixed(4)})`);
    for (let y: number = bottom + 1; y < top; y += 2) {
      const quarters: number[] = AutoMovieHumanTrunkComposedSection.shoulders(AutoMovieHumanTrunkComposedSection.inputs(source, y));
      if (!quarters.every((rho: number): boolean => rho > 0 && rho < 1)) {
        diagnostics.push(`a quarter's shoulder leaves (0, 1) at ${y.toFixed(1)} mm: ${quarters.map((rho: number): string => rho.toFixed(4)).join(", ")}`);
        break;
      }
    }

    // Results: knots in the station, the landmarks with the solved neck, the back reading.
    const knots: (datums: IDatum[]) => IKnot[] = (datums: IDatum[]): IKnot[] => {
      const s: Scalar = scalar(datums);
      return datums.map((d: IDatum, i: number): IKnot => ({ ...d, q: s.q[i]!, jet: s.jets[i]! }));
    };
    // The midlines' knots: the relative datums with the band knots, and the world-fair solve's relative jets.
    const relKnots: (datums: IDatum[]) => IKnot[] = (datums: IDatum[]): IKnot[] => {
      const s: Scalar = relScalar(datums);
      return withBand(datums).map((d: IDatum, i: number): IKnot => ({ ...d, q: s.q[i]!, jet: s.jets[i]! }));
    };
    const backKnots: IKnot[] = knots(backQuarter);
    const points: { name: string; point: Vec3 }[] = mounds.map((m: AutoMovieHumanTrunkMound.ISpec): { name: string; point: Vec3 } => {
      const r: number = AutoMovieHumanTrunkComposedSection.radius(source, m.station, m.phase) + m.projection;
      return { name: `${m.name} apex`, point: [course(m.station)[0] + r * Math.cos(m.phase), m.station, r * Math.sin(m.phase)] };
    });
    const neckBasis: string = "f1's authored neck base (AutoMovieHumanTrunkF1Lines.NECK: C7 behind IJ, the side neck points' half breadth), the side neck points at the neck's mid-depth in profile (the X midpoint of C7 and IJ, where the course ends)";
    const solved: AutoMovieHumanTrunkSpecLandmarks.IOutput = AutoMovieHumanTrunkSpecLandmarks.create(frames, measures, crotch, { depth, half: snpHalf, forward: neckX - ij[0], basis: neckBasis });
    const neck: INeck = { vp: ij[0] - depth, horizontal: depth, spatial: Math.hypot(depth, top - ij[1]), half: snpHalf, loop: rl + measures.neckBaseCircumference, chestDepth: apexAt() - xb(apexY) };
    diagnostics.push(`neck base: C7 ${depth.toFixed(1)} mm behind IJ (spatial ${neck.spatial.toFixed(1)}), side neck points ${snpHalf.toFixed(1)} mm from the midline (breadth ${(2 * snpHalf).toFixed(1)})`);
    const dimplesY: number = W.levels.dimples;
    const reading: AutoMovieHumanTrunkBackLineReading.IOutput = AutoMovieHumanTrunkBackLineReading.read(posterior, course, { top, waist: waistY, buttock: buttockY, dimples: dimplesY }, { kyphotic: F.POSTURE.kyphotic, lordotic: F.POSTURE.lordotic });
    return {
      bottom,
      top,
      axis: { xs, turn },
      lengths,
      outlines: { anterior: relKnots(front), posterior: relKnots(back), lateral: knots(side) },
      fullness: knots(fullness),
      departures: [knots(bridge), backKnots, backKnots, knots(bridge)],
      sites,
      mounds,
      source,
      landmarks: solved,
      neck,
      back: reading,
      points,
      iterations,
      diagnostics,
    };
  }
}
