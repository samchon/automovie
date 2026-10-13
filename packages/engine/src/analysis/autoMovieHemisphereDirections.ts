import { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/** Directions shorter than this carry no direction at all. */
const AXIS_EPSILON = 1e-12;

/**
 * Deterministic cosine-weighted unit directions over the hemisphere around
 * `normal`, `count` of them in index order.
 *
 * The set is a Hammersley sequence mapped by Malley's method, so it is a
 * property of the sample count alone: no random state, no host entropy, the
 * same directions in the same order on Windows and POSIX. Cosine weighting is
 * what makes the estimator exact for the case that matters most: a plane facing
 * the ground's own up with nothing above it sees every one of its directions,
 * so the estimate of an isotropic sky's contribution collapses to the declared
 * horizontal illuminance with no sampling error at all, for any count. A tilted
 * plane loses the directions that point below the horizon, and the fraction it
 * loses does carry sampling error.
 *
 * `normal` need not be unit length; it is normalized first. Throws when `count`
 * is not a positive safe integer or `normal` has no length.
 *
 * @evidence contracts/common.md#principled-implementation A stratified radial coordinate `(index + 0.5) / count` paired with the base-2 van der Corput angle (a Hammersley set), lifted by Malley's disk-to-hemisphere projection so density follows the cosine, in Duff et al.'s branchless orthonormal basis; a non-finite normal is not refused and would yield NaN directions, and the radical inverse reads the index as 32-bit unsigned, so angles would repeat past 2^32 samples.
 * @evidence contracts/common.md#clear-and-simple-design Takes no sample point because the daylight study's workplane is planar: every grid point shares the normal, so one set built per run serves all of them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No pole is special-cased, since choosing `sign` from `normal.z` keeps `sign + normal.z` away from zero; the half-sample radial offset is the stratification, not a correction for a measured result.
 * @evidence contracts/common.md#meaningful-documentation States the sequence and mapping, why the set is host-independent, when the sky estimate is exact and when it carries sampling error, the normalization of `normal`, and both refusals.
 * @evidence contracts/performance.md#cost-and-resources O(count) time and memory with an O(log index) radical inverse per direction; `count` is the request's `diffuseSamples`, which the daylight caller multiplies by every grid point and solid plane, so it dominates the study. The daylight run builds the set once and shares it across all grid points (valid because it depends only on the run-wide normal and count) and holds the array until it seals the run; nothing caps `count` beyond being a safe integer, so that allocation has no bound.
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
