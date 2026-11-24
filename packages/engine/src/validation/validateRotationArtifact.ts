import type {
  IAutoMovieQuaternion,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

/**
 * Require finite quaternion components and append unit-norm failures under the
 * supplied path. Component faults take precedence over computing the norm.
 */
export function validateRotationArtifact(
  rotation: IAutoMovieQuaternion,
  path: string,
  label: string,
  collector: IAutoMovieViolationCollector,
): void {
  let finite: boolean = true;
  for (const axis of ["x", "y", "z", "w"] as const)
    if (!Number.isFinite(rotation[axis])) {
      finite = false;
      collector.push(
        "range",
        `${path}.${axis}`,
        `${label} component must be finite, but was ${rotation[axis]}`,
        rotation[axis],
      );
    }
  if (finite) collector.unitQuaternion(path, rotation, label);
}
