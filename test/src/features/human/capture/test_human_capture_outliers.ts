import { CaptureOutliers } from "../../../../../packages/human/src/inspection/CaptureOutliers";

type V3 = CaptureOutliers.Vec3;
type Bounds = CaptureOutliers.IBounds;

/**
 * A multi-part capture row names a part whose geometry lies farther than the
 * plausible extent of a figure from the median of the parts' box centres and
 * leaves it out of the camera fit, so one misplaced part cannot shrink the
 * figure to a few pixels: the median stays with the figure, the outlier is
 * named with its distance, and a well-placed figure anywhere in space has
 * none.
 *
 * Scenarios:
 * 1. Red proofs: the checker rejects a classification that misses the 40 m part, one that also flags the figure's own parts (what a mean centre dragged by the outlier would do), and one whose distance is not the farthest corner.
 * 2. A made figure of six parts within 1 m of the origin plus a part reaching 40 m along Z: exactly that part is an outlier, at the hand-computed farthest-corner distance from the median centre, and the six stay inliers.
 * 3. The same figure translated by 100 m along X has no outlier: the centre moves with the figure.
 * 4. Boundaries: a part whose farthest corner lies exactly at the limit is an inlier; 1 mm beyond, an outlier; no parts gives no centre and no outlier; a non-positive limit throws.
 * 5. `bounds` of points gives the per-axis extremes and null for no point; the plausible extent is 1.75 statures, at least the 1.69-stature diagonal of a 1.25 x 1.06 x 0.4 stature box.
 * 6. A part with a NaN bound is reported invalid and leaves the centre and the other parts' classification exactly as without it; `finite` drops NaN, +Infinity and -Infinity points and counts them. Red: the NaN part's own centre is NaN, which would poison the median.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `CaptureOutliers.find` and `bounds`, which `node:capture` runs on every neighbour and whole row before fitting its cameras, and asserts the classification.
 * @evidence contracts/testing.md#independent-expectations The median centre and farthest-corner distances are computed by hand from the made boxes; the extent multiple is checked against the box-diagonal closed form, not read from the implementation.
 * @evidence contracts/testing.md#distinguishing-cases An outlier, a translated figure, exact and just-beyond limits, an empty row, an invalid limit. Red: a missed outlier, flagged inliers, a wrong distance.
 * @evidence contracts/testing.md#execution-ownership A synchronous CPU unit reached by `--include human_capture_outliers`; made boxes only.
 */
