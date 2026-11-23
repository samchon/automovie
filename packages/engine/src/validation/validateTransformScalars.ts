import type { IAutoMovieValidateTransformScalars } from "@automovie/interface";

import { isRecord } from "./isRecord";
import { validateObjectArtifact } from "./validateObjectArtifact";
import { validateRotationArtifact } from "./validateRotationArtifact";
import { validateVectorArtifact } from "./validateVectorArtifact";

/**
 * Append shape and scalar findings for an unchecked translation/rotation/scale record. Every component must be finite, each scale axis strictly positive, and rotation's quaternion norm within 1e-6 of one. No value is normalized. Malformed nested fields are reported independently at their owning paths.
 *
 * @param props.transform The unchecked TRS record.
 * @param props.path Prefix of every structural or scalar finding.
 * @param props.label Subject named in the correction text.
 * @param props.collector Caller-owned append-only finding sink.
 */
export function validateTransformScalars(
  props: IAutoMovieValidateTransformScalars.IProps,
): void {
  const { transform, path, label, collector }: typeof props = props;
  if (!validateObjectArtifact(transform, path, label, collector.items)) return;
  validateVectorArtifact(
    transform.translation,
    `${path}.translation`,
    `${label} translation`,
    collector.items,
  );
  validateRotationArtifact(
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
