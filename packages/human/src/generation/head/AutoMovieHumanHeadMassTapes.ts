import { AutoMovieHumanFairOutline } from "../arm/AutoMovieHumanFairOutline";
import type { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import type { AutoMovieHumanTrunkNeckBase } from "../trunk/AutoMovieHumanTrunkNeckBase";
import type { AutoMovieHumanHeadFrankfort } from "./AutoMovieHumanHeadFrankfort";
import { AutoMovieHumanHeadF1Lines } from "./AutoMovieHumanHeadF1Lines";
import { AutoMovieHumanHeadMassCurves } from "./AutoMovieHumanHeadMassCurves";
import type { AutoMovieHumanHeadNeckCourse } from "./AutoMovieHumanHeadNeckCourse";
import { AutoMovieHumanHeadPlanArcs } from "./AutoMovieHumanHeadPlanArcs";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;
type Knot = AutoMovieHumanHeadMassCurves.IKnot;
type Quarter = AutoMovieHumanHeadPlanArcs.IQuarter;

/**
 * The tapes that own head.mass's remaining freedom, solved on its analytic
 * section family before any loft (girths are checks solved, never authored
 * loops):
 * - the euryon station (no published placement) from ANSUR 1988's bitragion
 *   coronal arc: the coronal plane through the tragia meets the sections at
 *   their lateral extremes (exactly on the horizontal head run, within the
 *   course's small X drift inside the head-neck turn), so the arc is twice
 *   the length of the lateral extremes from the tragion's station to the
 *   vertex, read in the root parameter where it is smooth up to the pole;
 * - the anterior shoulder at the glabella station from ANSUR 1988's
 *   bitragion minimum-frontal arc (its midline point declared at the
 *   glabella, "just above the brow ridges"); the menton and subnasale arcs are
 *   read as checks (see the solve's comment); each arc is the cut of the
 *   analytic family by the plane through both tragia and its midline point
 *   (`AutoMovieHumanHeadPlanArcs`), its sample points located once on the
 *   course (`AutoMovieHumanHeadNeckCourse.locate`) since the course does not
 *   move during the solve;
 * - the posterior shoulder at the glabella station from the public head
 *   circumference (its tape passes glabella and opisthocranion, both at the
 *   glabella's height here, a horizontal head-run section).
 * Both laws start from the trunk's end shoulder with its height jet (C2 with
 * S00); the public neck girth's site lies under the port in f1 and is not
 * closed here. The arcs are
 * ANSUR 1988 women's lines on the head circumference or the bizygomatic
 * breadth (`AutoMovieHumanHeadArcs`): population priors, the person's own
 * arcs being input gaps.
 */
export namespace AutoMovieHumanHeadMassTapes {
  /** What the solve reads. */
  export interface IInput {
    /** Frame, landmarks, dimensions and arcs. */
    head: AutoMovieHumanHeadFrankfort.IOutput;

    /** The course. */
    course: AutoMovieHumanHeadNeckCourse.IOutput;

    /** Anterior outline. */
    anterior: Knot[];

    /** Posterior outline. */
    posterior: Knot[];

    /** Lateral outline for a euryon station. */
    lateral: (euryon: number) => Knot[];

    /** Datum stations by name. */
    stations: Record<string, number>;
  }

  /** The solved laws and their tapes. */
  export interface IOutput {
    /** Euryon station. */
    euryon: number;

    /** Lateral outline at that station. */
    lateral: Knot[];

    /** Fullness laws. */
    fullness: { anterior: Knot[]; posterior: Knot[] };

    /** Each tape with its target and reached length. */
    tapes: AutoMovieHumanHeadMassCurves.ITape[];

    /** Half-breadth checks. */
    checks: { name: string; station: number; value: number; detail: string }[];

    /** Unclosed tapes. */
    diagnostics: string[];
  }

  /** Solve the euryon station and both fullness laws. */
  export function solve(input: IInput): IOutput {
    const { head, course, anterior, posterior, stations } = input;
    const P: Record<AutoMovieHumanHeadFrankfort.Name, Vec3> = head.points;
    const D: AutoMovieHumanHeadFrankfort.IDims = head.dims;
    const L: number = course.length;
    const diagnostics: string[] = [];
    const M: typeof AutoMovieHumanHeadMassCurves = AutoMovieHumanHeadMassCurves;
    const E: number = M.ELLIPSE;

    // Euryon station from the coronal arc: the lateral extremes
    // origin(s) + z(s) v(s) from the tragion's station to the vertex, read at
    // even steps of the root parameter (smooth up to the pole), chord sums
    // Richardson-extrapolated. The course frames at those stations do not
    // depend on the euryon and are read once.
    const q0: number = M.parameter(stations.t!, L);
    const steps: { station: number; q: number; origin: Vec3; v: Vec3 }[] = Array.from({ length: 129 }, (_: unknown, k: number): { station: number; q: number; origin: Vec3; v: Vec3 } => {
      const q: number = q0 * (1 - k / 128);
      const station: number = L - q * q;
      const f: { origin: Vec3; v: Vec3 } = course.frame(station);
      return { station, q, origin: f.origin, v: f.v };
    });
    const coronal: (knots: Knot[]) => number = (knots: Knot[]): number => {
      const qs: number[] = knots.map((k: Knot): number => k.q);
      const jets: AutoMovieHumanFairOutline.IJet[] = knots.map((k: Knot): AutoMovieHumanFairOutline.IJet => ({ value: k.value, first: k.first, second: k.second }));
      const points: Vec3[] = steps.map((x: { q: number; origin: Vec3; v: Vec3 }): Vec3 => {
        const z: number = AutoMovieHumanFairOutline.evaluate(qs, jets, x.q)[0];
        return [x.origin[0] + z * x.v[0], x.origin[1] + z * x.v[1], x.origin[2] + z * x.v[2]];
      });
      return chords(points);
    };
    // f1 first (owner, 2026-11-08 13:1x): her euryon is an authored knot of the lateral outline (`AutoMovieHumanHeadF1Lines.LATERAL`), so the coronal arc is a check here. Later algorithmization: the arc solved the euryon station, `AutoMovieHumanHeadPlanArcs.root((s) => coronal(input.lateral(s)) - head.arcs.coronal, t + 2, L - 2)`, which with a free crown raised her euryon to 65 mm against her 56.
    const authored: AutoMovieHumanHeadF1Lines.IKnot | undefined = AutoMovieHumanHeadF1Lines.LATERAL.find((k: AutoMovieHumanHeadF1Lines.IKnot): boolean => k.sense === "max");
    const found: number | null = authored?.y ?? null;
    const euryon: number = found ?? (stations.t! + L) / 2;
    if (found === null) diagnostics.push("no authored euryon knot; drawn halfway (unresolved)");
    const lateral: Knot[] = input.lateral(euryon);
    const at: (knots: Knot[], s: number) => number = (knots: Knot[], s: number): number => M.value(knots, s, L)[0];

    // Both laws leave the port with the trunk's end shoulder and its jet.
    const shoulder: AutoMovieHumanTrunkNeckBase.IJet = course.base.shoulder;

    // Anterior shoulder law. The minimum-frontal arc (ANSUR 1988's line on
    // the head circumference, R2 0.42) solves the shoulder at the glabella.
    // The menton and subnasale arcs are checks only: their lines read the
    // bizygomatic breadth alone (R2 0.29 and 0.37), and solved for f1's large
    // vault on her small zy-zy they drove the lower face's shoulders to 0.17
    // and 0.30, a V plan that the per-station sections show well inside the
    // reference's broad cheeks at the mouth (an input gap: f1's own arcs are
    // not supplied). The menton and subnasale knots keep the exact quarter
    // ellipse (null law) until those arcs are measured.
    // A submental floor shoulder knot (`AutoMovieHumanHeadF1Lines.SUBMENTAL_SHOULDER` at the mid-submental station, render head-2026-11-08T05-38-16-713Z) turned the shoulder from 0.3 to the menton's within 3 mm of station and drew a crease up the cheek from the jaw (front-left-low.4); it stays out of the law, and the floor's U is the jaw relief's mandible over the quarter-ellipse floor.
    const sites: string[] = ["neck port", "me", "sn", "g", "v"];
    const knots: number[] = [course.start, stations.me!, stations.sn!, stations.g!, L];
    const law: (rm: number, rs: number, rg: number) => Knot[] = (rm: number, rs: number, rg: number): Knot[] => M.fullnessChain(sites, knots, [shoulder[0], rm, rs, rg, E], shoulder);
    const family: (chain: Knot[]) => (s: number) => Quarter = (chain: Knot[]): ((s: number) => Quarter) => (s: number): Quarter => ({ a: at(anterior, s), b: at(lateral, s), rho: M.fullness(chain, s) });
    const arcs: { name: string; point: Vec3; target: number; solved: boolean }[] = [
      { name: "bitragion menton arc", point: P.me, target: head.arcs.menton, solved: head.measured.menton },
      { name: "bitragion subnasale arc", point: P.sn, target: head.arcs.subnasale, solved: head.measured.subnasale },
      { name: "bitragion minimum frontal arc", point: P.g, target: head.arcs.minimumFrontal, solved: true },
    ];
    const samples: { station: number; offset: number; point: Vec3 }[][] = arcs.map((a: { point: Vec3 }): { station: number; offset: number; point: Vec3 }[] =>
      Array.from({ length: AutoMovieHumanHeadPlanArcs.SAMPLES + 1 }, (_: unknown, k: number): { station: number; offset: number; point: Vec3 } => {
        const s: number = 1 - (1 - k / AutoMovieHumanHeadPlanArcs.SAMPLES) ** 2;
        const point: Vec3 = [s * a.point[0], s * a.point[1], 0];
        return { ...course.locate(point), point };
      }),
    );
    const arc: (i: number, f: (s: number) => Quarter) => number = (i: number, f: (s: number) => Quarter): number =>
      chords(samples[i]!.map((x: { station: number; offset: number; point: Vec3 }): Vec3 => [x.point[0], x.point[1], AutoMovieHumanHeadPlanArcs.lateralAt(f(x.station), x.offset)]));
    // The shoulders the arcs solve: the glabella's always (its line reads
    // the head circumference), the menton's and the subnasale's only from
    // the person's own measured arcs (population lines on zy-zy alone drove
    // a V plan, 2026-11-08). Gauss-Seidel over the three stations, each arc
    // depending mostly on its own station's shoulder.
    const R: typeof AutoMovieHumanHeadPlanArcs.root = AutoMovieHumanHeadPlanArcs.root;
    let rm: number = E;
    let rs: number = E;
    let rg: number = E;
    // Passes stop once no shoulder moves by more than 1e-5, an arc change of a few thousandths of a millimetre (a 1e-9 stop doubled the passes, 460 against 200 ms, for no visible change).
    for (let pass: number = 0; pass < 8; ++pass) {
      const before: [number, number, number] = [rm, rs, rg];
      if (arcs[0]!.solved) rm = R((r: number): number => arc(0, family(law(r, rs, rg))) - arcs[0]!.target, 0.05, 0.95) ?? rm;
      if (arcs[1]!.solved) rs = R((r: number): number => arc(1, family(law(rm, r, rg))) - arcs[1]!.target, 0.05, 0.95) ?? rs;
      rg = R((r: number): number => arc(2, family(law(rm, rs, r))) - arcs[2]!.target, 0.05, 0.95) ?? rg;
      if (Math.max(Math.abs(rm - before[0]), Math.abs(rs - before[1]), Math.abs(rg - before[2])) < 1e-5) break;
    }
    // f1 first (owner, 2026-11-08: trace her sections as her outlines): both shoulder laws are her sections' quarter shoulders (`AutoMovieHumanHeadF1Lines.QUARTERS`, read on her exact cuts in the course's own quarter boxes) after the trunk's end shoulder with its jet; the arcs above become checks. Later algorithmization: the arc solves (`law(rm, rs, rg)` and the head circumference's posterior shoulder below).
    const Q: [number, number, number][] = AutoMovieHumanHeadF1Lines.QUARTERS.filter((r: [number, number, number]): boolean => r[0] > course.start + 1 && r[0] < L - 1);
    // Bounded by construction (`AutoMovieHumanHeadMassCurves.fullnessBounded`): her chin's V reads near zero; the plain chain through every row of hers undershot it and the loft refused head.mass (shoulders -0.013 at 1476.3, capture `.shots/f1_modeler/capture-1846`, 2026-11-08 18:49).
    const quarterLaw: (column: 1 | 2) => Knot[] = (column: 1 | 2): Knot[] =>
      M.fullnessBounded(
        ["neck port", ...Q.map((r: [number, number, number]): string => `her section (${r[0]})`), "v"],
        [course.start, ...Q.map((r: [number, number, number]): number => r[0]), L],
        [shoulder[0], ...Q.map((r: [number, number, number]): number => r[column]), E],
        shoulder,
      );
    const front: Knot[] = quarterLaw(1);
    arcs.forEach((a: { name: string; target: number; solved: boolean }, i: number): void => {
      const miss: number = arc(i, family(front)) - a.target;
      if (a.solved && !(Math.abs(miss) < 0.5)) diagnostics.push(`${a.name} ${a.target.toFixed(1)} mm does not close: ${miss.toFixed(2)} mm left`);
    });

    // Posterior shoulder at the glabella station from the head circumference.
    const sg: number = stations.g!;
    const anteriorQuarter: Quarter = { a: at(anterior, sg), b: at(lateral, sg), rho: M.fullness(front, sg) };
    const half: number = AutoMovieHumanHeadPlanArcs.quarterLength(anteriorQuarter);
    const back: (rho: number) => Quarter = (rho: number): Quarter => ({ a: at(posterior, sg), b: at(lateral, sg), rho });
    const rho: number | null = AutoMovieHumanHeadPlanArcs.root((x: number): number => 2 * (half + AutoMovieHumanHeadPlanArcs.quarterLength(back(x))) - D.circumference, 0.02, 0.98);
    if (rho === null) diagnostics.push(`head circumference ${D.circumference.toFixed(1)} mm cannot close at the glabella station on the anterior shoulder ${anteriorQuarter.rho.toFixed(4)}`);
    const rear: Knot[] = quarterLaw(2);

    const f: (s: number) => Quarter = family(front);
    return {
      euryon,
      lateral,
      fullness: { anterior: front, posterior: rear },
      tapes: [
        { name: "bitragion coronal arc", target: head.arcs.coronal, reached: coronal(lateral), solves: "euryon station", source: "ANSUR 1988 women, line on head circumference (AutoMovieHumanHeadArcs)" },
        ...arcs.map((a: { name: string; target: number; solved: boolean }, i: number): AutoMovieHumanHeadMassCurves.ITape => ({ name: a.name, target: a.target, reached: arc(i, f), solves: a.solved ? `nothing for f1 (check: her sections' quarter shoulders own the law; the arc would solve the anterior shoulder at ${["the menton", "the subnasale", "the glabella"][i]})` : "nothing (check only: population line on zy-zy, the person's arc not given)", source: a.solved && i < 2 ? "the person's measured arc (node:head-measure receipt)" : "ANSUR 1988 women, line on bizygomatic breadth or head circumference (AutoMovieHumanHeadArcs)" })),
        { name: "head circumference", target: D.circumference, reached: 2 * (half + AutoMovieHumanHeadPlanArcs.quarterLength(back(rho ?? E))), solves: "nothing for f1 (check: her sections' quarter shoulders own the posterior law; the tape would solve its shoulder at the glabella station)", source: "public input" },
      ],
      checks: [
        { name: "zy-zy/2 forward place at FH", station: stations.t!, value: AutoMovieHumanHeadPlanArcs.forwardAt(f(stations.t!), D.bizygomatic / 2), detail: "x (mm ahead of the tragion line) where the FH section's half breadth equals zy-zy/2; zygion's own place is an input gap" },
        { name: "ft-ft/2 forward place at the glabella station", station: sg, value: AutoMovieHumanHeadPlanArcs.forwardAt(f(sg), D.frontal / 2), detail: "x where the glabella section's half breadth equals ft-ft/2" },
        { name: "euryon height above FH", station: euryon, value: euryon - stations.t!, detail: found === null ? "unsolved" : "solved by the coronal arc" },
      ],
      diagnostics,
    };
  }

  /** Both halves of an arc from its right-half points: chord sums over all and every other point, Richardson-extrapolated. */
  function chords(points: Vec3[]): number {
    const sum: (step: number) => number = (step: number): number => {
      let length: number = 0;
      for (let k: number = step; k < points.length; k += step) length += Math.hypot(points[k]![0] - points[k - step]![0], points[k]![1] - points[k - step]![1], points[k]![2] - points[k - step]![2]);
      return length;
    };
    return 2 * ((4 * sum(1) - sum(2)) / 3);
  }

}
