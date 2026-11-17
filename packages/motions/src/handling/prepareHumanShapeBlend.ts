import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * Prepare a fixed pair of clinical hand shapes for actual linear weights.
 * Endpoint maps/tuples are immutable numeric data throughout this reader's
 * lifetime. Keys are captured now; values/differences are read on first use.
 *
 * @param from The fixed first shape, clinical degrees by authored bone.
 * @param to The fixed second shape in the same clinical axes.
 * @returns Fresh original x+(y-x)*weight tuples for each actual unitless weight, without clipping or a time profile.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines explicit immutable clinical endpoints, ordered lazy scalar preparation and fresh output; cold instead defines current key/component reads and original zero defaults for raw endpoint maps, with actual unmodified weights in both paths.
 * @evidence contracts/development/implementation.md#principled-implementation Fixed primitive endpoints give an invariant per-axis difference; preparing that exact subtraction once retains the original clinical linear expression for every actual weight. Prehension alone owns minimum-jerk timing and Preshape alone owns aperture bisection.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Explicit fixed schedules use a lazy scalar/difference list; cold preserves the original source-first key/tuple read loop for public shape and aperture searches whose inputs have no immutable provenance.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every key, first-seen order, component, zero default and arithmetic grouping. cold retains each original tuple component lookup and reads no unused own metadata; neither entry adds weight clipping, angle wrapping, a body fit, sample or tolerance.
 * @evidence contracts/development/implementation.md#efficient-algorithms Explicit fixed D-key schedules prepare differences once, retaining O(D) fresh tuple work per weight. cold retains O(D) key-union/source/component work on every call without sharing a sample or skipping an aperture query. Speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Explicit prepared digit schedules require unchanged primitive endpoint values and isolate output edits through scalar coefficients. Raw public shape and aperture consumers instead use cold's live reads; no evaluated shape or weight is cached by either policy.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Explicit fixed owners retain D names/coefficients until release and drop source references after first preparation. cold releases its D-key union/tuple locals at return. Outputs are fresh and neither policy retains a body, FK workspace, sampled weight/result history or external handle.
 */
export function prepareHumanShapeBlend(from: Readonly<IHumanPosture["joints"]>,
  to: Readonly<IHumanPosture["joints"]>): (weight: number) => IHumanPosture["joints"] {
  const names: string[] = [...new Set([...Object.keys(from), ...Object.keys(to)])];
  let first: Readonly<IHumanPosture["joints"]> | undefined = from;
  let second: Readonly<IHumanPosture["joints"]> | undefined = to;
  let keys: IKey[] | undefined;
  return (weight: number): IHumanPosture["joints"] => {
    if (keys === undefined) {
      keys = names.map((name: string): IKey => {
        const bone: AutoMovieHumanoidBone = name as AutoMovieHumanoidBone;
        const a: readonly [number, number, number] = first![bone] ?? ZERO;
        const b: readonly [number, number, number] = second![bone] ?? ZERO;
        const origin: readonly [number, number, number] = [a[0], a[1], a[2]];
        const x: number = b[0];
        const y: number = b[1];
        const z: number = b[2];
        return { bone, origin, difference: [x - origin[0], y - origin[1], z - origin[2]] };
      });
      first = undefined;
      second = undefined;
    }
    const out: IHumanPosture["joints"] = {};
    for (const { bone, origin, difference } of keys) out[bone] = [
      origin[0] + difference[0] * weight,
      origin[1] + difference[1] * weight,
      origin[2] + difference[2] * weight,
    ];
    return out;
  };
}

/** One original authored bone's immutable clinical origin and exact difference, degrees. */
interface IKey {
  /** Original unfiltered source name. */
  bone: AutoMovieHumanoidBone;
  /** First endpoint's three clinical coordinates. */
  origin: readonly [number, number, number];
  /** Original second-minus-first coordinates, with original subtraction grouping. */
  difference: readonly [number, number, number];
}

/** The original absent-joint clinical-zero endpoint. */
const ZERO: readonly [0, 0, 0] = [0, 0, 0];

/**
 * Original live-source interpolation beside explicitly fixed coefficients.
 *
 * @evidence contracts/development/common.md#meaningful-documentation cold re-reads both current endpoint maps, key union and every original component expression for one actual unmodified weight, returning fresh clinical tuples.
 * @evidence contracts/development/design.md#principled-representation Both policies use canonical clinical joint maps and unitless weights; fixed preparation requires unchanged primitive endpoints, while cold retains the existing raw read contract.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Public HumanPrehension.shape and HumanPreshape.open consume cold; actual explicitly fixed digit schedules consume the main producer, with no new pose, result or admission capability.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No borrowed tuple graph is automatically considered plain or immutable; no descriptor probing, cloning, identity certificate or cached evaluated shape selects the policy.
 */
export namespace prepareHumanShapeBlend {
  /** Preserve the original ordered union, absent zeros and x+(y-x)*weight reads on each call. */
  export function cold(from: Readonly<IHumanPosture["joints"]>, to: Readonly<IHumanPosture["joints"]>,
    weight: number): IHumanPosture["joints"] {
    const out: IHumanPosture["joints"] = {};
    for (const bone of new Set([...Object.keys(from), ...Object.keys(to)]) as Set<AutoMovieHumanoidBone>) {
      const x: readonly [number, number, number] = from[bone] ?? ZERO;
      const y: readonly [number, number, number] = to[bone] ?? ZERO;
      out[bone] = [
        x[0] + (y[0] - x[0]) * weight,
        x[1] + (y[1] - x[1]) * weight,
        x[2] + (y[2] - x[2]) * weight,
      ];
    }
    return out;
  }
}
