import type { IAutoMovieValidateTransformScalars } from "@automovie/interface";

/**
 * Append scalar findings for a translation/rotation/scale record. Every
 * component must be finite, each scale axis strictly positive, and rotation's
 * quaternion norm within 1e-6 of one. No value is normalized.
 *
 * @param props.transform The TRS record.
 * @param props.path Prefix of every scalar finding.
 * @param props.label Subject named in the correction text.
 * @param props.collector Caller-owned append-only finding sink.
 */
export function validateTransformScalars(
  props: IAutoMovieValidateTransformScalars.IProps,
): void {
  const { transform, path, label, collector }: typeof props = props;
  collector.unitQuaternion(
    `${path}.rotation`,
    transform.rotation,
    `${label} rotation`,
  );
  for (const axis of ["x", "y", "z"] as const) {
    const value: number = transform.scale[axis];
    if (value <= 0)
      collector.push(
        "range",
        `${path}.scale.${axis}`,
        `${label} scale component must be > 0, but was ${value}`,
        value,
      );
  }
}
