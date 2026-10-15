import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRingLayout } from "../../junction/IAutoMovieHumanRingLayout";
import { IAutoMovieHumanSurfaceCoordinate } from "../../junction/IAutoMovieHumanSurfaceCoordinate";
import { IAutoMovieHumanMeasurements } from "../../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanLegStation } from "./IAutoMovieHumanLegStation";
import { planAutoMovieHumanLegStations } from "./planAutoMovieHumanLegStations";
import { shapeAutoMovieHumanLegSection } from "./shapeAutoMovieHumanLegSection";

/**
 * Fixed-point passes that scale each station until its limit-surface girth matches its target. Each pass divides the remaining error by roughly the share a station's own ring carries in its limit section, two thirds, so eight passes leave well under a millimetre. Grade: numerical.
 */
const FIT_PASSES: number = 8;

/** Samples per span when measuring a limit cross-section's perimeter. */
const PERIMETER_SAMPLES: number = 16;

/**
 * Build one leg's control cage, from the mid thigh ring to the ankle ring.
 *
 * Every station is an edge loop around the limb at its planned level, perpendicular to the bone it crosses; the two end stations are the junction rings, with their vertices on the layout's directions, so the trunk and the foot meet them vertex for vertex. Twelve vertices run around each station from the thigh to the lower calf, where the calf's bellies narrow into the calcaneal tendon, and eight from there to the ankle. The reduction between them is two patches of four quads, centred on the medial and lateral midlines, each turning four spans into two around one regular vertex inside the patch; the two valence-3 and two valence-5 vertices each patch needs lie on the narrow, sharply curved sides of the lower shank, the region the junction research reserves for poles, never on the broad lit shin or calf.
 *
 * Each station's control points sit at the radii `shapeAutoMovieHumanLegSection` gives, then every station is scaled about its origin until the girth of its limit section matches the planned girth. On the regular tube the limit section through a station's vertices is the cubic B-spline of the points `(P[i-1] + 4P[i] + P[i+1]) / 6`, the Catmull-Clark limit mask along the limb; at the ends and beside the reduction, where the neighbours differ in count, the station's own ring is used. The measured girths of the identity therefore hold on the subdivided surface, not on the cage, which lies outside it.
 *
 * Chart: `u` runs from 0 at the mid thigh ring to 1 at the ankle ring by arc length of the bone axis, `v` from 0 at the anterior mark counterclockwise about the distal axis, which is medial on the left leg and lateral on the right.
 *
 * @param props.measurements The person's measurements
 * @param props.skeleton The person's skeleton at rest
 * @param props.side Which leg
 * @returns The leg's cage with its thigh ring and then its ankle ring
 */
