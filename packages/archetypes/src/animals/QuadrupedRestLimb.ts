import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Solve a four-bar planar limb from a fixed root, terminal goal and distal
 * carriage.
 *
 * @param source Five neutral joints, shoulder/hip through terminal endpoint,
 *   metres.
 * @param root Current shoulder/hip in model space; its X must match the source
 *   plane.
 * @param foot Desired terminal endpoint, metres, in the same X plane.
 * @param distal Third/fourth bar directions, radians from down toward +Z.
 * @param bend -1 keeps a fore elbow behind the root-to-wrist line; +1 keeps a
 *   hind stifle ahead.
 * @returns Five independent joints with all four original lengths.
 * @throws {RangeError} For a degenerate source, inconsistent plane or
 *   unreachable proximal triangle, including its reachable band.
 */
export function QuadrupedRestLimb(
  source: readonly IAutoMovieVector3[],
  root: IAutoMovieVector3,
  foot: IAutoMovieVector3,
  distal: readonly [number, number],
  bend: -1 | 1,
): IAutoMovieVector3[] {
  if (source.length !== 5)
    throw new RangeError("A resting quadruped limb requires five joints");
  const lengths: number[] = source
    .slice(1)
    .map((point: IAutoMovieVector3, index: number): number =>
      Vector3.length(Vector3.subtract(point, source[index]!)),
    );
  if (lengths.some((length: number): boolean => !(length > 0)))
    throw new RangeError(
      "Resting limb data must be finite with positive lengths",
    );
  const [a, b, c, d]: number[] = lengths;
  const roundoff: number =
    64 *
    Number.EPSILON *
    Math.max(...lengths, Vector3.length(root), Vector3.length(foot), 1);
  if (
    (bend !== -1 && bend !== 1) ||
    Math.abs(root.x - foot.x) > roundoff ||
    Math.abs(root.x - source[0]!.x) > roundoff ||
    source.some(
      (point: IAutoMovieVector3): boolean =>
        Math.abs(point.x - source[0]!.x) > roundoff,
    )
  )
    throw new RangeError(
      "Resting limb goals must remain in the source sagittal plane",
    );
  const ankle: IAutoMovieVector3 = {
    x: foot.x,
    y: foot.y + d! * Math.cos(distal[1]),
    z: foot.z - d! * Math.sin(distal[1]),
  };
  const wrist: IAutoMovieVector3 = {
    x: foot.x,
    y: ankle.y + c! * Math.cos(distal[0]),
    z: ankle.z - c! * Math.sin(distal[0]),
  };
  const dy: number = wrist.y - root.y;
  const dz: number = wrist.z - root.z;
  const distance: number = Math.hypot(dy, dz);
  const minimum: number = Math.abs(a! - b!);
  const maximum: number = a! + b!;
  if (
    distance === 0 ||
    distance < minimum - roundoff ||
    distance > maximum + roundoff
  )
    throw new RangeError(
      `Resting proximal reach ${distance} m is outside (${minimum}, ${maximum}] m`,
    );

  // Admission fixes the geometry; this bounded cosine only removes arithmetic
  // spill beyond the mathematical [-1,1] domain at an admitted tangency.
  const cosine: number = Math.max(
    -1,
    Math.min(
      1,
      (a! * a! + distance * distance - b! * b!) / (2 * a! * distance),
    ),
  );
  const upper: number = Math.atan2(dz, -dy) + bend * Math.acos(cosine);
  return [
    { ...root },
    {
      x: root.x,
      y: root.y - a! * Math.cos(upper),
      z: root.z + a! * Math.sin(upper),
    },
    wrist,
    ankle,
    { ...foot },
  ];
}
