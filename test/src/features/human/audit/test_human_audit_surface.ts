import { AutoMovieSplineCurve, type IAutoMovieLoftChain } from "@automovie/engine";
import { HumanSurfaceAudit } from "../../internal/audit/HumanSurfaceAudit";
import { HumanCurveRings } from "../../internal/curves/HumanCurveRings";
import { HumanAnatomyAudit } from "../../internal/HumanAnatomyAudit";
import { HumanPeople } from "../../internal/HumanPeople";
import { assertHumanProvenRows } from "../../internal/region/assertHumanProvenRows";

type IRow = HumanAnatomyAudit.IRow;

/**
 * Every chain of every person is a healthy surface: no meridian or centre track turns past
 * the crease bound, no ripple finer than the catalog resolves runs along it,
 * and no cell faces against the chain's outward sense.
 *
 * Scenarios:
 * 1. A made round tube whose radius swells smoothly from 25 to 30 mm over 100 mm passes every row.
 * 2. The same tube with a ripple 2 mm peak to peak at a 6 mm wavelength fails the ripple row; with one layer doubled in radius 20 mm from its neighbours it fails the step row; with one layer's section wound backwards it fails the fold row; with one layer's plane offset 15 mm sideways it fails the centre-track row.
 * 3. Every person of `HumanPeople`: every chain is read by `HumanSurfaceAudit.rows`, and every failing row is listed by person, chain, phase and place.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person through the public body law and reads every delivered chain's points by its own evaluator (`AutoMovieLoftChain.ring`) every 1 mm of station at 48 phases: each meridian, resampled every 1 mm of arc, for its sharpest turn over a 10 mm chord and for alternating turning runs shorter than that chord; each cell of the station-phase grid for its normal's sense against the chain's dominant outward sense; the track of the sections' centres for its sharpest turn over the same chord. It catches a step, rim or groove across a part, a rippled or banded meridian, and a surface turned over on itself; a smooth tube of any girth profile passes.
 * @evidence contracts/testing.md#independent-expectations The bounds are the catalog's definitions, not this construction's values: the crease bound (`HumanAnatomyShared.CREASE`, the sagitta over a 10 mm chord past the 12.5 mm radius' 1.04 mm, at most 1 mm); a ripple is an alternation of turning sense within that 10 mm chord, the shortest feature the catalog resolves, each run turning past the class A 0.1 degree; a closed tube's cells all face one way. Proven on made tubes: the smooth swelling's least radius of meridian curvature is far above 7 mm; the ripple's runs are 3 mm long; the doubled layer turns its meridian at a radius of a few millimetres; the reversed ring's cells face inward; the offset layer tents the centre track by 15 mm over 20 mm, a turn of about 0.23 /mm. Oracle limits: 48 meridians, so a crease narrower than a 48th of a ring can fall between them; 5 mm at each chain end are left to the seam and cap readers.
 * @evidence contracts/testing.md#distinguishing-cases Positive: the smooth tube. Negative: the ripple, the step and the reversed ring, each on its own row. Self-crossing sections belong to `test_human_audit_sections`; seams and blends to `test_human_audit_seams`; whether a crease is anatomical (a fold at a named site) to the anatomy audit.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_audit_surface`, building its made tubes and generating its people in process on the CPU (body law only) with no renderer, browser or GPU; nothing is cached across tests.
 */
export function test_human_audit_surface(): void {
  assertHumanProvenRows("surface health", proofs, (name: string): IRow[] => {
    const p: HumanPeople.IPerson = HumanPeople.person(name);
    return HumanSurfaceAudit.rows(name, p.body, HumanCurveRings.scale(p));
  });
}

