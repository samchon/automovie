import type { AutoMovieHumanLoftContract } from "../../../../../packages/human/src/lofting/AutoMovieHumanLoftContract";
import { AutoMovieHumanSolidBlendChain } from "../../../../../packages/human/src/lofting/AutoMovieHumanSolidBlendChain";
import { AutoMovieHumanSolidMerge } from "../../../../../packages/human/src/lofting/AutoMovieHumanSolidMerge";
import type { AutoMovieHumanSolidJoin } from "../../../../../packages/human/src/lofting/AutoMovieHumanSolidJoin";
import type { IAutoMovieHumanSolidSurface } from "../../../../../packages/human/src/lofting/IAutoMovieHumanSolidSurface";
import type { IAutoMovieHumanBodyCalibration } from "../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { HumanCurveRings } from "../../internal/curves/HumanCurveRings";
import { HumanInputs } from "../../internal/HumanInputs";
import { HumanPeople } from "../../internal/HumanPeople";
import { assertHumanProvenRows } from "../../internal/region/assertHumanProvenRows";
import { HumanSeamAudit } from "../../internal/audit/HumanSeamAudit";
import { HumanAnatomyAudit } from "../../internal/HumanAnatomyAudit";
import { HumanSolidShapes } from "../../internal/HumanSolidShapes";

type IRow = HumanAnatomyAudit.IRow;

/**
 * The seam and blend audit reads every declared seam against its declared
 * continuity: green on a sphere's two halves and on a solid merge's two
 * rails, red on a crack, a kink and a curvature step.
 *
 * Scenarios:
 * 1. A 30 mm sphere cut at its equator, declared G2: every row passes.
 * 2. The lower half pushed out 2 mm fails the gap; the lower half a cone flaring 20 degrees fails the normal angle; the lower half a cylinder of the sphere's radius (tangent, but flat in its meridian) passes the gap and the angle and fails the normal-curvature jump.
 * 3. A 20 mm cylinder merged onto a plane (`AutoMovieHumanSolidMerge`, 8 mm chords), its blend published as a chain (`AutoMovieHumanSolidBlendChain`): both rails' seams (`HumanSeamAudit.join`) pass every G2 row; the same blend read with its seed off by 0.3 rad fails the gap.
 * 4. Every person of `HumanPeople`: every merge and diff the body publishes (`IAutoMovieHumanBodyCalibration.merges`) is read at both rails, at its blend's columns, through `HumanSeamAudit.merges`, and every failing row is listed by person and seam; a body that publishes no merge yet contributes no row.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads made seams, a real merge's published blend and every person's published merges (`HumanSeamAudit.merges`) through `HumanSeamAudit.rows`, which reads each side in the plane normal to the seam by `HumanSeamObserver.surface` at 48 seam parameters. It catches a crack between two sides, a crease where their normals turn, and a curvature step where a G2 seam is only tangent, and, through the join adapter, a blend chain that does not land on its host or part where the join's rails say; any pair of sides that meet with the continuity they declare passes.
 * @evidence contracts/testing.md#independent-expectations The made sides are closed forms whose continuity is known: the sphere's halves are one smooth surface; the pushed half stands 2 mm off; the cone's normal turns by its 20 degree flare; the cylinder shares the sphere's tangent plane at the equator while its meridian curvature is 0 against the sphere's 1 / 30 mm. Limits: the gap the facets hide, the sagitta `h^2 / 8R` of a 2 mm vertex spacing on the crease bound's 12.5 mm radius (0.04 mm); the class A 0.1 degree; 0.1 degree over the 2 mm spacing for the curvature jump. The merge is G2 by its construction (`AutoMovieHumanSolidJoin`), so its seams must pass, and a blend read 0.3 rad off its seed misses the host by the rail circle's chord. Oracle limit: 48 readings per seam, so a defect narrower than a fiftieth of the seam can fall between them.
 * @evidence contracts/testing.md#distinguishing-cases Positive: the sphere and the merge. Negative: the crack, the kink and the step, each required to fail its own row and, for the step, to pass the rows below it. The figure's seams are every published merge's two rails, each at its own vertex spacing (the blend's station span over its rows); the operators' own G2 at both rails with exact limits belongs to `test_human_solid_merge` and `test_human_solid_diff`, section invariants to `test_human_audit_sections`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_audit_seams`; it builds closed-form surfaces and generates its people in process (body law only), and starts no host, browser or GPU.
 */
export function test_human_audit_seams(): void {
  assertHumanProvenRows("seam and blend", proofs, (name: string): IRow[] => {
    const p: HumanPeople.IPerson = HumanPeople.person(name);
    const k: number = HumanCurveRings.scale(p);
    const stature: number = HumanInputs.stature(p.params);

    // Each merge is read at its own vertex spacing across the blend: its station span over its rows.
    return (p.body.merges ?? []).flatMap((m: IAutoMovieHumanBodyCalibration.IMerge): IRow[] =>
      HumanSeamAudit.rows(name, HumanSeamAudit.merges({ ...p.body, merges: [m] }, 0.01), { k, stature, spacing: (m.length * k) / m.rows }),
    );
  });
}

