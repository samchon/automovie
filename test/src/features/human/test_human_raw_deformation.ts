import { TestValidator } from "@nestia/e2e";
import { HumanRawGeometry as G } from "../internal/HumanRawGeometry";
import { HumanRawDeformation as D } from "../internal/HumanRawDeformation";
import { nclose } from "../internal/nclose";

/**
 * Material triangle strain comes from raw bind and posed metrics, independently of rigs.
 *
 * Scenarios:
 * 1. A separately specified translation and 90-degree rotation preserve both stretches.
 * 2. Actual output scaling by 2 and 3 produces those stretches and known delta one.
 * 3. An anisotropic planar map has stretches 3 and 0.5 and area ratio 1.5.
 * 4. Shear has the golden-ratio singular values from its analytic quadratic.
 * 5. Missing correspondence, absent buffers, NaN and collapsed triangles remain red.
 * 6. The actual retained thin bind face has known identity, axis-permutation and exact-times-two maps under every material vertex permutation.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the exact raw triangle strain observer on independently specified affine output buffers. It verifies each principal stretch and area ratio, preserves rigid motion, and rejects actual collapsed/malformed material geometry rather than comparing rig formulas with themselves.
 * @evidence contracts/testing.md#independent-expectations Euclidean rigid maps are isometries. A diagonal map has its diagonal scale factors as singular values, and shear [[1,1],[0,1]] has squared stretches (3 plus/minus sqrt(5))/2. These analytic values are independent of the Gram-metric implementation; 1e-10 covers double arithmetic, not anatomical material tolerances.
 * @evidence contracts/testing.md#distinguishing-cases Covers rigid motion, uniform known input delta, anisotropy, shear, topology mismatch, empty/non-finite/degenerate geometry, absent raw buffers and absence of material support. An actual retained thin bind triangle is tested through identity, a coordinate-axis 90-degree rotation and exact times-two maps under every vertex permutation, with conditioning/residual diagnostics preserved. This test certifies those readings only; collision, skin failure thresholds, joint ranges and viewer-shader parity remain separate obligations.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU test_human_raw_deformation imports only raw-array geometry/deformation helpers and TestValidator. No production Human pose, rig, weights, process or renderer is reached.
 */
export function test_human_raw_deformation(): void {
  const failures: string[] = [];
  const scales: Map<string, number> = new Map();
  const bind: G.Mesh = { positions: [0, 0, 0, 10, 0, 0, 0, 10, 0], indices: [0, 1, 2] };
  for (const [label, positions, maximum, minimum, area] of [
    ["rigid translation/rotation", [7, 9, 11, 7, 19, 11, -3, 9, 11], 1, 1, 1],
    ["uniform2", [0, 0, 0, 20, 0, 0, 0, 20, 0], 2, 2, 4],
    ["uniform3", [0, 0, 0, 30, 0, 0, 0, 30, 0], 3, 3, 9],
    ["anisotropic", [0, 0, 0, 30, 0, 0, 0, 5, 0], 3, 0.5, 1.5],
    ["shear", [0, 0, 0, 10, 0, 0, 10, 10, 0], (1 + Math.sqrt(5)) / 2, (Math.sqrt(5) - 1) / 2, 1],
  ] as [string, number[], number, number, number][]) {
    const report: D.Report = D.read(bind, { ...bind, positions });
    const row: D.Row | undefined = report.rows[0];
    if (row?.maximum !== null && row?.maximum !== undefined) scales.set(label, row.maximum);
    if (report.status !== "OBSERVED" || row === undefined || row.maximum === null || row.minimum === null || row.areaRatio === null || !nclose(row.maximum, maximum, 1e-10) || !nclose(row.minimum, minimum, 1e-10) || !nclose(row.areaRatio, area, 1e-10)) failures.push(JSON.stringify({ label, observed: report, expected: { maximum, minimum, area }, deviation: row?.maximum === null || row?.maximum === undefined ? null : row.maximum - maximum, tolerance: 1e-10, units: "ratio" }));
  }
  if (!nclose((scales.get("uniform3") ?? NaN) - (scales.get("uniform2") ?? NaN), 1, 1e-10)) failures.push("Actual uniform input-scale change 3-2 did not produce stretch delta one");
  for (const mesh of [{ ...bind, positions: [0, 0, 0, 1, 0, 0, 2, 0, 0] }, { ...bind, positions: [NaN, 0, 0, 1, 0, 0, 0, 1, 0] }, { ...bind, indices: [0, 2, 1] }, { positions: [], indices: [] }]) {
    const report: D.Report = D.read(bind, mesh);
    if (report.status !== "FAIL" || report.issues.length === 0) failures.push(JSON.stringify({ label: "unavailable material metric must remain red", observed: report }));
  }
  for (const mesh of [{ positions: null, indices: [] }, { positions: [], indices: null }, {}] as unknown as G.Mesh[]) {
    const refused: D.Report = D.read(bind, mesh);
    if (refused.status !== "FAIL" || refused.issues.length === 0 || refused.issues.some((row): boolean => row.stage !== "posed")) failures.push(JSON.stringify({ label: "missing raw buffers have addressed refusals", observed: refused }));
  }
  // Actual wide bind face383720 is a regression INPUT, never a shape answer.
  // Expected identity/rotation/scale invariants below follow Euclidean geometry.
  const thin: G.Mesh = { positions: [20.873591458731898, 1545.8338083496094, 88.4874110254125, 21.004175994434476, 1545.8376143729834, 88.40332545195304, 21.002895113559937, 1545.8376143729834, 88.40446994843671], indices: [0, 1, 2] };
  for (const permutation of [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]) for (const mode of ["identity", "axis90", "times2"]) {
    const positions: number[] = [];
    for (let vertex: number = 0; vertex < 3; vertex++) {
      const [x, y, z]: G.Point = G.vertex(thin, vertex);
      positions.push(...(mode === "axis90" ? [-y, x, z] : mode === "times2" ? [2 * x, 2 * y, 2 * z] : [x, y, z]));
    }
    const report: D.Report = D.read({ ...thin, indices: permutation }, { positions, indices: permutation });
    const row: D.Row | undefined = report.rows[0]; const stretch: number = mode === "times2" ? 2 : 1;
    if (report.status !== "OBSERVED" || row?.maximum === null || row?.maximum === undefined || row.minimum === null || row.areaRatio === null || !nclose(row.maximum, stretch, 1e-10) || !nclose(row.minimum, stretch, 1e-10) || !nclose(row.areaRatio, stretch ** 2, 1e-10) || row.basisCondition === null || !Number.isFinite(row.basisCondition) || row.orthogonalityResidual === null) failures.push(JSON.stringify({ label: "actual thin material known maps", mode, permutation, observed: report, expected: { maximum: stretch, minimum: stretch, areaRatio: stretch ** 2 }, tolerance: 1e-10, units: "ratio" }));
  }
  TestValidator.predicate(failures.join("\n"), failures.length === 0);
}
