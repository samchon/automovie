import { ViolationCollector } from "./ViolationCollector";
import { describeInvalidValue } from "./describeInvalidValue";
import { isRecord } from "./isRecord";
import { validateObjectArtifact } from "./validateObjectArtifact";
import { validateVectorArtifact } from "./validateVectorArtifact";

/**
 * Append shape and scalar findings for an unchecked translation/rotation/scale record. Every component must be finite, each scale axis strictly positive, and rotation's quaternion norm within 1e-6 of one. No value is normalized. Malformed nested fields are reported independently at their owning paths.
 *
 * @param props.transform The unchecked TRS record.
 * @param props.path Prefix of every structural or scalar finding.
 * @param props.label Subject named in the correction text.
 * @param props.collector Caller-owned append-only finding sink.
 *
 * @evidence contracts/common.md#principled-implementation Admits raw TRS object shapes before numeric reads, checks finite vector components and positive scale, and delegates quaternion unit length to ViolationCollector.unitQuaternion's hypot norm and shared 1e-6 tolerance; the scale rule excludes collapsed or reflected transforms.
 * @evidence contracts/common.md#clear-and-simple-design One unknown-input transform gate serves engine model, pose, affordance and architecture validation as well as production artifact ingress; object/vector admission and quaternion policy reuse existing validation owners instead of a second artifact-specific scalar implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reports every independent malformed TRS field without repairing, normalizing or replacing it; no caller, model or axis gets a special tolerance, and quaternion norm is evaluated only after finite numeric components are admitted.
 * @evidence contracts/common.md#meaningful-documentation Documents the unchecked input, finite component and positive scale domains, unit quaternion tolerance, independent nested-field error paths and the absence of normalization.
 * @evidence contracts/performance.md#efficient-algorithms A fixed three-vector/quaternion record takes constant time and temporary space, including ten component reads, one quaternion norm and three positivity comparisons; no scene-wide scan or geometry rebuild occurs here.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reads one current mutable transform and appends its findings; it coordinates no phases and retains no verdict that could outlive an authored edit.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owns no long-lived state; only the caller's collector keeps bounded field findings after return, while the temporary quaternion copy is released when its norm check finishes.
 */
export function validateTransformScalars(props: {
  transform: unknown;
  path: string;
  label: string;
  collector: ViolationCollector;
}): void {
  const { transform, path, label, collector }: typeof props = props;
  if (!validateObjectArtifact(transform, path, label, collector.items)) return;
  validateVectorArtifact(
    transform.translation,
    `${path}.translation`,
    `${label} translation`,
    collector.items,
  );
  validateRotation(
    transform.rotation,
    `${path}.rotation`,
    `${label} rotation`,
    collector,
  );
  validateVectorArtifact(
    transform.scale,
    `${path}.scale`,
    `${label} scale`,
    collector.items,
  );
  if (isRecord(transform.scale))
    for (const axis of ["x", "y", "z"] as const) {
      const value: unknown = transform.scale[axis];
      if (typeof value === "number" && value <= 0)
        collector.push(
          "range",
          `${path}.scale.${axis}`,
          `${label} scale component must be > 0, but was ${value}`,
          value,
        );
    }
}

/** Admit a finite quaternion record before using the collector's norm policy. */
function validateRotation(
  rotation: unknown,
  path: string,
  label: string,
  collector: ViolationCollector,
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
