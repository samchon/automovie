import { TestValidator } from "@nestia/e2e";
import { HumanRawGeometry as G } from "../../../internal/HumanRawGeometry";
import { HumanReferenceAudit as A } from "../../../internal/reference/audit/HumanReferenceAudit";
import { nclose } from "../../../internal/nclose";

/**
 * Raw geometry comparisons reject real buffer defects independently of Human mathematics.
 *
 * Scenarios:
 * 1. Differently triangulated exact planar answers pass the SAME full comparator.
 * 2. Actual candidate XYZ buffers displaced by 2 and 5 mm give known normal-distance changes.
 * 3. Missing skin, a narrow spike, reversed faces and a composed strip discontinuity fail; geometric boundary incidence catches holes between quadrature points.
 * 4. Empty, non-finite, missing-index and degenerate inputs produce explicit failed observations.
 * 5. Distant queries and zero-component normal rays retain exact Euclidean observations.
 * 6. A finite oblique normal-line separation independently fails even where nearest distance remains allowed.
 * 7. Unused buffer points cannot fabricate a spike on unchanged indexed skin.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the raw-array comparator on independently specified analytic planes and modified actual mesh buffers. Positive and negative cases run the same nearest, normal-line, normal orientation, geometric boundary incidence, coverage and vertex checks; no Human interpolation or measurement code is reachable.
 * @evidence contracts/testing.md#independent-expectations Plane distances follow the coordinate definition X=d and signed normal projection. Opposite diagonals describe the same planar square without matching candidate triangles. Known 2 and 5 mm input translations must change RMS by exactly 3 mm. The 1e-8 mm and degree allowances cover double arithmetic only and are not clinical skin tolerances.
 * @evidence contracts/testing.md#distinguishing-cases Covers independent triangulation, known offsets, missing support, small-area spikes, winding reversal, strip composition gaps, non-finite and absent geometry, every Voronoi query region and normal rays with zero components. Private-source similarity, anthropometric sites, posed bodies and population relations remain separate whole-person obligations; this unit alone never admits a human shape.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU unit test_human_raw_reference_oracle uses portable plain-array helpers and TestValidator only. No process, browser, production Human import or native artifact is required.
 */
