import { HumanInspectionCurveDefects as C } from "../../../../../packages/human/src/inspection/HumanInspectionCurveDefects";

/**
 * The curve defect detectors report a section that crosses itself or winds
 * the wrong way, a rail that turns back, a turn sharper than the smallest
 * skin radius, and curvature spikes and ripples, on made curves, and nothing
 * on sound ones.
 *
 * Scenarios:
 * 1. A counter-clockwise circle of 64 points: simple and correctly wound. Red: the same circle clockwise reads as wrongly wound; a figure-eight reads as crossing itself.
 * 2. Fold: increasing stations pass; one station stepping back is reported at that step.
 * 3. Crease: a 20 mm circle arc sampled every 1 mm reads curvature 1/20 within 1e-3 and passes a 10 mm smallest radius; a right-angle corner is reported.
 * 4. Spikes: the smooth arc has none at a 0.01 /mm limit; one sample pushed 1 mm off the arc reads as a spike; a saw-tooth of 0.5 mm reads as a ripple.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `loop`, `fold`, `curvature`, `crease` and `spikes` of `HumanInspectionCurveDefects` on made polylines and reads their findings.
 * @evidence contracts/testing.md#independent-expectations A circle of radius R has curvature 1/R and positive signed area when counter-clockwise; a figure-eight's two lobes cross at its centre; each made defect (reversed order, a backward station, a corner, a displaced sample, a saw-tooth) is built to break exactly its detector's property.
 * @evidence contracts/testing.md#distinguishing-cases Sound against each defect; the circle's curvature against both a looser and the corner's sharper turn.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_inspection_curve_defects`, on made polylines with no person, reference, loft or browser.
 */
export function test_human_inspection_curve_defects(): void {
  const failures: string[] = [];

  // 1. Loops.
  const circle: [number, number][] = Array.from({ length: 64 }, (_: unknown, k: number): [number, number] => [40 * Math.cos((2 * Math.PI * k) / 64), 40 * Math.sin((2 * Math.PI * k) / 64)]);
  if (C.loop(circle, 1).length !== 0) failures.push("a counter-clockwise circle reports a defect");
  const clockwise: C.IFinding[] = C.loop([...circle].reverse(), 1);
  if (clockwise.length !== 1 || clockwise[0]!.kind !== "orientation") failures.push(`a clockwise circle reports ${JSON.stringify(clockwise)}`);
  const eight: [number, number][] = Array.from({ length: 64 }, (_: unknown, k: number): [number, number] => {
    const t: number = (2 * Math.PI * (k + 0.5)) / 64;
    return [40 * Math.sin(t), 20 * Math.sin(2 * t)];
  });
  if (!C.loop(eight, 1).some((f: C.IFinding): boolean => f.kind === "crossing")) failures.push("a figure-eight does not read as crossing itself");

  // 2. Fold.
  if (C.fold([0, 1, 2, 3, 5, 8], 1).length !== 0) failures.push("increasing stations read as a fold");
  const fold: C.IFinding[] = C.fold([0, 1, 2, 1.5, 3, 4], 1);
  if (fold.length !== 1 || fold[0]!.index !== 3) failures.push(`a station stepping back reports ${JSON.stringify(fold)}`);

  // 3. Crease.
  const R: number = 20;
  const arc: [number, number, number][] = Array.from({ length: 31 }, (_: unknown, i: number): [number, number, number] => [R * Math.cos(i / R), R * Math.sin(i / R), 0]);
  const k: number[] = C.curvature(arc);
  if (!k.every((v: number): boolean => Math.abs(v - 1 / R) <= 1e-3)) failures.push(`a ${R} mm arc reads curvature ${Math.min(...k)} to ${Math.max(...k)}`);
  if (C.crease(arc, 10).length !== 0) failures.push("a 20 mm arc reads as a crease against a 10 mm smallest radius");
  const corner: [number, number, number][] = [
    [0, 0, 0],
    [1, 0, 0],
    [2, 0, 0],
    [2, 1, 0],
    [2, 2, 0],
  ];
  const creased: C.IFinding[] = C.crease(corner, 10);
  if (creased.length !== 1 || creased[0]!.index !== 2) failures.push(`a right-angle corner reports ${JSON.stringify(creased)}`);

  // 4. Spikes and ripples.
  if (C.spikes(arc, 0.01).length !== 0) failures.push("a smooth arc reads as spiked");
  const bumped: [number, number, number][] = arc.map((p: [number, number, number], i: number): [number, number, number] => (i === 15 ? [p[0] * (1 + 1 / R), p[1] * (1 + 1 / R), 0] : p));
  if (!C.spikes(bumped, 0.01).some((f: C.IFinding): boolean => f.kind === "spike")) failures.push("a sample 1 mm off the arc does not read as a spike");
  const saw: [number, number, number][] = Array.from({ length: 31 }, (_: unknown, i: number): [number, number, number] => [i, i % 2 === 0 ? 0 : 0.5, 0]);
  if (!C.spikes(saw, 0.01).some((f: C.IFinding): boolean => f.kind === "ripple")) failures.push("a saw-tooth does not read as a ripple");
  if (failures.length !== 0) throw new Error(`${failures.length} curve defect failures:\n${failures.join("\n")}`);
}
