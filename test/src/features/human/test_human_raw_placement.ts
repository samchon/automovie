import { TestValidator } from "@nestia/e2e";
import { HumanRawGeometry as G } from "../internal/HumanRawGeometry";
import { HumanRawPlacement as P } from "../internal/HumanRawPlacement";
import { nclose } from "../internal/nclose";

/**
 * Bind placement answers original public stature and a declared world floor.
 *
 * Scenarios:
 * 1. Independently specified tetrahedra have floor zero and crowns at 10/20 mm.
 * 2. The actual output crown responds to the known input change by 10 mm.
 * 3. An actual misplaced crown and a floor penetration are both collected.
 * 4. A translated correct body obeys a nonzero world floor.
 * 5. Missing buffers, non-finite input and absent geometry stay red.
 * 6. Unused extreme or correct-looking buffer vertices never alter actual indexed skin placement.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads actual bind vertices and compares their extremal Y coordinates with original stature and world-floor inputs. A shape with a wrong crown and sole produces both addressed failures in one result rather than accepting a generated calibration number.
 * @evidence contracts/testing.md#independent-expectations The independent tetrahedron corners directly prescribe Y=0 and Y=h. World translation adds the same known floor offset. The 256-epsilon allowance depends only on prescribed inputs and covers double arithmetic, without inventing an anatomical tolerance or enlarging it to fit actual residuals.
 * @evidence contracts/testing.md#distinguishing-cases Covers exact correct placement, known height response, two simultaneous actual-vertex defects, nonzero floor, non-finite/missing input and absent buffers. Unused extreme vertices leave a correct surface green; unused answer-height/floor vertices cannot hide an actually short floating surface. The observer applies only to upright bind placement; clinical landmarks, limbs, collisions and posed geometry remain separate obligations.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU test_human_raw_placement imports raw-array placement/geometry and pure nclose assertions only. It reaches no Human calibration, rig, construction, renderer or process.
 */
export function test_human_raw_placement(): void {
  const failures: string[] = [];
  const crowns: number[] = [];
  for (const height of [10, 20]) {
    const report: P.Report = P.read("analytic", tetrahedron(height, 0), { stature: height, floor: 0 });
    crowns.push(report.crown?.[1] ?? NaN);
    if (report.status !== "PASS" || report.crown === null || !nclose(report.crown[1], height, 1e-10)) failures.push(JSON.stringify({ label: "correct actual bind", height, observed: report, expected: height, units: "mm" }));
  }
  if (!nclose(crowns[1]! - crowns[0]!, 10, 1e-10)) failures.push(JSON.stringify({ label: "known input response", observed: crowns, expectedDelta: 10, units: "mm" }));
  const defect: G.Mesh = tetrahedron(10, 0);
  const positions: number[] = Array.from(defect.positions); positions[1] = -2; positions[7] = 15;
  const red: P.Report = P.read("analytic", { ...defect, positions }, { stature: 10, floor: 0 });
  if (red.status !== "FAIL" || red.findings.length !== 2 || !red.findings.some((row): boolean => row.expected === 10 && row.observed === 15) || !red.findings.some((row): boolean => row.expected === 0 && row.observed === -2)) failures.push(JSON.stringify({ label: "both actual vertex defects collected", observed: red, expected: "crown deviation5mm and sole penetration2mm" }));
  const translated: P.Report = P.read("analytic", tetrahedron(10, 100), { stature: 10, floor: 100 });
  if (translated.status !== "PASS") failures.push(JSON.stringify({ label: "nonzero world floor", observed: translated }));
  const unusedExtreme: G.Mesh = { ...defect, positions: [...Array.from(defect.positions), 0, -1e9, 0, 0, 1e9, 0] };
  const invariant: P.Report = P.read("analytic", unusedExtreme, { stature: 10, floor: 0 });
  if (invariant.status !== "PASS" || invariant.crownVertex === null || invariant.crownVertex >= 4 || invariant.soleVertex === null || invariant.soleVertex >= 4) failures.push(JSON.stringify({ label: "unused extreme coordinates cannot move a correct surface", observed: invariant }));
  const shortFloating: G.Mesh = tetrahedron(6, 2);
  const hidden: P.Report = P.read("analytic", { ...shortFloating, positions: [...Array.from(shortFloating.positions), 0, 0, 0, 0, 10, 0] }, { stature: 10, floor: 0 });
  if (hidden.status !== "FAIL" || hidden.findings.length !== 2 || hidden.crownVertex === null || hidden.crownVertex >= 4 || hidden.soleVertex === null || hidden.soleVertex >= 4) failures.push(JSON.stringify({ label: "unused answer coordinates cannot conceal wrong indexed skin", observed: hidden, expectedCrown: 8, expectedSole: 2, units: "mm" }));
  for (const mesh of [{ positions: [], indices: [] }, { positions: null, indices: [] }] as unknown as G.Mesh[]) {
    const report: P.Report = P.read("analytic", mesh, { stature: 10, floor: 0 });
    if (report.status !== "FAIL" || report.findings.length === 0) failures.push(JSON.stringify({ label: "absent actual geometry", observed: report }));
  }
  for (const input of [{ stature: NaN, floor: 0 }, { stature: 10, floor: Infinity }, { stature: -1, floor: 0 }, {}] as P.Input[]) {
    const report: P.Report = P.read("analytic", tetrahedron(10, 0), input);
    if (report.status !== "FAIL" || report.findings.length === 0) failures.push(JSON.stringify({ label: "original input unavailable", observed: report }));
  }
  TestValidator.predicate(failures.join("\n"), failures.length === 0);
}

/** Independently declared nondegenerate corners, not a production construction or snapshot. */
function tetrahedron(height: number, floor: number): G.Mesh { return { positions: [0, floor, 0, 1, floor, 0, 0, floor + height, 0, 0, floor, 1], indices: [0, 2, 1, 0, 1, 3, 0, 3, 2, 1, 2, 3] }; }
