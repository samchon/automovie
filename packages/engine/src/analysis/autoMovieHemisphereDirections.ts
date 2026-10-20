import { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/** Directions this short or shorter carry no direction at all. */
const AXIS_EPSILON: number = 1e-12;

/**
 * Deterministic cosine-weighted unit directions over the hemisphere around
 * `normal`, `count` of them in index order.
 *
 * The set is a Hammersley sequence mapped by Malley's method, so it is a
 * property of the normal and sample count: no random state, no host entropy, the
 * same directions in the same order on Windows and POSIX. Cosine weighting is
 * what makes the estimator exact for the case that matters most: a plane facing
 * the ground's own up with nothing above it sees every one of its directions,
 * so the estimate of an isotropic sky's contribution collapses to the declared
 * horizontal illuminance with no sampling error in ideal arithmetic. A tilted
 * plane loses the directions that point below the horizon, and the fraction it
 * loses does carry sampling error.
 *
 * `normal` need not be unit length; it is normalized first. Throws when `count`
 * is not a positive safe integer, or when `normal` has a non-finite component
 * or a measured norm that is nonfinite or `1e-12` or less. Memory grows with `count`, which has no upper
 * bound here.
 *
 * @evidence contracts/common.md#principled-implementation A stratified radial coordinate `(index + 0.5) / count` paired with the base-2 van der Corput angle (a Hammersley set), lifted by Malley's disk-to-hemisphere projection so density follows the cosine, in Duff et al.'s branchless orthonormal basis; the radical inverse reads the index as a 32-bit unsigned integer, which is exact because a JavaScript array cannot hold 2^32 entries, and a non-finite normal is refused because it would turn every direction into NaN.
 * @evidence contracts/common.md#clear-and-simple-design One function owns sampling, with the radical inverse as its only private helper; it depends only on the normal and the count, which lets the daylight analyzer build the set once per study.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No pole is special-cased, since choosing `sign` from `normal.z` keeps `sign + normal.z` away from zero; the half-sample radial offset is the stratification, not a correction for a measured result.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the sequence and mapping, determinism across hosts, where the estimator is exact and where it carries error, normalization of `normal`, every throwing input, and the unbounded memory.
 * @evidence contracts/performance.md#efficient-algorithms O(N) time and memory for N=count: radical inversion reads at most 32 unsigned index bits per direction. The basis is computed once, followed by two square roots and a sine-cosine pair per direction; oversized counts may fail host allocation before completion.
 * @evidence contracts/performance.md#reuse-equivalent-work The daylight analyzer builds the set once per study and shares it across every grid cell, which is valid because the set depends only on the plane normal and `diffuseSamples`, both fixed for the study.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one new array of N vectors owned by the caller and retains nothing; N is the caller's `diffuseSamples`, which nothing caps beyond being a safe integer, so that allocation has no bound.
 */
export const autoMovieHemisphereDirections: (props: {
  normal: IAutoMovieVector3;
  count: number;
}) => IAutoMovieVector3[] = (props: {
  /** Axis of the hemisphere; any finite non-zero length. */
  normal: IAutoMovieVector3;

  /** Number of directions, a positive safe integer. */
  count: number;
}): IAutoMovieVector3[] => {
  const count: number = props.count;
  if (!Number.isSafeInteger(count) || count < 1)
    throw new Error(
      `hemisphere sample count must be a positive safe integer, but was ${count}`,
    );
  const length: number = Vector3.length(props.normal);
  if (!Number.isFinite(length) || length <= AXIS_EPSILON)
    throw new Error("hemisphere sampling needs a finite, non-zero normal");
  const normal: IAutoMovieVector3 = Vector3.normalize(props.normal);
  // Duff et al.'s branchless orthonormal basis: `sign + normal.z` is never zero
  // because `sign` is chosen from the sign of `normal.z`, so there is no
  // singular pole to special-case.
  const sign: number = normal.z >= 0 ? 1 : -1;
  const a: number = -1 / (sign + normal.z);
  const b: number = normal.x * normal.y * a;
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
  for (let index: number = 0; index < count; ++index) {
    const radial: number = (index + 0.5) / count;
    const angle: number = 2 * Math.PI * radicalInverse2(index);
    const radius: number = Math.sqrt(radial);
    const x: number = radius * Math.cos(angle);
    const y: number = radius * Math.sin(angle);
    const z: number = Math.sqrt(1 - radial);
    out.push({
      x: tangent.x * x + bitangent.x * y + normal.x * z,
      y: tangent.y * x + bitangent.y * y + normal.y * z,
      z: tangent.z * x + bitangent.z * y + normal.z * z,
    });
  }
  return out;
};

/** Reverse the unsigned 32-bit index into base-two fractional digits for the hemisphere's deterministic angle. At most 32 iterations use constant storage; the sampler reaches no wrapped index before exhausting JavaScript's array length and retains no cross-call state. */
const radicalInverse2: (index: number) => number = (index: number): number => {
  let bits: number = index >>> 0;
  let result: number = 0;
  let fraction: number = 0.5;
  while (bits > 0) {
    result += (bits & 1) * fraction;
    bits >>>= 1;
    fraction *= 0.5;
  }
  return result;
};