export function test_human_capture_outliers(): void {
  const failures: string[] = [];
  const figure: Bounds[] = [
    box("trunk", [-0.15, 0.9, -0.2], [0.15, 1.5, 0.2]),
    box("head", [-0.1, 1.5, -0.1], [0.12, 1.75, 0.1]),
    box("arm.left", [-0.05, 0.75, -0.25], [0.05, 1.4, -0.15]),
    box("arm.right", [-0.05, 0.75, 0.15], [0.05, 1.4, 0.25]),
    box("leg.left", [-0.08, 0, -0.15], [0.15, 0.9, -0.03]),
    box("leg.right", [-0.08, 0, 0.03], [0.15, 0.9, 0.15]),
  ];
  const far: Bounds = box("trunk.bad", [0, 1, -40], [0.2, 1.2, 40]);
  const limit: number = 2.8;

  // 2. One outlier. Centres x: 0, 0.01, 0, 0, 0.035, 0.035, 0.1 -> median 0.01; y: 1.2, 1.625, 1.075, 1.075, 0.45, 0.45, 1.1 -> 1.075; z: 0, 0, -0.2, 0.2, -0.09, 0.09, 0 -> 0.
  const found: CaptureOutliers.IOutput = CaptureOutliers.find([...figure, far], limit);
  const expectedDistance: number = Math.hypot(Math.max(Math.abs(0 - 0.01), Math.abs(0.2 - 0.01)), Math.max(Math.abs(1 - 1.075), Math.abs(1.2 - 1.075)), 40);
  failures.push(...check(found, figure.map((b: Bounds): string => b.name), [{ name: "trunk.bad", distance: expectedDistance }]));
  if (found.centre === null || Math.abs(found.centre[0] - 0.01) > 1e-12 || Math.abs(found.centre[1] - 1.075) > 1e-12 || Math.abs(found.centre[2]) > 1e-12) failures.push(`centre ${found.centre}`);

  // 1. Red proofs.
  const names: string[] = figure.map((b: Bounds): string => b.name);
  const missed: CaptureOutliers.IOutput = { ...found, inliers: [...found.inliers, "trunk.bad"], outliers: [] };
  if (check(missed, names, [{ name: "trunk.bad", distance: expectedDistance }]).length === 0) failures.push("proof: a missed outlier read as correct");
  const dragged: CaptureOutliers.IOutput = { ...found, inliers: [], outliers: [...found.outliers, ...names.map((n: string): CaptureOutliers.IOutlier => ({ name: n, distance: 3, low: [0, 0, 0], high: [0, 0, 0] }))] };
  if (check(dragged, names, [{ name: "trunk.bad", distance: expectedDistance }]).length === 0) failures.push("proof: flagged figure parts read as correct");
  const nearest: CaptureOutliers.IOutput = { ...found, outliers: found.outliers.map((o: CaptureOutliers.IOutlier): CaptureOutliers.IOutlier => ({ ...o, distance: 39.9 })) };
  if (check(nearest, names, [{ name: "trunk.bad", distance: expectedDistance }]).length === 0) failures.push("proof: a wrong distance read as correct");

  // 3. Translated figure.
  const moved: Bounds[] = [...figure, box("toe", [0.1, 0, 0.05], [0.2, 0.05, 0.1])].map((b: Bounds): Bounds => ({ name: b.name, low: [b.low[0] + 100, b.low[1], b.low[2]], high: [b.high[0] + 100, b.high[1], b.high[2]] }));
  const translated: CaptureOutliers.IOutput = CaptureOutliers.find(moved, limit);
  if (translated.outliers.length !== 0) failures.push(`translated figure flagged ${translated.outliers.map((o: CaptureOutliers.IOutlier): string => o.name).join(", ")}`);

  // 4. Boundaries: two point-like parts at the origin fix the median at the origin for odd counts.
  const anchor: Bounds[] = [box("a", [0, 0, 0], [0, 0, 0]), box("b", [0, 0, 0], [0, 0, 0])];
  const at: CaptureOutliers.IOutput = CaptureOutliers.find([...anchor, box("edge", [0, 0, 0], [0, 0, 2.8])], limit);
  if (at.outliers.length !== 0) failures.push("a part exactly at the limit was flagged");
  const beyond: CaptureOutliers.IOutput = CaptureOutliers.find([...anchor, box("edge", [0, 0, 0], [0, 0, 2.801])], limit);
  if (JSON.stringify(beyond.outliers.map((o: CaptureOutliers.IOutlier): string => o.name)) !== JSON.stringify(["edge"])) failures.push("a part 1 mm beyond the limit was not flagged");
  const empty: CaptureOutliers.IOutput = CaptureOutliers.find([], limit);
  if (empty.centre !== null || empty.inliers.length !== 0 || empty.outliers.length !== 0) failures.push("an empty row returned parts or a centre");
  let threw: boolean = false;
  try {
    CaptureOutliers.find(figure, 0);
  } catch {
    threw = true;
  }
  if (!threw) failures.push("a zero limit did not throw");

  // 5. Bounds and the extent multiple.
  const b: Bounds | null = CaptureOutliers.bounds("p", [[1, -2, 3], [-1, 5, 0], [0, 0, -4]]);
  if (b === null || JSON.stringify([b.low, b.high]) !== JSON.stringify([[-1, -2, -4], [1, 5, 3]])) failures.push(`bounds ${JSON.stringify(b)}`);
  if (CaptureOutliers.bounds("none", []) !== null) failures.push("bounds of no point is not null");
  if (!(CaptureOutliers.STATURES >= Math.hypot(1.25, 1.06, 0.4))) failures.push(`extent ${CaptureOutliers.STATURES} statures is below the 1.69-stature figure diagonal`);

  // 6. Non-finite geometry: a part with a NaN bound is invalid, takes no part in the centre and is neither inlier nor outlier; finite() drops NaN and infinite points and counts them.
  const nan: Bounds = box("foot.nan", [0, Number.NaN, 0], [0.2, 0.1, 0.1]);
  const withNan: CaptureOutliers.IOutput = CaptureOutliers.find([...figure, nan], limit);
  const without: CaptureOutliers.IOutput = CaptureOutliers.find(figure, limit);
  if (JSON.stringify(withNan.invalid) !== JSON.stringify(["foot.nan"])) failures.push(`invalid ${withNan.invalid.join(", ")}`);
  if (JSON.stringify(withNan.centre) !== JSON.stringify(without.centre) || JSON.stringify(withNan.inliers) !== JSON.stringify(names) || withNan.outliers.length !== 0) failures.push("a NaN part changed the centre or the classification of the others");
  if (without.invalid.length !== 0) failures.push("a finite figure reported invalid parts");
  const split: { points: V3[]; dropped: number } = CaptureOutliers.finite([[0, 0, 0], [Number.NaN, 0, 0], [0, Number.POSITIVE_INFINITY, 0], [1, 2, Number.NEGATIVE_INFINITY], [1, 2, 3]]);
  if (split.dropped !== 3 || JSON.stringify(split.points) !== JSON.stringify([[0, 0, 0], [1, 2, 3]])) failures.push(`finite split kept ${JSON.stringify(split.points)}, dropped ${split.dropped}`);

  // 6. Red proof: the median of centres including the NaN part is NaN, which is what the exclusion prevents.
  const naive: number[] = [...figure, nan].map((b: Bounds): number => (b.low[1] + b.high[1]) / 2).sort((a: number, b: number): number => a - b);
  if (!naive.some((v: number): boolean => Number.isNaN(v))) failures.push("proof: the NaN part's centre did not read as NaN");

  if (failures.length !== 0) throw new Error(`${failures.length} capture outlier findings:\n${failures.join("\n")}`);
}

/** Departures from the expected inliers and outliers with their distances. */
function check(found: CaptureOutliers.IOutput, inliers: string[], outliers: { name: string; distance: number }[]): string[] {
  const out: string[] = [];
  if (JSON.stringify(found.inliers) !== JSON.stringify(inliers)) out.push(`inliers ${found.inliers.join(", ")}`);
  if (JSON.stringify(found.outliers.map((o: CaptureOutliers.IOutlier): string => o.name)) !== JSON.stringify(outliers.map((o: { name: string }): string => o.name))) out.push(`outliers ${found.outliers.map((o: CaptureOutliers.IOutlier): string => o.name).join(", ")}`);
  for (const e of outliers) {
    const o: CaptureOutliers.IOutlier | undefined = found.outliers.find((x: CaptureOutliers.IOutlier): boolean => x.name === e.name);
    if (o !== undefined && Math.abs(o.distance - e.distance) > 1e-9) out.push(`${e.name} distance ${o.distance} instead of ${e.distance}`);
  }
  return out;
}

/** A named box. */
function box(name: string, low: V3, high: V3): Bounds {
  return { name, low, high };
}
