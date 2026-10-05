import { interpolateHumanBasisSourceTriangle } from "../../common/basis/interpolateHumanBasisSourceTriangle";
import type { IAutoMovieHumanPersonReferenceFieldProps } from "../structures/IAutoMovieHumanPersonReferenceFieldProps";
import type { IAutoMovieHumanPersonReferenceNormalField } from "../structures/IAutoMovieHumanPersonReferenceNormalField";
import type { IAutoMovieHumanPersonSourceStarBinding } from "../structures/IAutoMovieHumanPersonSourceStarBinding";

/**
 * Build the source normal field from performed parent area vectors.
 *
 * Each parent's area vector is accumulated at its three original
 * vertex/domain stars. A star is normalized when first consumed. A sample's
 * normal interpolates its required stars through its chart and is
 * normalized; corners the sample does not require contribute zero. The field
 * gives every used vertex of both sides its normal (unused vertices read
 * zero), and `at` answers any sample under any parent, cached by its binding
 * identity. A zero used normal refuses by name.
 *
 * @evidence contracts/common.md#principled-implementation Normals come from the performed parents' own area vectors through the frozen charts, so both halves read one field.
 * @evidence contracts/common.md#clear-and-simple-design Accumulate stars, normalize on use, interpolate per binding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A zero normal refuses instead of being replaced.
 * @evidence contracts/common.md#meaningful-documentation States the accumulation, the interpolation, the unused case, the cache and the refusal.
 * @evidence contracts/modeling.md#spatial-conventions Area vectors in square metres; returned normals are unit vectors.
 * @evidence contracts/modeling.md#shared-boundaries A shared sample bound to equal stars on both sides reads one normal.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The evaluator emits the parts.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function createHumanPersonReferenceField(
  props: IAutoMovieHumanPersonReferenceFieldProps,
): IAutoMovieHumanPersonReferenceNormalField {
  const { plan, bindings, bindingAt, parentAreas } = props;
  const unit = (vector: number[]): number[] => {
    const length = Math.hypot(...vector);
    if (!(length > 0)) throw new Error("Person source shading needs a nonzero used normal.");
    return vector.map((value) => value / length);
  };
  const original = new Map<string, number[]>();
  for (let at = 0; at < plan.face.parentTriangles.length; at += 3)
    for (let k = 0; k < 3; k++) {
      const key = `${plan.face.parentTriangles[at + k]}:${plan.face.parentNormalDomains?.[at + k] ?? 0}`;
      const vector = original.get(key) ?? [0, 0, 0];
      for (let axis = 0; axis < 3; axis++) vector[axis] += parentAreas[at + axis];
      original.set(key, vector);
    }
  const normalized = new Map<string, number[]>();
  const star = (key: string): number[] => {
    let vector = normalized.get(key);
    if (vector === undefined) {
      vector = unit(original.get(key)!);
      normalized.set(key, vector);
    }
    return vector;
  };
  const normalAt = (binding: IAutoMovieHumanPersonSourceStarBinding): number[] => {
    const required = new Set(binding.weights.map((weight) => weight.key));
    return unit(
      [0, 1, 2].map((axis) =>
        interpolateHumanBasisSourceTriangle(
          binding.keys.map((key) => (required.has(key) ? star(key)[axis] : 0)) as [number, number, number],
          binding.coordinates,
        ),
      ),
    );
  };
  const points = new Map<string, number[]>();
  return {
    normals: bindings.flatMap((side) => side.flatMap((binding) => (binding === undefined ? [0, 0, 0] : normalAt(binding)))),
    at: (sample: number, parent: number): number[] => {
      const binding = bindingAt(sample, parent);
      const key = `${sample}:${binding.identity}`;
      let normal = points.get(key);
      if (normal === undefined) {
        normal = normalAt(binding);
        points.set(key, normal);
      }
      return normal;
    },
  };
}
