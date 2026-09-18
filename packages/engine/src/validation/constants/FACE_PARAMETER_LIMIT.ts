/**
 * Face parameter weights live in `[-FACE_PARAMETER_LIMIT,
 * +FACE_PARAMETER_LIMIT]`.
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `FACE_PARAMETER_LIMIT` supplies the symmetric numeric bound named when one proxy-face trait exceeds its allowed weight.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `FACE_PARAMETER_LIMIT` keeps the expected interval stable across every nested face-parameter member path.
 */
export const FACE_PARAMETER_LIMIT = 2;
