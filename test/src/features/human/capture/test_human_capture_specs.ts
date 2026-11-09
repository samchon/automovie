import type { AutoMovieHumanArmCurveSpec } from "../../../../../packages/human/src/generation/arm/AutoMovieHumanArmCurveSpec";
import type { CaptureModel } from "../../../../../packages/human/src/inspection/CaptureModel";
import { CaptureSpecs } from "../../../../../packages/human/src/inspection/CaptureSpecs";

type V3 = [number, number, number];
type Spec = AutoMovieHumanArmCurveSpec.ICurveSpec;

/**
 * The capture's spec converter closes a loft's clay only at the end each cap
 * declares and draws a fullness spec's shoulder lines only on the quarters a
 * provider scopes it to: a `top` cap fans to the last ring and a `bottom` cap
 * to the first, an absent cap leaves its end open, and a declared quarter
 * scope keeps exactly the named neighbouring outline pairs, reporting a pair
 * that does not neighbour.
 *
 * Scenarios:
 * 1. Red proofs: the cap checker rejects a top cap fanned to the first ring (the former pole-first assumption) and a fan that skips a ring vertex; the quarter checker rejects an unscoped four-line drawing under a one-pair scope and a shoulder point off the quarter circle.
 * 2. Caps on a made 3-ring, 4-phase grid: only a `top` cap gives 4 triangles, each the new pole and two consecutive last-ring vertices covering all four; only a `bottom` cap does the same on the first ring; both caps give 8; no cap adds nothing.
 * 3. Quarters on a made frame with outlines along +X, +Z, -X, -Z of constant offset 10 mm and a fullness of constant sqrt 2 - 1 (the exact quarter-ellipse shoulder): without a scope, four shoulder lines; with the scope (+Z, +X) written in reverse order, exactly one line, every point 10 mm from the axis on the +X/+Z bisector; a non-neighbouring pair (+X, -X) draws nothing and leaves a diagnostic naming it.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `CaptureSpecs.fans` on a made grid and `CaptureSpecs.part` on made specs with and without the `quarters` hook, reading the returned triangles, lines and diagnostics.
 * @evidence contracts/testing.md#independent-expectations Cap rows follow the engine's documented `end` meaning (bottom the first, top the last station); the shoulder point (1 + rho) / 2 (a d_a + b d_b) with rho = sqrt 2 - 1 and a = b = 10 is the 45 degree point of the 10 mm circle, a closed form independent of the converter.
 * @evidence contracts/testing.md#distinguishing-cases Top, bottom, both and no cap; no scope, a reversed one-pair scope and a non-neighbouring pair. Red: wrong-end fan, a skipped vertex, an unscoped drawing, an off-circle point.
 * @evidence contracts/testing.md#execution-ownership A synchronous CPU unit reached by `--include human_capture_specs`; made specs, no person, mesh, file, canvas or browser.
 */
export function test_human_capture_specs(): void {
  const failures: string[] = [];

  // 2. Caps.
  const rows: number = 3;
  const phases: number = 4;
  const fan: (caps: ({ end: "bottom" | "top"; point: V3 } | undefined)[]) => { positions: number[]; indices: number[] } = (caps: ({ end: "bottom" | "top"; point: V3 } | undefined)[]): { positions: number[]; indices: number[] } => {
    const positions: number[] = new Array<number>(rows * phases * 3).fill(0);
    const indices: number[] = [];
    CaptureSpecs.fans(caps, rows, phases, positions, indices);
    return { positions, indices };
  };
  const top: { positions: number[]; indices: number[] } = fan([{ end: "top", point: [0, 9, 0] }, undefined]);
  failures.push(...capFindings("top cap", top.indices, [{ pole: rows * phases, ring: rows - 1 }]));
  const bottom: { positions: number[]; indices: number[] } = fan([undefined, { end: "bottom", point: [0, -9, 0] }]);
  failures.push(...capFindings("bottom cap", bottom.indices, [{ pole: rows * phases, ring: 0 }]));
  const both: { positions: number[]; indices: number[] } = fan([{ end: "top", point: [0, 9, 0] }, { end: "bottom", point: [0, -9, 0] }]);
  failures.push(...capFindings("both caps", both.indices, [{ pole: rows * phases, ring: rows - 1 }, { pole: rows * phases + 1, ring: 0 }]));
  const none: { positions: number[]; indices: number[] } = fan([undefined, undefined]);
  if (none.indices.length !== 0 || none.positions.length !== rows * phases * 3) failures.push("no cap added geometry");

  // 1. Red proofs for the cap checker.
  const wrongEnd: number[] = [12, 0, 1, 12, 1, 2, 12, 2, 3, 12, 3, 0];
  if (capFindings("proof", wrongEnd, [{ pole: 12, ring: rows - 1 }]).length === 0) failures.push("proof: a top cap fanned to the first ring read as correct");
  const skipped: number[] = [12, 8, 9, 12, 9, 10, 12, 10, 8, 12, 8, 9];
  if (capFindings("proof", skipped, [{ pole: 12, ring: rows - 1 }]).length === 0) failures.push("proof: a fan skipping a ring vertex read as correct");

  // 3. Quarters.
  const unscoped: CaptureModel.IPart = CaptureSpecs.part(bundle(null));
  const fullness: (p: CaptureModel.IPart) => CaptureModel.ICurve = (p: CaptureModel.IPart): CaptureModel.ICurve => p.curves.find((c: CaptureModel.ICurve): boolean => c.id === "f.fullness")!;
  if (fullness(unscoped).lines.length !== 4) failures.push(`unscoped fullness drew ${fullness(unscoped).lines.length} lines instead of 4`);
  const scoped: CaptureModel.IPart = CaptureSpecs.part(bundle([["o.pz", "o.px"]]));
  failures.push(...quarterFindings(fullness(scoped).lines));
  const apart: CaptureModel.IPart = CaptureSpecs.part(bundle([["o.px", "o.nx"]]));
  if (fullness(apart).lines.length !== 0) failures.push(`a non-neighbouring pair drew ${fullness(apart).lines.length} lines`);
  if (!apart.diagnostics.some((d: string): boolean => d.includes("o.px ~ o.nx") && d.includes("not a pair of neighbouring outlines"))) failures.push(`no diagnostic for the non-neighbouring pair: ${apart.diagnostics.join(" | ")}`);

  // 1. Red proofs for the quarter checker.
  if (quarterFindings(fullness(unscoped).lines).length === 0) failures.push("proof: an unscoped four-line drawing read as the one scoped quarter");
  const off: CaptureModel.ILine = { ...fullness(scoped).lines[0]!, points: fullness(scoped).lines[0]!.points.map((p: V3): V3 => [p[0] * 1.05, p[1], p[2] * 1.05]) };
  if (quarterFindings([off]).length === 0) failures.push("proof: a shoulder point 5 % off the circle read as correct");

  if (failures.length !== 0) throw new Error(`${failures.length} capture spec findings:\n${failures.join("\n")}`);
}

