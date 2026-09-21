import { IAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "../math/Vector3";

/** Directions shorter than this carry no direction at all. */
const AXIS_EPSILON = 1e-12;

/**
 * Deterministic cosine-weighted directions over the hemisphere around `normal`.
 *
 * The set is a Hammersley sequence mapped by Malley's method, so it is a
 * property of the sample count alone: no random state, no host entropy, the
 * same directions in the same order on Windows and POSIX. Cosine weighting is
 * what makes the estimator exact for the case that matters most: an
 * unobstructed plane sees every one of its directions, so the estimate of an
 * isotropic sky's contribution collapses to the declared horizontal illuminance
 * with no sampling error at all, for any count.
 *
 * @evidence requirements/map/weather-and-seasons.md#map-calendar-time-celestial-state `autoMovieHemisphereDirections` supplies repeatable sky-facing sample directions around an authored measurement normal.
 * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-calendar-time-celestial-input The Hammersley and Malley construction maps a sample count to one deterministic cosine-weighted hemisphere sequence.
 */
export const autoMovieHemisphereDirections = (props: {
  normal: IAutoMovieVector3;
  count: number;
}): IAutoMovieVector3[] => {
  const { count } = props;
  if (!Number.isSafeInteger(count) || count < 1)
    throw new Error(
      `hemisphere sample count must be a positive safe integer, but was ${count}`,
    );
  if (Vector3.length(props.normal) <= AXIS_EPSILON)
    throw new Error("hemisphere sampling needs a non-zero normal");
  const normal = Vector3.normalize(props.normal);
  // Duff et al.'s branchless orthonormal basis: `sign + normal.z` is never zero
  // because `sign` is chosen from the sign of `normal.z`, so there is no
  // singular pole to special-case.
  const sign = normal.z >= 0 ? 1 : -1;
  const a = -1 / (sign + normal.z);
  const b = normal.x * normal.y * a;
  const tangent: IAutoMovieVector3 = {
    x: 1 + sign * normal.x * normal.x * a,
    y: sign * b,
    z: -sign * normal.x,
  };
  const bitangent: IAutoMovieVector3 = {
    x: b,
    y: sign + normal.y * normal.y * a,
    z: -normal.y,
  };
  const out: IAutoMovieVector3[] = [];
  for (let index = 0; index < count; ++index) {
    const radial = (index + 0.5) / count;
    const angle = 2 * Math.PI * radicalInverse2(index);
    const radius = Math.sqrt(radial);
    const local = {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      z: Math.sqrt(1 - radial),
    };
    out.push({
      x: tangent.x * local.x + bitangent.x * local.y + normal.x * local.z,
      y: tangent.y * local.x + bitangent.y * local.y + normal.y * local.z,
      z: tangent.z * local.x + bitangent.z * local.y + normal.z * local.z,
    });
  }
  return out;
};

/** Van der Corput radical inverse in base two. */
const radicalInverse2 = (index: number): number => {
  let bits = index >>> 0;
  let result = 0;
  let fraction = 0.5;
  while (bits > 0) {
    result += (bits & 1) * fraction;
    bits >>>= 1;
    fraction *= 0.5;
  }
  return result;
};
