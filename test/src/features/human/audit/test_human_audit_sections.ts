import { AutoMovieSplineCurve, type IAutoMovieLoftChain } from "@automovie/engine";
import { HumanSectionAudit } from "../../internal/audit/HumanSectionAudit";
import { HumanSectionReading } from "../../internal/audit/HumanSectionReading";
import { HumanCurveRings } from "../../internal/curves/HumanCurveRings";
import { HumanAnatomyAudit } from "../../internal/HumanAnatomyAudit";
import { HumanInputs } from "../../internal/HumanInputs";
import { HumanPeople } from "../../internal/HumanPeople";
import { assertHumanProvenRows } from "../../internal/region/assertHumanProvenRows";

type P2 = HumanSectionReading.P2;
type IRow = HumanAnatomyAudit.IRow;

/**
 * Every section of every chain of every person keeps the section-curve
 * invariants: closed, simple, star-shaped about its axis, its curvature
 * continuous round the ring, touching its outline box at the guides where
 * the part was lofted from its views, and its breadth, depth and girth fair
 * along the stations.
 *
 * Scenarios:
 * 1. Made sections in closed form: a 40 by 25 mm ellipse passes every reading; a figure-eight crosses itself; a section folded back over its own arc turns backward round its centre; a stadium (two 20 mm semicircles joined by straight sides) jumps in curvature where the arcs meet the sides; the ellipse turned 20 degrees slopes at every guide and reaches past its guide points; an arc of 0.9 of a turn does not close.
 * 2. A made chain of axis-aligned elliptical sections along a straight axis, each layer declaring its 40 by 25 mm box (`ILayer.view`), passes every chain row; the same chain with its section samples turned 20 degrees under the same declared box fails the guide rows; with its middle layer swollen 30 percent it fails the breadth, depth and girth profile rows (a 10 percent swelling stays under both limits: its smoothstep bends the breadth by about 0.48 mm and the girth by 1.2 mm per 2 mm squared).
 * 3. Every person of `HumanPeople`: every chain is read by `HumanSectionAudit.rows`, and every failing row is listed by person, chain, layer or station.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person through the public body law (`HumanPeople.person`) and reads every delivered chain through its own public evaluator in each section's own plane (`HumanSectionAudit.section`): at every layer and midway between layers the closure gap, the self-crossings of the 192-point ring, the curvature jump by refinement (`HumanSectionReading.jump`) and, on a layer the view operator drew (`ILayer.view`) and midway between two such layers, the normal angle and overhang at the four guides and the guide radius against the declared half extent; at every station 2 mm apart the backward steps round the axis and the breadth, depth and taut girth profiles' second differences. It catches an open ring, a figure-eight, a lobe hooked behind the axis, a G1 joint of two arcs inside a section, a section whose box touch slid off its guide, and a step or wobble of a section's size along its part; any section that is a smooth simple star round its axis, with fair extents, passes.
 * @evidence contracts/testing.md#independent-expectations The bounds are geometry and rendering facts, not this construction's values: the closure within float32 rounding of the stature; no crossing and no backward step (a star-shaped simple curve has neither); the curvature jump within the 0.1 degree class A normal turn over one of the chain's own vertex spacings (`HumanSeamObserver.rendered`); the guide normal within 0.1 degree and the overhang within ISO 20685-1's 1 mm least error; the profiles' second differences within the crease bound (meridian curvature 0.08 /mm) round the ring for the girth (2.0 mm) and on both outlines for an extent (0.64 mm). Proofs: the closed forms of scenario 1 read their known defects (the stadium's jump of 1 / 20 mm reads about half of it, 0.025 /mm, against a limit near 3e-4 /mm; the turned ellipse's guide normal is about its 20 degree turn's slope), and the made chain of scenario 2 moves each profile row by its known swelling, 30 percent over a 20 mm layer spacing with flat slopes, whose smoothstep reads about 1.4 mm on the breadth and 3.7 mm on the girth. Oracle limits: the refinement reads a jump as about half its size, so a jump under twice the limit can pass; the star rule takes a horizontal layer's area centroid for its axis, a framed layer's plane origin.
 * @evidence contracts/testing.md#distinguishing-cases Positive: the ellipse and the straight elliptical chain. Negative: each closed-form defect and each made chain defect, each required to fail its own rule and, for the made chain, the rows that must stay green named apart. Boundary: sections shrunk to a pole (perimeter under 0.01 mm) are not read, and three stations at each chain end are left out of the profiles, which the seam and cap audits own. Seams between chains belong to `test_human_audit_seams`; surface folds across stations to the surface audit.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_audit_sections`, building its made shapes and generating its people in process on the CPU (body law only) with no renderer, browser or GPU; nothing is cached across tests.
 */