/** A fan per cap: `phases` triangles from the pole through consecutive vertices of the expected ring, covering every vertex of it. */
function capFindings(name: string, indices: readonly number[], caps: { pole: number; ring: number }[]): string[] {
  const out: string[] = [];
  const phases: number = 4;
  if (indices.length !== caps.length * phases * 3) out.push(`${name}: ${indices.length / 3} triangles instead of ${caps.length * phases}`);
  for (const cap of caps) {
    const tris: number[][] = [];
    for (let i: number = 0; i + 2 < indices.length; i += 3) if (indices[i] === cap.pole) tris.push([indices[i + 1]!, indices[i + 2]!]);
    const ring: number[] = Array.from({ length: phases }, (_: unknown, k: number): number => cap.ring * phases + k);
    const covered: Set<number> = new Set(tris.flat());
    if (tris.length !== phases) out.push(`${name}: pole ${cap.pole} has ${tris.length} triangles`);
    if (tris.some((t: number[]): boolean => !t.every((v: number): boolean => ring.includes(v)))) out.push(`${name}: pole ${cap.pole} fans outside ring ${cap.ring}`);
    if (ring.some((v: number): boolean => !covered.has(v))) out.push(`${name}: pole ${cap.pole} leaves a vertex of ring ${cap.ring} uncovered`);
    if (tris.some((t: number[]): boolean => (t[1]! - cap.ring * phases) !== ((t[0]! - cap.ring * phases + 1) % phases))) out.push(`${name}: pole ${cap.pole} joins non-consecutive vertices`);
  }
  return out;
}

/** Exactly one line, every point 10 mm from the Y axis on the +X/+Z bisector. */
function quarterFindings(lines: readonly CaptureModel.ILine[]): string[] {
  const out: string[] = [];
  if (lines.length !== 1) out.push(`${lines.length} shoulder lines instead of 1`);
  for (const l of lines)
    for (const p of l.points) {
      if (Math.abs(Math.hypot(p[0], p[2]) - 10) > 1e-9) out.push(`${l.id}: point ${p.join(",")} is ${Math.hypot(p[0], p[2])} mm from the axis`);
      if (Math.abs(p[0] - p[2]) > 1e-9 || p[0] <= 0) out.push(`${l.id}: point ${p.join(",")} off the +X/+Z bisector`);
    }
  return [...new Set(out)].slice(0, 6);
}

/** A made part: one identity frame, four constant 10 mm outlines along +X, +Z, -X, -Z and a constant sqrt 2 - 1 fullness, station parameter. */
function bundle(quarters: [string, string][] | null): CaptureSpecs.IBundle {
  const outline: (name: string, direction: V3 | null, value: number) => Spec = (name: string, direction: V3 | null, value: number): Spec => ({
    name,
    frame: "f",
    datums: [],
    constraints: [],
    representation: {
      kind: "outline",
      parameter: "station, mm",
      direction,
      walk: 0,
      domain: [0, 100],
      knots: [
        { site: "a", station: 0, q: 0, value, first: 0, second: 0 },
        { site: "b", station: 100, q: 100, value, first: 0, second: 0 },
      ],
      handleRule: "constant",
    },
    aids: [],
    consumers: [],
  });
  const identity: AutoMovieHumanArmCurveSpec.ITransform = { origin: [0, 0, 0], axes: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] };
  return {
    part: "made",
    frames: [{ name: "f", parent: null, basis: { kind: "derived", rule: "made" }, relative: identity }],
    root: identity,
    placement: "made",
    specs: [outline("o.px", [1, 0, 0], 10), outline("o.pz", [0, 0, 1], 10), outline("o.nx", [-1, 0, 0], 10), outline("o.nz", [0, 0, -1], 10), outline("f.fullness", null, Math.SQRT2 - 1)],
    axis: (): { origin: V3; distal: V3 } => ({ origin: [0, 0, 0], distal: [0, -1, 0] }),
    ...(quarters === null ? {} : { quarters: (spec: Spec): readonly (readonly [string, string])[] | null => (spec.name === "f.fullness" ? quarters : null) }),
    chain: null,
    diagnostics: [],
    ports: [],
    relations: { parent: null, children: [], shares: [], basis: "made" },
    reference: { status: "unavailable", cause: "made" },
    milliseconds: {},
  };
}
