/**
 * Plan the segments of a crafted or lofted curved section: the fewest whose
 * chords stray from the arc by at most one pixel footprint at the closest
 * distance a camera sees it from.
 *
 * At distance `d` metres from a pinhole camera of vertical field of view `θ`
 * drawing an image `H` pixels high, one metre at the image centre covers `p = H
 * / (2 d tan(θ / 2))` pixels, so one pixel covers `e = 1 / p` metres. A chord
 * spanning the angle `2π / n` of a circle of radius `r` strays from its arc by
 * its sagitta `r (1 - cos(π / n))`, so the fewest segments within `e` are `n =
 * ceil(π / acos(1 - e / r))`. The angle is evaluated as `2 asin(sqrt(e / (2
 * r)))`, the same value without the cancellation of `1 - e / r` at a small
 * ratio. Where `e` reaches the diameter `2r` the formula has no value, because
 * the whole section lies within one pixel; there, and wherever it gives fewer,
 * the budget is 3 segments, the fewest that close a section with area. The
 * budget falls roughly with the square root of the distance. Model primitives
 * keep their fixed segments; this plans only sections an author draws.
 *
 * @param props The image height, the vertical field of view and the section's
 *   closest camera distance and radius.
 * @returns The pixel footprint, the chord tolerance and the segment count.
 * @throws {RangeError} Naming the parameter when the height, distance or radius
 *   is not finite and positive, or the field of view is not inside (0, 180)
 *   degrees.
 */
export function planAutoMovieSegmentBudget(
  props: planAutoMovieSegmentBudget.IProps,
): planAutoMovieSegmentBudget.IResult {
  for (const key of ["height", "distance", "radius"] as const)
    if (!(Number.isFinite(props[key]) && props[key] > 0))
      throw new RangeError(
        `Segment budget ${key} must be finite and positive: ${props[key]}`,
      );
  if (!(props.fovDeg > 0 && props.fovDeg < 180))
    throw new RangeError(
      `Segment budget fovDeg must lie inside (0, 180) degrees: ${props.fovDeg}`,
    );

  const pixelsPerMetre: number =
    props.height /
    (2 * props.distance * Math.tan((props.fovDeg * Math.PI) / 360));
  const tolerance: number = 1 / pixelsPerMetre;

  // The half chord angle pi / n whose sagitta is the tolerance; past the
  // diameter the root exceeds 1 and asin has no value.
  const ratio: number = tolerance / props.radius;
  const angle: number =
    ratio >= 2 ? Math.PI : 2 * Math.asin(Math.sqrt(ratio / 2));
  return {
    pixelsPerMetre,
    tolerance,
    segments: Math.max(MINIMUM_SEGMENTS, Math.ceil(Math.PI / angle)),
  };
}

/** The fewest segments that close a section with area, a triangle. */
const MINIMUM_SEGMENTS: number = 3;

/** The budget's inputs and result. */
export namespace planAutoMovieSegmentBudget {
  /** The camera's image and view, and the section it sees. */
  export interface IProps {
    /** Image height in pixels, positive. */
    height: number;

    /** Vertical field of view in degrees, inside (0, 180). */
    fovDeg: number;

    /** Closest distance in metres a camera sees the section from, positive. */
    distance: number;

    /** The section's radius in metres, positive. */
    radius: number;
  }

  /** The pixel footprint at the distance and the segments it allows. */
  export interface IResult {
    /** Pixels one metre covers at the distance, `p`. */
    pixelsPerMetre: number;

    /**
     * Metres one pixel covers, `e = 1 / p`: the chord tolerance, also for the
     * chords along a profile.
     */
    tolerance: number;

    /** Segments of the section's full turn, an integer of at least 3. */
    segments: number;
  }
}
