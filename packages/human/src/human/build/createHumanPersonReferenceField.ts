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
 */
export function createHumanPersonReferenceField(
  props: IAutoMovieHumanPersonReferenceFieldProps,
): IAutoMovieHumanPersonReferenceNormalField {
  const { plan, bindings, bindingAt, parentAreas } = props;
  const unit = (vector: number[]): number[] => {
    const length = Math.hypot(...vector);
    if (!(length > 0))
      throw new Error("Person source shading needs a nonzero used normal.");
    return vector.map((value) => value / length);
  };
  const original = new Map<string, number[]>();
  for (let at = 0; at < plan.face.parentTriangles.length; at += 3)
    for (let k = 0; k < 3; k++) {
      const key = `${plan.face.parentTriangles[at + k]}:${plan.face.parentNormalDomains?.[at + k] ?? 0}`;
      const vector = original.get(key) ?? [0, 0, 0];
      for (let axis = 0; axis < 3; axis++)
        vector[axis] += parentAreas[at + axis];
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
  const normalAt = (
    binding: IAutoMovieHumanPersonSourceStarBinding,
  ): number[] => {
    const required = new Set(binding.weights.map((weight) => weight.key));
    return unit(
      [0, 1, 2].map((axis) =>
        interpolateHumanBasisSourceTriangle(
          binding.keys.map((key) =>
            required.has(key) ? star(key)[axis] : 0,
          ) as [number, number, number],
          binding.coordinates,
        ),
      ),
    );
  };
  const points = new Map<string, number[]>();
  return {
    normals: bindings.flatMap((side) =>
      side.flatMap((binding) =>
        binding === undefined ? [0, 0, 0] : normalAt(binding),
      ),
    ),
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