/** The made seams' proofs: every failure to read green on a sound seam or red on its defect. */
function proofs(): string[] {
  const failures: string[] = [];
  const options: HumanSeamAudit.IOptions = { k: 1, stature: 1000, spacing: 2 };
  const R: number = 30;
  const upper: (a: number, sigma: number) => number[] = (a: number, sigma: number): number[] => [R * Math.cos(sigma / R) * Math.cos(a), R * Math.cos(sigma / R) * Math.sin(a), R * Math.sin(sigma / R)];
  const seam: (name: string, neighbour: (a: number, sigma: number) => number[]) => HumanSeamAudit.ISeam = (name: string, neighbour: (a: number, sigma: number) => number[]): HumanSeamAudit.ISeam => ({
    name,
    continuity: "G2",
    owner: upper,
    neighbour,
    from: 0,
    to: 2 * Math.PI,
    step: 0.01,
  });
  const failing: (rows: IRow[], kind: string) => boolean = (rows: IRow[], kind: string): boolean => rows.some((r: IRow): boolean => r.site.includes(kind) && !HumanAnatomyAudit.passes(r));

  // 1. The sphere's two halves.
  const sphere: IRow[] = HumanSeamAudit.rows("made", [seam("sphere", (a: number, sigma: number): number[] => [R * Math.cos(sigma / R) * Math.cos(a), R * Math.cos(sigma / R) * Math.sin(a), -R * Math.sin(sigma / R)])], options);
  for (const r of sphere.filter((x: IRow): boolean => !HumanAnatomyAudit.passes(x))) failures.push(`sphere: ${r.site} reads ${r.value} ${r.unit}`);

  // 2. A crack, a kink and a curvature step.
  const pushed: IRow[] = HumanSeamAudit.rows("made", [seam("pushed", (a: number, sigma: number): number[] => [(R + 2) * Math.cos(sigma / (R + 2)) * Math.cos(a), (R + 2) * Math.cos(sigma / (R + 2)) * Math.sin(a), -(R + 2) * Math.sin(sigma / (R + 2))])], options);
  if (!failing(pushed, "gap")) failures.push("pushed half: the 2 mm crack passes the gap row");
  const flare: number = (20 * Math.PI) / 180;
  const cone: IRow[] = HumanSeamAudit.rows("made", [seam("cone", (a: number, sigma: number): number[] => [(R + sigma * Math.sin(flare)) * Math.cos(a), (R + sigma * Math.sin(flare)) * Math.sin(a), -sigma * Math.cos(flare)])], options);
  if (!failing(cone, "normal angle")) failures.push("cone: the 20 degree kink passes the normal angle row");
  const cylinder: IRow[] = HumanSeamAudit.rows("made", [seam("cylinder", (a: number, sigma: number): number[] => [R * Math.cos(a), R * Math.sin(a), -sigma])], options);
  if (!failing(cylinder, "normal-curvature jump")) failures.push("cylinder: the curvature step passes the normal-curvature row");
  if (failing(cylinder, "gap") || failing(cylinder, "normal angle")) failures.push("cylinder: a tangent continuation fails the gap or angle row");

  // 3. A real merge's rails, through the join adapter.
  const r: number = 20;
  const part: IAutoMovieHumanSolidSurface = HumanSolidShapes.cylinder("column", [0, 0, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0], r);
  const host: IAutoMovieHumanSolidSurface = HumanSolidShapes.plane("floor", [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const merged: AutoMovieHumanSolidJoin.IResult = AutoMovieHumanSolidMerge.create({
    part,
    host,
    seed: { phi: 0, s: 0.5, y: r - 0.4, theta: 0.3 },
    count: 48,
    tolerance: 1e-12,
    grazing: 0.05,
    width: { part: (): number => 8, host: (): number => 8 },
  });
  const blend: AutoMovieHumanSolidBlendChain.IBlend | null = merged.join === null ? null : AutoMovieHumanSolidBlendChain.of("blend.made", merged.join, 48);
  if (merged.join === null || blend === null) failures.push(`merge: no join or blend (${merged.diagnostics.map((d: AutoMovieHumanLoftContract.IDiagnostic): string => d.detail).join("; ")})`);
  else {
    const rows: IRow[] = HumanSeamAudit.rows("made", HumanSeamAudit.join("blend.made", merged.join, blend, host, part, 0.01), options);
    for (const x of rows.filter((y: IRow): boolean => !HumanAnatomyAudit.passes(y))) failures.push(`merge: ${x.site} reads ${x.value} ${x.unit}`);
    const off: IRow[] = HumanSeamAudit.rows("made", HumanSeamAudit.join("blend.off", merged.join, { ...blend, seed: blend.seed + 0.3 }, host, part, 0.01), options);
    if (!failing(off, "gap")) failures.push("merge: a blend read 0.3 rad off its seed passes the gap row");
  }

  return failures;
}