export function test_human_raw_reference_oracle(): void {
  const findings: string[] = [];
  const source: G.Mesh = plane(0, false);
  const regions: A.Region[] = [{ name: "analytic plane", triangle: (): boolean => true, basis: "All faces of the independently specified X=0 square" }];
  const limits: A.Limits = { distance: 1e-8, normalDegrees: 1e-8, basis: "Exact Euclidean equality of analytic planes; 1e-8 covers double arithmetic only" };
  const equal: A.Report = A.compare("analytic", "final skin", source, plane(0, true), regions, limits);
  record(findings, "normal shape green", equal.status === "PASS", equal);
  const readings: number[] = [];
  for (const distance of [2, 5]) {
    const displaced: G.Mesh = { ...plane(0, true), positions: Array.from(plane(0, true).positions, (value: number, index: number): number => index % 3 === 0 ? value + distance : value) };
    const report: A.Report = A.compare("analytic", "final skin", source, displaced, regions, limits);
    const rms: number = report.metrics[0]?.normalRms ?? NaN;
    readings.push(rms);
    record(findings, `translated actual output red ${distance}`, report.status === "FAIL" && nclose(rms, distance, 1e-8), report);
  }
  record(findings, "known input delta", nclose(readings[1]! - readings[0]!, 3, 1e-8), readings);
  const spike: G.Mesh = { positions: [0, 0, 0, 0, 10, 0, 0, 10, 10, 0, 0, 10, 20, 5, 5], indices: [0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4] };
  const reversed: G.Mesh = { ...source, indices: [0, 2, 1, 0, 3, 2] };
  const missing: G.Mesh = { ...source, indices: [0, 1, 2] };
  const split: G.Mesh = { positions: [0, 0, 0, 0, 10, 0, 0, 10, 4, 0, 0, 4, 0, 0, 6, 0, 10, 6, 0, 10, 10, 0, 0, 10], indices: [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7] };
  for (const [name, mesh] of [["spike", spike], ["reversed", reversed], ["missing anatomy", missing], ["composition gap", split]] as const) {
    const report: A.Report = A.compare("analytic", "final skin", source, mesh, regions, limits);
    record(findings, `${name} red`, report.status === "FAIL" && report.findings.length > 0, report);
  }
  for (const [name, mesh] of [["empty", { positions: [], indices: [] }], ["NaN", { ...source, positions: [NaN, ...Array.from(source.positions).slice(1)] }], ["missing vertex", { ...source, indices: [0, 1, 80] }], ["collapsed", { ...source, indices: [0, 0, 0] }]] as const) {
    const report: A.Report = A.compare("analytic", "final skin", source, mesh, regions, limits);
    record(findings, `${name} unavailable is RED`, report.status === "FAIL" && report.findings.every((finding: A.Finding): boolean => finding.observed === null), report);
  }
  const index: G.Index = new G.Index(source);
  for (const [point, expected] of [[[7, 5, 5], 7], [[7, -3, -4], Math.sqrt(74)], [[0, 11, 5], 1], [[0, 5, 11], 1], [[0, 11, 11], Math.sqrt(2)], [[100000, 5, 5], 100000]] as [G.Point, number][]) {
    const hit: G.Hit = index.nearest(point);
    record(findings, `Euclidean point ${JSON.stringify(point)}`, nclose(hit.distance, expected, 1e-8), { point, observed: hit.distance, expected, error: hit.distance - expected, tolerance: 1e-8, unit: "mm" });
  }
  const normalDistance: number | undefined = index.normalDistance([7, 5, 5], [1, 0, 0]);
  record(findings, "zero-component ray", normalDistance !== undefined && nclose(normalDistance, -7, 1e-8), normalDistance);

  // X=Y+2 has normal-line separation 31/3 at Y=25/3, but nearest
  // separation 31/(3 sqrt(2)) < 8. The two readings are not interchangeable.
  const oblique: G.Mesh = { positions: [2, 0, 0, 12, 10, 0, 12, 10, 10, 2, 0, 10], indices: [0, 1, 2, 0, 2, 3] };
  const normalGate: A.Limits = { distance: 8, normalDegrees: 90, basis: "This analytic control contract permits at most 8 mm of either nearest or normal-line separation; it supplies no clinical tolerance" };
  const normalGreen: A.Report = A.compare("analytic", "normal gate correct output", source, plane(2, true), regions, normalGate);
  record(findings, "independent normal gate admits correct output", normalGreen.status === "PASS", normalGreen);
  const normalRed: A.Report = A.compare("analytic", "oblique finite normal defect", source, oblique, regions, normalGate);
  record(findings, "finite normal distance independently stays red", normalRed.status === "FAIL" && normalRed.findings.some((row: A.Finding): boolean => row.direction === "reference-to-candidate.normal-distance" && row.observed !== null && nclose(row.observed, 31 / 3, 1e-8)), normalRed);
  const independentNearest: G.Hit = new G.Index(oblique).nearest([0, 25 / 3, 5 / 3]);
  record(findings, "the normal defect has a smaller in-contract nearest distance", nclose(independentNearest.distance, 31 / (3 * Math.sqrt(2)), 1e-8) && independentNearest.distance < normalGate.distance, independentNearest);
  const unbounded: A.Report = A.compare("analytic", "no invented limit", source, plane(0, true), regions);
  record(findings, "absent anatomical limit cannot pass", unbounded.status === "UNAVAILABLE", unbounded);
  const uncovered: A.Report = A.compare("analytic", "uncovered source", source, plane(0, true), [{ ...regions[0]!, triangle: (face: number): boolean => face === 0 }], limits);
  record(findings, "unassigned source cannot pass", uncovered.status === "FAIL" && uncovered.findings.some((row: A.Finding): boolean => row.part === "unassigned raw source"), uncovered);
  const mutable: { positions: number[]; indices: number[] } = { positions: Array.from(source.positions), indices: Array.from(source.indices) };
  const frozen: G.Index = new G.Index(mutable);
  mutable.positions.fill(500);
  record(findings, "producer buffer mutation cannot stale index", nclose(frozen.nearest([7, 5, 5]).distance, 7, 1e-8), frozen.nearest([7, 5, 5]));
  const tiny: G.Mesh = tinySpike();
  const narrow: A.Report = A.compare("analytic", "tiny-area actual vertex defect", source, tiny, regions, limits);
  record(findings, "tiny-area spike cannot disappear in p95", narrow.status === "FAIL" && narrow.findings.some((row: A.Finding): boolean => row.direction === "candidate-vertex-to-reference" && row.observed !== null && nclose(row.observed, 0.1, 1e-8)), narrow);
  const unused: G.Mesh = { ...plane(0, true), positions: [...Array.from(source.positions), 20, 5, 5] };
  const unchangedIndexed: A.Report = A.compare("analytic", "unused point is not a surface spike", source, unused, regions, limits);
  record(findings, "unused buffer vertex leaves the actual surface green", unchangedIndexed.status === "PASS" && unchangedIndexed.verticesChecked === 8, unchangedIndexed);
  for (const mesh of [{ positions: [1e308, 0, 0, -1e308, 1, 0, 0, 0, 1], indices: [0, 1, 2] }, { positions: [0, 0, 0, 1e-200, 0, 0, 0, 1e-200, 0], indices: [0, 1, 2] }]) {
    const report: A.Report = A.compare("analytic", "unresolved arithmetic", source, mesh, regions, limits);
    record(findings, "overflow or underflow cannot pass", report.status === "FAIL" && report.findings.length > 0, report);
  }
  const shiftedDegenerate: A.Report = A.compare("analytic", "diagnostic address", source, { positions: [1, 2, 3, 2, 2, 3, 3, 2, 3], indices: [0, 1, 2] }, regions, limits);
  const address: A.Finding | undefined = shiftedDegenerate.findings[0];
  record(findings, "failed triangle retains its real coordinate", address?.triangle === 0 && address.coordinate !== null && nclose(address.coordinate[0], 1, 1e-8) && nclose(address.coordinate[1], 2, 1e-8) && nclose(address.coordinate[2], 3, 1e-8), shiftedDegenerate);
  for (const mesh of [{ positions: null, indices: [] }, { positions: { length: Infinity }, indices: [] }] as unknown as G.Mesh[]) {
    const report: A.Report = A.compare("analytic", "malformed raw buffers", source, mesh, regions, limits);
    record(findings, "malformed buffers fail with unavailable coordinate", report.status === "FAIL" && report.findings.every((row: A.Finding): boolean => row.coordinate === null), report);
  }
  TestValidator.predicate(findings.join("\n"), findings.length === 0);
}

