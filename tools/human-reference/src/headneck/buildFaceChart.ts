import type { FaceChart } from "./FaceChart.ts";

type Point = [number, number, number];
interface Loop {
  points: Point[];
  closed: boolean;
  area: number | null;
  winding?: number;
}
interface Slice {
  y: number;
  loops: Loop[];
}
interface Input {
  gate: string;
  units: "mm";
  frame: string;
  pose: "native-A";
  sources: FaceChart["sources"];
  slices: Slice[];
  eyeMeanY: number;
  mentonY: number;
}
interface Crossing {
  point: Point;
  edge: number;
  t: number;
}

/**
 * Extracts one front arc from each saved horizontal source observation.
 *
 * The coverage offsets and 75-degree side rays are chart conventions. Every
 * intersection is linear on an observed source-plane edge, with exact shared
 * endpoints for the local patch and global trimming consumers. No source mesh,
 * vertex catalogue or triangle connectivity enters this operation.
 *
 * @evidence contracts/common.md#principled-implementation Linear segment-plane intersections and complete cyclic source arcs retain the observed geometry; the more anterior arc selects the front chart.
 * @evidence contracts/common.md#clear-and-simple-design One operation selects physical rows and derives every boundary from the same retained endpoint objects.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 50 mm, 10 mm and 75 degree coverage choices are explicit conventions; no identity-specific fit, source triangles or silent height-field fallback is used.
 * @evidence contracts/common.md#meaningful-documentation States exact intersection ownership, conventional coverage and the distinction between observations and fitted surfaces; output limits expose folds and apertures.
 * @evidence contracts/performance.md#efficient-algorithms Selection scans S slices and L candidate loops; each chosen loop with N points uses bounded linear scans for bounds, two ray intersections and alternative arcs, with O(S+L+sum N) work and O(S+sum N) storage.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure source-observation operation coordinates no requests or effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only returned rows and shared boundary arrays survive; temporary candidate arcs are bounded by their source loops and no external resources are acquired.
 */
export function buildFaceChart(input: Input): FaceChart {
  if (input.units !== "mm" || input.pose !== "native-A")
    throw new Error(
      "The face chart requires native-A world-millimetre observations.",
    );
  for (let i: number = 0; i < input.slices.length; i++)
    if (
      !Number.isFinite(input.slices[i].y) ||
      (i > 0 && input.slices[i].y <= input.slices[i - 1].y)
    )
      throw new Error(
        "Saved source section heights must be finite and strictly increasing.",
      );
  const targets: [number, number] = [input.mentonY + 10, input.eyeMeanY + 50];
  if (!targets.every(Number.isFinite) || targets[0] >= targets[1])
    throw new Error("Finite ordered face coverage levels are required.");
  const usable: number[] = input.slices
    .map((_slice: Slice, i: number): number => i)
    .filter((i: number): boolean =>
      input.slices[i].loops.some(
        (loop: Loop): boolean =>
          loop.closed &&
          loop.points.length >= 3 &&
          (loop.winding === undefined || loop.winding > 0),
      ),
    );
  const nearest: (y: number) => number = (y: number): number => {
    let index: number = -1;
    let distance: number = Infinity;
    for (const i of usable) {
      const candidate: number = Math.abs(input.slices[i].y - y);
      if (candidate < distance) {
        index = i;
        distance = candidate;
      }
    }
    if (index < 0 || distance > 2)
      throw new Error(
        `No saved source section within 2 mm of face coverage level ${y}.`,
      );
    return index;
  };
  const bottom: number = nearest(targets[0]);
  const top: number = nearest(targets[1]);
  const rows: FaceChart["rows"] = [];
  const angle: number = (75 * Math.PI) / 180;
  for (let i: number = bottom; i <= top; i++) {
    const slice: Slice = input.slices[i];
    let loopIndex: number = -1;
    let largestArea: number = -Infinity;
    for (let j: number = 0; j < slice.loops.length; j++) {
      const candidate: Loop = slice.loops[j];
      if (
        !candidate.closed ||
        candidate.points.length < 3 ||
        (candidate.winding !== undefined && candidate.winding <= 0)
      )
        continue;
      const area: number = Math.abs(candidate.area ?? 0);
      if (!Number.isFinite(area) || area <= 0) continue;
      if (area > largestArea) {
        largestArea = area;
        loopIndex = j;
      }
    }
    if (loopIndex < 0)
      throw new Error(`Missing main head section at source slice ${i}.`);
    const points: Point[] = slice.loops[loopIndex].points;
    const centre: Point = [0, slice.y, 0];
    for (const axis of [0, 2] as const) {
      let low: number = Infinity;
      let high: number = -Infinity;
      for (const point of points) {
        low = Math.min(low, point[axis]);
        high = Math.max(high, point[axis]);
      }
      centre[axis] = (low + high) / 2;
    }
    const right: Crossing = intersect(points, centre, [
      -Math.sin(angle),
      0,
      Math.cos(angle),
    ]);
    const left: Crossing = intersect(points, centre, [
      Math.sin(angle),
      0,
      Math.cos(angle),
    ]);
    const forward: Point[] = arc(points, right, left);
    const reverse: Point[] = arc(points, left, right).reverse();
    const selected: Point[] =
      meanDepth(forward) >= meanDepth(reverse) ? forward : reverse;
    const cumulative: number[] = [0];
    let backstep: number = 0;
    for (let j: number = 1; j < selected.length; j++) {
      cumulative.push(
        cumulative[j - 1] +
          Math.hypot(
            selected[j][0] - selected[j - 1][0],
            selected[j][1] - selected[j - 1][1],
            selected[j][2] - selected[j - 1][2],
          ),
      );
      backstep = Math.max(backstep, selected[j - 1][0] - selected[j][0]);
    }
    rows.push({
      id: `face-chart.row.${i}`,
      sourceSlice: i,
      sourceLoop: loopIndex,
      y: slice.y,
      points: selected,
      arcMm: cumulative,
      rightBoundary: selected[0],
      leftBoundary: selected[selected.length - 1],
      centre,
      regularInX: backstep <= 1e-6,
      maxBackstepMm: backstep,
    });
  }
  return {
    schema: "human-reference-face-chart-v1",
    gate: input.gate,
    units: input.units,
    frame: input.frame,
    pose: input.pose,
    sources: input.sources,
    coverage: {
      grade: "conventional",
      topTargetY: targets[1],
      bottomTargetY: targets[0],
      topY: rows[rows.length - 1].y,
      bottomY: rows[0].y,
      sideAngleDeg: 75,
      centreRule:
        "Per main closed horizontal loop: midpoint of the X and Z bounding intervals, at the observed world-Y level.",
    },
    rows,
    outerBoundary: {
      top: rows[rows.length - 1].points,
      bottom: rows[0].points,
      left: rows.map(
        (row: FaceChart["rows"][number]): Point => row.leftBoundary,
      ),
      right: rows.map(
        (row: FaceChart["rows"][number]): Point => row.rightBoundary,
      ),
    },
    limits: [
      "Coverage offsets and radial angle define a geometric replacement chart; they are not anatomical dimensions or population measurements.",
      "Saved source rows are observed polylines, not fitted Bezier spans. Both patch generation and global trimming must consume one shared fitted boundary definition.",
      "Eye, nasal and oral pockets are not a regular background face chart. Local feature charts must replace their affected support rather than cap them or interpolate through them.",
      "Rows with regularInX=false fold in world-X. Their complete source observations remain explicit; consumers must not silently reinterpret them as a single-valued height field.",
      "The native source can contain intersecting lip sheets and nonclinical geometric landmark proxies. These do not establish anatomical aperture or seam identity.",
      "Endpoint equality gives positional compatibility only. Neighboring patches must reconcile transverse derivatives before claiming a smooth join.",
    ],
  };
}