export function buildAutoMovieHumanLegCage(props: {
  measurements: IAutoMovieHumanMeasurements;
  skeleton: IAutoMovieHumanSkeleton;
  side: AutoMovieHumanSide;
}): IAutoMovieHumanCage {
  const { stations, thighRing, ankleRing }: planAutoMovieHumanLegStations.IOutput =
    planAutoMovieHumanLegStations(props);
  const lean: number =
    props.measurements.identity.composition.appendicularLeanMassIndex;
  const last: number = stations.length - 1;
  const reduced: number = stations.findIndex(
    (s: IAutoMovieHumanLegStation): boolean => s.count !== stations[0]!.count,
  );
  const wide: number = stations[0]!.count;
  const narrow: number = stations[last]!.count;
  if (
    wide !== thighRing.count ||
    narrow !== ankleRing.count ||
    wide !== narrow + 4 ||
    wide % 4 !== 0
  )
    throw new Error(
      `leg cage reduces ${wide} spans to ${narrow}; it needs rings of 4k + 4 and 4k`,
    );

  // directions and raw radii
  const directions: IAutoMovieVector3[][] = stations.map(
    (s: IAutoMovieHumanLegStation, i: number): IAutoMovieVector3[] =>
      Array.from({ length: s.count }, (_: unknown, j: number): IAutoMovieVector3 =>
        i === 0
          ? ring(thighRing, (s.count - j) % s.count)
          : i === last
            ? ring(ankleRing, j)
            : around(s, j / s.count),
      ),
  );
  const radii: number[][] = stations.map(
    (s: IAutoMovieHumanLegStation, i: number): number[] =>
      directions[i]!.map(
        (d: IAutoMovieVector3): number =>
          shapeAutoMovieHumanLegSection(s, anatomical(s, d), lean),
      ),
  );

  // fit every station's limit girth
  const scales: number[] = stations.map((): number => 1);
  const place = (i: number): IAutoMovieVector3[] =>
    directions[i]!.map(
      (d: IAutoMovieVector3, j: number): IAutoMovieVector3 =>
        AutoMovieHumanVector.offset(stations[i]!.origin, [
          d,
          scales[i]! * radii[i]![j]!,
        ]),
    );
  for (let pass: number = 0; pass < FIT_PASSES; ++pass) {
    const rings: IAutoMovieVector3[][] = stations.map(
      (_: unknown, i: number): IAutoMovieVector3[] => place(i),
    );
    stations.forEach((s: IAutoMovieHumanLegStation, i: number): void => {
      if (!s.fitted) return;
      const own: boolean =
        i === 0 || i === last || i === reduced - 1 || i === reduced;
      const section: IAutoMovieVector3[] = own
        ? rings[i]!
        : rings[i]!.map(
            (p: IAutoMovieVector3, j: number): IAutoMovieVector3 =>
              AutoMovieHumanVector.offset(
                AutoMovieHumanVector.of(0, 0, 0),
                [rings[i - 1]![j]!, 1 / 6],
                [p, 4 / 6],
                [rings[i + 1]![j]!, 1 / 6],
              ),
          );
      scales[i]! *= s.girth / perimeter(section);
    });
    interpolate(stations, scales);
  }

  // vertices: stations in order, then the two reduction centres
  const vertices: IAutoMovieHumanCage.IVertex[] = [];
  const coordinates: Array<{ u: number; v: number }> = [];
  const first: number[] = [];
  stations.forEach((s: IAutoMovieHumanLegStation, i: number): void => {
    first.push(vertices.length);
    place(i).forEach((position: IAutoMovieVector3, j: number): void => {
      vertices.push({ position });
      coordinates.push({ u: s.u, v: j / s.count });
    });
  });
  const upper: IAutoMovieHumanLegStation = stations[reduced - 1]!;
  const lower: IAutoMovieHumanLegStation = stations[reduced]!;
  const centres: number[] = [0.25, 0.75].map((v: number): number => {
    const d: IAutoMovieVector3 = around(upper, v);
    const angle: number = anatomical(upper, d);
    const radius: number =
      0.5 *
      (scales[reduced - 1]! * shapeAutoMovieHumanLegSection(upper, angle, lean) +
        scales[reduced]! * shapeAutoMovieHumanLegSection(lower, angle, lean));
    vertices.push({
      position: AutoMovieHumanVector.offset(
        AutoMovieHumanVector.of(0, 0, 0),
        [upper.origin, 0.5],
        [lower.origin, 0.5],
        [d, radius],
      ),
    });
    coordinates.push({ u: 0.5 * (upper.u + lower.u), v });
    return vertices.length - 1;
  });

  // faces
  const at = (i: number, j: number): number =>
    first[i]! + (((j % stations[i]!.count) + stations[i]!.count) % stations[i]!.count);
  const faces: IAutoMovieHumanCage.IFace[] = [];
  const quad = (order: [number, number, number, number]): void => {
    // listed down the limb first, which turns clockwise seen from outside
    const corners: [number, number, number, number] = [
      order[0],
      order[3],
      order[2],
      order[1],
    ];
    const vs: number[] = corners.map((c: number): number => coordinates[c]!.v);
    const wraps: boolean = vs.some((v: number): boolean => v > 0.5);
    faces.push({
      vertices: corners,
      coordinates: corners.map(
        (c: number, k: number): IAutoMovieHumanSurfaceCoordinate => ({
          part: "leg",
          side: props.side,
          u: coordinates[c]!.u,
          v: wraps && vs[k] === 0 ? 1 : vs[k]!,
        }),
      ) as IAutoMovieHumanCage.IFace["coordinates"],
    });
  };
  for (let i: number = 0; i < last; ++i) {
    if (i === reduced - 1) continue;
    for (let j: number = 0; j < stations[i]!.count; ++j)
      quad([at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)]);
  }
  // reduction: per half, a straight span, a 4-to-2 patch, a straight span
  const t = (j: number): number => at(reduced - 1, j);
  const b = (k: number): number => at(reduced, k);
  const q: number = wide / 4;
  const h: number = narrow / 4;
  for (let half: number = 0; half < 2; ++half) {
    const j0: number = half * 2 * q;
    const k0: number = half * 2 * h;
    const m: number = centres[half]!;
    quad([t(j0), b(k0), b(k0 + 1), t(j0 + 1)]);
    quad([t(j0 + 1), b(k0 + 1), m, t(j0 + 2)]);
    quad([t(j0 + 2), m, t(j0 + 4), t(j0 + 3)]);
    quad([t(j0 + 4), m, b(k0 + 3), t(j0 + 5)]);
    quad([m, b(k0 + 1), b(k0 + 2), b(k0 + 3)]);
    for (let j: number = j0 + 5; j < j0 + 2 * q; ++j)
      quad([t(j), b(j - j0 - 5 + k0 + 3), b(j - j0 - 5 + k0 + 4), t(j + 1)]);
  }

  return {
    vertices,
    faces,
    creases: [],
    rings: [
      {
        site: "thigh",
        side: props.side,
        vertices: Array.from(
          { length: wide },
          (_: unknown, k: number): number => at(0, wide - k),
        ),
        start: thighRing.start,
        frame: thighRing.frame,
      },
      {
        site: "ankle",
        side: props.side,
        vertices: Array.from(
          { length: narrow },
          (_: unknown, k: number): number => at(last, k),
        ),
        start: ankleRing.start,
        frame: ankleRing.frame,
      },
    ],
  };
}

