import {
  IAutoMovieSubdivisionSurface,
  subdivideAutoMovieSurface,
} from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanSurfaceCoordinate } from "../../junction/IAutoMovieHumanSurfaceCoordinate";
import { IAutoMovieHumanMeasurements } from "../../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanLegStation } from "./IAutoMovieHumanLegStation";
import { measureAutoMovieHumanLegGirth } from "./measureAutoMovieHumanLegGirth";
import { planAutoMovieHumanLegStations } from "./planAutoMovieHumanLegStations";
import { shapeAutoMovieHumanLegSection } from "./shapeAutoMovieHumanLegSection";

/**
 * Fixed-point passes that scale each fitted station until its limit-surface girth matches the measurement. A station's own ring carries about two thirds of its limit section, so each pass divides the remaining error by about three and five passes leave well under a millimetre. Grade: numerical.
 */
const FIT_PASSES: number = 5;

/**
 * Subdivision levels of the surface the girths are measured on: three levels put 64 quads on every cage face, so the measured section is a polygon of about a hundred sides whose length is within a fraction of a millimetre of the limit curve's. Grade: numerical.
 */
const MEASURE_LEVELS: number = 3;

/**
 * Build one leg's control cage, from the mid thigh ring to the ankle ring.
 *
 * Every station is an edge loop around the limb at its planned level, perpendicular to the bone it crosses; the two end stations are the junction rings, their vertices exactly on the shared ring shape of `shapeAutoMovieHumanRing`, so the junction welds them to the trunk and the foot without moving either. Twelve vertices run around each station from the thigh to the lower calf, where the calf's bellies narrow into the calcaneal tendon, and eight from there to the ankle. The reduction between them is two patches of four quads, centred on the medial and lateral midlines, each turning four spans into two around one regular vertex inside the patch; the two valence-3 and two valence-5 vertices each patch needs lie on the narrow, sharply curved sides of the lower shank, the region the junction research reserves for poles, never on the broad lit shin or calf.
 *
 * Each inner station's control points sit at the radii `shapeAutoMovieHumanLegSection` gives. The stations at the levels the identity measures, suprapatella and the calf maximum, are then scaled about their origins until the girth of the subdivided surface in their plane matches the measurement, measured on the same Catmull-Clark surface the person is rendered with; the stations between take scales interpolated along the limb from those and from the rings, which keep their shared shape, so no station is sharpened by a fit against neighbours that the limit surface averages. The measured girths therefore hold on the surface, not on the cage, which lies outside it.
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

  // topology: stations in order, then the two reduction centres
  const first: number[] = [];
  let count: number = 0;
  for (const s of stations) {
    first.push(count);
    count += s.count;
  }
  const centres: [number, number] = [count, count + 1];
  const upper: IAutoMovieHumanLegStation = stations[reduced - 1]!;
  const lower: IAutoMovieHumanLegStation = stations[reduced]!;
  const chart: Array<{ u: number; v: number }> = [];
  stations.forEach((s: IAutoMovieHumanLegStation): void => {
    for (let j: number = 0; j < s.count; ++j)
      chart.push({ u: s.u, v: j / s.count });
  });
  chart.push(
    { u: 0.5 * (upper.u + lower.u), v: 0.25 },
    { u: 0.5 * (upper.u + lower.u), v: 0.75 },
  );
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
    const vs: number[] = corners.map((c: number): number => chart[c]!.v);
    const wraps: boolean = vs.some((v: number): boolean => v > 0.5);
    faces.push({
      vertices: corners,
      coordinates: corners.map(
        (c: number, k: number): IAutoMovieHumanSurfaceCoordinate => ({
          part: "leg",
          side: props.side,
          u: chart[c]!.u,
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

  // positions for given station scales; the rings lie on the shared shape and are never scaled
  const directions: IAutoMovieVector3[][] = stations.map(
    (s: IAutoMovieHumanLegStation): IAutoMovieVector3[] =>
      Array.from({ length: s.count }, (_: unknown, j: number): IAutoMovieVector3 =>
        around(s, j / s.count),
      ),
  );
  const radii: number[][] = stations.map(
    (s: IAutoMovieHumanLegStation, i: number): number[] =>
      directions[i]!.map(
        (d: IAutoMovieVector3): number =>
          shapeAutoMovieHumanLegSection(s, anatomical(s, d), lean),
      ),
  );
  const place = (scales: number[]): IAutoMovieVector3[] => {
    const positions: IAutoMovieVector3[] = [];
    stations.forEach((s: IAutoMovieHumanLegStation, i: number): void => {
      for (let j: number = 0; j < s.count; ++j)
        positions.push(
          i === 0
            ? thighRing.positions[(wide - j) % wide]!
            : i === last
              ? ankleRing.positions[j]!
              : AutoMovieHumanVector.offset(s.origin, [
                  directions[i]![j]!,
                  scales[i]! * radii[i]![j]!,
                ]),
        );
    });
    for (const v of [0.25, 0.75]) {
      const d: IAutoMovieVector3 = around(upper, v);
      const angle: number = anatomical(upper, d);
      const radius: number =
        0.5 *
        (scales[reduced - 1]! * shapeAutoMovieHumanLegSection(upper, angle, lean) +
          scales[reduced]! * shapeAutoMovieHumanLegSection(lower, angle, lean));
      positions.push(
        AutoMovieHumanVector.offset(
          AutoMovieHumanVector.of(0, 0, 0),
          [upper.origin, 0.5],
          [lower.origin, 0.5],
          [d, radius],
        ),
      );
    }
    return positions;
  };

  // fit the measured girths on the subdivided surface
  const scales: number[] = stations.map((): number => 1);
  const quads: number[][] = faces.map(
    (f: IAutoMovieHumanCage.IFace): number[] => f.vertices,
  );
  for (let pass: number = 0; pass < FIT_PASSES; ++pass) {
    const surface: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({
      cage: {
        positions: place(scales).flatMap((p: IAutoMovieVector3): number[] => [
          p.x,
          p.y,
          p.z,
        ]),
        faces: quads,
      },
      levels: MEASURE_LEVELS,
    });
    stations.forEach((s: IAutoMovieHumanLegStation, i: number): void => {
      if (!s.fitted) return;
      scales[i]! *=
        s.girth /
        measureAutoMovieHumanLegGirth({
          positions: surface.limitPositions,
          faces: surface.faces,
          origin: s.origin,
          normal: s.axis,
          reach: s.girth / 2,
        });
    });
    interpolate(stations, scales);
  }

  return {
    vertices: place(scales).map(
      (position: IAutoMovieVector3): IAutoMovieHumanCage.IVertex => ({
        position,
      }),
    ),
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

/** Set the scale of every station that is not fitted by linear interpolation in `u` between the fitted stations around it, the rings counting as fitted at their unit scale. */
const interpolate = (
  stations: IAutoMovieHumanLegStation[],
  scales: number[],
): void => {
  const anchors: number[] = stations
    .map((s: IAutoMovieHumanLegStation, i: number): number =>
      s.fitted || i === 0 || i === stations.length - 1 ? i : -1,
    )
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
