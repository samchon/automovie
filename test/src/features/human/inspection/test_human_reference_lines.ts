import { HumanReferenceExtract as X } from "../../../../../packages/human/src/inspection/HumanReferenceExtract";

/**
 * Appends a made elliptic cylinder along +Y to a mesh: centre x = `cx` mm,
 * semi-axes `rx` in X and `rz` in Z, 64 sides, rings every 10 mm from y = 0
 * to 100 mm, sides triangulated.
 */
function cylinder(mesh: { positions: number[]; indices: number[] }, cx: number, rx: number, rz: number): void {
  const n: number = 64;
  const base: number = mesh.positions.length / 3;
  for (let r: number = 0; r <= 10; ++r) for (let k: number = 0; k < n; ++k) mesh.positions.push(cx + rx * Math.cos((2 * Math.PI * k) / n), 10 * r, rz * Math.sin((2 * Math.PI * k) / n));
  for (let r: number = 0; r < 10; ++r)
    for (let k: number = 0; k < n; ++k) {
      const a: number = base + r * n + k;
      const b: number = base + r * n + ((k + 1) % n);
      mesh.indices.push(a, b, a + n, b, b + n, a + n);
    }
}

/**
 * The one-call region reading crops a neighbour away and returns each
 * direction's reduced run and each station's reduced loops.
 *
 * Scenarios:
 * 1. Crop: an "arm" cylinder (30 by 20 mm at x = 0) beside a "trunk" cylinder (40 by 40 mm at x = 100), cut at ten stations along Y. With a box x in [-50, 50] the +b (X) run reads the arm's 30 mm at every station and reduces to its two end knots within 0.5 mm, nothing flagged, and each station holds one loop of the 64-gon's area. Red: without the box the +b run reads the trunk's 140 mm and each station holds two loops, the trunk's first.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `lines` of `HumanReferenceExtract` on a made two-part mesh with and without a crop box and reads its runs and loops.
 * @evidence contracts/testing.md#independent-expectations The cylinders' vertices stand on their ellipses at the axis angles, so the +X reach is the semi-axis plus the centre; every crossing lies on a side chord, so a cut's area is the 64-gon's `(64 / 2) a b sin(2 pi / 64)`.
 * @evidence contracts/testing.md#distinguishing-cases A cropped region against the whole mesh; one loop against two, ordered by area.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_reference_lines`, on made meshes with no person, reference file, loft or browser.
 */
export function test_human_reference_lines(): void {
  const failures: string[] = [];
  const mesh: { positions: number[]; indices: number[] } = { positions: [], indices: [] };
  cylinder(mesh, 0, 30, 20);
  cylinder(mesh, 100, 40, 40);
  const frame: { origin: [number, number, number]; axes: [[number, number, number], [number, number, number], [number, number, number]] } = { origin: [0, 0, 0], axes: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] };
  const stations: number[] = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95];
  const polygon = (a: number, b: number): number => 32 * a * b * Math.sin((2 * Math.PI) / 64);

  const arm: X.ILines = X.lines(mesh, frame, stations, 1, { box: { min: [-50, -1, -50], max: [50, 101, 50] } });
  const run: X.ILines["runs"]["+b"] = arm.runs["+b"];
  if (run === null || run.knots.length !== 2 || !run.knots.every((k: { value: number }): boolean => Math.abs(k.value - 30) <= 1e-9) || !(run.error <= 0.5) || run.flagged.length !== 0) failures.push(`the cropped +b run: ${JSON.stringify(run)}`);
  for (let i: number = 0; i < stations.length; ++i) {
    const loops: X.ILines["loops"][number] = arm.loops[i]!;
    if (!(loops.length === 1 && Math.abs(loops[0]!.area - polygon(30, 20)) <= 1e-6 && loops[0]!.error <= 0.5)) failures.push(`station ${stations[i]} of the cropped arm holds ${JSON.stringify(loops.map((l: { area: number; error: number }): [number, number] => [l.area, l.error]))}`);
  }

  const whole: X.ILines = X.lines(mesh, frame, stations, 1);
  if (whole.runs["+b"] === null || !whole.runs["+b"].knots.every((k: { value: number }): boolean => Math.abs(k.value - 140) <= 1e-9)) failures.push(`the uncropped +b run does not read the trunk: ${JSON.stringify(whole.runs["+b"])}`);
  const both: X.ILines["loops"][number] = whole.loops[0]!;
  if (!(both.length === 2 && Math.abs(both[0]!.area - polygon(40, 40)) <= 1e-6 && Math.abs(both[1]!.area - polygon(30, 20)) <= 1e-6)) failures.push(`the uncropped cut's loops ${JSON.stringify(both.map((l: { area: number }): number => l.area))}`);
  if (failures.length !== 0) throw new Error(`${failures.length} region reading failures:\n${failures.join("\n")}`);
}
