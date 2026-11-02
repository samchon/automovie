import { HumanMouthVolume } from "../internal/HumanMouthVolume";


/** Mouth volume checks separate Euclidean tissue clearance from explicit aperture closure.
 *
 * Scenarios:
 * 1. Cube centre, offset, shallow and exterior points use independent known box distances.
 * 2. A 45-degree cube and thin slab retain the same true clearance under rotation.
 * 3. An undeclared hole, lone wall and repeated face are refused as volumes.
 * 4. Only an explicit aperture cap closes the bowl; its triangles do not become tissue and loop reversal preserves the result.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes the actual closed-volume reader over triangulated boxes, rotated boxes, a thin slab, a wall and an explicitly capped bowl. The old mouth helper misclassified shared diagonals and lone walls and overestimated clearance; even a minimum-axis variant failed the rotated cases before this reader passed them.
 * @evidence contracts/testing.md#independent-expectations Box half extents and rigid rotation supply exact Euclidean distances; a closed manifold must have two opposite incidences per edge. An artificial cap defines classification only and cannot supply distance to actual tissue.
 * @evidence contracts/testing.md#distinguishing-cases Interior and exterior, shared edges, a 0.02 mm thin-slab clearance, rotation, unknown boundaries, explicit caps, reverse loop order and duplicate topology. No anatomical bound is changed.
 * @evidence contracts/testing.md#execution-ownership A synchronous CPU test over synthetic triangles, with no whole person, GPU, host or file writes.
 */
export function test_human_mouth_volume(): void {
  type Vec3 = HumanMouthVolume.Vec3;
  const box: (half: Vec3) => number[] = (half: Vec3): number[] => Array.from({ length: 8 }, (_: unknown, bit: number): number[] => half.map((length: number, axis: number): number => (bit & (1 << axis)) === 0 ? -length : length)).flat();
  const I: number[] = [0, 2, 3, 0, 3, 1, 4, 5, 7, 4, 7, 6, 0, 1, 5, 0, 5, 4, 2, 6, 7, 2, 7, 3, 0, 4, 6, 0, 6, 2, 1, 3, 7, 1, 7, 5];
  const rotate: (point: Vec3) => Vec3 = (point: Vec3): Vec3 => [(point[0] - point[1]) / Math.SQRT2, (point[0] + point[1]) / Math.SQRT2, point[2]];
  const rotated: (P: number[]) => number[] = (P: number[]): number[] => Array.from({ length: P.length / 3 }, (_: unknown, index: number): number[] => rotate([P[3 * index]!, P[3 * index + 1]!, P[3 * index + 2]!])).flat();
  const problems: string[] = [];
  const check: (name: string, condition: boolean, _detail?: unknown) => void = (name: string, condition: boolean, _detail?: unknown): void => {
    if (!condition) problems.push(name);
  };
  const equal: (actual: number, expected: number) => boolean = (actual: number, expected: number): boolean => Math.abs(actual - expected) < 1e-10;
  const cube: HumanMouthVolume.Reader = new HumanMouthVolume.Reader(box([2, 2, 2]), I, []);
  check("Closed cube centre survives rays through shared diagonals", cube.contains([0, 0, 0]) && equal(cube.distance([0, 0, 0]), 2));
  check("Offset cube point has the true nearest clearance", cube.contains([0.3, 0.5, 0.7]) && equal(cube.distance([0.3, 0.5, 0.7]), 1.3));
  check("Shallow cube point is below the unchanged one millimetre bound", cube.contains([1.8, 0.2, 0.3]) && equal(cube.distance([1.8, 0.2, 0.3]), 0.2));
  check("Outside cube point remains outside", !cube.contains([3, 0, 0]) && equal(cube.distance([3, 0, 0]), 1));
  const turn: HumanMouthVolume.Reader = new HumanMouthVolume.Reader(rotated(box([2, 2, 2])), I, []);
  const tilted: Vec3 = rotate([1.8, 0.2, 0.3]);
  check("Forty-five-degree rotation preserves Euclidean clearance", turn.contains(tilted) && equal(turn.distance(tilted), 0.2), { point: tilted, distance: turn.distance(tilted) });
  const slab: HumanMouthVolume.Reader = new HumanMouthVolume.Reader(rotated(box([0.05, 2, 2])), I, []);
  const thin: Vec3 = rotate([0.03, 0.2, 0.3]);
  check("Rotated thin slab retains its twenty micrometre clearance", slab.contains(thin) && equal(slab.distance(thin), 0.02), { point: thin, distance: slab.distance(thin) });
  const open: number[] = I.slice(0, -6);
  let rejected: boolean = false;
  try { new HumanMouthVolume.Reader(box([2, 2, 2]), open, []); } catch { rejected = true; }
  check("An undeclared aperture cannot be mistaken for a volume", rejected);
  const bowl: HumanMouthVolume.Reader = new HumanMouthVolume.Reader(box([2, 2, 2]), open, [[3, 1, 5, 7]]);
  check("An explicitly capped entrance defines the intended interior", bowl.contains([1.99, 0, 0]) && !bowl.contains([2.1, 0, 0]));
  check("The synthetic entrance does not supply tissue clearance", equal(bowl.distance([1.99, 0, 0]), 2));
  const reverse: HumanMouthVolume.Reader = new HumanMouthVolume.Reader(box([2, 2, 2]), open, [[7, 5, 1, 3]]);
  check("The explicit loop orientation does not override tissue orientation", reverse.contains([1.99, 0, 0]) && equal(reverse.distance([1.99, 0, 0]), 2));
  const plane: number[] = [0, -2, -2, 0, 2, -2, 0, 2, 2, 0, -2, 2];
  rejected = false;
  try { new HumanMouthVolume.Reader(plane, [0, 1, 2, 0, 2, 3], []); } catch { rejected = true; }
  check("A lone wall cannot classify a point behind it as inside", rejected);
  const repeated: number[] = [...I, ...I.slice(0, 3)];
  rejected = false;
  try { new HumanMouthVolume.Reader(box([2, 2, 2]), repeated, []); } catch { rejected = true; }
  check("A repeated face cannot silently change parity", rejected);
  if (problems.length > 0) throw new Error(problems.join("; "));
  
}
