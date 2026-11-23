import type { IAutoMovieViolationCollector } from "@automovie/interface";

import { describeInvalidValue } from "./describeInvalidValue";
import { validateObjectArtifact } from "./validateObjectArtifact";

/**
 * Admit a finite quaternion record and append unit-norm failures under its
 * supplied path. Component faults take precedence over computing the norm.
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