export function test_human_audit_sections(): void {
  assertHumanProvenRows("section invariant", proofs, (name: string): IRow[] => {
    const p: HumanPeople.IPerson = HumanPeople.person(name);
    return HumanSectionAudit.rows(name, p.body, { k: HumanCurveRings.scale(p), stature: HumanInputs.stature(p.params) });
  });
}

/** The made shapes' proofs: every failure of a rule to read green on its correct shape or red on its defect. */
function proofs(): string[] {
  const out: string[] = [];
  const ellipse: HumanSectionReading.Curve = (t: number): P2 => [40 * Math.cos(t), 25 * Math.sin(t)];
  const turned: HumanSectionReading.Curve = rotate(ellipse, (20 * Math.PI) / 180);
  const N: number = HumanSectionAudit.PHASES;

  // Scenario 1, green: the ellipse.
  const points: P2[] = HumanSectionReading.sample(ellipse, N);
  if (!(HumanSectionReading.closure(ellipse) < 1e-12)) out.push("ellipse: does not read closed");
  if (HumanSectionReading.crossings(points) !== 0) out.push("ellipse: reads a self-crossing");
  if (HumanSectionReading.backward(points, [0, 0]) !== 0) out.push("ellipse: reads a backward step round its centre");
  const smooth: HumanSectionReading.IJump = HumanSectionReading.jump(ellipse, N);
  if (!(smooth.jump < 1e-5)) out.push(`ellipse: reads a curvature jump of ${smooth.jump} /mm`);
  for (const t of HumanSectionReading.touch(ellipse, [0, 0], N))
    if (!(t.slope < 1e-6 && t.overhang < 1e-3)) out.push(`ellipse: guide ${t.guide} reads slope ${t.slope} rad, overhang ${t.overhang} mm`);

  // Scenario 1, red: each defect on its own rule.
  const eight: HumanSectionReading.Curve = (t: number): P2 => [40 * Math.sin(t), 20 * Math.sin(2 * t)];
  if (!(HumanSectionReading.crossings(HumanSectionReading.sample(eight, N)) > 0)) out.push("figure-eight: reads no self-crossing");
  const folded: HumanSectionReading.Curve = (t: number): P2 => {
    const a: number = t - 1.5 * Math.sin(t);
    const r: number = 30 + 8 * Math.cos(t);
    return [r * Math.cos(a), r * Math.sin(a)];
  };
  if (!(HumanSectionReading.backward(HumanSectionReading.sample(folded, N), [0, 0]) > 0)) out.push("folded section: reads no backward step");
  const stadium: HumanSectionReading.IJump = HumanSectionReading.jump(stadiumOf(20, 30), N);
  if (!(stadium.jump > 0.01)) out.push(`stadium: reads a curvature jump of ${stadium.jump} /mm, expected about 0.025`);
  for (const t of HumanSectionReading.touch(turned, [0, 0], N))
    if (!(t.slope > 0.05 && t.overhang > 0.5)) out.push(`turned ellipse: guide ${t.guide} reads slope ${t.slope} rad, overhang ${t.overhang} mm`);
  if (!(HumanSectionReading.closure((t: number): P2 => [30 * Math.cos(0.9 * t), 30 * Math.sin(0.9 * t)]) > 10)) out.push("open arc: reads closed");

  // Scenario 2: a made chain on a straight axis, green, then turned and swollen.
  const options: HumanSectionAudit.IOptions = { k: 1, stature: 1000 };
  const fails: (rows: IRow[], pattern: RegExp) => boolean = (rows: IRow[], pattern: RegExp): boolean =>
    rows.some((r: IRow): boolean => pattern.test(r.site) && !HumanAnatomyAudit.passes(r));
  const straight: IRow[] = HumanSectionAudit.chain("made", madeChain(ellipse, 1), options);
  for (const r of straight.filter((x: IRow): boolean => !HumanAnatomyAudit.passes(x))) out.push(`made elliptical chain: ${r.site} reads ${r.value} ${r.unit}`);
  const slid: IRow[] = HumanSectionAudit.chain("made", madeChain(turned, 1), options);
  if (!fails(slid, /guide .* normal angle/)) out.push("made turned chain: no failing guide normal row");
  if (!fails(slid, /guide .* overhang/)) out.push("made turned chain: no failing guide overhang row");
  if (fails(slid, /closure|self-crossings|curvature jump|star-shaped/)) out.push("made turned chain: a whole-section rule fails on a sound section");
  const swollen: IRow[] = HumanSectionAudit.chain("made", madeChain(ellipse, 1.3), options);
  for (const name of ["breadth", "depth", "girth"]) if (!fails(swollen, new RegExp(`^made ${name} profile`))) out.push(`made swollen chain: no failing ${name} profile row`);
  return out;
}

