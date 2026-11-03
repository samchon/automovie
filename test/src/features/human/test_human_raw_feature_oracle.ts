import { TestValidator } from "@nestia/e2e";
import { HumanRawFeatureAudit as F } from "../internal/HumanRawFeatureAudit";
import { HumanRawGeometry as G } from "../internal/HumanRawGeometry";
import { nclose } from "../internal/nclose";

/**
 * Original feature memberships keep their raw addresses while candidate geometry changes.
 *
 * Scenarios:
 * 1. Fixed source corners agree with a correct independently triangulated plane.
 * 2. Translating actual candidate mesh buffers by 2/5 mm is red and moves readings by 3 mm.
 * 3. Empty, malformed, unindexed and missing memberships/geometry cannot pass; unsupported arithmetic is retained.
 * 4. A missing independent acceptance limit remains UNAVAILABLE even at zero error.
 * 5. A defect away from the fixed membership is outside this sparse observer's authority.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads fixed original-source indexed points against real triangle buffers. Positive and negative cases execute exactly the same observer; the negative cases change actual candidate geometry, not a constant comparison or production prior.
 * @evidence contracts/testing.md#independent-expectations Analytically specified horizontal planes at Y=0/2/5 establish exact Euclidean separations 0/2/5 mm regardless of diagonal choice. The control's 0.01 mm geometric reconstruction contract is declared before observation and is not an anatomical tolerance. No generated Human formula or snapshot determines expectations.
 * @evidence contracts/testing.md#distinguishing-cases Covers independent tessellation, actual buffer translations, known three-millimetre response, absent/empty membership, unused source vertex, malformed raw geometry and invalid/missing limit. All seven Voronoi regions across twelve independently prescribed scales verify both closest coordinates and scaled distances, including a finite-product/overflowing-sum interior case. An extreme-aspect triangle that remains unsupported after normalization supplies two addressed refusals. It explicitly demonstrates that a far-away spike cannot be excluded by sparse points, preserving the need for the full two-way surface checker and triangle-interior checks.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU test_human_raw_feature_oracle reaches raw-array geometry and a pure nclose predicate only. No Human generator, landmark fitter, shader, viewer, process or private source installation is needed.
 */