/** The made tubes' proofs: every failure to read green on the smooth tube or red on its defect. */
function proofs(): string[] {
  const out: string[] = [];
  const failing: (rows: IRow[], rule: string) => boolean = (rows: IRow[], rule: string): boolean => rows.some((r: IRow): boolean => r.site.endsWith(`(${rule})`) && !HumanAnatomyAudit.passes(r));
  const swell: (y: number) => [number, number] = (y: number): [number, number] => [25 + 5 * smooth(y / 100), (5 * smoothSlope(y / 100)) / 100];

  // 1. The smooth tube.
  const sound: IRow[] = HumanSurfaceAudit.chain("made", tube(swell, 2, false), 1);
  for (const r of sound.filter((x: IRow): boolean => !HumanAnatomyAudit.passes(x))) out.push(`smooth tube: ${r.site} reads ${r.value} ${r.unit}`);

  // 2. A ripple of 2 mm at a 6 mm wavelength, layers every 0.5 mm so the station rule carries it.
  const w: number = (2 * Math.PI) / 6;
  const rippled: IRow[] = HumanSurfaceAudit.chain("made", tube((y: number): [number, number] => {
    const [r, d]: [number, number] = swell(y);
    return [r + Math.sin(w * y), d + w * Math.cos(w * y)];
  }, 0.5, false), 1);
  if (!failing(rippled, "RIB")) out.push("rippled tube: no failing ripple row");

  // A layer doubled in radius between neighbours 20 mm away.
  const stepped: IAutoMovieLoftChain = tube(swell, 20, false);
  const middle: IAutoMovieLoftChain.ILayer = stepped.layers[2]!;
  middle.coefficients = middle.coefficients.map((c: number): number => 2 * c);
  middle.slopes = middle.slopes.map((c: number): number => 2 * c);
  if (!failing(HumanSurfaceAudit.chain("made", stepped, 1), "STEP")) out.push("stepped tube: no failing step row");

  // One layer's plane offset 15 mm sideways between neighbours 20 mm away (5 mm stays under the crease bound: the track's smoothstep bends by about 0.08 /mm).
  const offset: IAutoMovieLoftChain = tube(swell, 20, false);
  offset.layers[2]!.frame!.origin[0] = 15;
  if (!failing(HumanSurfaceAudit.chain("made", offset, 1), "CUR-4")) out.push("offset layer: no failing centre-track row");

  // One layer's section wound backwards.
  if (!failing(HumanSurfaceAudit.chain("made", tube(swell, 2, true), 1), "FOLD")) out.push("reversed ring: no failing fold row");
  return out;
}

/**
 * A made round tube along `+y` from 0 to 100 mm, framed layers every
 * `spacing` mm, each section the circle of radius `r(y)` interpolated by the
 * periodic cubic spline through 48 points, its station slope the circle's
 * scaled by `r'(y) / r(y)`. With `reversed`, the middle layer's section runs
 * clockwise.
 */
function tube(radius: (y: number) => [number, number], spacing: number, reversed: boolean): IAutoMovieLoftChain {
  const n: number = 48;
  const count: number = Math.round(100 / spacing);
  const layers: IAutoMovieLoftChain.ILayer[] = Array.from({ length: count + 1 }, (_: unknown, i: number): IAutoMovieLoftChain.ILayer => {
    const y: number = i * spacing;
    const [r, d]: [number, number] = radius(y);
    const turn: number = reversed && i === Math.floor(count / 2) ? -1 : 1;
    const samples: [number, number][] = Array.from({ length: n }, (_: unknown, m: number): [number, number] => [r * Math.cos((2 * Math.PI * m) / n), turn * r * Math.sin((2 * Math.PI * m) / n)]);
    const coefficients: number[] = AutoMovieSplineCurve.interpolate(samples);
    return {
      y,
      frame: { origin: [0, y, 0], u: [1, 0, 0], v: [0, 0, 1] },
      coefficients,
      slopes: coefficients.map((c: number): number => (c * d) / r),
    };
  });
  return { name: "made", basis: "spline", order: n, rule: "polar", samples: 96, layers };
}

/** The quintic smoothstep `6 x^5 - 15 x^4 + 10 x^3` on `[0, 1]`. */
function smooth(x: number): number {
  return x * x * x * (10 - 15 * x + 6 * x * x);
}

/** The smoothstep's derivative `30 x^2 (1 - x)^2`. */
function smoothSlope(x: number): number {
  return 30 * x * x * (1 - x) * (1 - x);
}
