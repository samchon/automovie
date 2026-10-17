import { fitCurve } from "../fit/fitCurve.ts";
import type { MouthNetwork } from "./MouthNetwork.ts";
import type { MouthRibbonObservations } from "./MouthRibbonObservations.ts";

type Point = [number, number, number];
type Observation = MouthRibbonObservations["ribbons"][number];
const distance: (a: Point, b: Point) => number = (a: Point, b: Point): number =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/**
 * Fits ordered oral source curves without importing source meshes or filling
 * their cavity with horizontal caps. The caller chooses a positive world-mm
 * tolerance. Strict source contact occurrences are preserved on distinct
 * parameter intervals; ordinary cheeks use an explicit geometric chart split.
 *
 * @evidence contracts/common.md#principled-implementation Open cubic Hermite fits bound the observed polygons; separate contact occurrences preserve pocket order and do not certify neutral anatomy.
 * @evidence contracts/common.md#clear-and-simple-design One operation derives outer, pocket and collar curves from the same ordered observations and fitter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts There are no identity branches, baked source coordinates, silent missing-section bridges or clinical landmark substitutions.
 * @evidence contracts/common.md#meaningful-documentation States units, source collision policy, caller tolerance and limits of the curve certificate.
 * @evidence contracts/performance.md#efficient-algorithms For R ribbons with P observed points, arc preparation and splitting are linear in P; adaptive cubic fitting dominates and may emit one span per source edge.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure per-document operation coordinates no requests or caches.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only input and result arrays are retained for the call; it owns no handles, tasks or cross-call state.
 */
export function buildMouthNetwork(
  input: MouthRibbonObservations,
  toleranceMm: number,
): MouthNetwork {
  if (input.units !== "mm" || input.pose !== "native-A" || !input.frame)
    throw new Error(
      "Mouth observations require a named native-A millimetre frame",
    );
  if (!(toleranceMm > 0) || !Number.isFinite(toleranceMm))
    throw new Error("A finite positive cubic tolerance is required");
  if (input.missing.length)
    throw new Error(
      "A complete mouth collar cannot bridge missing source ribbons",
    );
  if (input.ribbons.length < 2)
    throw new Error("At least two sagittal source ribbons are required");
  const contacts: Observation[] = input.ribbons.filter(
    (r: Observation): boolean => r.sourceCollision !== null,
  );
  const result: MouthNetwork["ribbons"] = [];
  const top: Point[] = [],
    bottom: Point[] = [];
  for (let i: number = 0; i < input.ribbons.length; i++) {
    const observation: Observation = input.ribbons[i];
    const points: Point[] = observation.sourcePoints;
    if (
      !Number.isFinite(observation.xMm) ||
      (i > 0 && observation.xMm <= input.ribbons[i - 1].xMm)
    )
      throw new Error(
        "Sagittal ribbons must have strictly increasing finite X stations",
      );
    if (
      points.length < 2 ||
      points.some(
        (p: Point): boolean =>
          p.some((x: number): boolean => !Number.isFinite(x)) ||
          Math.abs(p[0] - observation.xMm) > 0.001,
      )
    )
      throw new Error(
        "Source ribbons must contain finite points in their declared sagittal plane",
      );
    const cumulative: number[] = arcs(points);
    const total: number = cumulative[cumulative.length - 1];
    if (total <= 0) throw new Error("Source ribbon arclength must be positive");
    let upper: number, lower: number;
    if (observation.sourceCollision) {
      upper = observation.sourceCollision.upperFraction;
      lower = observation.sourceCollision.lowerFraction;
      if (
        !Number.isFinite(upper) ||
        !Number.isFinite(lower) ||
        upper <= 0 ||
        upper >= lower ||
        lower >= 1
      )
        throw new Error(
          "Source contact occurrences must be distinct interior arclength fractions",
        );
    } else {
      let nearest: Observation | undefined;
      for (const contact of contacts)
        if (
          !nearest ||
          Math.abs(contact.xMm - observation.xMm) <
            Math.abs(nearest.xMm - observation.xMm)
        )
          nearest = contact;
      if (!nearest?.sourceCollision)
        throw new Error(
          "Regular cheek splitting requires an observed oral contact level",
        );
      upper = splitAtY(points, cumulative, nearest.sourceCollision.p[1]);
      lower = upper;
    }
    const pins: { semantic: string; fraction: number }[] = [
      { semantic: "outer-top", fraction: 0 },
      { semantic: "upper-source-contact-or-cheek-split", fraction: upper },
      { semantic: "lower-source-contact-or-cheek-split", fraction: lower },
      { semantic: "outer-bottom", fraction: 1 },
    ];
    const cubic: ReturnType<typeof fitCurve> = fitCurve(
      points,
      toleranceMm,
      pins,
      false,
    );
    result.push({
      id: observation.id,
      xMm: observation.xMm,
      cubic,
      upperOuter: fitCurve(
        part(points, cumulative, 0, upper),
        toleranceMm,
        [],
        false,
      ),
      lowerOuter: fitCurve(
        part(points, cumulative, lower, 1),
        toleranceMm,
        [],
        false,
      ),
      ...(lower > upper
        ? {
            oralCavity: fitCurve(
              part(points, cumulative, upper, lower),
              toleranceMm,
              [],
              false,
            ),
          }
        : {}),
      split: {
        upperFraction: upper,
        lowerFraction: lower,
        sourceCollision: observation.sourceCollision !== null,
      },
    });
    top.push(points[0]);
    bottom.push(points[points.length - 1]);
  }
  return {
    schema: "human-reference-mouth-network-v1",
    observations: input,
    toleranceMm,
    ribbons: result,
    collar: {
      top: fitCurve(top, toleranceMm, [], false),
      bottom: fitCurve(bottom, toleranceMm, [], false),
      right: result[0].cubic,
      left: result[result.length - 1].cubic,
    },
    limits: [
      "This dense per-source curve replay is a diagnostic baseline, not a compact equation with shared coefficients or held-out population evidence.",
      "Source sheet intersections are not clinical commissures or validated neutral meeting curves.",
      "Regular cheek splits follow the nearest collision Y as a chart convention.",
      "Coincident contact positions retain distinct upper/lower sheet topology; coordinate welding is invalid there.",
      "A small cubic-to-polyline bound does not certify the surface between ribbons, shared transverse derivatives or rendered quality.",
      "Collision events with nonzero limiting pocket arclength cannot be collapsed to a point without a declared source correction.",
      "Vermilion pigment borders and cupid bow colour boundaries are not identified from untextured geometry.",
    ],
  };
}

