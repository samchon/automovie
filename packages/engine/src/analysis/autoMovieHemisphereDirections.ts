import {
  type IAutoMovieHemisphereDirections,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/** Directions this short or shorter carry no direction at all. */
const AXIS_EPSILON: number = 1e-12;

/**
 * Deterministic cosine-weighted unit directions over the hemisphere around
 * `normal`, `count` of them in index order.
 *
 * The set is a Hammersley sequence mapped by Malley's method, so it is a
 * property of the normal and sample count: no random state, no host entropy,
 * the same directions in the same order on Windows and POSIX. Cosine weighting
 * is what makes the estimator exact for the case that matters most: a plane
 * facing the ground's own up with nothing above it sees every one of its
 * directions, so the estimate of an isotropic sky's contribution collapses to
 * the declared horizontal illuminance with no sampling error in ideal
 * arithmetic. A tilted plane loses the directions that point below the horizon,
 * and the fraction it loses does carry sampling error.
 *
 * `normal` need not be unit length; it is normalized first. Throws when `count`
 * is not a positive safe integer, or when `normal` has a non-finite component
 * or a measured norm that is nonfinite or `1e-12` or less. Memory grows with
 * `count`, which has no upper bound here.
 */
export const autoMovieHemisphereDirections: (
  props: IAutoMovieHemisphereDirections.IProps,
) => IAutoMovieVector3[] = (
  props: IAutoMovieHemisphereDirections.IProps,
): IAutoMovieVector3[] => {
  const count: number = props.count;
  if (
    !(
      count >= 1 &&
      count <= Number.MAX_SAFE_INTEGER &&
      Math.floor(count) === count
    )
  )
    throw new Error(
      `hemisphere sample count must be a positive safe integer, but was ${count}`,
    );
  const length: number = Vector3.length(props.normal);
  if (length <= AXIS_EPSILON)
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

/**
 * Reverse the unsigned 32-bit index into base-two fractional digits for the
 * hemisphere's deterministic angle. At most 32 iterations use constant storage;
 * the sampler reaches no wrapped index before exhausting JavaScript's array
 * length and retains no cross-call state.
 */
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