export function test_human_raw_feature_oracle(): void {
  const failures: string[] = [];
  const source: G.Mesh = plane(0, false);
  const members: F.Member[] = [{ feature: "fixed corner", canonicalVertex: 17, sourceVertex: 0 }, { feature: "fixed opposite corner", canonicalVertex: 29, sourceVertex: 2 }];
  const limit: F.Limit = { distanceMm: 0.01, basis: "Analytically specified plane reconstruction control; not a Human anatomical tolerance" };
  const correct: F.Report = F.read("analytic", source, plane(0, true), members, limit);
  if (correct.status !== "PASS" || correct.observations.length !== 2 || correct.observations.some((row: F.Observation): boolean => row.observed !== 0 || row.coordinate === null || row.candidateCoordinate === null || row.canonicalVertex < 0)) failures.push(JSON.stringify({ label: "independently triangulated correct plane", observed: correct }));
  const readings: number[] = [];
  for (const height of [2, 5]) {
    const report: F.Report = F.read("analytic", source, plane(height, true), members, limit);
    readings.push(report.observations[0]?.observed ?? NaN);
    if (report.status !== "FAIL" || report.observations.length !== 2 || report.observations.some((row: F.Observation): boolean => row.status !== "FAIL" || !nclose(row.observed ?? NaN, height, 1e-12) || row.coordinate?.[1] !== 0 || row.candidateCoordinate?.[1] !== height)) failures.push(JSON.stringify({ label: "actual candidate translation", height, observed: report, units: "mm" }));
  }
  if (!nclose(readings[1]! - readings[0]!, 3, 1e-12)) failures.push(JSON.stringify({ label: "known three millimetre change", observed: readings, expectedDelta: 3, units: "mm" }));
  for (const invalid of [[], [null], [undefined], [{ ...members[0]!, sourceVertex: null }], [{ ...members[0]!, sourceVertex: 4 }], [{ ...members[0]!, sourceVertex: NaN }], [{ ...members[0]!, canonicalVertex: NaN }], [{ ...members[0]!, canonicalVertex: -1 }], [{ ...members[0]!, feature: "" }]] as unknown as F.Member[][]) {
    const report: F.Report = F.read("analytic", { ...source, positions: [...Array.from(source.positions), 9, 9, 9] }, plane(0, true), invalid, limit);
    if (report.status !== "FAIL" || report.observations.length + report.refusals.length === 0) failures.push(JSON.stringify({ label: "absent, malformed or unindexed original membership", observed: report }));
  }
  for (const mesh of [{ positions: [], indices: [] }, { positions: [NaN, 0, 0], indices: [0, 0, 0] }, { positions: null, indices: [] }] as unknown as G.Mesh[]) {
    const report: F.Report = F.read("analytic", source, mesh, members, limit);
    if (report.status !== "FAIL" || report.refusals.length === 0) failures.push(JSON.stringify({ label: "invalid actual output", observed: report }));
    const absentSource: F.Report = F.read("analytic", mesh, plane(0, true), members, limit);
    if (absentSource.status !== "FAIL" || absentSource.refusals.length === 0) failures.push(JSON.stringify({ label: "invalid original source", observed: absentSource }));
  }
  for (const invalid of [null, { distanceMm: NaN, basis: "declared" }, { distanceMm: 1, basis: "" }, { distanceMm: -1, basis: "declared" }] as unknown as F.Limit[]) if (F.read("analytic", source, plane(0, true), members, invalid).status !== "FAIL") failures.push(JSON.stringify({ label: "invalid limit", observed: invalid }));
  const unavailable: F.Report = F.read("analytic", source, plane(0, true), members);
  if (unavailable.status !== "UNAVAILABLE" || unavailable.observations.some((row: F.Observation): boolean => row.tolerance !== null || row.observed !== 0 || row.status !== "UNAVAILABLE")) failures.push(JSON.stringify({ label: "missing acceptance authority remains unavailable", observed: unavailable }));
  const spike: G.Mesh = { positions: [...Array.from(source.positions), 0, 100, 0], indices: [0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4] };
  if (F.read("analytic", source, spike, members, limit).status !== "PASS") failures.push("Sparse point scope control changed: source corners remain on spike perimeter, so full-surface verification is still required");
  const tinySource: G.Mesh = { positions: [2e-101, 0, 2e-101, 8e-101, 0, 2e-101, 2e-101, 0, 8e-101], indices: [0, 1, 2] };
  const tinyCandidate: G.Mesh = { positions: [0, 2, 0, 1e-100, 2, 0, 0, 2, 1e-100], indices: [0, 1, 2] };
  const tinyMembers: F.Member[] = [{ feature: "tiny first", canonicalVertex: 0, sourceVertex: 0 }, { feature: "tiny second", canonicalVertex: 1, sourceVertex: 1 }];
  const resolved: F.Report = F.read("analytic", tinySource, tinyCandidate, tinyMembers, limit);
  if (resolved.status !== "FAIL" || resolved.observations.length !== 2 || resolved.observations.some((row: F.Observation): boolean => row.status !== "FAIL" || !nclose(row.observed ?? NaN, 2, 1e-12) || !nclose((row.candidateCoordinate?.[2] ?? NaN) / 2e-101, 1, 1e-12))) failures.push(JSON.stringify({ label: "tiny triangle keeps the actual interior witness, not a wrong edge with the same rounded distance", observed: resolved, expectedDistanceMm: 2, expectedWitnessZMm: 2e-101 }));
  const regions: { name: string; query: G.Point; answer: G.Point }[] = [{ name: "interior", query: [0.2, 1, 0.2], answer: [0.2, 0, 0.2] }, { name: "vertex b", query: [2, 1, 0], answer: [1, 0, 0] }, { name: "vertex c", query: [0, 1, 2], answer: [0, 0, 1] }, { name: "vertex a", query: [-1, 1, -1], answer: [0, 0, 0] }, { name: "edge ab", query: [0.4, 1, -1], answer: [0.4, 0, 0] }, { name: "edge ac", query: [-1, 1, 0.4], answer: [0, 0, 0.4] }, { name: "edge bc", query: [1, 1, 1], answer: [0.5, 0, 0.5] }];
  for (const scale of [1e-100, 1e-77, 1e-50, 1e-20, 1, 1e20, 1e50, 1e75, 1e77, 1.2e77, 2e77, 1e100]) {
    const triangle: G.Mesh = { positions: [0, 0, 0, scale, 0, 0, 0, 0, scale], indices: [0, 1, 2] };
    const index: G.Index = new G.Index(triangle);
    for (const region of regions) {
      const hit: G.Hit = index.nearest(region.query.map((value: number): number => value * scale) as unknown as G.Point);
      const expectedDistance: number = Math.hypot(...region.query.map((value: number, axis: number): number => value - region.answer[axis]!));
      if (!nclose(hit.distance / scale, expectedDistance, 1e-12) || !hit.point.every((value: number, axis: number): boolean => nclose(value / scale, region.answer[axis]!, 1e-12))) failures.push(JSON.stringify({ label: "independently known closest witness in every Voronoi region and distance scale", region: region.name, scale, observed: hit, expectedScaledPoint: region.answer, expectedScaledDistance: expectedDistance }));
    }
  }
  const extremeSource: G.Mesh = { positions: [2e-201, 0, 2e99, 8e-201, 0, 2e99, 2e-201, 0, 8e99], indices: [0, 1, 2] };
  const extremeCandidate: G.Mesh = { positions: [0, 2, 0, 1e-200, 2, 0, 0, 2, 1e100], indices: [0, 1, 2] };
  const unresolved: F.Report = F.read("analytic", extremeSource, extremeCandidate, tinyMembers, limit);
  if (unresolved.status !== "FAIL" || unresolved.observations.length !== 2 || unresolved.observations.some((row: F.Observation): boolean => row.status !== "FAIL" || row.observed !== null || !row.reason.includes("refused"))) failures.push(JSON.stringify({ label: "all numerically unsupported extreme-aspect observations stay addressed and red", observed: unresolved, expected: "two addressed refusals" }));
  TestValidator.predicate(failures.join("\n"), failures.length === 0);
}

/** Coordinates prescribe the geometric answer independently of either observer or Human code. */
function plane(height: number, otherDiagonal: boolean): G.Mesh { return { positions: [-1, height, -1, 1, height, -1, 1, height, 1, -1, height, 1], indices: otherDiagonal ? [0, 1, 3, 1, 2, 3] : [0, 1, 2, 0, 2, 3] }; }
