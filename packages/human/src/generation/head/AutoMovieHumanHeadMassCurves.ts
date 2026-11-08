import { AutoMovieHumanFairOutline } from "../arm/AutoMovieHumanFairOutline";
import type { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import type { AutoMovieHumanTrunkNeckBase } from "../trunk/AutoMovieHumanTrunkNeckBase";
import type { AutoMovieHumanHeadFrankfort } from "./AutoMovieHumanHeadFrankfort";
import type { AutoMovieHumanHeadNeckCourse } from "./AutoMovieHumanHeadNeckCourse";
import { AutoMovieHumanHeadF1Lines } from "./AutoMovieHumanHeadF1Lines";
import { AutoMovieHumanHeadF1Pose } from "./AutoMovieHumanHeadF1Pose";
import { AutoMovieHumanHeadThroat } from "./AutoMovieHumanHeadThroat";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/** f1's authored lines (head frame). */
const F: typeof AutoMovieHumanHeadF1Lines = AutoMovieHumanHeadF1Lines;
type IJet = AutoMovieHumanTrunkNeckBase.IJet;

/**
 * L2 of the head/neck stream (S01's mass) by conic lofting: a few 2D view
 * curves on the level course of `AutoMovieHumanHeadNeckCourse` (station = the
 * height above FH; FH-parallel sections whose origins drift from the trunk's
 * end onto the head axis). Each section is the conic through four outline
 * points in its own plane:
 * - `anterior`: the side view's midline (+u): throat contour, submental line,
 *   chin, the facial midline without the nose and lips (their own composed
 *   and native inputs: a midline feature on this outline is spread by the
 *   quarter conics into a rib around the whole face) and the forehead;
 * - `posterior`: the side view's nape and occipital midline (-u), unsigned;
 * - `lateral`: the front view's half breadth (+v, mirrored), unsigned;
 * - `fullness`: the conic shoulder of the anterior and the posterior
 *   quarter pairs, the top view.
 * Each outline is one C2 quintic Hermite chain in the engine's one-pole root
 * parameter `q = -sqrt(L - s)` (`L` the vertex station), the minimum bending
 * energy under the datums the anatomy fixes (`AutoMovieHumanFairOutline`); a
 * value the anatomy does not fix is left to that minimum.
 *
 * Datums and their sources:
 * - port (the first station): the trunk's level end
 *   (`AutoMovieHumanTrunkNeckBase`): its lateral and posterior extents with
 *   their height jets, converted to the root parameter, so the stream
 *   continues S00 to second order; the front reads the head's own throat
 *   contour there (`AutoMovieHumanHeadThroat`, which S00 reads too);
 * - throat contour: the throat line through IJ, the submental line from the
 *   gnathion and their conic fillet at the cervical point; its points above
 *   the port are datums, the submental line's midpoint among them;
 * - chin: the conic fillet at the gnathion between the submental line and
 *   the deep plane (the sn-gn chord) under the lips;
 * - subnasale, glabella, opisthocranion: each at the station whose plane
 *   holds the landmark, with its offset there;
 * - gonion: on the mandibular plane through menton at the Frankfort-
 *   mandibular plane angle (Tweed 1954, 25 degrees; unverified citation),
 *   below the tragion line (its forward place is an input gap);
 * - neck side: from the menton's height to the gonion's, the trunk's end
 *   half breadth (the neck breadth is an input gap); the mandible
 *   inside the gonial wedge (half go-go, the jaw line, the ramus) is the jaw
 *   relief's (`AutoMovieHumanHeadJawRelief`);
 * - tragion: half t-t at the FH station; euryon: half eu-eu with zero slope,
 *   its station solved from the coronal arc (`AutoMovieHumanHeadMassTapes`).
 * The public neck girth is not closed here: its ISO site below the larynx
 * lies under the port in f1, a check on the joined surface. The fullness laws
 * are solved from the public tapes and the ANSUR 1988 bitragion arcs.
 */
export namespace AutoMovieHumanHeadMassCurves {
  /** The three outline labels. */
  export type Label = "anterior" | "posterior" | "lateral";

  /** The labels. */
  export const LABELS: readonly Label[] = ["anterior", "posterior", "lateral"];

  /** A declared extremum at a knot. */
  export type Sense = "max" | "min" | null;

  /** One knot of an outline or a fullness law. */
  export interface IKnot {
    /** Site name. */
    site: string;

    /** Course station, mm. */
    station: number;

    /** Root parameter `-sqrt(L - s)`; a fullness knot uses the station itself. */
    q: number;

    /** Unsigned offset from the course in the section's plane, mm; dimensionless for a fullness. */
    value: number;

    /** d value / dq. */
    first: number;

    /** d2 value / dq2. */
    second: number;

    /** Declared extremum. */
    sense: Sense;

    /** What fixed the knot. */
    rule: string;
  }

  /** One tape the construction closes, with its solved residual. */
  export interface ITape {
    /** Tape name. */
    name: string;

    /** Target length, mm. */
    target: number;

    /** Length on the analytic section family after the solve, mm. */
    reached: number;

    /** What the solve moved. */
    solves: string;

    /** Source of the target. */
    source: string;
  }

  /** The datum-fixed outlines, before the tapes solve the euryon station and the fullness. */
  export interface IDatums {
    /** Vertex station, the pole: the course length, mm. */
    length: number;

    /** Named stations of the datums, mm. */
    stations: Record<string, number>;

    /** Anterior outline. */
    anterior: IKnot[];

    /** Posterior outline. */
    posterior: IKnot[];

    /** Lateral outline for a euryon station. */
    lateral: (euryon: number) => IKnot[];

    /** Gonion height above FH, mm. */
    gonion: number;

    /** Measured notes: the front step against the trunk's end, the neck girth's place. */
    notes: string[];
  }

  /** A datum of an outline; a null value leaves it to the minimum. */
  export interface IDatum {
    /** Site. */
    site: string;

    /** Course station, mm. */
    station: number;

    /** Value, or null. */
    value: number | null;

    /** Declared extremum. */
    sense: Sense;

    /** A declared slope in the root parameter, or absent. */
    slope?: number;

    /** A declared second derivative in the root parameter (the trunk's end jet), or absent. */
    second?: number;
  }

  /** The conic shoulder of an exact quarter ellipse on its box. */
  export const ELLIPSE: number = Math.SQRT2 - 1;

  /** Frankfort-mandibular plane angle, radians (Tweed 1954, 25 degrees; unverified citation). */
  export const FMA: number = (25 * Math.PI) / 180;

  /** DEBT: the chin fillet's tangent length from the gnathion along the submental line and the deep plane, mm (no published soft-tissue chin radius read). */
  export const CHIN_FILLET: number = 12;

  /** Root parameter of a station for the vertex pole at `length`. */
  export function parameter(station: number, length: number): number {
    return -Math.sqrt(Math.max(0, length - station));
  }

  /** Build the datum-fixed outlines from the head frame's landmarks, the course, the head's throat contour (head frame) and the public neck girth. */
  export function create(head: AutoMovieHumanHeadFrankfort.IOutput, course: AutoMovieHumanHeadNeckCourse.IOutput, throat: AutoMovieHumanHeadThroat.IOutput, neckGirth: number): IDatums {
    const P: Record<AutoMovieHumanHeadFrankfort.Name, Vec3> = head.points;
    const D: AutoMovieHumanHeadFrankfort.IDims = head.dims;
    const L: number = course.length;
    const s0: number = course.start;
    const notes: string[] = [];

    // Datum stations and offsets.
    const me: { station: number; offset: number } = course.locate(P.me);
    const sn: { station: number; offset: number } = course.locate(P.sn);
    const g: { station: number; offset: number } = course.locate(P.g);
    const nasion: { station: number; offset: number } = course.locate(P.n);
    const op: { station: number; offset: number } = course.locate(P.op);
    // The mandibular plane at FMA to FH, read in her upright frame (her FH pitched by `AutoMovieHumanHeadF1Pose.PITCH`).
    const goY: number = P.me[1] + P.me[0] * Math.tan(FMA - AutoMovieHumanHeadF1Pose.PITCH);
    // f1's authored knots (zero frame) in her upright frame: the midline knots' places rotate, the lateral knots keep their half breadth at their rotated height.
    const posed: (knots: readonly AutoMovieHumanHeadF1Lines.IKnot[], midline: boolean) => AutoMovieHumanHeadF1Lines.IKnot[] = (knots: readonly AutoMovieHumanHeadF1Lines.IKnot[], midline: boolean): AutoMovieHumanHeadF1Lines.IKnot[] =>
      knots.map((k: AutoMovieHumanHeadF1Lines.IKnot): AutoMovieHumanHeadF1Lines.IKnot => {
        const p: Vec3 = AutoMovieHumanHeadF1Pose.upright([midline ? k.at : 0, k.y, 0]);
        return { ...k, y: p[1], at: midline ? p[0] : k.at };
      });
    const anteriorKnots: AutoMovieHumanHeadF1Lines.IKnot[] = posed(F.ANTERIOR, true);
    const posteriorKnots: AutoMovieHumanHeadF1Lines.IKnot[] = posed(F.POSTERIOR, true);
    const lateralKnots: AutoMovieHumanHeadF1Lines.IKnot[] = posed(F.LATERAL, false);
    const go: number = course.locate([0, goY, 0]).station;
    const t: number = course.locate([0, 0, 0]).station;

    // The jaw. A level section's lateral extreme stands at the course origin,
    // about 30 mm behind the gonion at its height, where only the neck
    // reaches; the mandible is wider than the neck ahead of it. A jaw width on
    // this outline widened the neck behind the jaw and left a step around the
    // section (a groove ring at 06:12, a horizontal crease at 07:21 on
    // 2026-11-08). So this outline carries the neck's side up to the gonion's
    // height and the mandible inside the gonial wedge is the jaw relief's
    // (`AutoMovieHumanHeadJawRelief`). The neck's side continues the trunk's
    // end half breadth (its side neck points); the neck breadth is an input
    // gap, and the public neck girth's circle radius, used here before, stood
    // wider than the end (51.7 against 48.1 mm once the end became a saddle)
    // and turned the neck's taper upside down. The neck girth is a check on
    // the joined surface (its site lies under the port).
    const side: number = course.base.extents[1][0];
    notes.push(`jaw: the neck's side ${side.toFixed(2)} mm (the trunk's end half breadth) from the menton's height to the gonion's (${(go - s0).toFixed(1)} mm above the port), the neck girth's circle radius ${(neckGirth / (2 * Math.PI)).toFixed(2)} mm for the pending check; the mandible in the gonial wedge is the jaw relief's`);

    // The port's jets in the root parameter: s = L - q^2, so
    // dv/dq = -2 q v' and d2v/dq2 = 4 q^2 v'' - 2 v' (v', v'' per mm of
    // height). The course leaves the port with zero drift slope and
    // curvature, so an extent's height jets are its offset's.
    const q0: number = parameter(s0, L);
    const port: (site: string, j: IJet) => IDatum = (site: string, j: IJet): IDatum => ({ site, station: s0, value: j[0], sense: null, slope: -2 * q0 * j[1], second: 4 * q0 * q0 * j[2] - 2 * j[1] });
    const e: readonly [IJet, IJet, IJet, IJet] = course.base.extents;
    const contour: [number, number, number] = throat.at(s0);
    const front: IJet = [contour[0] - course.base.centre[0], contour[1], contour[2]];
    notes.push(
      `front at the port: the head's throat contour ${front[0].toFixed(2)} mm ahead of the end's axis point (slope ${front[1].toFixed(3)}, curvature ${front[2].toFixed(4)} /mm), the trunk's end extent ${e[0][0].toFixed(2)} mm (slope ${e[0][1].toFixed(3)}, curvature ${e[0][2].toFixed(4)} /mm): step ${(front[0] - e[0][0]).toFixed(2)} mm until S00 reads the contour`,
      `throat corner C ${(throat.corner[1] - s0).toFixed(1)} mm from the port's height, the fillet's ends ${(throat.from[1] - s0).toFixed(1)} and ${(throat.to[1] - s0).toFixed(1)} mm`,
      `neck girth (public, ISO 8559-1 5.3.2) not closed on head.mass: its site below the larynx lies under the port in f1, a check on the joined surface (pending); its circle radius serves as the neck's half breadth under the jaw`,
    );

    // The throat contour's points above the port, and the submental line's
    // midpoint between the throat fillet and the chin fillet.
    const back: Vec3 = [-Math.cos(throat.submental), -Math.sin(throat.submental), 0];
    const rise: Vec3 = unit2([P.sn[0] - P.gn[0], P.sn[1] - P.gn[1], 0]);
    const chin: Vec3[] = AutoMovieHumanHeadThroat.fillet(P.gn, back, rise, CHIN_FILLET);
    const located: (site: string, p: Vec3) => IDatum = (site: string, p: Vec3): IDatum => {
      const l: { station: number; offset: number } = course.locate(p);
      return { site, station: l.station, value: l.offset, sense: null };
    };
    const throatKnots: IDatum[] = (
      [
        ["throat fillet (throat line)", throat.from],
        ["throat fillet (shoulder)", throat.shoulder],
        ["throat fillet (submental line)", throat.to],
      ] as [string, Vec3][]
    )
      .filter(([, p]: [string, Vec3]): boolean => p[1] > s0 + 0.5)
      .map(([site, p]: [string, Vec3]): IDatum => located(site, p));
    const ym: number = (Math.max(throat.to[1], s0) + chin[0]![1]) / 2;
    const mid: IDatum = located("mid-submental", [throat.at(ym)[0], ym, 0]);

    // The deep plane under the lips: the stomion's place on the sn-gn chord
    // (`AutoMovieHumanHeadFrankfort`); the vermilion's protrusion ahead of it
    // belongs to the native lip inputs (Legan and Burstone's Ls and Li ahead
    // of Sn-Pg'), not to head.mass. The chin's corner is the conic fillet
    // between the submental line and that plane at the gnathion (`CHIN_FILLET`,
    // DEBT); the pogonion's prominence and the mentolabial sulcus are local
    // features of the facial mask.
    const sto: { station: number; offset: number } = course.locate(P.sto);
    const stations: Record<string, number> = {
      port: s0,
      "mid-submental": mid.station,
      me: me.station,
      go,
      sto: sto.station,
      sn: sn.station,
      t,
      g: g.station,
      op: op.station,
      vertex: L,
    };

    const anterior: IKnot[] = solve(
      [
        // The port takes S00's live end extent with its height jets (`course.base.extents[0]`), as the other three outlines do, so head.mass's first section is S00's end exactly: reading the head's throat contour here (`front`, which S00 reads too) left a 0.0105 mm, 0.266 degree continuation gap once the throat's knots changed (f1_integration run-19, 2026-11-08 17:3x); the contour's own value stays a note above.
        { ...port("neck port (the trunk's end extent, S00's reading of the throat contour)", e[0]) },
        ...throatKnots,
        mid,
        located("chin fillet (submental line)", chin[0]!),
        located("chin fillet (shoulder)", chin[1]!),
        located("chin fillet (deep plane)", chin[2]!),
        { site: "sto", station: sto.station, value: sto.offset, sense: null },
        { site: "sn", station: sn.station, value: sn.offset, sense: null },
        // The soft nasion: the nose relief rises from it, so it lies on the face's deep plane; without it the chain from sn to g bulged 6 mm ahead of her nasion between them (the brow overshoot of the 2026-11-08 overlays).
        { site: "n", station: nasion.station, value: nasion.offset, sense: null },
        { site: "g", station: g.station, value: g.offset, sense: "max" },
        // f1's authored forehead and crown knots (`AutoMovieHumanHeadF1Lines.ANTERIOR`, head frame): the minimum-energy pole left the crown 3-4 mm inside hers.
        ...anteriorKnots.map((k: AutoMovieHumanHeadF1Lines.IKnot): IDatum => ({ site: k.site, station: k.y, value: k.at - course.frame(k.y).origin[0], sense: k.sense })),
      ],
      L,
    );
    // The posterior outline from f1's authored knots in the head frame (`AutoMovieHumanHeadF1Lines.POSTERIOR`), each converted to the course's offset at its own station: an offset left free between the port and the opisthocranion rode the course origin's 46 mm drift forward and ran 17 mm inside her nape. Stagnara's cervical arrow apex (`head.measured.nape`, read upright) waits for the posture batch with S00 (later algorithmization).
    const behind: (k: AutoMovieHumanHeadF1Lines.IKnot) => IDatum = (k: AutoMovieHumanHeadF1Lines.IKnot): IDatum => ({ site: k.site, station: k.y, value: -(k.at - course.frame(k.y).origin[0]), sense: k.sense });
    const posterior: IKnot[] = solve(
      [
        port("neck port (the trunk's C7 extent)", e[2]),
        ...posteriorKnots.filter((k: AutoMovieHumanHeadF1Lines.IKnot): boolean => k.y < op.station).map(behind),
        { site: "op", station: op.station, value: -op.offset, sense: "max" },
        ...posteriorKnots.filter((k: AutoMovieHumanHeadF1Lines.IKnot): boolean => k.y > op.station).map(behind),
      ],
      L,
    );
    // The lateral outline from f1's authored knots (`AutoMovieHumanHeadF1Lines.LATERAL`), the gonion and the tragion: her euryon is an authored knot, so the coronal arc is a check (later algorithmization: the arc's solve of the euryon station, `AutoMovieHumanHeadMassTapes`, with a crown law); the neck side at the menton's height (the trunk's end half breadth, 48.08) gave way to her neck's knots.
    const lateral: (eu: number) => IKnot[] = (): IKnot[] =>
      solve(
        [
          port("neck port (the trunk's side neck extent)", e[1]),
          ...lateralKnots.filter((k: AutoMovieHumanHeadF1Lines.IKnot): boolean => k.y < go).map((k: AutoMovieHumanHeadF1Lines.IKnot): IDatum => ({ site: k.site, station: k.y, value: k.at, sense: k.sense })),
          // Above the gonion the section's lateral extreme lies in the parotid region below the ear, as wide as the ramus: the outline leaves the gonion along the ramus chord from half go-go to half t-t at FH. Carrying the neck's side up to the gonion there left the jaw plane standing about a centimetre proud behind the ramus, a cliff the 2 ROLL step could not round (front-left-low curvature, 10:22 and 10:29).
          { site: "go", station: go, value: D.bigonial / 2, sense: null, slope: -2 * parameter(go, L) * ((D.bitragion / 2 - D.bigonial / 2) / (t - go)) },
          ...lateralKnots.filter((k: AutoMovieHumanHeadF1Lines.IKnot): boolean => k.y > go && k.y < t).map((k: AutoMovieHumanHeadF1Lines.IKnot): IDatum => ({ site: k.site, station: k.y, value: k.at, sense: k.sense })),
          { site: "t", station: t, value: D.bitragion / 2, sense: null },
          ...lateralKnots.filter((k: AutoMovieHumanHeadF1Lines.IKnot): boolean => k.y > t).map((k: AutoMovieHumanHeadF1Lines.IKnot): IDatum => ({ site: k.site, station: k.y, value: k.at, sense: k.sense })),
        ],
        L,
      );
    return { length: L, stations, anterior, posterior, lateral, gonion: goY, notes };
  }

  /** In-plane unit vector; throws on a zero vector. */
  function unit2(a: Vec3): Vec3 {
    const n: number = Math.hypot(a[0], a[1]);
    if (!(n > 0)) throw new Error("head chin fillet: zero direction");
    return [a[0] / n, a[1] / n, 0];
  }

  /** The minimum-energy chain through the datums plus the vertex pole. */
  export function solve(datums: readonly IDatum[], length: number): IKnot[] {
    const all: IDatum[] = [...datums, { site: "v", station: length, value: 0, sense: null }];
    for (let i: number = 1; i < all.length; ++i)
      if (!(all[i]!.station > all[i - 1]!.station)) throw new Error(`head outline: ${all[i]!.site} at station ${all[i]!.station.toFixed(2)} does not follow ${all[i - 1]!.site} at ${all[i - 1]!.station.toFixed(2)}`);
    const jets: AutoMovieHumanFairOutline.IJet[] = AutoMovieHumanFairOutline.solve(
      all.map((d: IDatum): AutoMovieHumanFairOutline.IKnot => ({ q: parameter(d.station, length), value: d.value, slope: d.sense !== null ? 0 : (d.slope ?? null), second: d.second ?? null })),
    );
    return all.map((d: IDatum, i: number): IKnot => ({
      site: d.site,
      station: d.station,
      q: parameter(d.station, length),
      value: jets[i]!.value,
      first: jets[i]!.first,
      second: jets[i]!.second,
      sense: d.sense,
      rule: [d.value !== null ? "value" : null, d.sense, d.slope !== undefined ? "slope" : null, d.second !== undefined ? "second derivative (the trunk's end jet)" : null].filter((x: string | null): x is string => x !== null).join(", ") || "free",
    }));
  }

  /** Value and first two station derivatives of an outline at a station. */
  export function value(knots: readonly IKnot[], station: number, length: number): [number, number, number] {
    const q: number = parameter(station, length);
    const [v, vq, vqq]: [number, number, number] = AutoMovieHumanFairOutline.evaluate(
      knots.map((k: IKnot): number => k.q),
      knots.map((k: IKnot): AutoMovieHumanFairOutline.IJet => ({ value: k.value, first: k.first, second: k.second })),
      q,
    );
    // s = L - q^2: ds/dq = -2 q.
    if (!(q < 0)) return [v, NaN, NaN];
    const vs: number = vq / (-2 * q);
    return [v, vs, (vqq + 2 * vs) / (4 * q * q)];
  }

  /** A fullness chain's value at a station (its knots are in station). */
  export function fullness(knots: readonly IKnot[], station: number): number {
    return AutoMovieHumanFairOutline.evaluate(
      knots.map((k: IKnot): number => k.station),
      knots.map((k: IKnot): AutoMovieHumanFairOutline.IJet => ({ value: k.value, first: k.first, second: k.second })),
      station,
    )[0];
  }

  /**
   * A bounded chain in station through measured shoulder values: the engine's quintic Hermite spans
   * (`AutoMovieHumanFairOutline.evaluate`, `AutoMovieViewHermite`) with the second derivative zero at
   * every knot after the first and each slope limited to the smaller adjacent secant, zero where the
   * secants change sign (the extremum) and zero at the last knot (the pole). Proof that every such
   * span lies between its two knot values: on a span normalised to `p(0) = 0`, `p(1) = 1` with end
   * slopes `a`, `b` (in secant units) and zero second derivatives, `p'(t) = (1 - t)^2 g(a, t) +
   * t^2 g(b, 1 - t)` with `g(c, t) = (15 - 15 c) t^2 + 2 c t + c`, whose coefficients are all
   * non-negative for `0 <= c <= 1`; so `p` is monotone and stays in `[p(0), p(1)]`. Every value lies
   * in (0, 1), so the chain does too, whichever rows exist. The first knot keeps `port` (the trunk's
   * end shoulder with its height jet, C2 with S00); that one span is outside the proof and is checked
   * on its samples. The interior knots share zero second derivatives on both sides, so the chain is
   * C2. The fair chain (`fullnessChain`) minimises bending instead and undershot f1's chin V (0.014
   * at -90 between 0.141 and 0.409) below zero, -0.013 at -92.6 (render
   * `.shots/f1_head/head-2026-11-08T08-40-16-785Z`, the loft refused head.mass).
   */
  export function fullnessBounded(sites: readonly string[], stations: readonly number[], values: readonly number[], port?: IJet): IKnot[] {
    const n: number = stations.length;
    const secant: number[] = Array.from({ length: n - 1 }, (_: unknown, k: number): number => (values[k + 1]! - values[k]!) / (stations[k + 1]! - stations[k]!));
    const slope: (i: number) => number = (i: number): number => {
      if (i === 0) return port !== undefined ? port[1] : 0;
      if (i === n - 1) return 0;
      const l: number = secant[i - 1]!;
      const r: number = secant[i]!;
      return l * r <= 0 ? 0 : Math.sign(r) * Math.min(Math.abs(l), Math.abs(r));
    };
    return stations.map((s: number, i: number): IKnot => ({
      site: sites[i]!,
      station: s,
      q: s,
      value: values[i]!,
      first: slope(i),
      second: i === 0 && port !== undefined ? port[2] : 0,
      sense: null,
      rule: i === 0 && port !== undefined ? "the trunk's end shoulder with its height jet" : "measured shoulder, slope limited to the smaller adjacent secant, zero second derivative (bounded)",
    }));
  }

  /** The fair chain in station through shoulder values (natural where free); `port`, when given, fixes the first knot's slope and second derivative per mm (the trunk's end shoulder jet). */
  export function fullnessChain(sites: readonly string[], stations: readonly number[], values: readonly number[], port?: IJet): IKnot[] {
    const jets: AutoMovieHumanFairOutline.IJet[] = AutoMovieHumanFairOutline.solve(
      stations.map((s: number, i: number): AutoMovieHumanFairOutline.IKnot => ({ q: s, value: values[i]!, slope: i === 0 && port !== undefined ? port[1] : null, second: i === 0 && port !== undefined ? port[2] : null })),
    );
    return stations.map((s: number, i: number): IKnot => ({
      site: sites[i]!,
      station: s,
      q: s,
      value: jets[i]!.value,
      first: jets[i]!.first,
      second: jets[i]!.second,
      sense: null,
      rule: i === 0 && port !== undefined ? "the trunk's end shoulder with its height jet" : "shoulder solved for a tape, or the exact quarter ellipse at the pole",
    }));
  }
}