function intersect(points: Point[], centre: Point, direction: Point): Crossing {
  let best: Crossing | undefined;
  let reach: number = -Infinity;
  for (let i: number = 0; i < points.length; i++) {
    const a: Point = points[i];
    const b: Point = points[(i + 1) % points.length];
    const sa: number =
      (a[0] - centre[0]) * direction[2] - (a[2] - centre[2]) * direction[0];
    const sb: number =
      (b[0] - centre[0]) * direction[2] - (b[2] - centre[2]) * direction[0];
    if (sa > 0 === sb > 0 || Math.abs(sa - sb) <= 1e-12) continue;
    const t: number = sa / (sa - sb);
    const point: Point = [
      a[0] + t * (b[0] - a[0]),
      a[1] + t * (b[1] - a[1]),
      a[2] + t * (b[2] - a[2]),
    ];
    const radial: number =
      (point[0] - centre[0]) * direction[0] +
      (point[2] - centre[2]) * direction[2];
    if (radial >= 0 && radial > reach) {
      best = { point, edge: i, t };
      reach = radial;
    }
  }
  if (!best)
    throw new Error(
      "The declared side ray does not intersect the main head loop.",
    );
  return best;
}

function arc(points: Point[], start: Crossing, end: Crossing): Point[] {
  const output: Point[] = [start.point];
  if (start.edge === end.edge && end.t >= start.t)
    return [start.point, end.point];
  let index: number = (start.edge + 1) % points.length;
  for (let count: number = 0; count < points.length; count++) {
    output.push(points[index]);
    if (index === end.edge) {
      output.push(end.point);
      return output;
    }
    index = (index + 1) % points.length;
  }
  throw new Error(
    "Failed to traverse the observed head loop between side intersections.",
  );
}

function meanDepth(points: Point[]): number {
  let sum: number = 0;
  let length: number = 0;
  for (let i: number = 1; i < points.length; i++) {
    const distance: number = Math.hypot(
      points[i][0] - points[i - 1][0],
      points[i][2] - points[i - 1][2],
    );
    sum += (distance * (points[i][2] + points[i - 1][2])) / 2;
    length += distance;
  }
  return length > 0 ? sum / length : -Infinity;
}
