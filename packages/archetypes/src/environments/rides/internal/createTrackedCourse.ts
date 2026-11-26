import { Quaternion, Vector3, frameAutoMovieSweepSpine, AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieSweepFrame,
  IAutoMovieSweepPath,
  IAutoMovieTrackCourse,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../../../core/AutoMovieArchetypeFrame";
import { AutoMovieArchetypeUnits } from "../../../core/AutoMovieArchetypeUnits";

/** Start with 32 chord and display sections per spline span. */
const SECTIONS_PER_SPAN: number = 32;

/** The vertical axis used to start an open or closed course upright. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** The axis of the bank in the local track frame. */
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

/**
 * Prepare a reusable banked course through XYZ waypoints.
 *
 * @param input Local waypoints, closure and optional bank and lateral input.
 * @returns Approximate arc stations and their shared rigid frame sampler.
 * @throws On malformed points or orientation, degenerate travel or distances
 *   the sampled frame cannot represent.
 */
export function createTrackedCourse(
  input: IAutoMovieTrackCourse.IInput,
): IAutoMovieTrackCourse.IPrepared {
  const closed: boolean = input.closed ?? false;
  const points: IAutoMovieVector3[] = input.points.map(
    (point: IAutoMovieVector3): IAutoMovieVector3 => ({ ...point }),
  );
  if (points.length < (closed ? 3 : 2))
    throw new Error("Track needs at least two open or three closed waypoints");
  const banks: number[] =
    input.banks === undefined
      ? points.map((): number => 0)
      : Array.from(input.banks);
  if (banks.length !== points.length)
    throw new Error("Track banks must contain one finite angle per waypoint");
  if (closed) {
    points.push({ ...points[0]! });
    banks.push(banks[0]!);
  }

  const chords: number[] = [0];
  for (let i: number = 1; i < points.length; ++i) {
    const distance: number = Vector3.distance(points[i - 1]!, points[i]!);
    const total: number = chords[i - 1]! + distance;
    if (total <= chords[i - 1]!)
      throw new Error(`Track chord at waypoint ${i} must increase finitely`);
    if (Math.abs(banks[i]! - banks[i - 1]!) > 180)
      throw new Error(`Track bank change at waypoint ${i} exceeds a half turn`);
    chords.push(total);
  }

  const firstDirection: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(points[1]!, points[0]!),
  );
  const direction: IAutoMovieVector3 = closed
    ? Vector3.normalize(
        Vector3.add(
          firstDirection,
          Vector3.normalize(
            Vector3.subtract(points[0]!, points[points.length - 2]!),
          ),
        ),
      )
    : firstDirection;
  if (Vector3.length(direction) < 1e-9)
    throw new Error("Closed track reverses at the seam");
  const defaultLateral: IAutoMovieVector3 = Vector3.cross(UP, direction);
  const path: IAutoMovieSweepPath = frameAutoMovieSweepSpine({
    points,
    normal:
      input.lateral ??
      (Vector3.length(defaultLateral) > 1e-9
        ? defaultLateral
        : { x: 1, y: 0, z: 0 }),
    ...(closed ? { tangents: { start: direction, end: direction } } : {}),
  });
  const first: IAutoMovieSweepFrame = path.frame(0);
  const last: IAutoMovieSweepFrame = path.frame(1);

  // Transport around a loop need not return the first lateral axis. Distribute the measured correction along the loop.
  const correction: number = closed
    ? Math.atan2(
        Vector3.dot(first.normal, Vector3.cross(last.x, first.x)),
        Vector3.dot(last.x, first.x),
      ) / AutoMovieArchetypeUnits.DEGREE
    : 0;
  const chordLength: number = chords[chords.length - 1]!;
  const parameters: number[] = [0];
  const stations: number[] = [0];
  const sectionBanks: number[] = [banks[0]!];
  let previous: IAutoMovieVector3 = first.origin;
  for (let i: number = 1; i < points.length; ++i) {
    for (let j: number = 1; j <= SECTIONS_PER_SPAN; ++j) {
      const fraction: number = j / SECTIONS_PER_SPAN;
      const u: number =
        ((1 - fraction) * chords[i - 1]! + fraction * chords[i]!) / chordLength;
      const point: IAutoMovieVector3 = path.point(u);
      const total: number =
        stations[stations.length - 1]! + Vector3.distance(previous, point);
      if (total <= stations[stations.length - 1]!)
        throw new Error(
          `Track spline interval at waypoint ${i} must increase finitely`,
        );
      parameters.push(u);
      stations.push(total);
      sectionBanks.push((1 - fraction) * banks[i - 1]! + fraction * banks[i]!);
      previous = point;
    }
  }
  const length: number = stations[stations.length - 1]!;

  return Object.freeze({
    stations: Object.freeze(stations),
    length,
    closed,
    frame: (distance: number): IAutoMovieTransform => {
      if (distance < 0 || distance > length)
        throw new Error(
          "Track frame distance must be finite and within the course",
        );
      if (closed && distance === length) distance = 0;

      let left: number = 0;
      let right: number = stations.length - 1;
      while (right - left > 1) {
        const middle: number = Math.floor((left + right) / 2);
        if (stations[middle]! <= distance) left = middle;
        else right = middle;
      }
      const fraction: number =
        (distance - stations[left]!) / (stations[right]! - stations[left]!);
      const u: number =
        (1 - fraction) * parameters[left]! + fraction * parameters[right]!;
      const frame: IAutoMovieSweepFrame = path.frame(u);
      const bank: number =
        (1 - fraction) * sectionBanks[left]! +
        fraction * sectionBanks[right]! +
        correction * (distance / length);
      const rotation: IAutoMovieQuaternion = AutoMovieEngineMath.quaternionFromBasis(
        frame.x,
        frame.y,
        frame.normal,
      );
      return {
        translation: frame.origin,
        rotation: Quaternion.normalize(
          Quaternion.multiply(
            rotation,
            Quaternion.fromAxisAngle(FORWARD, bank),
          ),
        ),
        scale: { ...AutoMovieArchetypeFrame.UNIT },
      };
    },
  });
}
