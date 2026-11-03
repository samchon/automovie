import { TestValidator } from "@nestia/e2e";
import { HumanRawGeometry as G } from "../internal/HumanRawGeometry";
import { HumanRawCourseAudit as C } from "../internal/HumanRawCourseAudit";
import { nclose } from "../internal/nclose";

/**
 * Fixed independent source curves retain key and intermediate skin disagreement.
 *
 * Scenarios:
 * 1. A source square of perimeter 40 mm lies on a separately triangulated plane.
 * 2. Actual output XYZ buffers translated by 2 and 5 mm give delta 3 mm.
 * 3. A missing strip between original source keys is observed at intermediate samples.
 * 4. Empty, singleton, NaN and overflow source courses explicitly fail.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the raw course observer against independently declared planar answer and output triangle buffers. All observations retain original source segment/fraction/world coordinate and actual emitted nearest face. A missing strip whose original keys remain on-skin must be found between those keys.
 * @evidence contracts/testing.md#independent-expectations Four explicitly specified square edges are each 10 mm long. Distance to the independently specified X=d plane is abs(d); changing d from 2 to 5 changes the same reading by 3 mm. Arithmetic limits of 1e-8 mm do not authorize any anatomical tolerance or manufacture clinical landmarks.
 * @evidence contracts/testing.md#distinguishing-cases Covers unchanged shape with different diagonal, known actual-buffer translations, intermediate-only missing support and malformed source paths. Reports stay diagnostic on finite observations rather than claiming anatomical acceptance; whole raw surface and independently registered clinical identity remain separate obligations.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU test_human_raw_course_oracle imports only raw-array geometry, the course observer and TestValidator. No Human producer, interpolation, measurement, process or GPU is reachable.
 */
export function test_human_raw_course_oracle(): void {
  const failures: string[] = [];
  const source: G.Mesh = { positions: [0, 0, 0, 0, 10, 0, 0, 10, 10, 0, 0, 10], indices: [0, 1, 2, 0, 2, 3] };
  const original: G.Index = new G.Index(source);
  const course: C.Course = { name: "independent square", points: [[0, 0, 0], [0, 10, 0], [0, 10, 10], [0, 0, 10], [0, 0, 0]], dimension: 40, authority: "Four independently specified 10-mm Euclidean sides" };
  const values: number[] = [];
  for (const offset of [0, 2, 5]) {
    const made: G.Mesh = { positions: Array.from(source.positions, (value: number, index: number): number => index % 3 === 0 ? value + offset : value), indices: [0, 1, 3, 1, 2, 3] };
    const report: C.Report = C.read(course, original, new G.Index(made));
    values.push(report.skinMaximum ?? NaN);
    check(failures, `actual buffer offset ${offset}`, report.status === "DIAGNOSTIC" && nclose(report.polylineLength, 40, 1e-8) && report.readings.every((row: C.Reading): boolean => row.skinDistance !== null && row.sourceDistance !== null && nclose(row.skinDistance, offset, 1e-8) && nclose(row.sourceDistance, 0, 1e-8)), report);
  }
  check(failures, "known input delta", nclose(values[2]! - values[1]!, 3, 1e-8), values);
  const gap: G.Mesh = { positions: [0, 0, 0, 0, 10, 0, 0, 10, 4, 0, 0, 4, 0, 0, 6, 0, 10, 6, 0, 10, 10, 0, 0, 10], indices: [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7] };
  const defect: C.Report = C.read(course, original, new G.Index(gap));
  check(failures, "all actual source keys remain on skin", defect.readings.filter((row: C.Reading): boolean => row.fraction === 0 || row.fraction === 1).every((row: C.Reading): boolean => row.skinDistance !== null && nclose(row.skinDistance, 0, 1e-8)), defect);
  check(failures, "intermediate source interval catches missing strip", defect.readings.some((row: C.Reading): boolean => row.fraction > 0 && row.fraction < 1 && row.skinDistance !== null && row.skinDistance > 0.5), defect);
  const missing: C.Report = C.read(course, original);
  check(failures, "missing candidate stays red without source substitution", missing.status === "FAIL" && missing.readings.every((row: C.Reading): boolean => row.sourceDistance !== null && row.skinDistance === null && row.reason !== null), missing);
  for (const points of [[], [[0, 0, 0]], [[NaN, 0, 0], [1, 0, 0]], [[1e308, 0, 0], [-1e308, 0, 0]], [[0, 0, 0], [1e200, 0, 0]]] as G.Point[][]) {
    const refused: C.Report = C.read({ ...course, points }, original, original);
    check(failures, "unavailable original curve cannot pass", refused.status === "FAIL" && refused.issues.length > 0, refused);
  }
  TestValidator.predicate(failures.join("\n"), failures.length === 0);
}
/** Collect every control's actual evidence before failing the maintained function. */
function check(failures: string[], label: string, accepted: boolean, evidence: unknown): void { if (!accepted) failures.push(JSON.stringify({ label, observed: evidence, expected: "independently prescribed geometry", units: "mm", tolerance: 1e-8 })); }