/**
 * A made chain of nine framed layers 20 mm apart along `+y`, each section the
 * curve sampled at 48 phases and interpolated by the periodic cubic spline,
 * the middle layer scaled by `swell`. Slopes are zero, as for a cylinder of
 * constant section, so a swollen layer is a local bulge.
 */
function madeChain(curve: HumanSectionReading.Curve, swell: number): IAutoMovieLoftChain {
  const n: number = 48;
  const layers: IAutoMovieLoftChain.ILayer[] = Array.from({ length: 9 }, (_: unknown, i: number): IAutoMovieLoftChain.ILayer => {
    const scale: number = i === 4 ? swell : 1;
    const samples: P2[] = HumanSectionReading.sample(curve, n).map(([x, z]: P2): P2 => [scale * x, scale * z]);
    const coefficients: number[] = AutoMovieSplineCurve.interpolate(samples);
    // Every layer declares the box of the axis-aligned 40 by 25 mm ellipse,
    // with the ellipse's shoulders and guide curvatures `a / b^2`.
    return {
      y: 20 * i,
      frame: { origin: [0, 20 * i, 0], u: [1, 0, 0], v: [0, 0, 1] },
      coefficients,
      slopes: coefficients.map((): number => 0),
      view: {
        extents: [40 * scale, 25 * scale, 40 * scale, 25 * scale],
        shoulders: [Math.SQRT2 - 1, Math.SQRT2 - 1, Math.SQRT2 - 1, Math.SQRT2 - 1],
        curvatures: [40 / 625 / scale, 25 / 1600 / scale, 40 / 625 / scale, 25 / 1600 / scale],
      },
    };
  });
  return { name: "made", basis: "spline", order: n, rule: "polar", samples: 96, layers };
}

/** A closed curve turned by an angle about the origin. */
function rotate(curve: HumanSectionReading.Curve, angle: number): HumanSectionReading.Curve {
  const c: number = Math.cos(angle);
  const s: number = Math.sin(angle);
  return (t: number): P2 => {
    const [x, z]: P2 = curve(t);
    return [c * x - s * z, s * x + c * z];
  };
}

/**
 * A stadium by arc length: two semicircles of radius `r` joined by straight
 * sides of length `l`, its curvature `1 / r` on the arcs and zero on the
 * sides, so it steps by `1 / r` at the four joints.
 */
function stadiumOf(r: number, l: number): HumanSectionReading.Curve {
  const arc: number = Math.PI * r;
  const total: number = 2 * arc + 2 * l;
  return (t: number): P2 => {
    let s: number = ((((t / (2 * Math.PI)) % 1) + 1) % 1) * total;
    if (s < l) return [-l / 2 + s, -r];
    s -= l;
    if (s < arc) return [l / 2 + r * Math.sin(s / r), -r * Math.cos(s / r)];
    s -= arc;
    if (s < l) return [l / 2 - s, r];
    s -= l;
    return [-l / 2 - r * Math.sin(s / r), r * Math.cos(s / r)];
  };
}