function arcs(points: Point[]): number[] {
  const cumulative: number[] = [0];
  for (let i: number = 1; i < points.length; i++)
    cumulative.push(cumulative[i - 1] + distance(points[i - 1], points[i]));
  return cumulative;
}

function splitAtY(points: Point[], cumulative: number[], y: number): number {
  let depth: number = -Infinity,
    fraction: number = -1;
  const total: number = cumulative[cumulative.length - 1];
  for (let i: number = 0; i < points.length - 1; i++) {
    const a: Point = points[i],
      b: Point = points[i + 1];
    if (a[1] > y === b[1] > y || Math.abs(a[1] - b[1]) < 1e-10) continue;
    const t: number = (y - a[1]) / (b[1] - a[1]);
    const z: number = a[2] + t * (b[2] - a[2]);
    if (z > depth) {
      depth = z;
      fraction = (cumulative[i] + t * distance(a, b)) / total;
    }
  }
  if (fraction <= 0 || fraction >= 1)
    throw new Error(
      "The regular cheek split does not intersect the source ribbon interior",
    );
  return fraction;
}

function part(
  points: Point[],
  cumulative: number[],
  from: number,
  to: number,
): Point[] {
  const total: number = cumulative[cumulative.length - 1];
  const at: (fraction: number) => { p: Point; edge: number } = (
    fraction: number,
  ): { p: Point; edge: number } => {
    const length: number = fraction * total;
    let edge: number = 0;
    while (edge < cumulative.length - 2 && cumulative[edge + 1] < length)
      edge++;
    const denominator: number = cumulative[edge + 1] - cumulative[edge];
    const t: number =
      denominator > 0 ? (length - cumulative[edge]) / denominator : 0;
    return {
      edge,
      p: points[edge].map(
        (value: number, k: number): number =>
          value + t * (points[edge + 1][k] - value),
      ) as Point,
    };
  };
  const a: ReturnType<typeof at> = at(from),
    b: ReturnType<typeof at> = at(to);
  return [a.p, ...points.slice(a.edge + 1, b.edge + 1), b.p].filter(
    (p: Point, i: number, all: Point[]): boolean =>
      !i || distance(p, all[i - 1]) > 1e-9,
  );
}
