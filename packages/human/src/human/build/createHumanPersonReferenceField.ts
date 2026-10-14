import { interpolateHumanBasisSourceTriangle } from "../../common/basis/interpolateHumanBasisSourceTriangle";
import type { IAutoMovieHumanPersonReferenceFieldProps } from "../structures/IAutoMovieHumanPersonReferenceFieldProps";
import type { IAutoMovieHumanPersonReferenceNormalField } from "../structures/IAutoMovieHumanPersonReferenceNormalField";
import type { IAutoMovieHumanPersonSourceStarBinding } from "../structures/IAutoMovieHumanPersonSourceStarBinding";

/**
 * Build the source normal field from performed parent area vectors.
 *
 * Each parent's area vector is accumulated at its three original vertex/domain stars. A star is normalized when first consumed. A sample's normal interpolates its required stars through its chart and is normalized; corners the sample does not require contribute zero. The field gives every used vertex of both sides its normal (unused vertices read zero), and `at` answers any sample under any parent, cached by its binding identity. A zero or nonfinite used normal refuses by name.
 *
 * Parent areas use square metres and returned normals are dimensionless in the performed frame. Source buffers are borrowed unchanged. Cached arrays remain owned by this field and are borrowed by callers, who must not mutate them; cache growth follows the actual distinct sample/binding queries until release.
 *
 * @evidence contracts/common.md#principled-implementation Performed parent area vectors accumulate at original vertex/domain stars; required positive-weight corners feed the shared ordered affine chart and normalized normals, preserving opposed shading domains.
 * @evidence contracts/common.md#clear-and-simple-design Source-normal compilation supplies admitted bindings and identity, while this field owns area accumulation and lazy star/sample normal evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unused vertices remain zero, inactive chart corners contribute finite placeholders, and zero/nonfinite used norms refuse instead of replacing performed geometry with neutral normals.
 * @evidence contracts/common.md#meaningful-documentation Prose states area/normal units, borrowed source buffers, mutable-array purity and distinct-query cache lifetime.
 * @evidence contracts/performance.md#efficient-algorithms One O(parent triangles) accumulation and O(bound vertices) interpolation produce dense normals; each first sparse query derives its actual binding and fixed three-corner normal before map lookup reuse.
 * @evidence contracts/performance.md#reuse-equivalent-work Stars are normalized once per source/domain key and sparse normals once per sample plus exact binding identity; equivalence holds only for this unchanged performed parent-area field.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The field closure retains source-star maps, borrowed binding reader and queried normal arrays until dropped; sparse cache size follows distinct queries with no independent eviction limit.
 */
export function createHumanPersonReferenceField(
  props: IAutoMovieHumanPersonReferenceFieldProps,
): IAutoMovieHumanPersonReferenceNormalField {
  const {
    plan,
    bindings,
    bindingAt,
    parentAreas,
  }: IAutoMovieHumanPersonReferenceFieldProps = props;
  const unit: (vector: number[]) => number[] = (vector: number[]): number[] => {
    const length: number = Math.hypot(...vector);
    if (!(length > 0) || !Number.isFinite(length))
      throw new Error(
        "Person source shading needs a finite nonzero used normal.",
      );
    return vector.map((value: number): number => value / length);
  };
  const original: Map<string, number[]> = new Map<string, number[]>();
  for (let at: number = 0; at < plan.face.parentTriangles.length; at += 3)
    for (let k: number = 0; k < 3; k++) {
      const key: string = `${plan.face.parentTriangles[at + k]}:${plan.face.parentNormalDomains?.[at + k] ?? 0}`;
      const vector: number[] = original.get(key) ?? [0, 0, 0];
      for (let axis: number = 0; axis < 3; axis++)
        vector[axis] += parentAreas[at + axis];
      original.set(key, vector);
    }
  const normalized: Map<string, number[]> = new Map<string, number[]>();
  const star: (key: string) => number[] = (key: string): number[] => {
    let vector: number[] | undefined = normalized.get(key);
    if (vector === undefined) {
      vector = unit(original.get(key)!);
      normalized.set(key, vector);
    }
    return vector;
  };
  const normalAt: (
    binding: IAutoMovieHumanPersonSourceStarBinding,
  ) => number[] = (
    binding: IAutoMovieHumanPersonSourceStarBinding,
  ): number[] => {
    const required: Set<string> = new Set(
      binding.weights.map(
        (
          weight: IAutoMovieHumanPersonSourceStarBinding["weights"][number],
        ): string => weight.key,
      ),
    );
    return unit(
      [0, 1, 2].map((axis: number): number =>
        interpolateHumanBasisSourceTriangle(
          binding.keys.map((key: string): number =>
            required.has(key) ? star(key)[axis] : 0,
          ) as [number, number, number],
          binding.coordinates,
        ),
      ),
    );
  };
  const points: Map<string, number[]> = new Map<string, number[]>();
  return {
    normals: bindings.flatMap(
      (
        side: IAutoMovieHumanPersonReferenceFieldProps["bindings"][number],
      ): number[] =>
        side.flatMap(
          (
            binding: IAutoMovieHumanPersonSourceStarBinding | undefined,
          ): number[] =>
            binding === undefined ? [0, 0, 0] : normalAt(binding),
        ),
    ),
    at: (sample: number, parent: number): number[] => {
      const binding: IAutoMovieHumanPersonSourceStarBinding = bindingAt(
        sample,
        parent,
      );
      const key: string = `${sample}:${binding.identity}`;
      let normal: number[] | undefined = points.get(key);
      if (normal === undefined) {
        normal = normalAt(binding);
        points.set(key, normal);
      }
      return normal;
    },
  };
}