/** Independently written corners of the exact X=x plane, with two nonmatching diagonals. */
function plane(x: number, alternate: boolean): G.Mesh { return { positions: [x, 0, 0, x, 10, 0, x, 10, 10, x, 0, 10], indices: alternate ? [0, 1, 3, 1, 2, 3] : [0, 1, 2, 0, 2, 3] }; }

/** Preserve every control failure before the unit throws, including its actual evidence. */
function record(findings: string[], label: string, accepted: boolean, evidence: unknown): void { if (!accepted) findings.push(JSON.stringify({ label, observed: evidence, expected: "independent control admitted", reason: "Control result did not meet the independently stated contract" })); }

/** Preserve more than 99 percent planar area while moving only one tiny interior vertex. */
function tinySpike(): G.Mesh {
  const count: number = 100; const positions: number[] = []; const indices: number[] = [];
  for (let y: number = 0; y <= count; y++) for (let z: number = 0; z <= count; z++) positions.push(y === 50 && z === 50 ? 0.1 : 0, y / 10, z / 10);
  for (let y: number = 0; y < count; y++) for (let z: number = 0; z < count; z++) {
    const a: number = y * (count + 1) + z; const b: number = a + count + 1;
    indices.push(a, b, b + 1, a, b + 1, a + 1);
  }
  return { positions, indices };
}
