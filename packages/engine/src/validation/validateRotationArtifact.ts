import type { IAutoMovieViolationCollector } from "@automovie/interface";

import { describeInvalidValue } from "./describeInvalidValue";
import { validateObjectArtifact } from "./validateObjectArtifact";

/**
 * Admit a finite quaternion record and append unit-norm failures under its
 * supplied path. Component faults take precedence over computing the norm.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the finite record and unit norm checks, their diagnostic paths and when the norm is evaluated.
 * @evidence contracts/development/implementation.md#principled-implementation Checks record shape and then all four components before invoking the collector's shared norm rule.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Record shape is admitted before field access. The collector owns unit-norm policy.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses nonfinite or nonunit input without adjusting its components.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four component checks and one norm use constant temporary work.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Transform and cue gates use the same rotation record checks and shared collector tolerance.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only appended findings keep any offending values. No rotation copy escapes the norm check.
 */
export function validateRotationArtifact(
  rotation: unknown,
  path: string,
  label: string,
  collector: IAutoMovieViolationCollector,
): void {
  if (!validateObjectArtifact(rotation, path, label, collector.items)) return;
  let finite: boolean = true;
  for (const axis of ["x", "y", "z", "w"] as const)
    if (
      typeof rotation[axis] !== "number" ||
      !Number.isFinite(rotation[axis])
    ) {
      finite = false;
      collector.push(
        "range",
        `${path}.${axis}`,
        `${label} component must be finite, but was ${describeInvalidValue(rotation[axis])}`,
        rotation[axis],
      );
    }
  if (
    finite &&
    typeof rotation.x === "number" &&
    typeof rotation.y === "number" &&
    typeof rotation.z === "number" &&
    typeof rotation.w === "number"
  )
    collector.unitQuaternion(
      path,
      { x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w },
      label,
    );
}