/** Set the scale of every station that is not fitted by linear interpolation in `u` between the fitted stations around it. */
const interpolate = (
  stations: IAutoMovieHumanLegStation[],
  scales: number[],
): void => {
  const anchors: number[] = stations
    .map((s: IAutoMovieHumanLegStation, i: number): number => (s.fitted ? i : -1))
    .filter((i: number): boolean => i >= 0);
  for (let k: number = 0; k + 1 < anchors.length; ++k) {
    const a: number = anchors[k]!;
    const z: number = anchors[k + 1]!;
    for (let i: number = a + 1; i < z; ++i) {
      const t: number =
        (stations[i]!.u - stations[a]!.u) / (stations[z]!.u - stations[a]!.u);
      scales[i] = scales[a]! + (scales[z]! - scales[a]!) * t;
    }
  }
};

/** Direction of ring vertex `k` of a layout. */
const ring = (layout: IAutoMovieHumanRingLayout, k: number): IAutoMovieVector3 =>
  layout.directions[k]!;

/** Direction at chart angle `v` around a station. */
const around = (s: IAutoMovieHumanLegStation, v: number): IAutoMovieVector3 =>
  AutoMovieHumanVector.offset(
    AutoMovieHumanVector.of(0, 0, 0),
    [s.anterior, Math.cos(2 * Math.PI * v)],
    [s.around, Math.sin(2 * Math.PI * v)],
  );

/** Anatomical angle of a direction at a station, from anterior toward medial, radians. */
const anatomical = (
  s: IAutoMovieHumanLegStation,
  d: IAutoMovieVector3,
): number =>
  Math.atan2(
    AutoMovieHumanVector.dot(d, s.medial),
    AutoMovieHumanVector.dot(d, s.anterior),
  );

/** Perimeter of the closed uniform cubic B-spline over the given control points. */
const perimeter = (points: IAutoMovieVector3[]): number => {
  const n: number = points.length;
  let total: number = 0;
  let previous: IAutoMovieVector3 | null = null;
  for (let k: number = 0; k <= n * PERIMETER_SAMPLES; ++k) {
    const span: number = Math.floor(k / PERIMETER_SAMPLES) % n;
    const s: number = (k % PERIMETER_SAMPLES) / PERIMETER_SAMPLES;
    const w: [number, number, number, number] = [
      ((1 - s) * (1 - s) * (1 - s)) / 6,
      (3 * s * s * s - 6 * s * s + 4) / 6,
      (-3 * s * s * s + 3 * s * s + 3 * s + 1) / 6,
      (s * s * s) / 6,
    ];
    const point: IAutoMovieVector3 = AutoMovieHumanVector.offset(
      AutoMovieHumanVector.of(0, 0, 0),
      [points[(span + n - 1) % n]!, w[0]],
      [points[span]!, w[1]],
      [points[(span + 1) % n]!, w[2]],
      [points[(span + 2) % n]!, w[3]],
    );
    if (previous !== null)
      total += AutoMovieHumanVector.distance(previous, point);
    previous = point;
  }
  return total;
};
